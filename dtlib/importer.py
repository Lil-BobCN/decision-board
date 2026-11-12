"""从 GitHub 读一张地图，组装一条 import 事件的 payload。"""
from __future__ import annotations

import json
import re
import subprocess

from .util import DtError, split_list, split_paths


class GitHub:
    def __init__(self, repo, gh_bin="gh"):
        self.repo = repo
        self.gh_bin = gh_bin

    def api(self, path, paginate=False, method=None, fields=None, input_json=None):
        cmd = [self.gh_bin, "api"]
        if paginate:
            cmd += ["--paginate", "--slurp"]
        if method:
            cmd += ["--method", method]
        if input_json is not None:
            cmd += ["--input", "-"]
        cmd.append(path)
        for key, value in (fields or {}).items():
            if isinstance(value, int):
                cmd += ["-F", f"{key}={value}"]
            else:
                cmd += ["-f", f"{key}={value}"]
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            input=json.dumps(input_json, ensure_ascii=False) if input_json is not None else None,
        )
        if result.returncode != 0:
            message = (result.stderr or result.stdout).strip()
            raise DtError(f"gh api {path} 失败：{message}")
        if not result.stdout.strip():
            return None
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise DtError(f"gh api {path} 返回的不是 JSON：{exc}")


def detect_repo(cwd="."):
    result = subprocess.run(
        ["git", "-C", cwd, "remote", "get-url", "origin"],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        url = result.stdout.strip()
        match = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$", url)
        if match:
            return f"{match.group(1)}/{match.group(2)}"
    result = subprocess.run(
        ["gh", "repo", "view", "--json", "nameWithOwner"],
        capture_output=True, text=True, cwd=cwd,
    )
    if result.returncode == 0:
        try:
            return json.loads(result.stdout)["nameWithOwner"]
        except (json.JSONDecodeError, KeyError):
            pass
    raise DtError("找不到 GitHub 仓库；请在仓库目录里运行，或设置 GRILLING_REPO", 2)


def build_import_payload(repo, map_number, gh_bin="gh", start_comment=1):
    gh = GitHub(repo, gh_bin)
    map_id = str(map_number)
    issue = gh.api(f"repos/{repo}/issues/{map_id}")
    if not issue:
        raise DtError(f"GitHub 上找不到 issue {map_id}")

    map_comments = _comments(gh, map_id)
    sub_issues = gh.api(f"repos/{repo}/issues/{map_id}/sub_issues", paginate=True)
    sub_issues = _flatten(sub_issues)
    if not sub_issues:
        sub_issues = _find_part_of(gh, map_id)
    sub_issues.sort(key=lambda x: x["number"])

    root_id = f"D-{map_id}-ROOT"
    main, fragments, coverage = parse_destination(issue.get("body") or "")
    if not fragments:
        raise DtError("地图正文里找不到 Destination 覆盖表，也切不出拆句")

    tickets = []
    ticket_comments = {}
    for sub in sub_issues:
        number = str(sub["number"])
        ticket_comments[number] = _comments(gh, number)
        ticket_type, warnings = _ticket_type(sub)
        blocked_by = _blocked_by(gh, number)
        tickets.append({
            "id": number,
            "kind": "ticket",
            "type": ticket_type,
            "title": sub.get("title") or "",
            "body": sub.get("body") or "",
            "state": sub.get("state") or "open",
            "labels": [l["name"] if isinstance(l, dict) else l
                       for l in sub.get("labels", []) if _label_name(l) and not _label_name(l).startswith("wayfinder:")],
            "parent": map_id,
            "blocked_by": blocked_by,
            "split_reason": "",
            "derived_from": [root_id],
            "derived_from_inferred": [],
            "covers": [],
            "created_at": sub.get("created_at"),
            "updated_at": sub.get("updated_at"),
            "closed_at": sub.get("closed_at"),
            "created_by": _author(sub),
        })

    comments = []
    github_comments = {}
    next_comment = int(start_comment)
    ordered = [(map_id, map_comments)] + [(n, ticket_comments[n]) for n in sorted(ticket_comments, key=_num_key)]
    for issue_id, items in ordered:
        for item in sorted(items, key=lambda c: (c.get("created_at") or "", c.get("id") or 0)):
            cid = f"C-{next_comment:04d}"
            next_comment += 1
            comments.append({
                "id": cid,
                "issue": issue_id,
                "body": item.get("body") or "",
                "author": _author(item),
                "created_at": item.get("created_at"),
                "edited_at": item.get("updated_at") if item.get("updated_at") != item.get("created_at") else None,
                "deleted": False,
            })
            github_comments[cid] = item.get("id")

    decisions = []
    seen = {}
    for issue_id, items in ordered:
        for item in sorted(items, key=lambda c: (c.get("created_at") or "", c.get("id") or 0)):
            for row in parse_decision_tables(item.get("body") or ""):
                did = row["id"]
                if did in seen:
                    if seen[did]["statement"] != row["statement"]:
                        raise DtError(f"决定 {did} 在两条评论里陈述不同，导入前先人工核对")
                    for old in row["supersedes"]:
                        if old not in seen[did]["supersedes"]:
                            seen[did]["supersedes"].append(old)
                    for path in row["output_files"]:
                        if path not in seen[did]["output_files"]:
                            seen[did]["output_files"].append(path)
                    continue
                record = {
                    "id": did,
                    "statement": row["statement"],
                    "source_ticket": None if issue_id == map_id else issue_id,
                    "output_files": row["output_files"],
                    "created_at": item.get("created_at"),
                    "created_by": _author(item),
                    "supersedes": row["supersedes"],
                }
                seen[did] = record
                decisions.append(record)

    # 覆盖行映射到票
    coverage_rows = []
    for index, row in enumerate(coverage, start=1):
        fragment_id = f"{root_id}#{index}"
        ticket_ids = row["tickets"]
        coverage_rows.append({"fragment": fragment_id, "tickets": ticket_ids})
        for ticket in tickets:
            if ticket["id"] in ticket_ids:
                ticket["covers"].append(fragment_id)

    known_tickets = {t["id"] for t in tickets}
    for ticket in tickets:
        dropped = [b for b in ticket["blocked_by"] if b not in known_tickets]
        ticket["blocked_by"] = [b for b in ticket["blocked_by"] if b in known_tickets]
        if dropped:
            ticket["blocked_by_note"] = "未在本次导入范围内，边未建立：" + "、".join(dropped)

    warnings = []
    for ticket in tickets:
        if ticket.get("blocked_by_note"):
            warnings.append(f"票 #{ticket['id']}：{ticket.pop('blocked_by_note')}")
    for ticket in tickets:
        if not ticket["type"]:
            ticket["type"] = "task"
            warnings.append(f"票 #{ticket['id']} 没有 wayfinder:<type> 标签，按 task 导入")

    map_labels = [_label_name(l) for l in issue.get("labels", [])]
    payload = {
        "map": {
            "id": map_id,
            "kind": "map",
            "title": issue.get("title") or "",
            "body": normalize_map_body(issue.get("body") or ""),
            "state": issue.get("state") or "open",
            "labels": [l for l in map_labels if l and not l.startswith("wayfinder:")],
            "created_at": issue.get("created_at"),
            "updated_at": issue.get("updated_at"),
            "closed_at": issue.get("closed_at"),
            "created_by": _author(issue),
            "root": {
                "id": root_id,
                "statement": main,
                "fragments": [{"index": i, "text": text} for i, text in enumerate(fragments, start=1)],
                "output_files": [],
                "created_at": issue.get("created_at"),
                "created_by": _author(issue),
            },
        },
        "tickets": tickets,
        "comments": comments,
        "decisions": decisions,
        "premises": [],
        "coverage": coverage_rows,
        "github": {
            "issues": {str(n): n for n in [map_id] + [str(s["number"]) for s in sub_issues]},
            "comments": github_comments,
        },
    }
    return payload, warnings, issue


def _flatten(data):
    if data is None:
        return []
    if isinstance(data, list) and data and isinstance(data[0], list):
        result = []
        for page in data:
            result.extend(page)
        return result
    return data if isinstance(data, list) else []


def _find_part_of(gh, map_id):
    """旧图没有原生 sub-issue 时，按正文 Part of #<地图> 找票。"""
    data = gh.api(f"repos/{gh.repo}/issues?state=all&per_page=100", paginate=True)
    pattern = re.compile(rf"Part of #{map_id}\b")
    result = []
    for issue in _flatten(data) or []:
        if issue.get("pull_request"):
            continue
        if str(issue.get("number")) == str(map_id):
            continue
        if pattern.search(issue.get("body") or ""):
            result.append(issue)
    return result


def _comments(gh, number):
    data = gh.api(f"repos/{gh.repo}/issues/{number}/comments", paginate=True)
    return _flatten(data) or []


def _blocked_by(gh, number):
    try:
        data = gh.api(f"repos/{gh.repo}/issues/{number}/dependencies/blocked_by", paginate=True)
    except DtError as exc:
        text = str(exc)
        if "404" in text or "Not Found" in text:
            return []
        raise
    return [str(item["number"]) for item in (_flatten(data) or [])]


def _num_key(value):
    try:
        return (0, int(value))
    except ValueError:
        return (1, value)


def _label_name(label):
    if isinstance(label, dict):
        return label.get("name")
    return str(label)


def _author(obj):
    user = obj.get("user") or {}
    login = user.get("login") if isinstance(user, dict) else None
    return f"human:{login}" if login else "human:github"


def _ticket_type(sub):
    types = []
    for label in sub.get("labels", []):
        name = _label_name(label) or ""
        if name.startswith("wayfinder:"):
            value = name.split(":", 1)[1]
            if value in ("grilling", "research", "prototype", "task"):
                types.append(value)
    types = sorted(set(types))
    if len(types) > 1:
        raise DtError(f"票 #{sub['number']} 有多个 wayfinder 票型标签：{types}")
    return (types[0] if types else None), []


# ---------- 正文解析 ----------

def _sections(body):
    """按 ## 标题切段，返回 [(heading, text)]；<details> 里的标题不算。"""
    lines = body.splitlines()
    result = []
    heading = ""
    buf = []
    in_details = False
    for line in lines:
        lower = line.lower()
        if "<details" in lower:
            in_details = True
        if not in_details and re.match(r"^##\s+", line):
            result.append((heading, "\n".join(buf).strip("\n")))
            heading = line.strip()
            buf = []
        else:
            buf.append(line)
        if "</details>" in lower:
            in_details = False
    result.append((heading, "\n".join(buf).strip("\n")))
    return result


def parse_destination(body):
    sections = _sections(body)
    dest = ""
    cov = ""
    for heading, text in sections:
        if heading.startswith("## Destination 覆盖表"):
            cov = text
        elif heading.startswith("## Destination"):
            dest = text
    main = ""
    match = re.search(r"^\*\*主句[：:]\*\*\s*(.+)$", dest, re.M)
    if match:
        main = match.group(1).strip()
    else:
        plain = _strip_details(dest)
        for line in plain.splitlines():
            line = line.strip()
            if not line or line.startswith("**状态"):
                continue
            main = _first_sentence(line)
            if main:
                break
    if not main:
        raise DtError("地图正文里找不到 Destination 主句")

    rows = []
    table = _first_table(cov)
    if table:
        header, body_rows = table
        idx_text = _find_col(header, ("原文片段", "主句片段"))
        idx_ticket = _find_col(header, ("由哪张票落", "由哪些票落"))
        if idx_text is not None:
            for row in body_rows:
                if idx_text >= len(row):
                    continue
                text = row[idx_text].strip()
                if not text:
                    continue
                ticket_cell = row[idx_ticket] if idx_ticket is not None and idx_ticket < len(row) else ""
                rows.append({"text": text, "tickets": extract_ticket_refs(ticket_cell)})
    if not rows:
        plain = _strip_details(dest)
        for line in plain.splitlines():
            line = line.strip()
            if not line or line.startswith("**状态") or re.match(r"^\d+\.\s", line):
                if re.match(r"^\d+\.\s", line):
                    rows.append({"text": re.sub(r"^\d+\.\s*", "", line), "tickets": []})
                continue
        if not rows:
            for sentence in split_sentences(plain):
                if sentence and sentence != main:
                    rows.append({"text": sentence, "tickets": []})
    return main, [r["text"] for r in rows], rows


def _first_sentence(text):
    for index, char in enumerate(text):
        if char in "。！？":
            return text[:index + 1].strip()
    return text.strip()


def split_sentences(text):
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


def extract_ticket_refs(cell):
    found = []
    for match in re.finditer(r"#(\d+)", cell):
        value = match.group(1)
        if value not in found:
            found.append(value)
    for match in re.finditer(r"/issues/(\d+)", cell):
        value = match.group(1)
        if value not in found:
            found.append(value)
    return found


def parse_decision_tables(text):
    """从一条评论里解析所有四列表。"""
    rows = []
    for header, body_rows in _tables(text):
        if _find_col(header, ("id",)) is None or _find_col(header, ("决定",)) is None:
            continue
        idx_id = _find_col(header, ("id",))
        idx_statement = _find_col(header, ("决定",))
        idx_supersedes = _find_col(header, ("取代",))
        idx_output = _find_col(header, ("产出文件",))
        for row in body_rows:
            if idx_id >= len(row):
                continue
            did = row[idx_id].strip()
            if not did.startswith("D-"):
                continue
            statement = row[idx_statement].strip() if idx_statement < len(row) else ""
            if not statement:
                raise DtError(f"决定 {did} 的陈述为空，导入前先人工核对")
            supersedes = split_list(row[idx_supersedes]) if idx_supersedes is not None and idx_supersedes < len(row) else []
            output_files = split_paths(row[idx_output]) if idx_output is not None and idx_output < len(row) else []
            rows.append({
                "id": did,
                "statement": statement,
                "supersedes": supersedes,
                "output_files": output_files,
            })
    return rows


def _tables(text):
    lines = text.splitlines()
    result = []
    index = 0
    while index + 1 < len(lines):
        line = lines[index].strip()
        nxt = lines[index + 1].strip()
        if line.startswith("|") and re.match(r"^\|[\s:\-|]+\|$", nxt):
            header = _split_row(line)
            rows = []
            index += 2
            while index < len(lines) and lines[index].strip().startswith("|"):
                cells = _split_row(lines[index].strip())
                rows.append(cells)
                index += 1
            result.append((header, rows))
            continue
        index += 1
    return result


def _first_table(text):
    tables = _tables(text)
    return tables[0] if tables else None


def _split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    parts = re.split(r"(?<!\\)\|", line)
    return [p.replace("\\|", "|").strip() for p in parts]


def _find_col(header, names):
    for index, cell in enumerate(header):
        for name in names:
            if cell.strip() == name:
                return index
    return None


def _strip_details(text):
    return re.sub(r"<details>.*?</details>", "", text, flags=re.S)


def normalize_map_body(body):
    """去掉 Destination、覆盖表和决定索引；旧稿 details 留在正文。"""
    details = re.findall(r"<details>.*?</details>", body, flags=re.S)
    sections = _sections(body)
    kept = []
    for heading, text in sections:
        if heading.startswith("## Destination 覆盖表"):
            continue
        if heading.startswith("## Decisions so far"):
            continue
        if heading.startswith("## Destination"):
            continue
        if heading:
            kept.append(heading)
        if text:
            kept.append(text)
    normalized = "\n\n".join(p for p in kept if p != "").strip()
    if details:
        normalized += "\n\n## 旧稿\n\n" + "\n\n".join(details)
    return normalized.strip() + "\n"
