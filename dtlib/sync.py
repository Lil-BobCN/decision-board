"""同步：中台 → GitHub 镜像。先出计划，再执行。"""
from __future__ import annotations

import subprocess

from .fold import coverage_rows, current_root
from .importer import GitHub, _flatten
from .util import DtError, now_ts

MARK_BEGIN = "<!-- 中台:begin -->"
MARK_END = "<!-- 中台:end -->"
SECTION_LIMIT = 60 * 1024


def compute_plan(store, repo, map_id, gh_bin="gh"):
    state = store.state
    map_issue = state["issues"].get(map_id)
    if not map_issue or map_issue["kind"] != "map":
        raise DtError(f"找不到地图 {map_id}")
    if not str(map_id).isdigit():
        raise DtError(f"地图 {map_id} 还没有 GitHub 号；v1 只同步导入的图")
    gh = GitHub(repo, gh_bin)
    local_tickets = [i for i in state["issues"].values() if i["parent"] == map_id]
    local_tickets.sort(key=lambda i: _num_key(i["id"]))
    remote = _fetch_remote(store, repo, map_id, local_tickets, gh)
    remote_map = remote["map"]
    remote_by_number = remote["issues"]
    remote_subs = remote["sub_issues"]
    remote_subs_numbers = remote["sub_numbers"]

    actions = []
    warnings = []
    seen_remote = set()

    # 地图本身
    map_actions = _diff_issue(store, repo, map_issue, remote_map, is_map=True)
    actions.extend(map_actions)
    seen_remote.add(int(remote_map["number"]))

    for issue in local_tickets:
        remote_number = _remote_number(store, issue["id"], remote_by_number)
        if remote_number is None:
            # 崩溃重试时，先认领同标题同正文的远端票，避免重复新建
            match = _match_unclaimed_remote(store, issue, remote_subs, seen_remote, warnings)
            if match:
                remote_number = int(match["number"])
                actions.append({
                    "kind": "comment.map", "phase": 0,
                    "ref": issue["id"], "issues": [],
                    "detail": f"认领 GitHub #{remote_number}（{issue['title']}）",
                    "issue_number": remote_number,
                })
            else:
                actions.append({
                    "kind": "issue.create", "phase": 1,
                    "ref": issue["id"],
                    "detail": f"新建票 #{issue['id']} {issue['title']}",
                    "title": issue["title"], "body": issue["body"],
                    "labels": sorted(set(issue["labels"] + [f"wayfinder:{issue['type']}"])),
                })
                if issue["state"] == "closed":
                    actions.append({
                        "kind": "issue.state", "phase": 2,
                        "ref": issue["id"], "state": "closed",
                        "detail": f"新建后关掉 #{issue['id']}",
                    })
        else:
            seen_remote.add(remote_number)
            actions.extend(_diff_issue(store, repo, issue, remote_by_number.get(remote_number), is_map=False))

    for number in remote_by_number:
        if number not in seen_remote:
            warnings.append(f"GitHub 上的 #{number} 不在中台这张地图下，本次跳过（中台为准）")

    # 父子、阻塞、评论
    for issue in local_tickets:
        remote_number = _remote_number(store, issue["id"], remote_by_number)
        if remote_number is None or remote_number not in remote_subs_numbers:
            actions.append({
                "kind": "parent.add", "phase": 3,
                "ref": issue["id"], "parent": map_id,
                "detail": f"把 #{issue['id']} 挂到地图 {map_id} 下",
            })
        remote = remote_by_number.get(remote_number) or {}
        remote_blockers = {int(b) for b in (remote.get("blocked_by") or [])}
        local_by_number = {}
        for blocker in issue["blocked_by"]:
            blocker_number = _remote_number(store, blocker, remote_by_number)
            if blocker_number is None:
                warnings.append(f"#{issue['id']} 的阻塞项 {blocker} 无法镜像：它不在本图且没有 GitHub 号")
                continue
            local_by_number.setdefault(blocker_number, blocker)
        local_blocker_numbers = set(local_by_number)
        for blocker_number in sorted(local_blocker_numbers - remote_blockers):
            blocker = local_by_number[blocker_number]
            actions.append({
                "kind": "block.add", "phase": 3,
                "ref": issue["id"], "blocker": blocker,
                "blocker_number": blocker_number,
                "detail": f"加阻塞：#{issue['id']} 被 {blocker} 挡",
            })
        for blocker_number in sorted(remote_blockers - local_blocker_numbers):
            actions.append({
                "kind": "block.remove", "phase": 3,
                "ref": issue["id"], "blocker": str(blocker_number),
                "blocker_number": blocker_number,
                "detail": f"移除阻塞：#{issue['id']} 不再被 {blocker_number} 挡",
            })
        # 评论
        remote_comments = remote.get("comments") or []
        actions.extend(_diff_comments(store, issue, remote_number, remote_comments, warnings))

    # 地图自己的评论
    map_comments = remote_map.get("comments") or []
    actions.extend(_diff_comments(store, map_issue, int(remote_map["number"]), map_comments, warnings))

    # 地图正文生成段
    section = build_generated_section(store, map_id)
    desired_body = with_generated(map_issue["body"], section)
    if (remote_map.get("body") or "") != desired_body:
        actions.append({
            "kind": "map.body", "phase": 5, "ref": map_id,
            "detail": "改写地图正文的生成段",
            "body": desired_body,
        })

    actions.sort(key=lambda a: (a["phase"], _num_key(a.get("ref", ""))))
    counts = {}
    for action in actions:
        counts[action["kind"]] = counts.get(action["kind"], 0) + 1
    return {
        "map": map_id,
        "mirror": store.mirror_on(map_id),
        "actions": actions,
        "warnings": warnings,
        "counts": counts,
    }


def _fetch_remote(store, repo, map_id, local_tickets, gh):
    mapped = set()
    for issue in local_tickets:
        mapped_number = store.sync.get("issues", {}).get(str(issue["id"]))
        if mapped_number is not None:
            mapped.add(int(mapped_number))
        elif str(issue["id"]).isdigit():
            mapped.add(int(issue["id"]))
    try:
        return _fetch_remote_graphql(repo, map_id, mapped, gh)
    except Exception as exc:
        store._log(f"GraphQL 读取失败，退回 REST：{exc}")
        return _fetch_remote_rest(gh, repo, map_id, mapped)


def _fetch_remote_graphql(repo, map_id, mapped, gh):
    if not str(map_id).isdigit():
        raise DtError(f"地图 {map_id} 还没有 GitHub 号")
    owner, name = repo.split("/", 1)
    aliases = " ".join(
        f'i{number}: issue(number: {number}) {{ ...IssueFields }}'
        for number in sorted(mapped)
    )
    query = f"""
query {{
  repository(owner: "{owner}", name: "{name}") {{
    map: issue(number: {int(map_id)}) {{
      ...IssueFields
      subIssues(first: 100) {{ nodes {{ ...IssueFields }} }}
    }}
    {aliases}
  }}
}}
fragment IssueFields on Issue {{
  number title body state
  labels(first: 50) {{ nodes {{ name }} }}
  comments(first: 100) {{ nodes {{ databaseId body }} }}
  blockedBy(first: 100) {{ nodes {{ number }} }}
}}
"""
    data = gh.api("graphql", fields={"query": query})
    if data.get("errors"):
        raise DtError(f"GraphQL 返回错误：{data['errors']}")
    repo_data = (data.get("data") or {}).get("repository") or {}
    map_node = repo_data.get("map")
    if not map_node:
        raise DtError(f"GitHub 上找不到地图 {map_id}")
    sub_nodes = ((map_node.get("subIssues") or {}).get("nodes")) or []
    issues = {}
    for node in sub_nodes:
        issues[int(node["number"])] = _graph_issue(node)
    for number in sorted(mapped):
        node = repo_data.get(f"i{number}")
        if node:
            issues[int(number)] = _graph_issue(node)
    return {
        "map": _graph_issue(map_node),
        "issues": issues,
        "sub_numbers": {int(node["number"]) for node in sub_nodes},
        "sub_issues": [_graph_issue(node) for node in sub_nodes],
    }


def _graph_issue(node):
    return {
        "number": int(node["number"]),
        "title": node.get("title") or "",
        "body": node.get("body") or "",
        "state": (node.get("state") or "").lower(),
        "labels": [{"name": item["name"]} for item in
                   ((node.get("labels") or {}).get("nodes") or [])],
        "comments": [{"id": item.get("databaseId"), "body": item.get("body") or ""}
                     for item in ((node.get("comments") or {}).get("nodes") or [])],
        "blocked_by": {str(item["number"]) for item in
                       ((node.get("blockedBy") or {}).get("nodes") or [])},
    }


def _fetch_remote_rest(gh, repo, map_id, mapped):
    remote_map_raw = gh.api(f"repos/{repo}/issues/{map_id}")
    if not remote_map_raw:
        raise DtError(f"GitHub 上找不到地图 {map_id}")
    remote_subs_raw = _flatten(gh.api(f"repos/{repo}/issues/{map_id}/sub_issues", paginate=True)) or []
    issues = {}
    for item in remote_subs_raw:
        number = int(item["number"])
        issues[number] = _rest_issue(gh, repo, item)
    for number in sorted(mapped):
        if number not in issues:
            item = gh.api(f"repos/{repo}/issues/{number}")
            if item:
                issues[number] = _rest_issue(gh, repo, item)
    remote_map = _rest_issue(gh, repo, remote_map_raw)
    sub_numbers = {int(item["number"]) for item in remote_subs_raw}
    return {
        "map": remote_map,
        "issues": issues,
        "sub_numbers": sub_numbers,
        "sub_issues": [issues[number] for number in sorted(sub_numbers) if number in issues],
    }


def _rest_issue(gh, repo, item):
    number = int(item["number"])
    comments = _flatten(_remote_comments(gh, repo, number, {})) or []
    blockers = _remote_blockers(gh, repo, number)
    return {
        "number": number,
        "title": item.get("title") or "",
        "body": item.get("body") or "",
        "state": (item.get("state") or "").lower(),
        "labels": [{"name": _label_name(l)} for l in item.get("labels", [])],
        "comments": [{"id": c.get("id"), "body": c.get("body") or ""} for c in comments],
        "blocked_by": blockers,
    }


def _remote_number(store, local_id, remote_by_number):
    if str(local_id).isdigit() and int(local_id) in remote_by_number:
        return int(local_id)
    mapped = store.sync.get("issues", {}).get(str(local_id))
    if mapped is not None:
        return int(mapped)
    return None


def _match_unclaimed_remote(store, issue, remote_subs, seen_remote, warnings):
    for item in remote_subs:
        number = int(item["number"])
        if number in seen_remote:
            continue
        if (item.get("title") or "") != issue["title"]:
            continue
        if (item.get("body") or "") != issue["body"]:
            continue
        if store.sync.get("issues", {}).get(str(issue["id"])) is not None:
            continue
        return item
    return None


def _diff_issue(store, repo, issue, remote, is_map):
    actions = []
    if remote is None:
        return actions
    number = int(remote["number"])
    local_body = issue["body"]
    if is_map:
        # 地图正文由 map.body 统一处理；标题单独比
        if (remote.get("title") or "") != issue["title"]:
            actions.append({
                "kind": "issue.update", "phase": 2, "ref": issue["id"],
                "title": issue["title"],
                "detail": f"更新地图标题",
            })
    else:
        if (remote.get("title") or "") != issue["title"]:
            actions.append({
                "kind": "issue.update", "phase": 2, "ref": issue["id"],
                "title": issue["title"], "body": local_body,
                "detail": f"更新 #{issue['id']} 的标题",
            })
        elif (remote.get("body") or "") != local_body:
            actions.append({
                "kind": "issue.update", "phase": 2, "ref": issue["id"],
                "title": issue["title"], "body": local_body,
                "detail": f"更新 #{issue['id']} 的正文",
            })
    remote_state = remote.get("state")
    if remote_state and remote_state != issue["state"]:
        actions.append({
            "kind": "issue.state", "phase": 2, "ref": issue["id"],
            "state": issue["state"],
            "detail": f"把 #{issue['id']} 改成 {issue['state']}",
        })
    desired_labels = list(issue["labels"])
    structural = "wayfinder:map" if issue["kind"] == "map" else f"wayfinder:{issue['type']}"
    desired_labels.append(structural)
    remote_labels = [_label_name(l) for l in remote.get("labels", [])]
    if sorted(set(remote_labels)) != sorted(set(desired_labels)):
        actions.append({
            "kind": "issue.labels", "phase": 2, "ref": issue["id"],
            "labels": sorted(set(desired_labels)),
            "detail": f"更新 #{issue['id']} 的标签",
        })
    return actions


def _label_name(label):
    return label.get("name") if isinstance(label, dict) else str(label)


def _remote_blockers(gh, repo, number):
    try:
        data = gh.api(f"repos/{repo}/issues/{number}/dependencies/blocked_by", paginate=True)
    except DtError as exc:
        text = str(exc)
        if "404" in text or "Not Found" in text:
            return set()
        raise
    return {str(item["number"]) for item in (_flatten(data) or [])}


def _remote_comments(gh, repo, number, cache):
    if number in cache:
        return cache[number]
    data = gh.api(f"repos/{repo}/issues/{number}/comments", paginate=True)
    comments = _flatten(data) or []
    cache[number] = comments
    return comments


def _diff_comments(store, issue, remote_number, remote_comments, warnings):
    actions = []
    by_id = {int(c["id"]): c for c in remote_comments}
    mapped_remote = set()
    for cid, gh_id in store.sync.get("comments", {}).items():
        comment = store.state["comments"].get(cid)
        if comment and comment["issue"] == issue["id"] and gh_id is not None:
            mapped_remote.add(int(gh_id))
    for comment in store.state["comments"].values():
        if comment["issue"] != issue["id"]:
            continue
        gh_id = store.sync.get("comments", {}).get(comment["id"])
        if comment["deleted"]:
            if gh_id is not None:
                actions.append({
                    "kind": "comment.delete", "phase": 4, "ref": comment["id"],
                    "issue": issue["id"], "issue_number": remote_number,
                    "remote_id": int(gh_id),
                    "detail": f"删除评论 {comment['id']}",
                })
            continue
        if gh_id is not None:
            remote = by_id.get(int(gh_id))
            if remote and (remote.get("body") or "") != comment["body"]:
                actions.append({
                    "kind": "comment.edit", "phase": 4, "ref": comment["id"],
                    "issue": issue["id"], "issue_number": remote_number,
                    "remote_id": int(gh_id), "body": comment["body"],
                    "detail": f"更新评论 {comment['id']}",
                })
            elif remote is None:
                warnings.append(f"评论 {comment['id']} 的 GitHub 映射指向不存在的评论，按新建处理")
                actions.append(_comment_create(issue, remote_number, comment))
            continue
        # 没有映射：先看远端有没有同正文的未映射评论
        match = None
        for remote in remote_comments:
            rid = int(remote["id"])
            if rid in mapped_remote:
                continue
            if (remote.get("body") or "") == comment["body"]:
                match = remote
                break
        if match:
            actions.append({
                "kind": "comment.map", "phase": 4, "ref": comment["id"],
                "issue": issue["id"], "remote_id": int(match["id"]),
                "detail": f"认领 GitHub 评论 {comment['id']}",
            })
        else:
            actions.append(_comment_create(issue, remote_number, comment))
    return actions


def _comment_create(issue, remote_number, comment):
    return {
        "kind": "comment.create", "phase": 4, "ref": comment["id"],
        "issue": issue["id"], "issue_number": remote_number,
        "body": comment["body"],
        "detail": f"发评论 {comment['id']} 到 #{issue['id']}",
    }


def build_generated_section(store, map_id):
    state = store.state
    root = current_root(state, map_id)
    if not root:
        raise DtError(f"地图 {map_id} 没有现行根决定")
    rows = coverage_rows(state, map_id)
    tickets = [i for i in state["issues"].values() if i["parent"] == map_id]
    tickets.sort(key=lambda i: _num_key(i["id"]))
    decisions = _map_decisions(state, map_id)
    lines = [
        MARK_BEGIN,
        "## Destination",
        "",
        f"**主句：** {root['statement']}",
        "",
        "**主句拆开：**",
        "",
    ]
    for frag in root["fragments"]:
        lines.append(f"{frag['index']}. {frag['text']}")
    lines += ["", "## Destination 覆盖表", "",
              "| 句 | 主句片段 | 由哪张票落 | 状态 |",
              "| --- | --- | --- | --- |"]
    for row in rows:
        ticket_text = "、".join(_ticket_label(t) for t in row["tickets"]) or "无"
        lines.append(f"| {row['fragment']['index']} | {_cell(row['fragment']['text'])} | "
                     f"{_cell(ticket_text)} | {row['status']} |")
    lines += ["", "## 决定清单", "",
              "| id | 决定 | 状态 | 来源票 | 前提 |",
              "| --- | --- | --- | --- | --- |"]
    for d in decisions:
        premises = [p for p in state["premises"].values() if p["decision"] == d["id"]]
        premise_text = "；".join(f"{p['id']} {p['state']}" for p in premises) or "无"
        source = f"#{d['source_ticket']}" if d.get("source_ticket") else "无"
        lines.append(f"| {d['id']} | {_cell(d['statement'])} | {d['status']} | "
                     f"{_cell(source)} | {_cell(premise_text)} |")
    lines += ["", "## 票因果表", "",
              "| 票 | 拆票理由 | 从哪条决定拆出 | 产出哪条决定 | 覆盖句 |",
              "| --- | --- | --- | --- | --- |"]
    for t in tickets:
        produced = [d["id"] for d in decisions if d.get("source_ticket") == t["id"]]
        lines.append(
            f"| {_cell(_ticket_label(t))} | {_cell(t['split_reason'] or '未记录')} | "
            f"{_cell('、'.join(t['derived_from']) or '未记录')} | {_cell('、'.join(produced) or '无')} | "
            f"{_cell('、'.join(t['covers']) or '无')} |")
    lines += ["", f"完整内容在中台：http://127.0.0.1:8788/#map/{map_id}", MARK_END]
    text = "\n".join(lines) + "\n"
    if len(text.encode("utf-8")) > SECTION_LIMIT:
        text = _truncate_section(lines, SECTION_LIMIT)
    return text


def _truncate_section(lines, limit):
    lines = list(lines)
    while len("\n".join(lines).encode("utf-8")) > limit:
        # 从后往前去掉表格数据行，保留表头和标记
        removed = False
        for index in range(len(lines) - 1, -1, -1):
            line = lines[index]
            if line.startswith("|") and not line.startswith("| ---") and "| id |" not in line \
                    and "| 句 |" not in line and "| 票 |" not in line:
                del lines[index]
                removed = True
                break
        if not removed:
            break
    note = f"（表格已截断，完整内容在中台：http://127.0.0.1:8788/）\n"
    if lines and lines[-1] == MARK_END:
        lines.insert(-1, note)
    else:
        lines.append(note)
    return "\n".join(lines) + "\n"


def _map_decisions(state, map_id):
    tickets = {i["id"] for i in state["issues"].values() if i["parent"] == map_id}
    result = []
    for d in state["decisions"].values():
        if d.get("root_of") == map_id:
            result.append(d)
        elif d.get("source_ticket") in tickets:
            result.append(d)
    result.sort(key=lambda d: d["id"])
    return result


def with_generated(body, section):
    body = body or ""
    if MARK_BEGIN in body and MARK_END in body:
        start = body.index(MARK_BEGIN)
        end = body.index(MARK_END) + len(MARK_END)
        return body[:start] + section + body[end:]
    return body.rstrip() + "\n\n" + section


def execute_plan(store, repo, map_id, plan, gh_bin="gh"):
    if not plan["mirror"]:
        raise DtError(f"地图 {map_id} 的镜像开关是关的，先打开再同步")
    gh = GitHub(repo, gh_bin)
    results = []
    new_numbers = {}
    failed_refs = set()
    actions = sorted(plan["actions"], key=lambda a: (a["phase"], _num_key(a.get("ref", ""))))

    for action in actions:
        kind = action["kind"]
        ref = action.get("ref")
        try:
            if kind == "comment.map":
                store.sync_record({"type": "mapping", "kind": "issue", "local": ref,
                                   "github": action["issue_number"]})
                new_numbers[ref] = action["issue_number"]
            elif kind == "issue.create":
                data = gh.api(f"repos/{repo}/issues", method="POST", input_json={
                    "title": action["title"], "body": action["body"],
                    "labels": action.get("labels", []),
                })
                number = int(data["number"])
                new_numbers[ref] = number
                store.sync_record({"type": "mapping", "kind": "issue", "local": ref, "github": number})
            elif kind == "issue.update":
                number = _number_for(store, ref, new_numbers)
                patch = {}
                if "title" in action:
                    patch["title"] = action["title"]
                if "body" in action:
                    patch["body"] = action["body"]
                gh.api(f"repos/{repo}/issues/{number}", method="PATCH", input_json=patch)
            elif kind == "issue.state":
                number = _number_for(store, ref, new_numbers)
                gh.api(f"repos/{repo}/issues/{number}", method="PATCH",
                       input_json={"state": action["state"]})
            elif kind == "issue.labels":
                number = _number_for(store, ref, new_numbers)
                gh.api(f"repos/{repo}/issues/{number}/labels", method="PUT",
                       input_json={"labels": action["labels"]})
            elif kind == "parent.add":
                child = _number_for(store, ref, new_numbers)
                parent = _number_for(store, action["parent"], new_numbers)
                _gh_edit(repo, parent, "--add-sub-issue", str(child), gh_bin=gh_bin)
            elif kind == "block.add":
                child = _number_for(store, ref, new_numbers)
                blocker = action.get("blocker_number") or _number_for(store, action["blocker"], new_numbers)
                _gh_edit(repo, child, "--add-blocked-by", str(blocker), gh_bin=gh_bin)
            elif kind == "block.remove":
                child = _number_for(store, ref, new_numbers)
                _gh_edit(repo, child, "--remove-blocked-by", str(action["blocker_number"]), gh_bin=gh_bin)
            elif kind == "comment.create":
                number = _number_for(store, action["issue"], new_numbers)
                data = gh.api(f"repos/{repo}/issues/{number}/comments", method="POST",
                              input_json={"body": action["body"]})
                store.sync_record({"type": "mapping", "kind": "comment", "local": ref,
                                   "github": int(data["id"])})
            elif kind == "comment.edit":
                gh.api(f"repos/{repo}/issues/comments/{action['remote_id']}", method="PATCH",
                       input_json={"body": action["body"]})
            elif kind == "comment.delete":
                try:
                    gh.api(f"repos/{repo}/issues/comments/{action['remote_id']}", method="DELETE")
                except DtError as exc:
                    if "404" not in str(exc) and "Not Found" not in str(exc):
                        raise
            elif kind == "map.body":
                gh.api(f"repos/{repo}/issues/{map_id}", method="PATCH",
                       input_json={"body": action["body"]})
            else:
                raise DtError(f"不认识的同步动作 {kind}")
            results.append({"action": kind, "ref": ref, "status": "ok", "detail": action["detail"]})
            store.sync_record({"type": "sync", "map": map_id, "action": kind,
                               "ref": ref, "status": "ok", "detail": action["detail"]})
        except DtError as exc:
            failed_refs.add(ref)
            results.append({"action": kind, "ref": ref, "status": "failed", "detail": str(exc)})
            store.sync_record({"type": "sync", "map": map_id, "action": kind,
                               "ref": ref, "status": "failed", "detail": str(exc)})
        except Exception as exc:  # 不让单项意外拖垮整次同步
            failed_refs.add(ref)
            detail = f"{type(exc).__name__}: {exc}"
            results.append({"action": kind, "ref": ref, "status": "failed", "detail": detail})
            store.sync_record({"type": "sync", "map": map_id, "action": kind,
                               "ref": ref, "status": "failed", "detail": detail})
    store.sync_record({"type": "position", "map": map_id, "at": now_ts()})
    ok = not any(r["status"] == "failed" for r in results)
    return {"ok": ok, "results": results, "warnings": plan["warnings"]}


def _number_for(store, local_id, new_numbers):
    if local_id in new_numbers:
        return new_numbers[local_id]
    mapped = store.sync.get("issues", {}).get(str(local_id))
    if mapped is not None:
        return int(mapped)
    if str(local_id).isdigit():
        return int(local_id)
    raise DtError(f"{local_id} 还没有 GitHub 编号")


def _gh_edit(repo, number, *flags, gh_bin="gh"):
    result = subprocess.run(
        [gh_bin, "issue", "edit", str(number), "-R", repo] + list(flags),
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip()
        if "already" in message.lower():
            return
        raise DtError(f"gh issue edit #{number} 失败：{message}")


def _num_key(value):
    try:
        return (0, int(value))
    except (TypeError, ValueError):
        return (1, str(value))


def _ticket_label(ticket):
    if str(ticket["id"]).startswith("I-"):
        return f"{ticket['id']} {ticket['title']}"
    return f"#{ticket['id']} {ticket['title']}"


def _cell(text):
    return str(text).replace("|", "\\|").replace("\n", " ")
