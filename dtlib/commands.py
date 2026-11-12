"""把命令翻译成一条事件。服务是唯一调用方。"""
from __future__ import annotations

from .fold import current_root, open_blockers, stale_covers
from .util import DtError, now_ts


class Board:
    def __init__(self, store):
        self.store = store

    @property
    def state(self):
        return self.store.state

    # ---------- 编号 ----------

    def _next(self, kind, prefix):
        # 只读计数器；事件写入后由折叠推进，避免准备失败时跳号
        return f"{prefix}-{self.state['counters'][kind]:04d}"

    def next_issue_id(self):
        return self._next("issue", "I")

    def next_comment_id(self):
        return self._next("comment", "C")

    def next_decision_id(self):
        return self._next("decision", "D")

    def next_premise_id(self):
        return self._next("premise", "P")

    def next_impact_id(self):
        return self._next("impact", "IC")

    def _event(self, op, target, payload, actor, reason=None):
        return {
            "v": 3 if op == "decision.annotate" else 2,
            "seq": self.store.last_seq + 1,
            "ts": now_ts(),
            "actor": actor,
            "op": op,
            "target": target,
            "payload": payload,
            "reason": reason,
        }

    # ---------- 票 ----------

    def issue_create(self, actor, kind, title, body="", labels=None, parent=None,
                     state="open", type=None, split_reason="", split_rationale="",
                     derived_from=None, derived_from_inferred=None, covers=None,
                     destination=None, reason=None, impact=None):
        iid = self.next_issue_id()
        labels = list(labels or [])
        payload = {
            "kind": kind,
            "title": title,
            "body": body,
            "labels": labels,
            "parent": parent,
            "state": state,
        }
        if kind == "ticket":
            if split_rationale:
                raise DtError("票没有 split_rationale，用 split_reason", 2)
            payload.update({
                "type": type,
                "split_reason": split_reason,
                "derived_from": list(derived_from or []),
                "derived_from_inferred": list(derived_from_inferred or []),
                "covers": list(covers or []),
            })
            if not payload["derived_from"]:
                raise DtError("新建票必须至少有一条 derived_from", 2)
            if not payload["split_reason"].strip():
                raise DtError("新建票必须写拆票理由", 2)
        else:
            if parent is not None:
                raise DtError("地图不能有父票", 2)
            if not destination or not destination.get("statement"):
                raise DtError("新建地图必须给 destination.statement", 2)
            fragments = destination.get("fragments") or _split_sentences(destination["statement"])
            root_id = f"D-{iid}-ROOT"
            payload["split_rationale"] = split_rationale or ""
            payload["destination"] = {
                "decision": root_id,
                "statement": destination["statement"],
                "fragments": list(fragments),
            }
        if impact:
            payload.update(impact)
        return self._event("issue.create", iid, payload, actor, reason)

    def issue_edit(self, actor, iid, fields, reason=None, impact=None):
        payload = {}
        for key in ("title", "body", "type", "split_reason", "split_rationale",
                    "derived_from", "derived_from_inferred", "covers"):
            if fields.get(key) is not None:
                payload[key] = fields[key]
        if not payload:
            raise DtError("issue edit 至少要改一个字段", 2)
        if impact:
            payload.update(impact)
        return self._event("issue.edit", iid, payload, actor, reason)

    def issue_confirm_derived(self, actor, iid, decisions=None):
        ticket = self.state["issues"].get(iid)
        if not ticket or ticket.get("kind") != "ticket":
            raise DtError(f"找不到票 {iid}")
        inferred = list(ticket.get("derived_from_inferred", []))
        if not inferred:
            raise DtError(f"票 {iid} 没有待确认的推断来源")
        picked = list(decisions or inferred)
        unknown = [d for d in picked if d not in inferred]
        if unknown:
            raise DtError(f"这些决定不是票 {iid} 的推断来源：{'、'.join(unknown)}", 2)
        return self._event("issue.confirm_derived", iid, {"decisions": picked}, actor)

    def issue_state(self, actor, iid, state, reason=None, impact=None, merged_into=None):
        payload = {"state": state}
        if impact:
            payload.update(impact)
        if merged_into:
            payload["impact_merged_into"] = merged_into
        return self._event("issue.state", iid, payload, actor, reason)

    def issue_label(self, actor, iid, add, remove):
        return self._event("issue.label", iid, {"add": list(add), "remove": list(remove)}, actor)

    def issue_block(self, actor, iid, add, remove):
        return self._event("issue.block", iid, {"add": list(add), "remove": list(remove)}, actor)

    def issue_parent(self, actor, iid, parent):
        raise DtError("v1 不开放改父票；建错地图就关掉重建", 1)

    # ---------- 评论 ----------

    def comment_add(self, actor, issue, body):
        cid = self.next_comment_id()
        return self._event("comment.create", cid, {"issue": issue, "body": body}, actor)

    def comment_edit(self, actor, cid, body):
        return self._event("comment.edit", cid, {"body": body}, actor)

    def comment_delete(self, actor, cid):
        return self._event("comment.delete", cid, {}, actor)

    # ---------- 决定 ----------

    def decision_create(self, actor, statement, source_ticket=None, output_files=None,
                        fragments=None, root_of=None, reason=None, did=None, rationale=None):
        if did:
            if not did.startswith("D-") or any(ch.isspace() for ch in did):
                raise DtError(f"决定编号不合法：{did}", 2)
        else:
            did = self.next_decision_id()
        payload = {
            "statement": statement,
            "source_ticket": source_ticket,
            "output_files": list(output_files or []),
        }
        if rationale is not None:
            payload["rationale"] = rationale
        if root_of:
            payload["root_of"] = root_of
            if not fragments:
                payload["fragments"] = _split_sentences(statement)
            else:
                payload["fragments"] = list(fragments)
        return self._event("decision.create", did, payload, actor, reason)

    def decision_overturn(self, actor, old_id, statement, source_ticket=None,
                          output_files=None, fragments=None, reason=None,
                          impact_action=None, rationale=None):
        old = self.state["decisions"].get(old_id)
        if not old:
            raise DtError(f"找不到决定 {old_id}")
        if old["status"] != "active":
            raise DtError(f"决定 {old_id} 不是 active，不能取代")
        if source_ticket is None:
            source_ticket = old.get("source_ticket")
        if old.get("root_of"):
            if not fragments:
                raise DtError("取代根决定必须给新拆句", 2)
            root_of = old["root_of"]
        else:
            root_of = None
        new_id = self.next_decision_id()
        payload = {
            "new_decision": {
                "id": new_id,
                "statement": statement,
                "source_ticket": source_ticket,
                "output_files": list(output_files or []),
            }
        }
        if rationale is not None:
            payload["new_decision"]["rationale"] = rationale
        if root_of:
            payload["new_decision"]["root_of"] = root_of
            payload["new_decision"]["fragments"] = list(fragments)
        if impact_action:
            payload.update(impact_action)
        else:
            items = impact_range(self.state, old_id,
                                 "root_replaced" if old.get("root_of") else "overturn",
                                 old_fragments={f["id"] for f in old.get("fragments", [])})
            if items:
                case_id = self.next_impact_id()
                payload["impact_case"] = case_id
                payload["impact_items"] = items
        return self._event("decision.overturn", old_id, payload, actor, reason)

    def decision_void(self, actor, did, reason_text, impact_action=None, reason=None):
        d = self.state["decisions"].get(did)
        if not d:
            raise DtError(f"找不到决定 {did}")
        if d["status"] != "active":
            raise DtError(f"决定 {did} 不是 active，不能作废")
        if d.get("root_of"):
            raise DtError("根决定不能作废")
        payload = {"reason": reason_text}
        if impact_action:
            payload.update(impact_action)
        else:
            items = impact_range(self.state, did, "void")
            if items:
                case_id = self.next_impact_id()
                payload["impact_case"] = case_id
                payload["impact_items"] = items
        return self._event("decision.void", did, payload, actor, reason or reason_text)

    def decision_annotate(self, actor, did, rationale, source=None, reason=None):
        """补记依据；不动陈述、状态和取代边。"""
        d = self.state["decisions"].get(did)
        if not d:
            raise DtError(f"找不到决定 {did}")
        if not rationale or not rationale.strip():
            raise DtError("rationale 为空", 2)
        payload = {"rationale": rationale}
        if source is not None:
            payload["source"] = source
        return self._event("decision.annotate", did, payload, actor, reason)

    # ---------- 前提 ----------

    def premise_add(self, actor, decision, statement, evidence):
        pid = self.next_premise_id()
        return self._event("premise.add", pid, {
            "decision": decision,
            "statement": statement,
            "evidence": list(evidence or []),
        }, actor)

    def premise_edit(self, actor, pid, statement=None, evidence=None):
        payload = {}
        if statement is not None:
            payload["statement"] = statement
        if evidence is not None:
            payload["evidence"] = list(evidence)
        if not payload:
            raise DtError("premise edit 至少要改一个字段", 2)
        return self._event("premise.edit", pid, payload, actor)

    def premise_judge(self, actor, pid, verdict, evidence, reason):
        premise = self.state["premises"].get(pid)
        if not premise:
            raise DtError(f"找不到前提 {pid}")
        payload = {"verdict": verdict, "evidence": list(evidence or [])}
        if verdict == "已破":
            decision = self.state["decisions"].get(premise["decision"])
            if decision and decision["status"] == "active":
                items = impact_range(self.state, decision["id"], "premise_broken")
                if items:
                    case_id = self.next_impact_id()
                    payload["impact_case"] = case_id
                    payload["impact_items"] = items
        return self._event("premise.judge", pid, payload, actor, reason)

    # ---------- 影响清单 ----------

    def impact_act(self, actor, case_id, kind, ref, action, reason=None, **options):
        case = self._case(case_id)
        item = self._case_item(case, kind, ref)
        impact_fields = {
            "impact_case": case_id,
            "impact_item": {"kind": kind, "ref": ref},
            "impact_action": action,
        }
        if kind == "decision":
            if action == "仍成立":
                return self._event("impact.act", case_id, {
                    "item": {"kind": kind, "ref": ref}, "action": action}, actor, reason)
            if action == "需修改":
                if not options.get("statement"):
                    raise DtError("需修改必须给新决定的陈述", 2)
                return self.decision_overturn(
                    actor, ref,
                    statement=options["statement"],
                    source_ticket=options.get("source_ticket"),
                    output_files=options.get("output_files"),
                    reason=reason,
                    impact_action=impact_fields,
                )
            if action == "作废":
                text = options.get("void_reason") or reason or "按影响清单作废"
                return self.decision_void(actor, ref, text, impact_action=impact_fields, reason=reason)
            if action == "要补问":
                if not options.get("title"):
                    raise DtError("要补问必须给跟进票标题", 2)
                ticket_type = options.get("type") or "grilling"
                if ticket_type not in ("grilling", "research"):
                    raise DtError("要补问的跟进票只能是 grilling 或 research", 2)
                parent = options.get("parent") or self._map_of_decision(ref)
                if not parent:
                    raise DtError("要补问必须给 --parent 地图", 2)
                payload_impact = dict(impact_fields)
                return self.issue_create(
                    actor, "ticket",
                    title=options["title"],
                    body=options.get("body", ""),
                    parent=parent,
                    type=ticket_type,
                    split_reason=options.get("split_reason") or options["title"],
                    derived_from=options.get("derived_from") or [ref],
                    reason=reason,
                    impact=payload_impact,
                )
            raise DtError(f"决定没有动作 {action}", 2)
        else:
            if action == "保留":
                return self._event("impact.act", case_id, {
                    "item": {"kind": kind, "ref": ref}, "action": action}, actor, reason)
            if action == "改范围":
                fields = {
                    "body": options.get("body"),
                    "derived_from": options.get("derived_from"),
                    "covers": options.get("covers"),
                }
                return self.issue_edit(actor, ref, fields, reason=reason, impact=impact_fields)
            if action in ("关掉", "重开"):
                return self.issue_state(
                    actor, ref,
                    "closed" if action == "关掉" else "open",
                    reason=reason, impact=impact_fields,
                    merged_into=options.get("into"),
                )
            if action == "新建":
                if not options.get("title"):
                    raise DtError("新建票必须给标题", 2)
                ticket_type = options.get("type") or "task"
                parent = options.get("parent") or self._map_of_ticket(ref)
                if not parent:
                    raise DtError("新建票必须给 --parent 地图", 2)
                return self.issue_create(
                    actor, "ticket",
                    title=options["title"],
                    body=options.get("body", ""),
                    parent=parent,
                    type=ticket_type,
                    split_reason=options.get("split_reason") or options["title"],
                    derived_from=options.get("derived_from") or self._derived_from(ref),
                    reason=reason,
                    impact=impact_fields,
                )
            raise DtError(f"票没有动作 {action}", 2)

    def impact_close(self, actor, case_id, reason):
        return self._event("impact.close", case_id, {}, actor, reason)

    def _case(self, case_id):
        case = self.state["impact_cases"].get(case_id)
        if not case:
            raise DtError(f"找不到影响清单 {case_id}")
        return case

    def _case_item(self, case, kind, ref):
        for item in case["items"]:
            if item["kind"] == kind and item["ref"] == ref:
                return item
        raise DtError(f"影响清单 {case['id']} 里没有 {kind} {ref}")

    def _map_of_decision(self, did):
        d = self.state["decisions"].get(did)
        if not d:
            return None
        if d.get("root_of"):
            return d["root_of"]
        if d.get("source_ticket"):
            t = self.state["issues"].get(d["source_ticket"])
            if t:
                return t["parent"]
        return None

    def _map_of_ticket(self, tid):
        t = self.state["issues"].get(tid)
        return t["parent"] if t else None

    def _derived_from(self, tid):
        t = self.state["issues"].get(tid)
        return list(t["derived_from"]) if t else []

    # ---------- 导入 ----------

    def import_event(self, actor, payload, source):
        return self._event("import", source, payload, actor)


def _split_sentences(text):
    """按。！？切句，保留句末标点。"""
    if not text:
        return []
    result = []
    start = 0
    for index, char in enumerate(text):
        if char in "。！？":
            piece = text[start:index + 1].strip()
            if piece:
                result.append(piece)
            start = index + 1
    rest = text[start:].strip()
    if rest:
        result.append(rest)
    return result


def impact_range(state, trigger_id, trigger_type, old_fragments=None):
    """按 ADR 0006 算范围。返回去重后的范围项。"""
    items = {}

    def add(kind, ref, relation):
        key = (kind, ref)
        if key not in items:
            items[key] = {"kind": kind, "ref": ref, "relations": []}
        if relation not in items[key]["relations"]:
            items[key]["relations"].append(relation)

    decisions = state["decisions"]
    tickets = [i for i in state["issues"].values() if i["kind"] == "ticket"]
    trigger = decisions.get(trigger_id)

    if trigger_type == "premise_broken" and trigger and trigger["status"] == "active":
        add("decision", trigger_id, "premise")

    queue = [trigger_id]
    visited = set()
    while queue:
        did = queue.pop(0)
        if did in visited:
            continue
        visited.add(did)
        d = decisions.get(did)
        if not d:
            continue
        if did == trigger_id:
            if trigger_type != "premise_broken":
                pass  # 触发决定是原因，不进范围
            # 前提判破时触发决定已经用 premise 关系加过，不再重复
        else:
            if d["status"] != "active":
                continue
            add("decision", did, "derived_from")
        for ticket in tickets:
            if did in ticket["derived_from"]:
                add("ticket", ticket["id"], "derived_from")
                for produced in decisions.values():
                    if produced["source_ticket"] == ticket["id"] and produced["status"] == "active":
                        queue.append(produced["id"])
        if d.get("source_ticket"):
            add("ticket", d["source_ticket"], "source_ticket")

    if trigger_type == "root_replaced" and old_fragments:
        for ticket in tickets:
            if any(c in old_fragments for c in ticket["covers"]):
                add("ticket", ticket["id"], "covers")

    # 触发决定本身不是受影响项，除非是前提判破
    if trigger_type != "premise_broken":
        items.pop(("decision", trigger_id), None)
    return list(items.values())


def dispatch(board, op, args, actor, reason=None):
    """把 CLI 命令翻译成一次 Board 调用。"""
    if op == "issue.create":
        return board.issue_create(
            actor,
            kind=args["kind"],
            title=args["title"],
            body=args.get("body", ""),
            labels=args.get("labels"),
            parent=args.get("parent"),
            state=args.get("state", "open"),
            type=args.get("type"),
            split_reason=args.get("split_reason", ""),
            split_rationale=args.get("split_rationale", ""),
            derived_from=args.get("derived_from"),
            derived_from_inferred=args.get("derived_from_inferred"),
            covers=args.get("covers"),
            destination=args.get("destination"),
            reason=reason,
        )
    if op == "issue.edit":
        return board.issue_edit(
            actor, args["id"],
            {k: args.get(k) for k in ("title", "body", "type", "split_reason",
                                      "split_rationale", "derived_from",
                                      "derived_from_inferred", "covers")},
            reason=reason,
        )
    if op == "issue.confirm_derived":
        return board.issue_confirm_derived(
            actor, args["id"], decisions=args.get("decisions"))
    if op == "issue.state":
        return board.issue_state(
            actor, args["id"], args["state"], reason=reason,
            merged_into=args.get("merged_into"),
        )
    if op == "issue.label":
        return board.issue_label(actor, args["id"], args.get("add") or [], args.get("remove") or [])
    if op == "issue.block":
        return board.issue_block(actor, args["id"], args.get("add") or [], args.get("remove") or [])
    if op == "comment.add":
        return board.comment_add(actor, args["issue"], args["body"])
    if op == "comment.edit":
        return board.comment_edit(actor, args["id"], args["body"])
    if op == "comment.delete":
        return board.comment_delete(actor, args["id"])
    if op == "decision.create":
        return board.decision_create(
            actor, args["statement"],
            source_ticket=args.get("source_ticket"),
            output_files=args.get("output_files"),
            fragments=args.get("fragments"),
            root_of=args.get("root_of"),
            reason=reason,
            did=args.get("id"),
            rationale=args.get("rationale"),
        )
    if op == "decision.overturn":
        return board.decision_overturn(
            actor, args["id"], args["statement"],
            source_ticket=args.get("source_ticket"),
            output_files=args.get("output_files"),
            fragments=args.get("fragments"),
            reason=reason,
            rationale=args.get("rationale"),
        )
    if op == "decision.void":
        return board.decision_void(actor, args["id"], args["void_reason"], reason=reason)
    if op == "decision.annotate":
        return board.decision_annotate(
            actor, args["id"], args["rationale"],
            source=args.get("source"), reason=reason)
    if op == "premise.add":
        return board.premise_add(
            actor, args["decision"], args["statement"], args.get("evidence") or [])
    if op == "premise.edit":
        return board.premise_edit(
            actor, args["id"], statement=args.get("statement"), evidence=args.get("evidence"))
    if op == "premise.judge":
        return board.premise_judge(
            actor, args["id"], args["verdict"], args.get("evidence") or [], reason or "")
    if op == "impact.act":
        options = {k: v for k, v in args.items() if k not in ("case", "kind", "ref", "action")}
        return board.impact_act(
            actor, args["case"], args["kind"], args["ref"], args["action"],
            reason=reason, **options)
    if op == "impact.close":
        return board.impact_close(actor, args["case"], reason or "")
    raise DtError(f"不认识命令 {op}", 2)

