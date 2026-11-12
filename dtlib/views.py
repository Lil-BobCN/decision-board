"""给 CLI 和屏幕读的视图。只读，不改状态。"""
from __future__ import annotations

from .fold import (
    coverage_rows, current_root, decision_red, open_blockers, stale_covers,
)


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
