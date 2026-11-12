"""折叠：把事件日志变成当前状态，并算状态哈希、覆盖表、红色和阻塞。"""
from __future__ import annotations

import copy
import json
from datetime import datetime

from .util import DtError, now_ts, parse_ts, sha256_hex


def empty_state():
    return {
        "issues": {},
        "decisions": {},
        "comments": {},
        "premises": {},
        "impact_cases": {},
        # 计数器不进状态哈希，只服务下一次编号
        "counters": {
            "issue": 1,
            "comment": 1,
            "decision": 1,
            "premise": 1,
            "impact": 1,
        },
        "seq": 0,
    }


def fold_events(events):
    state = empty_state()
    for event in events:
        apply_event(state, event)
        state["seq"] = event["seq"]
    return state


def apply_event(state, event):
    op = event["op"]
    payload = event["payload"]
    version = event["v"]
    ts = event["ts"]
    actor = event["actor"]

    if op == "import":
        _fold_import(state, event)
    elif op == "issue.create":
        _fold_issue_create(state, event)
    elif op == "issue.edit":
        _fold_issue_edit(state, event)
    elif op == "issue.state":
        _fold_issue_state(state, event)
    elif op == "issue.label":
        _fold_issue_label(state, event)
    elif op == "issue.parent":
        _fold_issue_parent(state, event)
    elif op == "issue.block":
        _fold_issue_block(state, event)
    elif op == "comment.create":
        _fold_comment_create(state, event)
    elif op == "comment.edit":
        _fold_comment_edit(state, event)
    elif op == "comment.delete":
        _fold_comment_delete(state, event)
    elif op == "decision.create":
        _fold_decision_create(state, event)
    elif op == "decision.overturn":
        _fold_decision_overturn(state, event)
    elif op == "decision.void":
        _fold_decision_void(state, event)
    elif op == "premise.add":
        _fold_premise_add(state, event)
    elif op == "premise.edit":
        _fold_premise_edit(state, event)
    elif op == "premise.judge":
        _fold_premise_judge(state, event)
    elif op == "impact.act":
        _fold_impact_act(state, event)
    elif op == "impact.close":
        _fold_impact_close(state, event)
    else:
        raise DtError(f"不认识事件 {op}", detail=event)

    # 影响动作字段：底层 op 带 impact_case/impact_item/impact_action 时，
    # 顺带把那一项标成已处理。
    if version >= 2 and "impact_item" in payload:
        _mark_impact_item(state, event)
    # 触发事件：打开影响清单
    if version >= 2 and "impact_items" in payload:
        _open_impact_case(state, event)


# ---------- 导入 ----------

def _fold_import(state, event):
    payload = event["payload"]
    ts = event["ts"]
    map_data = payload["map"]
    map_id = str(map_data["id"])
    if map_id in state["issues"]:
        raise DtError(f"重复导入：地图 {map_id} 已存在")
    root = map_data.get("root") or {}
    root_id = root.get("id")
    fragments = []
    for index, item in enumerate(root.get("fragments", []), start=1):
        text = item["text"] if isinstance(item, dict) else str(item)
        fragments.append({
            "id": f"{root_id}#{index}",
            "index": index,
            "text": text,
        })
    if root_id and not fragments:
        raise DtError("导入的根决定没有拆句")
    _put_issue(state, {
        "id": map_id,
        "kind": "map",
        "type": None,
        "title": map_data["title"],
        "body": map_data.get("body", ""),
        "state": map_data.get("state", "open"),
        "labels": [l for l in map_data.get("labels", []) if not l.startswith("wayfinder:")],
        "parent": None,
        "blocked_by": [],
        "split_reason": "",
        "derived_from": [],
        "covers": [],
        "created_at": map_data.get("created_at") or ts,
        "updated_at": map_data.get("updated_at") or map_data.get("created_at") or ts,
        "closed_at": map_data.get("closed_at"),
        "created_by": map_data.get("created_by") or event["actor"],
    })
    if root_id:
        _put_decision(state, {
            "id": root_id,
            "statement": root["statement"],
            "fragments": fragments,
            "root_of": map_id,
            "source_ticket": None,
            "output_files": root.get("output_files", []),
            "status": "active",
            "supersedes": [],
            "superseded_by": None,
            "last_still_valid_at": None,
            "void_reason": None,
            "voided_at": None,
            "created_at": root.get("created_at") or ts,
            "created_by": root.get("created_by") or event["actor"],
        })

    for item in payload.get("tickets", []):
        _put_issue(state, {
            "id": str(item["id"]),
            "kind": "ticket",
            "type": item.get("type") or "task",
            "title": item["title"],
            "body": item.get("body", ""),
            "state": item.get("state", "open"),
            "labels": [l for l in item.get("labels", []) if not l.startswith("wayfinder:")],
            "parent": str(item.get("parent") or map_id),
            "blocked_by": [str(b) for b in item.get("blocked_by", [])],
            "split_reason": item.get("split_reason", ""),
            "derived_from": [str(d) for d in item.get("derived_from", ([root_id] if root_id else []))],
            "covers": list(item.get("covers", [])),
            "created_at": item.get("created_at") or ts,
            "updated_at": item.get("updated_at") or item.get("created_at") or ts,
            "closed_at": item.get("closed_at"),
            "created_by": item.get("created_by") or event["actor"],
        })

    for item in payload.get("comments", []):
        cid = str(item["id"])
        if cid in state["comments"]:
            raise DtError(f"导入的评论编号重复：{cid}")
        issue_id = str(item["issue"])
        if issue_id not in state["issues"]:
            raise DtError(f"导入的评论 {cid} 指向不存在的 {issue_id}")
        state["comments"][cid] = {
            "id": cid,
            "issue": issue_id,
            "body": item.get("body", ""),
            "author": item.get("author") or event["actor"],
            "created_at": item.get("created_at") or ts,
            "edited_at": item.get("edited_at"),
            "deleted": bool(item.get("deleted", False)),
        }

    pending_supersedes = []
    for item in payload.get("decisions", []):
        did = str(item["id"])
        if did in state["decisions"]:
            raise DtError(f"导入的决定编号重复：{did}")
        _put_decision(state, {
            "id": did,
            "statement": item["statement"],
            "fragments": item.get("fragments", []),
            "root_of": item.get("root_of"),
            "source_ticket": str(item["source_ticket"]) if item.get("source_ticket") else None,
            "output_files": list(item.get("output_files", [])),
            "status": "active",
            "supersedes": [],
            "superseded_by": None,
            "last_still_valid_at": None,
            "void_reason": None,
            "voided_at": None,
            "created_at": item.get("created_at") or ts,
            "created_by": item.get("created_by") or event["actor"],
        })
        for old in item.get("supersedes", []) or []:
            pending_supersedes.append((did, str(old)))
    for new_id, old_id in pending_supersedes:
        if old_id not in state["decisions"]:
            raise DtError(f"取代边指向不存在的决定：{new_id} -> {old_id}")
        old = state["decisions"][old_id]
        old["status"] = "superseded"
        old["superseded_by"] = new_id
        state["decisions"][new_id]["supersedes"].append(old_id)

    for item in payload.get("premises", []):
        pid = str(item["id"])
        did = str(item["decision"])
        if pid in state["premises"]:
            raise DtError(f"导入的前提编号重复：{pid}")
        if did not in state["decisions"]:
            raise DtError(f"导入的前提 {pid} 指向不存在的决定 {did}")
        _put_premise(state, {
            "id": pid,
            "decision": did,
            "statement": item["statement"],
            "evidence": list(item.get("evidence", [])),
            "state": item.get("state", "未验"),
            "created_at": item.get("created_at") or ts,
            "created_by": item.get("created_by") or event["actor"],
            "last_judged_at": item.get("last_judged_at"),
            "last_judged_by": item.get("last_judged_by"),
        })

    for row in payload.get("coverage", []):
        fragment_id = row["fragment"]
        for ticket_id in row.get("tickets", []):
            ticket_id = str(ticket_id)
            ticket = state["issues"].get(ticket_id)
            if not ticket:
                raise DtError(f"覆盖行指向不存在的票：{ticket_id}")
            if fragment_id not in ticket["covers"]:
                ticket["covers"].append(fragment_id)

    _recount(state)


# ---------- 票 ----------

def _put_issue(state, issue):
    state["issues"][issue["id"]] = issue
    if issue["id"].startswith("I-"):
        _bump_counter(state, "issue", issue["id"][2:])


def _put_decision(state, decision):
    state["decisions"][decision["id"]] = decision
    if decision["id"].startswith("D-") and not decision["id"].endswith("-ROOT"):
        part = decision["id"][2:].split("-")[0]
        if part.isdigit():
            _bump_counter(state, "decision", part)


def _put_premise(state, premise):
    state["premises"][premise["id"]] = premise
    if premise["id"].startswith("P-"):
        _bump_counter(state, "premise", premise["id"][2:])


def _bump_counter(state, key, value):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return
    if number >= state["counters"][key]:
        state["counters"][key] = number + 1


def _recount(state):
    # 从现有对象重新算计数器，避免导入后出现重号
    counters = {k: 1 for k in state["counters"]}
    for iid in state["issues"]:
        if iid.startswith("I-"):
            counters["issue"] = max(counters["issue"], int(iid[2:]) + 1)
    for cid in state["comments"]:
        if cid.startswith("C-"):
            counters["comment"] = max(counters["comment"], int(cid[2:]) + 1)
    for pid in state["premises"]:
        if pid.startswith("P-"):
            counters["premise"] = max(counters["premise"], int(pid[2:]) + 1)
    for did in state["decisions"]:
        if did.startswith("D-") and not did.endswith("-ROOT"):
            part = did[2:].split("-")[0]
            if part.isdigit():
                counters["decision"] = max(counters["decision"], int(part) + 1)
    state["counters"] = counters


def _fold_issue_create(state, event):
    p = event["payload"]
    iid = event["target"]
    if iid in state["issues"]:
        raise DtError(f"票已存在：{iid}")
    # v1 没有 kind 字段，按 parent 推断
    kind = p.get("kind") or ("ticket" if p.get("parent") else "map")
    parent = p.get("parent")
    if kind == "ticket":
        if not parent or parent not in state["issues"]:
            raise DtError(f"票 {iid} 的父地图不存在：{parent}")
        if state["issues"][parent]["kind"] != "map":
            raise DtError(f"票 {iid} 的父 issue 不是地图：{parent}")
        derived_from = list(p.get("derived_from", []))
        covers = list(p.get("covers", []))
        _check_decisions(state, derived_from)
        _check_covers(state, parent, covers)
    else:
        if parent is not None:
            raise DtError("地图不能有父票")
        d = p.get("destination")
        if d and d["decision"] in state["decisions"]:
            raise DtError(f"根决定编号冲突：{d['decision']}")
    labels = [l for l in p["labels"] if not l.startswith("wayfinder:")]
    if len(labels) != len(p["labels"]):
        raise DtError("标签里不能带 wayfinder: 前缀")
    issue = {
        "id": iid,
        "kind": kind,
        "type": (p.get("type") or "task") if kind == "ticket" else None,
        "title": p["title"],
        "body": p["body"],
        "state": p["state"],
        "labels": list(p["labels"]),
        "parent": parent,
        "blocked_by": [],
        "split_reason": p.get("split_reason", "") if kind == "ticket" else "",
        "derived_from": list(p.get("derived_from", [])) if kind == "ticket" else [],
        "covers": list(p.get("covers", [])) if kind == "ticket" else [],
        "created_at": event["ts"],
        "updated_at": event["ts"],
        "closed_at": event["ts"] if p["state"] == "closed" else None,
        "created_by": event["actor"],
    }
    _put_issue(state, issue)
    if kind == "map" and p.get("destination"):
        d = p["destination"]
        frags = []
        for index, text in enumerate(d["fragments"], start=1):
            frags.append({"id": f"{d['decision']}#{index}", "index": index, "text": text})
        _put_decision(state, {
            "id": d["decision"],
            "statement": d["statement"],
            "fragments": frags,
            "root_of": iid,
            "source_ticket": None,
            "output_files": [],
            "status": "active",
            "supersedes": [],
            "superseded_by": None,
            "last_still_valid_at": None,
            "void_reason": None,
            "voided_at": None,
            "created_at": event["ts"],
            "created_by": event["actor"],
        })


def _fold_issue_edit(state, event):
    issue = _issue(state, event["target"])
    p = event["payload"]
    for key in ("title", "body", "split_reason"):
        if key in p:
            issue[key] = p[key]
    if "type" in p:
        _require_ticket(issue)
        issue["type"] = p["type"]
    if "derived_from" in p:
        _require_ticket(issue)
        _check_decisions(state, p["derived_from"])
        issue["derived_from"] = list(p["derived_from"])
    if "covers" in p:
        _require_ticket(issue)
        _check_covers(state, issue["parent"], p["covers"])
        issue["covers"] = list(p["covers"])
    issue["updated_at"] = event["ts"]


def _fold_issue_state(state, event):
    issue = _issue(state, event["target"])
    p = event["payload"]
    if p["state"] == "closed":
        issue["closed_at"] = event["ts"]
    else:
        issue["closed_at"] = None
    issue["state"] = p["state"]
    issue["updated_at"] = event["ts"]


def _fold_issue_label(state, event):
    issue = _issue(state, event["target"])
    p = event["payload"]
    for label in p["add"]:
        if label.startswith("wayfinder:"):
            raise DtError("标签里不能带 wayfinder: 前缀")
        if label not in issue["labels"]:
            issue["labels"].append(label)
    for label in p["remove"]:
        if label in issue["labels"]:
            issue["labels"].remove(label)
    issue["updated_at"] = event["ts"]


def _fold_issue_parent(state, event):
    issue = _issue(state, event["target"])
    parent = event["payload"]["parent"]
    if parent is None:
        if issue["kind"] == "ticket":
            raise DtError("票必须有父地图")
    else:
        if parent not in state["issues"] or state["issues"][parent]["kind"] != "map":
            raise DtError(f"父 issue 不是地图：{parent}")
        if issue["kind"] == "map":
            raise DtError("地图不能有父票")
    issue["parent"] = parent
    issue["updated_at"] = event["ts"]


def _fold_issue_block(state, event):
    issue = _issue(state, event["target"])
    if issue["kind"] != "ticket":
        raise DtError("地图不参与阻塞")
    p = event["payload"]
    for blocker in p["add"]:
        if blocker == issue["id"]:
            raise DtError("票不能挡自己")
        other = state["issues"].get(blocker)
        if not other or other["kind"] != "ticket":
            raise DtError(f"挡路的票不存在：{blocker}")
        if blocker not in issue["blocked_by"]:
            issue["blocked_by"].append(blocker)
    for blocker in p["remove"]:
        if blocker in issue["blocked_by"]:
            issue["blocked_by"].remove(blocker)
    _check_block_cycles(state)
    issue["updated_at"] = event["ts"]


def _check_block_cycles(state):
    color = {}

    def visit(node):
        if color.get(node) == 1:
            raise DtError(f"阻塞边成环：{node}")
        if color.get(node) == 2:
            return
        color[node] = 1
        for nxt in state["issues"][node].get("blocked_by", []):
            if nxt in state["issues"]:
                visit(nxt)
        color[node] = 2

    for node in state["issues"]:
        if state["issues"][node]["kind"] == "ticket":
            visit(node)


def _require_ticket(issue):
    if issue["kind"] != "ticket":
        raise DtError(f"{issue['id']} 不是票")
    return issue


def _issue(state, iid):
    issue = state["issues"].get(iid)
    if not issue:
        raise DtError(f"找不到 issue {iid}")
    return issue


def _check_decisions(state, ids):
    for did in ids:
        if did not in state["decisions"]:
            raise DtError(f"derived_from 指向不存在的决定：{did}")
        if state["decisions"][did]["status"] != "active":
            raise DtError(f"derived_from 指向不是 active 的决定：{did}")


def _check_covers(state, map_id, covers):
    if not covers:
        return
    root = current_root(state, map_id)
    if root is None:
        raise DtError(f"地图 {map_id} 没有现行根决定")
    valid = {f["id"] for f in root["fragments"]}
    for cid in covers:
        if cid not in valid:
            raise DtError(f"covers 指向不属于当前根决定的拆句：{cid}")


# ---------- 评论 ----------

def _fold_comment_create(state, event):
    cid = event["target"]
    if cid in state["comments"]:
        raise DtError(f"评论编号重复：{cid}")
    p = event["payload"]
    issue = _issue(state, p["issue"])
    state["comments"][cid] = {
        "id": cid,
        "issue": issue["id"],
        "body": p["body"],
        "author": event["actor"],
        "created_at": event["ts"],
        "edited_at": None,
        "deleted": False,
    }
    issue["updated_at"] = event["ts"]
    _bump_counter(state, "comment", cid[2:])


def _fold_comment_edit(state, event):
    comment = state["comments"].get(event["target"])
    if not comment:
        raise DtError(f"找不到评论 {event['target']}")
    if comment["deleted"]:
        raise DtError("已删除的评论不能编辑")
    comment["body"] = event["payload"]["body"]
    comment["edited_at"] = event["ts"]


def _fold_comment_delete(state, event):
    comment = state["comments"].get(event["target"])
    if not comment:
        raise DtError(f"找不到评论 {event['target']}")
    comment["deleted"] = True
    comment["body"] = ""
    comment["edited_at"] = event["ts"]


# ---------- 决定 ----------

def _fold_decision_create(state, event):
    p = event["payload"]
    did = event["target"]
    if did in state["decisions"]:
        raise DtError(f"决定编号重复：{did}")
    if p.get("root_of"):
        if p["root_of"] not in state["issues"] or state["issues"][p["root_of"]]["kind"] != "map":
            raise DtError(f"root_of 不是地图：{p['root_of']}")
        if p.get("source_ticket"):
            raise DtError("根决定不能有来源票")
    else:
        if p.get("source_ticket") and p["source_ticket"] not in state["issues"]:
            raise DtError(f"来源票不存在：{p['source_ticket']}")
    _put_decision(state, {
        "id": did,
        "statement": p["statement"],
        "fragments": _normalize_fragments(did, p.get("fragments", [])),
        "root_of": p.get("root_of"),
        "source_ticket": p.get("source_ticket"),
        "output_files": list(p["output_files"]),
        "status": "active",
        "supersedes": [],
        "superseded_by": None,
        "last_still_valid_at": None,
        "void_reason": None,
        "voided_at": None,
        "created_at": event["ts"],
        "created_by": event["actor"],
    })


def _fold_decision_overturn(state, event):
    old = _decision(state, event["target"])
    if old["status"] != "active":
        raise DtError(f"决定 {old['id']} 不是 active，不能取代")
    nd = event["payload"]["new_decision"]
    new_id = nd.get("id") or f"D-{state['counters']['decision']:04d}"
    if new_id in state["decisions"]:
        raise DtError(f"新决定编号重复：{new_id}")
    if nd.get("root_of") and nd["root_of"] != old.get("root_of"):
        raise DtError("新根决定的 root_of 必须和旧根决定相同")
    if old.get("root_of"):
        if not nd.get("root_of"):
            raise DtError("取代根决定必须给新根决定")
        if not nd.get("fragments"):
            raise DtError("新根决定必须有拆句")
    _put_decision(state, {
        "id": new_id,
        "statement": nd["statement"],
        "fragments": _normalize_fragments(new_id, nd.get("fragments", [])),
        "root_of": nd.get("root_of"),
        "source_ticket": nd.get("source_ticket"),
        "output_files": list(nd.get("output_files", [])),
        "status": "active",
        "supersedes": [old["id"]],
        "superseded_by": None,
        "last_still_valid_at": None,
        "void_reason": None,
        "voided_at": None,
        "created_at": event["ts"],
        "created_by": event["actor"],
    })
    old["status"] = "superseded"
    old["superseded_by"] = new_id
    _invalidate_decision_items(state, old["id"])


def _fold_decision_void(state, event):
    d = _decision(state, event["target"])
    if d["status"] != "active":
        raise DtError(f"决定 {d['id']} 不是 active，不能作废")
    if d.get("root_of"):
        raise DtError("根决定不能作废")
    d["status"] = "void"
    d["void_reason"] = event["payload"]["reason"]
    d["voided_at"] = event["ts"]
    _invalidate_decision_items(state, d["id"])


def _decision(state, did):
    d = state["decisions"].get(did)
    if not d:
        raise DtError(f"找不到决定 {did}")
    return d


def _normalize_fragments(owner_id, fragments):
    result = []
    for index, item in enumerate(fragments, start=1):
        if isinstance(item, dict):
            text = item.get("text", "")
            frag_id = item.get("id") or f"{owner_id}#{index}"
        else:
            text = str(item)
            frag_id = f"{owner_id}#{index}"
        if not text:
            raise DtError(f"拆句 {frag_id} 为空")
        result.append({"id": frag_id, "index": index, "text": text})
    return result


def _invalidate_decision_items(state, decision_id):
    for case in state["impact_cases"].values():
        if case["status"] != "open":
            continue
        for item in case["items"]:
            if item["kind"] == "decision" and item["ref"] == decision_id:
                if item["status"] == "待处理":
                    item["status"] = "已失效"


# ---------- 前提 ----------

def _fold_premise_add(state, event):
    p = event["payload"]
    pid = event["target"]
    if pid in state["premises"]:
        raise DtError(f"前提编号重复：{pid}")
    _decision(state, p["decision"])
    _put_premise(state, {
        "id": pid,
        "decision": p["decision"],
        "statement": p["statement"],
        "evidence": list(p["evidence"]),
        "state": "未验",
        "created_at": event["ts"],
        "created_by": event["actor"],
        "last_judged_at": None,
        "last_judged_by": None,
    })


def _fold_premise_edit(state, event):
    p = event["payload"]
    premise = _premise(state, event["target"])
    if premise["last_judged_at"]:
        raise DtError("判过的前提不能改陈述；要换说法请新建一条")
    if "statement" in p:
        premise["statement"] = p["statement"]
    if "evidence" in p:
        premise["evidence"] = list(p["evidence"])


def _fold_premise_judge(state, event):
    p = event["payload"]
    premise = _premise(state, event["target"])
    premise["state"] = p["verdict"]
    premise["last_judged_at"] = event["ts"]
    premise["last_judged_by"] = event["actor"]
    premise["evidence"] = list(premise["evidence"]) + list(p["evidence"])


def _premise(state, pid):
    p = state["premises"].get(pid)
    if not p:
        raise DtError(f"找不到前提 {pid}")
    return p


# ---------- 影响清单 ----------

def _open_impact_case(state, event):
    p = event["payload"]
    cid = p["impact_case"]
    if cid in state["impact_cases"]:
        raise DtError(f"影响清单编号重复：{cid}")
    op = event["op"]
    if op == "decision.overturn":
        old = _decision(state, event["target"])
        trigger = "root_replaced" if old.get("root_of") else "overturn"
        trigger_decision = old["id"]
    elif op == "decision.void":
        trigger = "void"
        trigger_decision = event["target"]
    elif op == "premise.judge":
        premise = _premise(state, event["target"])
        trigger = "premise_broken"
        trigger_decision = premise["decision"]
    else:
        raise DtError(f"{op} 不能打开影响清单")
    items = []
    for item in p["impact_items"]:
        items.append({
            "kind": item["kind"],
            "ref": item["ref"],
            "relations": sorted(item.get("relations", [])),
            "status": "待处理",
            "action": None,
            "acted_at": None,
            "acted_by": None,
            "reason": None,
            "merged_into": None,
        })
    state["impact_cases"][cid] = {
        "id": cid,
        "trigger": trigger,
        "trigger_decision": trigger_decision,
        "trigger_event_seq": event["seq"],
        "items": items,
        "status": "open",
        "opened_at": event["ts"],
        "opened_by": event["actor"],
        "closed_at": None,
        "closed_by": None,
        "close_reason": None,
    }
    _bump_counter(state, "impact", cid[3:])


def _mark_impact_item(state, event):
    p = event["payload"]
    case = state["impact_cases"].get(p["impact_case"])
    if not case:
        raise DtError(f"找不到影响清单 {p['impact_case']}")
    if case["status"] != "open":
        raise DtError(f"影响清单 {case['id']} 已关闭")
    item = _find_item(case, p["impact_item"])
    item["status"] = "已处理"
    item["action"] = p["impact_action"]
    item["acted_at"] = event["ts"]
    item["acted_by"] = event["actor"]
    item["reason"] = event.get("reason")
    if p.get("impact_merged_into"):
        item["merged_into"] = p["impact_merged_into"]
    if item["kind"] == "decision" and item["action"] == "仍成立":
        d = state["decisions"].get(item["ref"])
        if d:
            d["last_still_valid_at"] = event["ts"]


def _find_item(case, ref):
    for item in case["items"]:
        if item["kind"] == ref["kind"] and item["ref"] == ref["ref"]:
            return item
    raise DtError(f"影响清单 {case['id']} 里没有 {ref['kind']} {ref['ref']}")


def _fold_impact_act(state, event):
    p = event["payload"]
    case = state["impact_cases"].get(event["target"])
    if not case:
        raise DtError(f"找不到影响清单 {event['target']}")
    if case["status"] != "open":
        raise DtError(f"影响清单 {case['id']} 已关闭")
    item = _find_item(case, p["item"])
    if p["action"] == "仍成立" and item["kind"] != "decision":
        raise DtError("仍成立只能用在决定上")
    if p["action"] == "保留" and item["kind"] != "ticket":
        raise DtError("保留只能用在票上")
    item["status"] = "已处理"
    item["action"] = p["action"]
    item["acted_at"] = event["ts"]
    item["acted_by"] = event["actor"]
    item["reason"] = event.get("reason")
    if p["action"] == "仍成立":
        d = state["decisions"].get(item["ref"])
        if d:
            d["last_still_valid_at"] = event["ts"]


def _fold_impact_close(state, event):
    case = state["impact_cases"].get(event["target"])
    if not case:
        raise DtError(f"找不到影响清单 {event['target']}")
    if case["status"] != "open":
        raise DtError(f"影响清单 {case['id']} 已经关闭")
    pending = [i for i in case["items"] if i["status"] == "待处理"]
    if pending:
        names = "、".join(f"{i['kind']} {i['ref']}" for i in pending)
        raise DtError(f"还有 {len(pending)} 项待处理：{names}")
    case["status"] = "closed"
    case["closed_at"] = event["ts"]
    case["closed_by"] = event["actor"]
    case["close_reason"] = event.get("reason")


# ---------- 视图 ----------

def current_root(state, map_id):
    roots = [
        d for d in state["decisions"].values()
        if d.get("root_of") == map_id and d["status"] == "active"
    ]
    if len(roots) == 1:
        return roots[0]
    if len(roots) > 1:
        raise DtError(f"地图 {map_id} 有多条现行根决定")
    return None


def coverage_rows(state, map_id):
    root = current_root(state, map_id)
    if not root:
        return []
    rows = []
    for frag in root["fragments"]:
        tickets = [
            i for i in state["issues"].values()
            if i["kind"] == "ticket" and i["parent"] == map_id and frag["id"] in i["covers"]
        ]
        tickets.sort(key=lambda i: _issue_sort_key(i["id"]))
        if not tickets:
            status = "缺口"
        elif any(t["state"] == "open" for t in tickets):
            status = "进行中"
        else:
            status = "已落"
        rows.append({"fragment": frag, "tickets": tickets, "status": status})
    return rows


def stale_covers(state, ticket):
    root = current_root(state, ticket["parent"])
    valid = {f["id"] for f in root["fragments"]} if root else set()
    return [c for c in ticket["covers"] if c not in valid]


def open_blockers(state, issue_id):
    issue = state["issues"].get(issue_id)
    if not issue:
        return []
    result = []
    for bid in issue["blocked_by"]:
        blocker = state["issues"].get(bid)
        if blocker is None or blocker["state"] == "open":
            result.append(bid)
    return result


def decision_red(state, decision):
    if decision["status"] != "active":
        return False
    last_valid = parse_ts(decision.get("last_still_valid_at"))
    for premise in state["premises"].values():
        if premise["decision"] != decision["id"] or premise["state"] != "已破":
            continue
        judged = parse_ts(premise.get("last_judged_at"))
        if last_valid is None or (judged and judged > last_valid):
            return True
    return False


def _issue_sort_key(iid):
    if iid.startswith("I-"):
        try:
            return (1, int(iid[2:]), "")
        except ValueError:
            pass
    try:
        return (0, int(iid), "")
    except ValueError:
        return (2, 0, iid)


# ---------- 状态哈希 ----------

def state_hash(state):
    business = {
        "issues": state["issues"],
        "decisions": state["decisions"],
        "comments": state["comments"],
        "premises": state["premises"],
        "impact_cases": _impact_for_hash(state["impact_cases"]),
    }
    canonical = _canonical(business)
    text = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256_hex("v1\n" + text)


def _impact_for_hash(cases):
    out = {}
    for cid, case in cases.items():
        copy_case = {k: v for k, v in case.items() if k != "trigger_event_seq"}
        copy_case["items"] = [
            {k: (sorted(v) if k == "relations" else v) for k, v in item.items()}
            for item in case["items"]
        ]
        out[cid] = copy_case
    return out


def _canonical(value):
    if isinstance(value, dict):
        return {k: _canonical(value[k]) for k in sorted(value)}
    if isinstance(value, list):
        items = [_canonical(v) for v in value]
        if items and all(isinstance(v, dict) for v in items):
            if all("id" in v for v in items):
                return sorted(items, key=lambda v: str(v["id"]))
            if all("ref" in v for v in items):
                return sorted(items, key=lambda v: (str(v.get("kind", "")), str(v["ref"])))
            if all("index" in v for v in items):
                return sorted(items, key=lambda v: int(v["index"]))
        if items and all(isinstance(v, str) for v in items):
            return sorted(items)
        return items
    return value
