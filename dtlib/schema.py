"""事件格式校验。只接受认识的版本和 op；缺字段、多字段都拒绝。"""
from __future__ import annotations

import re

from .util import DtError

OPS_V1 = {
    "import", "issue.create", "issue.edit", "issue.state", "issue.label",
    "issue.parent", "issue.block", "comment.create", "comment.edit",
    "comment.delete", "decision.create", "decision.overturn",
    "premise.add", "premise.judge",
}
OPS_V2 = OPS_V1 | {
    "decision.void", "premise.edit", "impact.act", "impact.close",
    "issue.confirm_derived",
}
OPS_V3 = OPS_V2 | {"decision.annotate"}
OPS_V4 = OPS_V3 | {"premise.annotate"}
OPS_V5 = OPS_V4 | {"close.prepare", "close.revoke", "close.mark", "issue.close"}

TICKET_TYPES = ("grilling", "research", "prototype", "task")
VERDICTS = ("成立", "已破", "未知")
IMPACT_ACTIONS = (
    "仍成立", "需修改", "作废", "要补问",
    "保留", "改范围", "关掉", "重开", "新建",
)

# required / optional 键集合。v1 的导入 payload 没有 comments。
_SCHEMAS = {
    1: {
        "import": ({"map", "tickets", "decisions", "premises", "coverage"}, set()),
        "issue.create": ({"title", "body", "labels", "parent", "state"}, set()),
        "issue.edit": (set(), {"title", "body"}),
        "issue.state": ({"state"}, set()),
        "issue.label": ({"add", "remove"}, set()),
        "issue.parent": ({"parent"}, set()),
        "issue.block": ({"add", "remove"}, set()),
        "comment.create": ({"issue", "body"}, set()),
        "comment.edit": ({"body"}, set()),
        "comment.delete": (set(), set()),
        "decision.create": ({"statement", "group", "source_ticket", "output_files"}, set()),
        "decision.overturn": ({"new_decision"}, set()),
        "premise.add": ({"decision", "statement", "evidence"}, set()),
        "premise.judge": ({"verdict", "evidence"}, set()),
    },
    2: {
        "import": (
            {"map", "tickets", "comments", "decisions", "premises", "coverage"},
            {"github"},
        ),
        "issue.create": (
            {"kind", "title", "body", "labels", "parent", "state"},
            {"type", "split_reason", "split_rationale", "derived_from", "derived_from_inferred",
             "covers", "destination", "impact_case", "impact_item", "impact_action"},
        ),
        "issue.edit": (
            set(),
            {"title", "body", "type", "split_reason", "split_rationale", "derived_from",
             "derived_from_inferred", "covers", "impact_case", "impact_item", "impact_action"},
        ),
        "issue.confirm_derived": (set(), {"decisions"}),
        "issue.state": (
            {"state"},
            {"impact_case", "impact_item", "impact_action", "impact_merged_into"},
        ),
        "issue.label": ({"add", "remove"}, set()),
        "issue.parent": ({"parent"}, set()),
        "issue.block": ({"add", "remove"}, set()),
        "comment.create": ({"issue", "body"}, set()),
        "comment.edit": ({"body"}, set()),
        "comment.delete": (set(), set()),
        "decision.create": (
            {"statement", "source_ticket", "output_files"},
            {"fragments", "root_of", "rationale"},
        ),
        "decision.overturn": (
            {"new_decision"},
            {"impact_case", "impact_items", "impact_item", "impact_action"},
        ),
        "decision.void": (
            {"reason"},
            {"impact_case", "impact_items", "impact_item", "impact_action"},
        ),
        "premise.add": ({"decision", "statement", "evidence"}, set()),
        "premise.judge": (
            {"verdict", "evidence"},
            {"impact_case", "impact_items"},
        ),
        "premise.edit": (set(), {"statement", "evidence"}),
        "impact.act": ({"item", "action"}, set()),
        "impact.close": (set(), set()),
    },
}

# v3 只加一个只写依据的 op；其余事件按 v2 折叠。
_SCHEMAS[3] = dict(_SCHEMAS[2])
_SCHEMAS[3]["decision.annotate"] = ({"rationale"}, {"source"})

# v4 只加一个只改上次判定理由的 op；其余事件按 v3 折叠。
_SCHEMAS[4] = dict(_SCHEMAS[3])
_SCHEMAS[4]["premise.annotate"] = (set(), set())

# v5 加待关票记录和自动关票；其余事件按 v4 折叠。
_SCHEMAS[5] = dict(_SCHEMAS[4])
_SCHEMAS[5]["issue.state"] = (
    {"state"},
    {"impact_case", "impact_item", "impact_action", "impact_merged_into", "close_record"},
)
_SCHEMAS[5]["close.prepare"] = ({"record", "pr", "sha", "comments", "decisions"}, set())
_SCHEMAS[5]["close.revoke"] = ({"record"}, set())
_SCHEMAS[5]["close.mark"] = ({"record"}, {"status", "verify", "check", "detail"})
_SCHEMAS[5]["issue.close"] = ({"record", "pr", "comments", "decisions"}, set())

_SHA_RE = re.compile(r"^[0-9a-f]{7,40}$")
_TS_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")
_ACTOR_RE = re.compile(r"^(human|agent):.+$")


def validate_event(event, line_no=None):
    """校验一条事件。返回规范化后的事件副本。"""
    where = f"第 {line_no} 行" if line_no else "事件"
    if not isinstance(event, dict):
        raise DtError(f"{where}不是 JSON 对象", detail=event)
    allowed_top = {"v", "seq", "ts", "actor", "op", "target", "payload", "reason"}
    missing = allowed_top - set(event)
    extra = set(event) - allowed_top
    if missing or extra:
        raise DtError(
            f"{where}字段不对：缺 {sorted(missing)}，多 {sorted(extra)}")
    version = event["v"]
    if version not in _SCHEMAS:
        raise DtError(f"{where}不认识的版本 {version!r}")
    if not isinstance(event["seq"], int) or event["seq"] < 1:
        raise DtError(f"{where}的 seq 不是正整数")
    if not isinstance(event["ts"], str) or not _TS_RE.match(event["ts"]):
        raise DtError(f"{where}的 ts 格式不对")
    if not isinstance(event["actor"], str) or not _ACTOR_RE.match(event["actor"]):
        raise DtError(f"{where}的 actor 格式不对")
    if not isinstance(event["target"], str) or not event["target"]:
        raise DtError(f"{where}的 target 为空")
    if event["reason"] is not None and not isinstance(event["reason"], str):
        raise DtError(f"{where}的 reason 不是字符串或 null")
    op = event["op"]
    schemas = _SCHEMAS[version]
    if op not in schemas:
        raise DtError(f"{where}不认识的 op {op!r}（版本 {version}）")
    if op == "premise.annotate" and not (event.get("reason") or "").strip():
        raise DtError(f"{where}的 premise.annotate 缺判定理由")
    required, optional = schemas[op]
    payload = event["payload"]
    if not isinstance(payload, dict):
        raise DtError(f"{where}的 payload 不是对象")
    keys = set(payload)
    missing = required - keys
    extra = keys - required - optional
    if missing or extra:
        raise DtError(
            f"{where}的 payload 字段不对：op={op}，缺 {sorted(missing)}，多 {sorted(extra)}")
    if op in ("issue.edit", "premise.edit"):
        change_keys = keys - {"impact_case", "impact_item", "impact_action"}
        if not change_keys:
            raise DtError(f"{where}的 {op} 至少要改一个字段")
    _validate_payload_types(op, payload, where, version)
    return event


def _expect(condition, message, where):
    if not condition:
        raise DtError(f"{where}：{message}")


def _str_list(value):
    return isinstance(value, list) and all(isinstance(v, str) for v in value)


def _validate_payload_types(op, p, where, version=2):
    if op == "import":
        _expect(isinstance(p["map"], dict), "map 不是对象", where)
        for key in ("tickets", "comments", "decisions", "premises", "coverage"):
            if key in p:
                _expect(isinstance(p[key], list), f"{key} 不是数组", where)
        if "github" in p:
            _expect(isinstance(p["github"], dict), "github 不是对象", where)
    elif op == "issue.create":
        if version == 1:
            _expect(isinstance(p["title"], str) and p["title"], "title 为空", where)
            _expect(isinstance(p["body"], str), "body 不是字符串", where)
            _expect(_str_list(p["labels"]), "labels 不是字符串数组", where)
            _expect(p["parent"] is None or isinstance(p["parent"], str), "parent 不对", where)
            _expect(p["state"] in ("open", "closed"), "state 只能是 open 或 closed", where)
            return
        _expect(p["kind"] in ("map", "ticket"), "kind 只能是 map 或 ticket", where)
        _expect(isinstance(p["title"], str) and p["title"], "title 为空", where)
        _expect(isinstance(p["body"], str), "body 不是字符串", where)
        _expect(_str_list(p["labels"]), "labels 不是字符串数组", where)
        _expect(p["parent"] is None or isinstance(p["parent"], str), "parent 不对", where)
        _expect(p["state"] in ("open", "closed"), "state 只能是 open 或 closed", where)
        if p["kind"] == "ticket":
            for key in ("type", "split_reason", "derived_from", "covers"):
                _expect(key in p, f"票缺 {key}", where)
            _expect(p["type"] in TICKET_TYPES, "type 不在四种票型里", where)
            _expect(isinstance(p["split_reason"], str), "split_reason 不是字符串", where)
            _expect(_str_list(p["derived_from"]), "derived_from 不是字符串数组", where)
            if "derived_from_inferred" in p:
                _expect(_str_list(p["derived_from_inferred"]),
                        "derived_from_inferred 不是字符串数组", where)
            _expect(_str_list(p["covers"]), "covers 不是字符串数组", where)
            _expect(p["parent"] is not None, "票必须挂地图", where)
            _expect("destination" not in p, "票不能带 destination", where)
            _expect("split_rationale" not in p, "票没有 split_rationale，用 split_reason", where)
        else:
            _expect("destination" in p, "地图缺 destination", where)
            if "split_rationale" in p:
                _expect(isinstance(p["split_rationale"], str), "split_rationale 不是字符串", where)
            _expect(isinstance(p["destination"], dict), "destination 不是对象", where)
            d = p["destination"]
            _expect(set(d) == {"decision", "statement", "fragments"},
                    "destination 字段应为 decision、statement、fragments", where)
            _expect(isinstance(d["decision"], str) and d["decision"], "destination.decision 为空", where)
            _expect(isinstance(d["statement"], str) and d["statement"], "destination.statement 为空", where)
            _expect(_str_list(d["fragments"]) and d["fragments"], "destination.fragments 为空", where)
            _expect(p["parent"] is None, "地图不能有父票", where)
    elif op == "issue.edit":
        for key in ("title", "body", "type", "split_reason", "split_rationale",
                    "derived_from", "derived_from_inferred", "covers"):
            if key in p:
                if key in ("title",):
                    _expect(isinstance(p[key], str) and p[key], f"{key} 为空", where)
                elif key in ("body", "split_reason", "split_rationale"):
                    _expect(isinstance(p[key], str), f"{key} 不是字符串", where)
                elif key == "type":
                    _expect(p[key] in TICKET_TYPES, "type 不在四种票型里", where)
                else:
                    _expect(_str_list(p[key]), f"{key} 不是字符串数组", where)
    elif op == "issue.confirm_derived":
        if "decisions" in p:
            _expect(_str_list(p["decisions"]), "decisions 不是字符串数组", where)
    elif op in ("issue.state",):
        _expect(p["state"] in ("open", "closed"), "state 只能是 open 或 closed", where)
    elif op in ("issue.label", "issue.block"):
        _expect(_str_list(p["add"]) and _str_list(p["remove"]), f"{op} 的 add/remove 不对", where)
        _expect(p["add"] or p["remove"], f"{op} 的 add 和 remove 不能都为空", where)
    elif op == "comment.create":
        _expect(isinstance(p["issue"], str) and p["issue"], "issue 为空", where)
        _expect(isinstance(p["body"], str) and p["body"], "body 为空", where)
    elif op == "comment.edit":
        _expect(isinstance(p["body"], str), "body 不是字符串", where)
    elif op == "decision.create":
        _expect(isinstance(p["statement"], str) and p["statement"], "statement 为空", where)
        _expect(p["source_ticket"] is None or isinstance(p["source_ticket"], str), "source_ticket 不对", where)
        _expect(_str_list(p["output_files"]), "output_files 不是字符串数组", where)
        if "fragments" in p:
            _expect(isinstance(p["fragments"], list) and p["fragments"], "fragments 为空", where)
        if "root_of" in p:
            _expect(isinstance(p["root_of"], str) and p["root_of"], "root_of 为空", where)
        if "rationale" in p:
            _expect(isinstance(p["rationale"], str), "rationale 不是字符串", where)
    elif op == "decision.overturn":
        nd = p["new_decision"]
        _expect(isinstance(nd, dict), "new_decision 不是对象", where)
        if version == 1:
            _expect(isinstance(nd.get("statement"), str) and nd["statement"],
                    "new_decision.statement 为空", where)
        else:
            allowed = {"id", "statement", "source_ticket", "output_files", "fragments", "root_of",
                       "rationale"}
            _expect(set(nd) <= allowed, f"new_decision 多字段 {sorted(set(nd) - allowed)}", where)
            _expect({"id", "statement", "source_ticket", "output_files"} <= set(nd),
                    "new_decision 缺字段", where)
            _expect(isinstance(nd["id"], str) and nd["id"], "new_decision.id 为空", where)
            _expect(isinstance(nd["statement"], str) and nd["statement"], "new_decision.statement 为空", where)
            _expect(nd["source_ticket"] is None or isinstance(nd["source_ticket"], str),
                    "new_decision.source_ticket 不对", where)
            _expect(_str_list(nd["output_files"]), "new_decision.output_files 不对", where)
            if "fragments" in nd:
                _expect(isinstance(nd["fragments"], list) and nd["fragments"], "new_decision.fragments 为空", where)
            if "root_of" in nd:
                _expect(isinstance(nd["root_of"], str) and nd["root_of"], "new_decision.root_of 为空", where)
            if "rationale" in nd:
                _expect(isinstance(nd["rationale"], str), "new_decision.rationale 不是字符串", where)
    elif op == "decision.void":
        _expect(isinstance(p["reason"], str) and p["reason"], "reason 为空", where)
    elif op == "decision.annotate":
        _expect(isinstance(p["rationale"], str) and p["rationale"].strip(),
                "rationale 为空", where)
        if "source" in p:
            _expect(isinstance(p["source"], str), "source 不是字符串", where)
    elif op == "premise.add":
        _expect(isinstance(p["decision"], str) and p["decision"], "decision 为空", where)
        _expect(isinstance(p["statement"], str) and p["statement"], "statement 为空", where)
        _expect(_str_list(p["evidence"]), "evidence 不是字符串数组", where)
    elif op == "premise.judge":
        _expect(p["verdict"] in VERDICTS, "verdict 只能是成立、已破、未知", where)
        _expect(_str_list(p["evidence"]), "evidence 不是字符串数组", where)
    elif op == "premise.annotate":
        pass
    elif op == "premise.edit":
        for key in ("statement", "evidence"):
            if key in p:
                if key == "statement":
                    _expect(isinstance(p[key], str) and p[key], "statement 为空", where)
                else:
                    _expect(_str_list(p[key]), "evidence 不是字符串数组", where)
    elif op == "impact.act":
        item = p["item"]
        _expect(isinstance(item, dict) and set(item) == {"kind", "ref"},
                "item 字段应为 kind、ref", where)
        _expect(item["kind"] in ("decision", "ticket"), "item.kind 不对", where)
        _expect(isinstance(item["ref"], str) and item["ref"], "item.ref 为空", where)
        _expect(p["action"] in ("仍成立", "保留"), "impact.act 的 action 只能是仍成立或保留", where)
    elif op == "impact.close":
        pass
    elif op == "close.prepare":
        _expect(isinstance(p["record"], str) and p["record"], "record 为空", where)
        _expect(isinstance(p["pr"], int) and p["pr"] > 0, "pr 不是正整数", where)
        _expect(isinstance(p["sha"], str) and _SHA_RE.match(p["sha"]),
                "sha 不是 7 到 40 位小写十六进制", where)
        _validate_close_comments(p["comments"], where, with_ids=False)
        _validate_decision_drafts(p["decisions"], where)
    elif op == "close.revoke":
        _expect(isinstance(p["record"], str) and p["record"], "record 为空", where)
    elif op == "close.mark":
        _expect(isinstance(p["record"], str) and p["record"], "record 为空", where)
        _expect("status" in p or "verify" in p, "close.mark 至少改 status 或 verify", where)
        if "status" in p:
            _expect(p["status"] == "过期", "close.mark 的 status 只能是过期", where)
        if "verify" in p:
            _expect(p["verify"] in (None, "无法核对"),
                    "close.mark 的 verify 只能是 null 或无法核对", where)
        if "check" in p:
            _expect(isinstance(p["check"], str) and p["check"], "check 为空", where)
        if "detail" in p:
            _expect(isinstance(p["detail"], str), "detail 不是字符串", where)
    elif op == "issue.close":
        _expect(isinstance(p["record"], str) and p["record"], "record 为空", where)
        _expect(isinstance(p["pr"], int) and p["pr"] > 0, "pr 不是正整数", where)
        _validate_close_comments(p["comments"], where, with_ids=True)
        _validate_decision_drafts(p["decisions"], where)
    # 影响字段的形态
    if "impact_item" in p:
        item = p["impact_item"]
        _expect(isinstance(item, dict) and set(item) == {"kind", "ref"},
                "impact_item 字段应为 kind、ref", where)
    if "impact_items" in p:
        _expect(isinstance(p["impact_items"], list), "impact_items 不是数组", where)
        for item in p["impact_items"]:
            _expect(isinstance(item, dict) and {"kind", "ref", "relations"} <= set(item),
                    "impact_items 项字段不对", where)
            _expect(item["kind"] in ("decision", "ticket"), "impact_items.kind 不对", where)
            _expect(_str_list(item.get("relations", [])), "impact_items.relations 不对", where)
    if "impact_action" in p:
        _expect(p["impact_action"] in IMPACT_ACTIONS, "impact_action 不在词表里", where)


def _validate_close_comments(comments, where, with_ids):
    _expect(isinstance(comments, list) and len(comments) == 4,
            "comments 必须正好四条", where)
    for item in comments:
        if with_ids:
            _expect(isinstance(item, dict) and set(item) == {"id", "body"},
                    "comment 字段应为 id、body", where)
            _expect(isinstance(item["id"], str) and item["id"].startswith("C-"),
                    "comment.id 不是 C- 号", where)
            body = item["body"]
        else:
            _expect(isinstance(item, str), "comment 不是字符串", where)
            body = item
        _expect(isinstance(body, str) and body.strip(), "comment 正文为空", where)


def _validate_decision_drafts(drafts, where):
    _expect(isinstance(drafts, list), "decisions 不是数组", where)
    seen = set()
    for draft in drafts:
        _expect(isinstance(draft, dict), "决定草稿不是对象", where)
        allowed = {"id", "statement", "output_files", "rationale"}
        _expect(set(draft) <= allowed, f"决定草稿多字段 {sorted(set(draft) - allowed)}", where)
        _expect({"id", "statement", "output_files"} <= set(draft), "决定草稿缺字段", where)
        _expect(isinstance(draft["id"], str) and draft["id"].startswith("D-"),
                "决定草稿 id 不是 D- 号", where)
        _expect(draft["id"] not in seen, f"决定草稿编号重复：{draft['id']}", where)
        seen.add(draft["id"])
        _expect(isinstance(draft["statement"], str) and draft["statement"].strip(),
                "决定草稿陈述为空", where)
        _expect(_str_list(draft["output_files"]), "决定草稿 output_files 不对", where)
        if "rationale" in draft:
            _expect(isinstance(draft["rationale"], str), "决定草稿 rationale 不是字符串", where)
