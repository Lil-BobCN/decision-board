"""给 CLI 和屏幕读的视图。只读，不改状态。"""
from __future__ import annotations

import getpass

from .fold import (
    coverage_rows, current_root, decision_red, open_blockers, stale_covers,
)
from .util import DtError


def issue_view(store, iid):
    state = store.state
    issue = state["issues"].get(iid)
    if not issue:
        raise KeyError(iid)
    comments = [c for c in state["comments"].values() if c["issue"] == iid and not c["deleted"]]
    comments.sort(key=lambda c: c["created_at"] or "")
    view = {
        "issue": issue,
        "comments": comments,
        "blocked_by_open": open_blockers(state, iid),
    }
    if issue["kind"] == "map":
        root = current_root(state, iid)
        view["root"] = root
        view["coverage"] = coverage_rows(state, iid)
        children = [i for i in state["issues"].values() if i["parent"] == iid]
        children.sort(key=lambda i: _key(i["id"]))
        view["tickets"] = children
    else:
        produced = [d for d in state["decisions"].values() if d["source_ticket"] == iid]
        view["produced_decisions"] = sorted(produced, key=lambda d: d["id"])
        view["stale_covers"] = stale_covers(state, issue)
        work = store.read_workstate().get("tickets", {}).get(iid)
        view["workstate"] = work
    return view


def decision_view(store, did):
    state = store.state
    d = state["decisions"].get(did)
    if not d:
        raise KeyError(did)
    premises = [p for p in state["premises"].values() if p["decision"] == did]
    premises.sort(key=lambda p: p["id"])
    return {
        "decision": d,
        "premises": premises,
        "red": decision_red(state, d),
        "superseded_by": state["decisions"].get(d.get("superseded_by")) if d.get("superseded_by") else None,
        "supersedes": [state["decisions"].get(x) for x in d.get("supersedes", []) if state["decisions"].get(x)],
        "source_ticket_issue": state["issues"].get(d.get("source_ticket")) if d.get("source_ticket") else None,
        "impact_cases": [c for c in state["impact_cases"].values()
                         if c["trigger_decision"] == did and c["status"] == "open"],
    }


def premise_view(store, pid):
    state = store.state
    p = state["premises"].get(pid)
    if not p:
        raise KeyError(pid)
    return {"premise": p, "decision": state["decisions"].get(p["decision"])}


def impact_view(store, cid):
    state = store.state
    case = state["impact_cases"].get(cid)
    if not case:
        raise KeyError(cid)
    items = []
    for item in case["items"]:
        entry = dict(item)
        if item["kind"] == "decision":
            entry["object"] = state["decisions"].get(item["ref"])
            entry["premises"] = [p for p in state["premises"].values()
                                  if p["decision"] == item["ref"]]
        else:
            entry["object"] = state["issues"].get(item["ref"])
        items.append(entry)
    return {"impact": case, "items": items,
            "trigger_decision": state["decisions"].get(case["trigger_decision"])}


def impact_list(store):
    cases = [c for c in store.state["impact_cases"].values() if c["status"] == "open"]
    cases.sort(key=lambda c: c["id"])
    return cases


def coverage_view(store, map_id):
    rows = coverage_rows(store.state, map_id)
    missing = [r for r in rows if r["status"] == "缺口"]
    return {
        "map": store.state["issues"].get(map_id),
        "root": current_root(store.state, map_id),
        "rows": rows,
        "total": len(rows),
        "missing": len(missing),
    }


def workstate_view(store):
    return store.read_workstate()


def sync_view(store, map_id):
    return {
        "mirror": store.mirror_on(map_id),
        "issues": store.sync.get("issues", {}),
        "comments": store.sync.get("comments", {}),
        "position": store.sync.get("position", {}).get(map_id),
        "history": [h for h in store.sync.get("history", []) if str(h.get("map")) == str(map_id)][-20:],
    }


def _key(iid):
    try:
        return (0, int(iid))
    except ValueError:
        return (1, iid)


def _screen_actor():
    """屏幕是人的操作面，事件记成 human:<本机用户名>。"""
    try:
        return "human:" + getpass.getuser()
    except Exception:
        return "human:unknown"


# ---------- 屏幕 ----------

SIGNALS = (
    ("orphan-ticket", "无主票", "amber", "票没有 derived_from。补来源决定和拆票理由。"),
    ("orphan-decision", "无源决定", "amber", "生效决定没有来源票。补 source_ticket；导入的决定标「未记录」。"),
    ("stale-decision", "吃旧决定", "amber", "票挂在已被取代或作废的决定上，或 covers 指向旧拆句。改范围、关掉、重开或新建。"),
    ("bare-decision", "裸决定", "gray", "生效决定没有记录前提。加一条可被证伪的前提。"),
    ("broken-premise", "破前提", "red", "前提已破，决定还没处理。逐项处理影响清单。"),
    ("coverage-gap", "覆盖缺口", "red", "根决定的拆句没有票接。新建票，covers 指向这一句。"),
    ("impact-open", "影响清单未清", "red", "有开着的影响清单。逐项处理完再显式关闭。"),
    ("stuck-ticket", "工作卡住", "amber", "票在等人处理。去 orca 看终端，或在中台改票。"),
    ("sync-error", "同步异常", "red", "最近一次同步有失败项。重试或重新同步。"),
)


def board_view(store, map_id=None):
    """一张地图的完整看板数据：图、票、覆盖、影响清单、信号和同步状态。"""
    state = store.state
    if not map_id:
        candidates = [i for i in state["issues"].values() if i["kind"] == "map"]
        if not candidates:
            raise DtError("还没有地图；先导入或新建一张")
        candidates.sort(key=lambda m: (
            m.get("updated_at") or m.get("created_at") or "",
            _key(m["id"]),
        ))
        map_id = candidates[-1]["id"]
    map_id = str(map_id)
    map_issue = state["issues"].get(map_id)
    if not map_issue or map_issue["kind"] != "map":
        raise DtError(f"找不到地图 {map_id}")

    root = current_root(state, map_id)
    maps = [
        {"id": i["id"], "title": i["title"], "state": i["state"]}
        for i in state["issues"].values() if i["kind"] == "map"
    ]
    maps.sort(key=lambda m: _key(m["id"]))

    tickets = [
        i for i in state["issues"].values()
        if i["kind"] == "ticket" and i["parent"] == map_id
    ]
    tickets.sort(key=lambda i: _key(i["id"]))
    ticket_ids = {t["id"] for t in tickets}

    all_decisions = state["decisions"]
    included = {}
    for decision in all_decisions.values():
        if decision.get("root_of") == map_id or decision.get("source_ticket") in ticket_ids:
            included[decision["id"]] = decision
    for ticket in tickets:
        for decision_id in (ticket.get("derived_from", [])
                            + ticket.get("derived_from_inferred", [])):
            if decision_id in all_decisions:
                included[decision_id] = all_decisions[decision_id]
    changed = True
    while changed:
        changed = False
        for decision in list(included.values()):
            for old_id in decision.get("supersedes", []):
                if old_id in all_decisions and old_id not in included:
                    included[old_id] = all_decisions[old_id]
                    changed = True
            replaced = decision.get("superseded_by")
            if replaced and replaced in all_decisions and replaced not in included:
                included[replaced] = all_decisions[replaced]
                changed = True
    decisions = sorted(included.values(), key=lambda d: d["id"])
    decision_ids = {d["id"] for d in decisions}

    premises_by_decision = {}
    for premise in state["premises"].values():
        if premise["decision"] in decision_ids:
            premises_by_decision.setdefault(premise["decision"], []).append(premise)
    for items in premises_by_decision.values():
        items.sort(key=lambda p: p["id"])

    workstate = store.read_workstate()
    work_tickets = workstate.get("tickets") or {}

    map_history = [
        h for h in store.sync.get("history", [])
        if str(h.get("map")) == map_id
    ]
    last_by_ref = {}
    for record in map_history:
        ref = record.get("ref")
        if ref:
            last_by_ref[ref] = record
    sync_history = map_history[-20:]
    failed_refs = [
        ref for ref, record in last_by_ref.items()
        if record.get("status") == "failed"
    ]
    position = store.sync.get("position", {}).get(map_id)
    mirror = store.mirror_on(map_id)
    if not mirror:
        sync_state = "未开启"
    elif failed_refs:
        sync_state = "失败"
    elif position:
        sync_state = "已同步"
    else:
        sync_state = "未同步"

    def decision_entry(d):
        return {
            "id": d["id"],
            "statement": d["statement"],
            "fragments": d.get("fragments", []),
            "root_of": d.get("root_of"),
            "source_ticket": d.get("source_ticket"),
            "output_files": d.get("output_files", []),
            "rationale": d.get("rationale", ""),
            "status": d["status"],
            "supersedes": d.get("supersedes", []),
            "superseded_by": d.get("superseded_by"),
            "last_still_valid_at": d.get("last_still_valid_at"),
            "void_reason": d.get("void_reason"),
            "voided_at": d.get("voided_at"),
            "created_at": d.get("created_at"),
            "created_by": d.get("created_by"),
            "premises": premises_by_decision.get(d["id"], []),
            "red": decision_red(state, d),
        }

    decision_entries = [decision_entry(d) for d in decisions]

    def ticket_entry(ticket):
        work = work_tickets.get(ticket["id"]) or {}
        work_label = "已完成" if ticket["state"] == "closed" else (work.get("state") or "未领取")
        comments = [
            c for c in state["comments"].values()
            if c["issue"] == ticket["id"] and not c["deleted"]
        ]
        comments.sort(key=lambda c: c["created_at"] or "")
        sync_entry = last_by_ref.get(ticket["id"])
        if sync_entry and sync_entry.get("status") == "failed":
            ticket_sync = "失败"
        elif sync_entry or store.sync.get("issues", {}).get(ticket["id"]):
            ticket_sync = "已同步"
        else:
            ticket_sync = "未同步"
        return {
            "id": ticket["id"],
            "title": ticket["title"],
            "type": ticket["type"],
            "state": ticket["state"],
            "labels": ticket.get("labels", []),
            "parent": ticket.get("parent"),
            "body": ticket.get("body", ""),
            "split_reason": ticket.get("split_reason", ""),
            "derived_from": ticket.get("derived_from", []),
            "derived_from_inferred": ticket.get("derived_from_inferred", []),
            "covers": ticket.get("covers", []),
            "blocked_by": ticket.get("blocked_by", []),
            "created_at": ticket.get("created_at"),
            "updated_at": ticket.get("updated_at"),
            "closed_at": ticket.get("closed_at"),
            "created_by": ticket.get("created_by"),
            "work": work_label,
            "work_note": work.get("note"),
            "work_started_at": work.get("state_started_at"),
            "work_synced_at": work.get("last_synced_at"),
            "produces": [d["id"] for d in decisions if d.get("source_ticket") == ticket["id"]],
            "comments": comments,
            "blocked_by_open": open_blockers(state, ticket["id"]),
            "stale_covers": stale_covers(state, ticket),
            "sync": {
                "state": ticket_sync,
                "github": store.sync.get("issues", {}).get(ticket["id"]),
                "last": sync_entry,
            },
        }

    ticket_entries = [ticket_entry(t) for t in tickets]
    ticket_by_id = {t["id"]: t for t in ticket_entries}

    groups = []
    if root:
        groups.append({
            "key": "decision:" + root["id"],
            "root": True,
            "ticket": None,
            "main": root["id"],
            "decisions": [root["id"]],
        })
    for ticket in tickets:
        produced = [d for d in decisions if d.get("source_ticket") == ticket["id"]]
        if not produced:
            continue
        produced.sort(key=lambda d: (
            0 if (d["status"] == "active" and d.get("supersedes")) else
            1 if d["status"] == "active" else 2,
            d["id"],
        ))
        groups.append({
            "key": "decision:" + produced[0]["id"],
            "root": False,
            "ticket": ticket["id"],
            "main": produced[0]["id"],
            "decisions": [d["id"] for d in produced],
        })
    orphans = [
        d for d in decisions
        if not d.get("source_ticket") and not d.get("root_of")
    ]
    if orphans:
        groups.append({
            "key": "decision:" + orphans[0]["id"],
            "root": False,
            "ticket": None,
            "main": orphans[0]["id"],
            "decisions": [d["id"] for d in orphans],
        })

    edges = []
    for ticket in tickets:
        confirmed = list(ticket.get("derived_from", []))
        for decision_id in confirmed:
            if decision_id in decision_ids:
                edges.append({
                    "kind": "derived",
                    "from": "decision:" + decision_id,
                    "to": "ticket:" + ticket["id"],
                    "inferred": False,
                })
        for decision_id in ticket.get("derived_from_inferred", []):
            if decision_id in decision_ids and decision_id not in confirmed:
                edges.append({
                    "kind": "derived",
                    "from": "decision:" + decision_id,
                    "to": "ticket:" + ticket["id"],
                    "inferred": True,
                })
    for decision in decisions:
        source = decision.get("source_ticket")
        if source in ticket_ids:
            edges.append({
                "kind": "produced",
                "from": "ticket:" + source,
                "to": "decision:" + decision["id"],
            })
        replaced = decision.get("superseded_by")
        if replaced in decision_ids:
            edges.append({
                "kind": "supersedes",
                "from": "decision:" + replaced,
                "to": "decision:" + decision["id"],
            })

    def case_entry(case):
        items = []
        for item in case["items"]:
            ref = item["ref"]
            obj = (state["decisions"].get(ref) if item["kind"] == "decision"
                   else state["issues"].get(ref)) or {}
            items.append({
                **item,
                "object": {
                    "id": obj.get("id"),
                    "title": obj.get("title"),
                    "statement": obj.get("statement"),
                    "state": obj.get("state"),
                    "type": obj.get("type"),
                    "status": obj.get("status"),
                },
            })
        trigger = state["decisions"].get(case["trigger_decision"]) or {}
        return {
            **case,
            "items": items,
            "trigger_decision_issue": {
                "id": trigger.get("id"),
                "statement": trigger.get("statement"),
                "status": trigger.get("status"),
            },
        }

    cases = [
        case for case in state["impact_cases"].values()
        if case["trigger_decision"] in decision_ids
        or any(
            (item["kind"] == "decision" and item["ref"] in decision_ids)
            or (item["kind"] == "ticket" and item["ref"] in ticket_ids)
            for item in case["items"]
        )
    ]
    cases.sort(key=lambda c: c["id"], reverse=True)

    rows = coverage_rows(state, map_id)
    for row in rows:
        row["tickets"] = [
            {
                "id": t["id"],
                "title": t["title"],
                "state": t["state"],
                "split_reason": t.get("split_reason", ""),
                "work": (ticket_by_id.get(t["id"]) or {}).get("work", "未领取"),
            }
            for t in row["tickets"]
        ]

    map_comments = [
        c for c in state["comments"].values()
        if c["issue"] == map_id and not c["deleted"]
    ]
    map_comments.sort(key=lambda c: c["created_at"] or "")

    signals = _signals(
        map_id, ticket_entries, ticket_by_id, decision_entries,
        rows, cases, map_history, sync_state,
    )

    counts = {
        "groups": len(groups),
        "decisions": len(decisions),
        "tickets": len(tickets),
        "open": len([t for t in tickets if t["state"] == "open"]),
        "fragments": len(root.get("fragments", [])) if root else 0,
        "coverage_done": len([r for r in rows if r["status"] == "已落"]),
        "coverage_doing": len([r for r in rows if r["status"] == "进行中"]),
        "coverage_gaps": len([r for r in rows if r["status"] == "缺口"]),
        "impact_open": len([c for c in cases if c["status"] == "open"]),
    }

    return {
        "seq": store.last_seq,
        "hash": store.hash(),
        "actor": _screen_actor(),
        "map": {
            "id": map_issue["id"],
            "title": map_issue["title"],
            "body": map_issue.get("body", ""),
            "split_rationale": map_issue.get("split_rationale", ""),
            "state": map_issue["state"],
            "labels": map_issue.get("labels", []),
            "created_at": map_issue.get("created_at"),
            "updated_at": map_issue.get("updated_at"),
            "comments": map_comments,
        },
        "maps": maps,
        "root": root,
        "fragments": root.get("fragments", []) if root else [],
        "groups": groups,
        "decisions": decision_entries,
        "tickets": ticket_entries,
        "edges": edges,
        "coverage": rows,
        "impact_cases": [case_entry(c) for c in cases],
        "signals": signals,
        "counts": counts,
        "workstate": workstate,
        "sync": {
            "mirror": mirror,
            "position": position,
            "state": sync_state,
            "history": sync_history,
        },
    }


def _signals(map_id, ticket_entries, ticket_by_id, decision_entries,
             rows, cases, sync_history, sync_state):
    decision_by_id = {d["id"]: d for d in decision_entries}

    orphan_tickets = [t["id"] for t in ticket_entries if not t["derived_from"]]
    orphan_decisions = [
        d["id"] for d in decision_entries
        if d["status"] == "active" and not d.get("source_ticket") and not d.get("root_of")
    ]
    stale_tickets = []
    for ticket in ticket_entries:
        stale = bool(ticket["stale_covers"])
        for decision_id in (ticket["derived_from"]
                            + ticket["derived_from_inferred"]):
            decision = decision_by_id.get(decision_id)
            if decision and decision["status"] != "active":
                stale = True
                break
        if stale:
            stale_tickets.append(ticket["id"])
    bare = [
        d["id"] for d in decision_entries
        if d["status"] == "active" and not d.get("root_of") and not d["premises"]
    ]
    broken = [d["id"] for d in decision_entries if d["red"]]
    gaps = [r["fragment"]["id"] for r in rows if r["status"] == "缺口"]
    open_cases = [c for c in cases if c["status"] == "open"]
    impact_targets = []
    for case in open_cases:
        for item in case["items"]:
            if item["status"] == "待处理":
                impact_targets.append(item["kind"] + ":" + item["ref"])
    stuck = [
        t["id"] for t in ticket_entries
        if t["state"] == "open" and t["work"] == "等待人"
    ]
    last_status = {}
    for record in sync_history:
        if record.get("ref") and record.get("status"):
            last_status[record["ref"]] = record["status"]
    failed_refs = sorted([ref for ref, status in last_status.items() if status == "failed"])
    sync_targets = ["ticket:" + ref for ref in failed_refs if ref in ticket_by_id]
    if sync_state == "失败" and not sync_targets:
        sync_targets = ["map:" + map_id]

    values = {
        "orphan-ticket": (["ticket:" + i for i in orphan_tickets], len(orphan_tickets)),
        "orphan-decision": (["decision:" + i for i in orphan_decisions], len(orphan_decisions)),
        "stale-decision": (["ticket:" + i for i in stale_tickets], len(stale_tickets)),
        "bare-decision": (["decision:" + i for i in bare], len(bare)),
        "broken-premise": (["decision:" + i for i in broken], len(broken)),
        "coverage-gap": (["fragment:" + i for i in gaps], len(gaps)),
        "impact-open": (impact_targets, len(open_cases)),
        "stuck-ticket": (["ticket:" + i for i in stuck], len(stuck)),
        "sync-error": (sync_targets, len(failed_refs) or (1 if sync_state == "失败" else 0)),
    }
    result = []
    for key, label, tone, hint in SIGNALS:
        targets, count = values[key]
        result.append({
            "key": key,
            "label": label,
            "tone": tone,
            "hint": hint,
            "count": count,
            "targets": targets,
        })
    return result
