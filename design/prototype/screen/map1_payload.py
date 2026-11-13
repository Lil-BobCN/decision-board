#!/usr/bin/env python3
"""把 design/prototype/screen/map1.js 转成中台导入 payload。

一次性工具，需要本机有 `gh`（读 GitHub 正文、评论和时间）和 `node`（读 map1.js）。
用法：

    python3 design/prototype/screen/map1_payload.py --start-comment 48 --out /tmp/map1_payload.json

`--start-comment` 取目标中台当前的评论计数器，避免导入后 C- 号重复。
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from dtlib.importer import GitHub, build_import_payload  # noqa: E402
from dtlib.util import DtError  # noqa: E402

REPO = "Lil-BobCN/grilling-remote"
MAP_NUMBER = 1


def proto_data():
    code = (
        "global.window={};"
        "require(process.argv[1]);"
        "process.stdout.write(JSON.stringify(window.PROTO_MAP1));"
    )
    result = subprocess.run(
        ["node", "-e", code, str(ROOT / "design/prototype/screen/map1.js")],
        capture_output=True, text=True, check=True, timeout=60,
    )
    return json.loads(result.stdout)


def with_retries(api):
    def wrapped(self, path, paginate=False, method=None, fields=None, input_json=None):
        last = None
        for attempt in range(5):
            try:
                return api(self, path, paginate=paginate, method=method,
                           fields=fields, input_json=input_json)
            except DtError as exc:
                text = str(exc)
                if "EOF" not in text and "timeout" not in text.lower() and "502" not in text:
                    raise
                last = exc
                time.sleep(1.5 * (attempt + 1))
        raise last
    return wrapped


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-comment", type=int, default=1,
                        help="评论编号起点，取目标中台当前的评论计数器")
    parser.add_argument("--out", default="/tmp/map1_payload.json")
    args = parser.parse_args()

    data = proto_data()
    GitHub.api = with_retries(GitHub.api)
    payload, warnings, _ = build_import_payload(
        REPO, MAP_NUMBER, start_comment=args.start_comment)
    raw_tickets = {str(t["id"]): t for t in payload["tickets"]}

    fragments = data["map"]["fragments"]
    tickets = []
    for item in sorted(data["tickets"], key=lambda x: x["id"]):
        tid = str(item["id"])
        base = raw_tickets.get(tid) or {}
        derived = ["D-" + d for d in (item.get("derivedFrom") or [])]
        tickets.append({
            "id": tid,
            "kind": "ticket",
            "type": item.get("type") or "task",
            "title": item["title"],
            "body": item.get("body") or "",
            "state": item.get("state") or "closed",
            "labels": [l for l in item.get("labels") or [] if not l.startswith("wayfinder:")],
            "parent": str(MAP_NUMBER),
            "blocked_by": base.get("blocked_by") or [],
            "split_reason": "",
            "derived_from": derived or ["D-M1-ROOT"],
            "derived_from_inferred": [],
            "covers": [f"D-M1-ROOT#{i}" for i in item.get("covers") or []],
            "created_at": base.get("created_at"),
            "updated_at": base.get("updated_at"),
            "closed_at": base.get("closed_at"),
            "created_by": base.get("created_by") or "human:github",
        })
    known = {t["id"] for t in tickets}
    for item in tickets:
        item["blocked_by"] = [b for b in item["blocked_by"] if b in known]

    decisions = []
    for item in data["decisions"]:
        if item.get("root"):
            continue
        decisions.append({
            "id": "D-" + item["id"],
            "statement": item["statement"],
            "source_ticket": str(item["sourceTicket"]) if item.get("sourceTicket") else None,
            "output_files": list(item.get("outputs") or []),
            "status": "superseded" if item.get("status") == "superseded" else "active",
            "rationale": "",
            "rationale_source": "",
        })

    premises = [{
        "id": "P-" + p["id"],
        "decision": "D-" + p["decision"],
        "statement": p["statement"],
        "evidence": list(p.get("evidence") or []),
        "state": p.get("state") or "未验",
        "last_judged_reason": p.get("lastJudge"),
    } for p in data.get("premises") or []]

    coverage = [{
        "fragment": f"D-M1-ROOT#{row['frag']}",
        "tickets": [str(x) for x in row.get("tickets") or []],
    } for row in data.get("coverage") or []]

    payload["map"].update({
        "id": str(MAP_NUMBER),
        "title": data["map"]["title"],
        "split_rationale": "",
        "state": "open",
        "labels": [],
    })
    payload["map"]["root"] = {
        "id": "D-M1-ROOT",
        "statement": fragments[0],
        "fragments": [{"index": i, "text": text}
                      for i, text in enumerate(fragments, start=1)],
        "output_files": [],
        "created_at": payload["map"].get("created_at"),
        "created_by": payload["map"].get("created_by") or "human:github",
    }
    payload["tickets"] = tickets
    payload["decisions"] = decisions
    payload["premises"] = premises
    payload["coverage"] = coverage
    payload["github"] = {
        "issues": {"1": 1, **{t["id"]: int(t["id"]) for t in tickets}},
        "comments": (payload.get("github") or {}).get("comments") or {},
    }

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)
    print(json.dumps({
        "out": args.out,
        "tickets": len(tickets),
        "decisions": len(decisions),
        "comments": len(payload.get("comments") or []),
        "premises": len(premises),
        "coverage": len(coverage),
        "superseded": [d["id"] for d in decisions if d["status"] == "superseded"],
        "derived_edges": sum(len(t["derived_from"]) for t in tickets),
        "warnings": warnings,
    }, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
