"""dt 命令行：读走 HTTP，写也走 HTTP；服务自动拉起。"""
from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

from .util import (
    DtError, EXIT_BUSINESS, EXIT_SERVICE, EXIT_UNKNOWN, EXIT_USAGE,
    current_actor, default_data_dir, eprint, print_json, read_json,
)

DT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dt"))


class Client:
    def __init__(self, port):
        self.base = f"http://127.0.0.1:{port}"

    def get(self, path):
        try:
            return self._request("GET", path)
        except DtError as exc:
            if exc.code != EXIT_SERVICE:
                raise
            time.sleep(0.2)
            return self._request("GET", path)

    def post(self, path, data):
        return self._request("POST", path, data)

    def _request(self, method, path, data=None):
        url = self.base + path
        body = None
        headers = {}
        if data is not None:
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json; charset=utf-8"
        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        timeout = 300 if path in ("/import", "/import/payload", "/sync/run") else 60
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, socket.timeout, TimeoutError) as exc:
            if method == "POST":
                raise DtError(f"写入结果未知：{exc}。先用读命令查一下再重试", EXIT_UNKNOWN)
            raise DtError(f"服务读失败：{exc}", EXIT_SERVICE)
        if not payload.get("ok"):
            raise DtError(payload.get("error") or "服务返回失败", payload.get("code") or EXIT_BUSINESS)
        return payload.get("data")


def service_port(home):
    info = read_json(os.path.join(home, "service.json"), None)
    if not info:
        return None
    return int(info.get("port") or 0) or None


def health_ok(port, timeout=0.5):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        return bool(data.get("ok"))
    except Exception:
        return False


def ensure_service(home):
    port = service_port(home)
    if port and health_ok(port):
        return port
    os.makedirs(home, exist_ok=True)
    log_path = os.path.join(home, "service.log")
    log = open(log_path, "a", encoding="utf-8")
    try:
        cmd = [sys.executable, DT_PATH]
        if home:
            cmd += ["--home", home]
        cmd += ["serve"]
        subprocess.Popen(
            cmd,
            cwd=os.getcwd(),
            stdout=log, stderr=log,
            start_new_session=True,
            close_fds=True,
        )
    finally:
        log.close()
    deadline = time.time() + 5
    while time.time() < deadline:
        port = service_port(home)
        if port and health_ok(port, timeout=0.3):
            return port
        time.sleep(0.1)
    raise DtError(f"服务没有起来，看 {log_path}", EXIT_SERVICE)


def client_for(args):
    home = args.home or default_data_dir()
    port = ensure_service(home)
    return Client(port)


# ---------- 输出 ----------

def _issue_label(issue):
    if issue["kind"] == "map":
        return f"地图 {issue['id']}"
    return f"#{issue['id']} [{issue['type']}]"


def _print_issue(view):
    issue = view["issue"]
    print(f"{_issue_label(issue)} {issue['title']}")
    print(f"状态：{issue['state']}  标签：{'、'.join(issue['labels']) or '无'}")
    if issue["kind"] == "ticket":
        print(f"父地图：{issue['parent']}  拆票理由：{issue['split_reason'] or '未记录'}")
        print(f"derived_from：{'、'.join(issue['derived_from']) or '无'}")
        inferred = issue.get("derived_from_inferred") or []
        if inferred:
            print(f"推断来源（未确认）：{'、'.join(inferred)}")
        print(f"covers：{'、'.join(issue['covers']) or '无'}")
        if view.get("stale_covers"):
            print(f"吃旧决定：{'、'.join(view['stale_covers'])}")
        work = view.get("workstate")
        if work:
            print(f"工作状态：{work.get('state')}")
        if view.get("blocked_by_open"):
            print(f"未关闭阻塞：{'、'.join(view['blocked_by_open'])}")
        if view.get("produced_decisions"):
            print("产出决定：" + "、".join(d["id"] for d in view["produced_decisions"]))
    else:
        print(f"拆票理由：{issue.get('split_rationale') or '未记录'}")
        root = view.get("root")
        if root:
            print(f"根决定：{root['id']}  {root['statement']}")
        coverage = view.get("coverage") or []
        if coverage:
            print("")
            _print_coverage_rows(coverage)
        tickets = view.get("tickets") or []
        if tickets:
            print("")
            for ticket in tickets:
                print(f"  #{ticket['id']} [{ticket['type']}] {ticket['state']} {ticket['title']}")
    if issue.get("body"):
        print("")
        print(issue["body"].rstrip())
    comments = view.get("comments") or []
    if comments:
        print("")
        print(f"评论（{len(comments)} 条）")
        for comment in comments:
            print(f"--- {comment['id']} {comment['author']} {comment['created_at']} ---")
            print(comment["body"].rstrip())


def _print_coverage_rows(rows):
    print("覆盖表")
    for row in rows:
        frag = row["fragment"]
        tickets = "、".join(f"#{t['id']}" for t in row["tickets"]) or "无"
        print(f"  {frag['index']}. {row['status']}  {tickets}  {frag['text']}")


def _print_decision(view):
    d = view["decision"]
    print(f"{d['id']} [{d['status']}] {d['statement']}")
    if d.get("root_of"):
        print(f"根决定，地图：{d['root_of']}")
    if d.get("source_ticket"):
        print(f"来源票：#{d['source_ticket']}")
    if d.get("output_files"):
        print(f"产出文件：{'、'.join(d['output_files'])}")
    print(f"依据：{d.get('rationale') or '未记录'}")
    if view.get("red"):
        print("红色：有未处理的已破前提")
    if d.get("superseded_by"):
        print(f"被取代：{d['superseded_by']}")
    if d.get("supersedes"):
        print(f"取代：{'、'.join(d['supersedes'])}")
    premises = view.get("premises") or []
    if premises:
        print("前提：")
        for p in premises:
            print(f"  {p['id']} [{p['state']}] {p['statement']}")
            if p.get("evidence"):
                print(f"    证据：{'、'.join(p['evidence'])}")
            if p.get("last_judged_reason"):
                print(f"    上次判定理由：{p['last_judged_reason']}")
    else:
        print("前提：无（裸决定）")


def _print_impact(view):
    case = view["impact"]
    print(f"{case['id']} [{case['status']}] 触发：{case['trigger']}  决定：{case['trigger_decision']}")
    print(f"打开：{case['opened_at']} {case['opened_by']}")
    for item in view["items"]:
        action = item.get("action") or ""
        print(f"  {item['kind']} {item['ref']} [{item['status']}] {action}  原因：{'、'.join(item['relations'])}")
        obj = item.get("object")
        if obj:
            label = obj.get("statement") if item["kind"] == "decision" else obj.get("title")
            if label:
                print(f"    {label}")


def _print_plan(plan):
    print(f"同步计划：地图 {plan['map']}，镜像{'开' if plan['mirror'] else '关'}")
    counts = plan.get("counts") or {}
    if not plan["actions"]:
        print("没有要改的。")
    else:
        for action in plan["actions"]:
            print(f"  [{action['kind']}] {action['detail']}")
    if counts:
        print("合计：" + "、".join(f"{k} {v}" for k, v in sorted(counts.items())))
    for warning in plan.get("warnings") or []:
        print(f"注意：{warning}")


# ---------- 命令 ----------

def cmd_serve(args):
    from .service import serve
    return serve(home=args.home, port=args.port)


def cmd_health(args):
    client = client_for(args)
    print_json(client.get("/health"))
    return 0


def cmd_open(args):
    client = client_for(args)
    port = service_port(args.home or default_data_dir())
    webbrowser.open(f"http://127.0.0.1:{port}/")
    print(f"已打开 http://127.0.0.1:{port}/")
    return 0


def cmd_import(args):
    client = client_for(args)
    actor = args.actor or current_actor()
    if getattr(args, "payload", None):
        if getattr(args, "map", None):
            raise DtError("--payload 和 github 地图号只能给一个", EXIT_USAGE)
        try:
            with open(args.payload, encoding="utf-8") as f:
                payload = json.load(f)
        except OSError as exc:
            raise DtError(f"读不了 payload 文件：{exc}", EXIT_USAGE)
        except json.JSONDecodeError as exc:
            raise DtError(f"payload 文件不是合法 JSON：{exc}", EXIT_USAGE)
        data = client.post("/import/payload", {"payload": payload, "actor": actor})
        map_id = str((payload.get("map") or {}).get("id") or args.payload)
        print(f"导入完成：地图 {map_id}")
    else:
        if not getattr(args, "map", None):
            raise DtError("导入要给 github <地图号> 或 --payload <文件>", EXIT_USAGE)
        data = client.post("/import", {"map": args.map, "actor": actor})
        print(f"导入完成：地图 {args.map}")
    counts = data.get("counts") or {}
    print("、".join(f"{k} {v}" for k, v in counts.items()))
    for warning in data.get("warnings") or []:
        print(f"注意：{warning}")
    return 0


def cmd_show(args):
    client = client_for(args)
    ident = args.id
    if ident.startswith("D-"):
        _print_decision(client.get(f"/decision/{ident}"))
    elif ident.startswith("P-"):
        view = client.get(f"/premise/{ident}")
        p = view["premise"]
        print(f"{p['id']} [{p['state']}] {p['statement']}")
        print(f"所属决定：{p['decision']}")
        if p.get("evidence"):
            print(f"证据：{'、'.join(p['evidence'])}")
        if p.get("last_judged_reason"):
            print(f"判定理由：{p['last_judged_reason']}")
    elif ident.startswith("IC-"):
        _print_impact(client.get(f"/impact/{ident}"))
    elif ident.isdigit() or ident.startswith("I-"):
        _print_issue(client.get(f"/issue/{ident}"))
    else:
        raise DtError(f"不认识的编号：{ident}", EXIT_USAGE)
    return 0


def cmd_coverage(args):
    client = client_for(args)
    map_id = args.map
    if not map_id:
        state = client.get("/state")["state"]
        maps = [i for i in state["issues"].values() if i["kind"] == "map"]
        if len(maps) == 1:
            map_id = maps[0]["id"]
        else:
            names = "、".join(f"{m['id']} {m['title']}" for m in maps) or "无"
            raise DtError(f"有 {len(maps)} 张地图，请指定：{names}", EXIT_USAGE)
    view = client.get(f"/coverage/{map_id}")
    print(f"{view['total']} 句里 {view['missing']} 句没落票")
    _print_coverage_rows(view["rows"])
    return 0


def _post(args, op, payload):
    client = client_for(args)
    result = client.post("/command", {
        "op": op, "args": payload,
        "actor": args.actor or current_actor(),
        "reason": getattr(args, "reason", None),
    })
    event = result["event"]
    print(f"{event['op']}  {event['target']}  seq={event['seq']}")
    return event


def cmd_issue_create(args):
    if args.kind == "map":
        if not args.destination_statement:
            raise DtError("建地图必须给 --destination-statement", EXIT_USAGE)
        destination = {
            "statement": args.destination_statement,
            "fragments": args.fragment or [],
        }
        payload = {
            "kind": "map", "title": args.title, "body": args.body or "",
            "labels": args.label or [], "parent": None, "state": args.state,
            "split_rationale": args.split_rationale or "",
            "destination": destination,
        }
    else:
        if not args.parent:
            raise DtError("建票必须给 --parent", EXIT_USAGE)
        if not args.type:
            raise DtError("建票必须给 --type", EXIT_USAGE)
        if not args.split_reason:
            raise DtError("建票必须写 --split-reason", EXIT_USAGE)
        if not args.derived_from:
            raise DtError("建票必须给至少一条 --derived-from", EXIT_USAGE)
        payload = {
            "kind": "ticket", "title": args.title, "body": args.body or "",
            "labels": args.label or [], "parent": args.parent, "state": args.state,
            "type": args.type, "split_reason": args.split_reason,
            "derived_from": args.derived_from,
            "derived_from_inferred": args.derived_from_inferred or [],
            "covers": args.covers or [],
        }
    _post(args, "issue.create", payload)
    return 0


def cmd_issue_edit(args):
    payload = {"id": args.id}
    for key in ("title", "body", "type", "split_reason", "split_rationale"):
        value = getattr(args, key)
        if value is not None:
            payload[key] = value
    if args.derived_from is not None:
        payload["derived_from"] = args.derived_from
    if args.derived_from_inferred is not None:
        payload["derived_from_inferred"] = args.derived_from_inferred
    if args.covers is not None:
        payload["covers"] = args.covers
    _post(args, "issue.edit", payload)
    return 0


def cmd_issue_state(args):
    state = getattr(args, "state", None)
    if args.action == "close":
        state = "closed"
    elif args.action == "reopen":
        state = "open"
    _post(args, "issue.state", {"id": args.id, "state": state})
    return 0


def cmd_issue_label(args):
    _post(args, "issue.label", {"id": args.id, "add": args.add or [], "remove": args.remove or []})
    return 0


def cmd_label(args):
    if args.action == "add":
        _post(args, "issue.label", {"id": args.id, "add": [args.label], "remove": []})
    else:
        _post(args, "issue.label", {"id": args.id, "add": [], "remove": [args.label]})
    return 0


def cmd_issue_block(args):
    _post(args, "issue.block", {"id": args.id, "add": args.add or [], "remove": args.remove or []})
    return 0


def cmd_issue_confirm_derived(args):
    payload = {"id": args.id}
    if args.decision:
        payload["decisions"] = args.decision
    _post(args, "issue.confirm_derived", payload)
    return 0


def cmd_issue_parent(args):
    raise DtError("v1 不开放改父票；建错地图就关掉重建", EXIT_BUSINESS)


def cmd_comment(args):
    if args.action == "add":
        _post(args, "comment.add", {"issue": args.id, "body": args.body})
    elif args.action == "edit":
        _post(args, "comment.edit", {"id": args.id, "body": args.body})
    else:
        _post(args, "comment.delete", {"id": args.id})
    return 0


def cmd_decision(args):
    if args.action == "create":
        if not args.root_of and not args.source_ticket:
            raise DtError("非根决定必须给 --source-ticket", EXIT_USAGE)
        _post(args, "decision.create", {
            "id": args.id,
            "statement": args.statement,
            "source_ticket": args.source_ticket,
            "output_files": args.output_files or [],
            "fragments": args.fragment or [],
            "root_of": args.root_of,
            "rationale": args.rationale,
        })
    elif args.action == "overturn":
        _post(args, "decision.overturn", {
            "id": args.id,
            "statement": args.statement,
            "source_ticket": args.source_ticket,
            "output_files": args.output_files or [],
            "fragments": args.fragment or [],
            "rationale": args.rationale,
        })
    else:
        _post(args, "decision.void", {"id": args.id, "void_reason": args.reason})
    return 0


def cmd_premise(args):
    if args.action == "add":
        _post(args, "premise.add", {
            "decision": args.decision, "statement": args.statement,
            "evidence": args.evidence or [],
        })
    elif args.action == "edit":
        payload = {"id": args.id}
        if args.statement is not None:
            payload["statement"] = args.statement
        if args.evidence is not None:
            payload["evidence"] = args.evidence
        _post(args, "premise.edit", payload)
    else:
        if not args.reason:
            raise DtError("判定必须给理由 --reason", EXIT_USAGE)
        _post(args, "premise.judge", {
            "id": args.id, "verdict": args.verdict,
            "evidence": args.evidence or [], "reason": args.reason,
        })
    return 0


def cmd_impact(args):
    client = client_for(args)
    if args.action == "list":
        cases = client.get("/impact")
        if not cases:
            print("没有开着的影响清单。")
        for case in cases:
            pending = sum(1 for i in case["items"] if i["status"] == "待处理")
            print(f"{case['id']}  {case['trigger']}  {case['trigger_decision']}  待处理 {pending}/{len(case['items'])}")
    elif args.action == "show":
        _print_impact(client.get(f"/impact/{args.case}"))
    elif args.action == "close":
        if not args.reason:
            raise DtError("关闭影响清单必须给理由 --reason", EXIT_USAGE)
        _post(args, "impact.close", {"case": args.case, "reason": args.reason})
    else:
        kind = "decision" if args.ref.startswith("D-") else "ticket"
        act = args.act
        if act == "合并":
            if not args.into:
                raise DtError("合并必须给 --into 目标票", EXIT_USAGE)
            act = "关掉"
        if act == "需修改" and not args.statement:
            raise DtError("需修改必须给 --statement", EXIT_USAGE)
        if act in ("要补问", "新建") and not args.title:
            raise DtError(f"{act}必须给 --title", EXIT_USAGE)
        options = {}
        for key in ("statement", "title", "type", "split_reason", "body",
                    "void_reason", "parent", "into"):
            value = getattr(args, key)
            if value is not None:
                options[key] = value
        if args.source_ticket is not None:
            options["source_ticket"] = args.source_ticket
        if args.output_files is not None:
            options["output_files"] = args.output_files
        if args.derived_from is not None:
            options["derived_from"] = args.derived_from
        if args.covers is not None:
            options["covers"] = args.covers
        payload = {"case": args.case, "kind": kind, "ref": args.ref, "action": act}
        payload.update(options)
        _post(args, "impact.act", payload)
    return 0


def cmd_status(args):
    client = client_for(args)
    data = client.post("/status", {})
    print(f"orca：{'离线' if data.get('offline') else '在线'}  最后同步：{data.get('updated_at')}")
    tickets = data.get("tickets") or {}
    if not tickets:
        print("没有开着的票。")
    for tid, entry in sorted(tickets.items(), key=lambda kv: kv[0]):
        print(f"  #{tid}  {entry.get('state')}  进入：{entry.get('state_started_at')}"
              + (f"  备注：{entry.get('note')}" if entry.get("note") else ""))
    return 0


def cmd_sync(args):
    client = client_for(args)
    if args.check:
        plan = client.post("/sync/check", {"map": args.map})
        _print_plan(plan)
        return 0
    result = client.post("/sync/run", {"map": args.map})
    for item in result.get("results") or []:
        print(f"  [{item['status']}] {item['detail']}")
    for warning in result.get("warnings") or []:
        print(f"注意：{warning}")
    return 0 if result.get("ok") else EXIT_BUSINESS


def cmd_mirror(args):
    client = client_for(args)
    data = client.post("/mirror", {"map": args.map, "on": args.on == "on"})
    print(f"地图 {data['map']} 的镜像开关：{'开' if data['on'] else '关'}")
    return 0


def cmd_rebuild(args):
    client = client_for(args)
    data = client.post("/rebuild", {})
    print(f"重建完成：seq={data['seq']}  hash={data['hash']}")
    return 0


def cmd_hash(args):
    client = client_for(args)
    data = client.get("/health")
    print(f"seq={data['seq']}  hash={data['hash']}")
    return 0


def cmd_snapshot(args):
    client = client_for(args)
    data = client.post("/snapshot", {})
    print("已提交" if data.get("committed") else "没有新内容")
    return 0


def cmd_events(args):
    client = client_for(args)
    port = service_port(args.home or default_data_dir())
    url = f"http://127.0.0.1:{port}/events?since={args.since}"
    try:
        with urllib.request.urlopen(url) as response:
            for line in response:
                sys.stdout.buffer.write(line)
                sys.stdout.buffer.flush()
    except KeyboardInterrupt:
        return 0
    return 0


# ---------- 参数 ----------

def build_parser():
    parser = argparse.ArgumentParser(prog="dt", description="决策中台命令行")
    parser.add_argument("--home", help="数据目录，默认 ~/.grilling/中台")
    parser.add_argument("--actor", help="事件 actor，如 human:名字")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("serve", help="前台运行服务")
    p.add_argument("--port", type=int)
    p.set_defaults(func=cmd_serve)

    sub.add_parser("health", help="看服务状态").set_defaults(func=cmd_health)
    sub.add_parser("open", help="打开屏幕").set_defaults(func=cmd_open)

    p = sub.add_parser("import", help="从 GitHub 或本地 payload 导入")
    p.add_argument("--payload", help="本地导入 payload JSON 文件")
    ip = p.add_subparsers(dest="source")
    g = ip.add_parser("github")
    g.add_argument("map")
    p.set_defaults(func=cmd_import)

    p = sub.add_parser("show", help="看一张票、决定、前提或影响清单")
    p.add_argument("id")
    p.set_defaults(func=cmd_show)

    p = sub.add_parser("coverage", help="看覆盖表")
    p.add_argument("map", nargs="?")
    p.set_defaults(func=cmd_coverage)

    p = sub.add_parser("issue", help="票和地图")
    isub = p.add_subparsers(dest="action", required=True)
    c = isub.add_parser("create")
    c.add_argument("--kind", choices=["map", "ticket"], required=True)
    c.add_argument("--title", required=True)
    c.add_argument("--body", default="")
    c.add_argument("--parent")
    c.add_argument("--type", choices=["grilling", "research", "prototype", "task"])
    c.add_argument("--split-reason")
    c.add_argument("--split-rationale", help="地图级拆票理由")
    c.add_argument("--derived-from", nargs="*")
    c.add_argument("--derived-from-inferred", nargs="*")
    c.add_argument("--covers", nargs="*")
    c.add_argument("--label", action="append")
    c.add_argument("--state", choices=["open", "closed"], default="open")
    c.add_argument("--destination-statement")
    c.add_argument("--fragment", action="append")
    c.set_defaults(func=cmd_issue_create)
    e = isub.add_parser("edit")
    e.add_argument("id")
    e.add_argument("--title")
    e.add_argument("--body")
    e.add_argument("--type", choices=["grilling", "research", "prototype", "task"])
    e.add_argument("--split-reason")
    e.add_argument("--split-rationale", help="地图级拆票理由")
    e.add_argument("--derived-from", nargs="*")
    e.add_argument("--derived-from-inferred", nargs="*")
    e.add_argument("--covers", nargs="*")
    e.set_defaults(func=cmd_issue_edit)
    s = isub.add_parser("state")
    s.add_argument("id")
    s.add_argument("state", choices=["open", "closed"])
    s.set_defaults(func=cmd_issue_state)
    for name in ("close", "reopen"):
        x = isub.add_parser(name)
        x.add_argument("id")
        x.set_defaults(func=cmd_issue_state)
    l = isub.add_parser("label")
    l.add_argument("id")
    l.add_argument("--add", action="append")
    l.add_argument("--remove", action="append")
    l.set_defaults(func=cmd_issue_label)
    b = isub.add_parser("block")
    b.add_argument("id")
    b.add_argument("--add", action="append")
    b.add_argument("--remove", action="append")
    b.set_defaults(func=cmd_issue_block)
    cd = isub.add_parser("confirm-derived")
    cd.add_argument("id")
    cd.add_argument("--decision", action="append")
    cd.set_defaults(func=cmd_issue_confirm_derived)
    pp = isub.add_parser("parent")
    pp.add_argument("id")
    pp.add_argument("--set")
    pp.set_defaults(func=cmd_issue_parent)

    p = sub.add_parser("label", help="标签快捷命令")
    lsub = p.add_subparsers(dest="action", required=True)
    for name in ("add", "remove"):
        x = lsub.add_parser(name)
        x.add_argument("id")
        x.add_argument("label")
        x.set_defaults(func=cmd_label)

    p = sub.add_parser("comment", help="评论")
    csub = p.add_subparsers(dest="action", required=True)
    a = csub.add_parser("add")
    a.add_argument("id")
    a.add_argument("--body", required=True)
    a.set_defaults(func=cmd_comment)
    ed = csub.add_parser("edit")
    ed.add_argument("id")
    ed.add_argument("--body", required=True)
    ed.set_defaults(func=cmd_comment)
    de = csub.add_parser("delete")
    de.add_argument("id")
    de.set_defaults(func=cmd_comment)

    p = sub.add_parser("decision", help="决定")
    dsub = p.add_subparsers(dest="action", required=True)
    dc = dsub.add_parser("create")
    dc.add_argument("--statement", required=True)
    dc.add_argument("--id", help="指定决定编号，如 D-0025a；不写则按顺序发号")
    dc.add_argument("--source-ticket")
    dc.add_argument("--output-files", nargs="*")
    dc.add_argument("--fragment", action="append")
    dc.add_argument("--root-of")
    dc.add_argument("--rationale", help="决定依据")
    dc.set_defaults(func=cmd_decision)
    do = dsub.add_parser("overturn")
    do.add_argument("id")
    do.add_argument("--statement", required=True)
    do.add_argument("--source-ticket")
    do.add_argument("--output-files", nargs="*")
    do.add_argument("--fragment", action="append")
    do.add_argument("--rationale", help="新决定的依据")
    do.set_defaults(func=cmd_decision)
    dv = dsub.add_parser("void")
    dv.add_argument("id")
    dv.add_argument("--reason", required=True)
    dv.set_defaults(func=cmd_decision)

    p = sub.add_parser("premise", help="前提")
    psub = p.add_subparsers(dest="action", required=True)
    pa = psub.add_parser("add")
    pa.add_argument("--decision", required=True)
    pa.add_argument("--statement", required=True)
    pa.add_argument("--evidence", action="append")
    pa.set_defaults(func=cmd_premise)
    pe = psub.add_parser("edit")
    pe.add_argument("id")
    pe.add_argument("--statement")
    pe.add_argument("--evidence", action="append")
    pe.set_defaults(func=cmd_premise)
    pj = psub.add_parser("judge")
    pj.add_argument("id")
    pj.add_argument("verdict", choices=["成立", "已破", "未知"])
    pj.add_argument("--evidence", action="append")
    pj.add_argument("--reason")
    pj.set_defaults(func=cmd_premise)

    p = sub.add_parser("impact", help="影响清单")
    isub2 = p.add_subparsers(dest="action", required=True)
    isub2.add_parser("list").set_defaults(func=cmd_impact)
    sh = isub2.add_parser("show")
    sh.add_argument("case")
    sh.set_defaults(func=cmd_impact)
    ac = isub2.add_parser("act", aliases=["handle"])
    ac.add_argument("case")
    ac.add_argument("ref")
    ac.add_argument("act", choices=[
        "仍成立", "需修改", "作废", "要补问", "保留", "改范围", "关掉", "重开", "新建", "合并",
    ])
    ac.add_argument("--statement")
    ac.add_argument("--source-ticket")
    ac.add_argument("--output-files", nargs="*")
    ac.add_argument("--void-reason")
    ac.add_argument("--title")
    ac.add_argument("--type", choices=["grilling", "research", "prototype", "task"])
    ac.add_argument("--split-reason")
    ac.add_argument("--derived-from", nargs="*")
    ac.add_argument("--covers", nargs="*")
    ac.add_argument("--body")
    ac.add_argument("--parent")
    ac.add_argument("--into")
    ac.add_argument("--reason")
    ac.set_defaults(func=cmd_impact)
    cl = isub2.add_parser("close")
    cl.add_argument("case")
    cl.add_argument("--reason")
    cl.set_defaults(func=cmd_impact)

    p = sub.add_parser("status", help="看工作状态")
    p.add_argument("action", nargs="?", choices=["sync"])
    p.set_defaults(func=cmd_status)

    p = sub.add_parser("sync", help="同步到 GitHub")
    p.add_argument("map")
    p.add_argument("--check", action="store_true")
    p.set_defaults(func=cmd_sync)

    p = sub.add_parser("mirror", help="镜像开关")
    p.add_argument("map")
    p.add_argument("on", choices=["on", "off"])
    p.set_defaults(func=cmd_mirror)

    sub.add_parser("rebuild", help="重建索引库").set_defaults(func=cmd_rebuild)
    sub.add_parser("hash", help="看状态哈希").set_defaults(func=cmd_hash)
    sub.add_parser("snapshot", help="提交数据目录").set_defaults(func=cmd_snapshot)
    ev = sub.add_parser("events", help="跟事件流")
    ev.add_argument("--since", type=int, default=0)
    ev.set_defaults(func=cmd_events)
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except DtError as exc:
        eprint(exc.message)
        return exc.code
    except KeyboardInterrupt:
        return 0
