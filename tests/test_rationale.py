"""理由字段、导入解析和 --payload 导入的测试。不联网，不碰真实数据目录。"""
from __future__ import annotations

import os
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from dtlib.cli import build_parser
from dtlib.commands import Board
from dtlib.importer import (
    build_import_payload, normalize_map_body, parse_rationale_sections,
    parse_split_rationale,
)
from dtlib.service import BoardService
from dtlib.schema import validate_event
from dtlib.store import EventStore
from dtlib.util import DtError

NOW = "2026-01-01T00:00:00Z"


class Base(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="dt-rationale-")
        self.store = EventStore(home=self.home, repo="Example/repo")
        self.store.ensure_dirs()
        self.store.load()
        self.board = Board(self.store)

    def append(self, event):
        self.store.append_event(event)
        return event

    def make_map(self, statement="根句。", split_rationale=""):
        event = self.board.issue_create(
            "agent:test", "map", title="理由测试地图",
            destination={"statement": statement, "fragments": [statement]},
            split_rationale=split_rationale,
        )
        self.append(event)
        return event["target"], self.store.state["decisions"][f"D-{event['target']}-ROOT"]

    def make_ticket(self, parent, root_id, title="测试票", inferred_from=None):
        event = self.board.issue_create(
            "agent:test", "ticket", title=title, parent=parent, type="task",
            split_reason="测试拆票理由", derived_from=[root_id],
            derived_from_inferred=inferred_from,
        )
        self.append(event)
        return event["target"]


class TestRationaleModel(Base):
    def test_map_split_rationale_create_and_edit(self):
        map_id, _ = self.make_map(split_rationale="先拆三个方向。")
        self.assertEqual(self.store.state["issues"][map_id]["split_rationale"],
                         "先拆三个方向。")
        self.append(self.board.issue_edit(
            "agent:test", map_id, {"split_rationale": "改成一个方向。"}))
        self.assertEqual(self.store.state["issues"][map_id]["split_rationale"],
                         "改成一个方向。")

    def test_ticket_rejects_split_rationale(self):
        map_id, root = self.make_map()
        with self.assertRaises(DtError):
            self.board.issue_create(
                "agent:test", "ticket", title="坏票", parent=map_id, type="task",
                split_reason="票理由", derived_from=[root["id"]],
                split_rationale="地图的理由不能挂票上",
            )
        ticket = self.make_ticket(map_id, root["id"])
        with self.assertRaises(DtError):
            self.store.append_event(self.board.issue_edit(
                "agent:test", ticket, {"split_rationale": "不该有"}))
        self.assertEqual(self.store.state["issues"][ticket]["split_reason"], "测试拆票理由")

    def test_decision_rationale_create_and_overturn(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"])
        event = self.board.decision_create(
            "agent:test", "第一条决定", source_ticket=ticket,
            rationale="原型测试通过，来源：PR #173。")
        self.append(event)
        did = event["target"]
        self.assertEqual(self.store.state["decisions"][did]["rationale"],
                         "原型测试通过，来源：PR #173。")
        overturn = self.board.decision_overturn(
            "agent:test", did, "新的第一条决定", source_ticket=ticket,
            rationale="接口改了，旧决定不成立。")
        self.append(overturn)
        new_id = overturn["payload"]["new_decision"]["id"]
        self.assertEqual(self.store.state["decisions"][new_id]["rationale"],
                         "接口改了，旧决定不成立。")

    def test_premise_judge_stores_reason(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"])
        d = self.board.decision_create("agent:test", "决定", source_ticket=ticket)
        self.append(d)
        p = self.board.premise_add("agent:test", d["target"], "前提", ["#170"])
        self.append(p)
        self.assertIsNone(self.store.state["premises"][p["target"]]["last_judged_reason"])
        self.append(self.board.premise_judge(
            "agent:test", p["target"], "已破", ["新证据"], "来源：中台/dtlib/cli.py。"))
        self.assertEqual(
            self.store.state["premises"][p["target"]]["last_judged_reason"],
            "来源：中台/dtlib/cli.py。")

    def test_decision_annotate_writes_rationale_and_source(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"])
        d = self.board.decision_create("agent:test", "决定", source_ticket=ticket)
        self.append(d)
        event = self.board.decision_annotate(
            "agent:test", d["target"], "旧票回填的理由。", source="来源：C-0018。")
        self.assertEqual(event["v"], 3)
        self.append(event)
        decision = self.store.state["decisions"][d["target"]]
        self.assertEqual(decision["rationale"], "旧票回填的理由。")
        self.assertEqual(decision["rationale_source"], "来源：C-0018。")
        self.assertEqual(decision["statement"], "决定")
        self.assertEqual(decision["status"], "active")

    def test_decision_annotate_unknown_decision(self):
        with self.assertRaises(DtError):
            self.board.decision_annotate("agent:test", "D-9999", "理由")

    def test_decision_annotate_rejects_empty_rationale(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"])
        d = self.board.decision_create("agent:test", "决定", source_ticket=ticket)
        self.append(d)
        with self.assertRaises(DtError):
            self.board.decision_annotate("agent:test", d["target"], "  ")

    def test_decision_annotate_only_accepts_v3(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"])
        d = self.board.decision_create("agent:test", "决定", source_ticket=ticket)
        self.append(d)
        event = self.board.decision_annotate("agent:test", d["target"], "理由。")
        validate_event(event)
        too_old = dict(event)
        too_old["v"] = 2
        with self.assertRaises(DtError):
            validate_event(too_old)

    def test_import_recomputes_impact_counter(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"], "产决定")
        decision = self.board.decision_create("agent:test", "旧决定", source_ticket=ticket)
        self.append(decision)
        derived = self.board.issue_create(
            "agent:test", "ticket", title="派生票", parent=map_id, type="task",
            split_reason="派生", derived_from=[decision["target"]])
        self.append(derived)
        overturn = self.board.decision_overturn(
            "agent:test", decision["target"], "新决定", source_ticket=ticket)
        self.append(overturn)
        self.assertEqual(overturn["payload"]["impact_case"], "IC-0001")
        payload = {
            "map": {
                "id": "9", "kind": "map", "title": "导入图", "body": "",
                "split_rationale": "", "state": "open", "labels": [],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "created_by": "human:test",
                "root": {
                    "id": "D-9-ROOT", "statement": "根句。",
                    "fragments": [{"index": 1, "text": "根句。"}],
                    "output_files": [], "created_at": NOW, "created_by": "human:test",
                },
            },
            "tickets": [], "comments": [], "decisions": [], "premises": [], "coverage": [],
        }
        self.append(self.board.import_event("agent:test", payload, "payload:9"))
        self.assertEqual(self.store.state["counters"]["impact"], 2)

    def test_confirm_derived_moves_inferred_edge(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root["id"], "先产决定")
        d = self.board.decision_create("agent:test", "来源决定", source_ticket=ticket)
        self.append(d)
        inferred_ticket = self.make_ticket(
            map_id, root["id"], "推断来源", inferred_from=[d["target"]])
        self.assertEqual(
            self.store.state["issues"][inferred_ticket]["derived_from_inferred"],
            [d["target"]])
        self.append(self.board.issue_confirm_derived(
            "agent:test", inferred_ticket, [d["target"]]))
        issue = self.store.state["issues"][inferred_ticket]
        self.assertIn(d["target"], issue["derived_from"])
        self.assertEqual(issue["derived_from_inferred"], [])

    def test_import_payload_fields(self):
        payload = {
            "map": {
                "id": "1", "kind": "map", "title": "导入地图", "body": "",
                "split_rationale": "地图级理由。",
                "state": "open", "labels": [], "created_at": NOW,
                "updated_at": NOW, "closed_at": None, "created_by": "human:test",
                "root": {
                    "id": "D-1-ROOT", "statement": "根句。",
                    "fragments": [{"index": 1, "text": "根句。"}],
                    "output_files": [], "created_at": NOW, "created_by": "human:test",
                },
            },
            "tickets": [{
                "id": "10", "type": "task", "title": "导入票", "body": "",
                "state": "open", "labels": [], "parent": "1", "blocked_by": [],
                "split_reason": "票级理由。", "derived_from": ["D-1-ROOT"],
                "derived_from_inferred": ["D-0001"], "covers": [],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "created_by": "human:test",
            }],
            "comments": [], "coverage": [],
            "decisions": [{
                "id": "D-0001", "statement": "导入的决定",
                "source_ticket": "10", "output_files": [],
                "rationale": "决定级理由。",
                "created_at": NOW, "created_by": "human:test",
            }],
            "premises": [{
                "id": "P-0001", "decision": "D-0001", "statement": "前提",
                "evidence": [], "state": "已破",
                "created_at": NOW, "created_by": "human:test",
                "last_judged_at": NOW, "last_judged_by": "human:test",
                "last_judged_reason": "来源：C-0001。",
            }],
        }
        self.append(self.board.import_event("agent:test", payload, "payload:1"))
        issues = self.store.state["issues"]
        self.assertEqual(issues["1"]["split_rationale"], "地图级理由。")
        self.assertEqual(issues["10"]["split_reason"], "票级理由。")
        self.assertEqual(issues["10"]["derived_from_inferred"], ["D-0001"])
        self.assertEqual(
            self.store.state["decisions"]["D-0001"]["rationale"], "决定级理由。")
        self.assertEqual(
            self.store.state["premises"]["P-0001"]["last_judged_reason"],
            "来源：C-0001。")


class TestParsing(unittest.TestCase):
    def test_parse_split_rationale(self):
        body = "## 拆票理由\n\n因为要分开做。\n\n## Scope\n\n做事。\n"
        self.assertEqual(parse_split_rationale(body), "因为要分开做。")
        self.assertEqual(parse_split_rationale("## Scope\n\n做事。\n"), "")

    def test_parse_rationale_sections(self):
        text = (
            "## 依据\n\n"
            "- D-0001：原型测试通过。来源：PR #173。\n"
            "- D-0002：旧接口还在用。来源：`中台/dtlib/cli.py`。\n"
            "  第二行补充。\n\n"
            "## 四列表\n\n"
            "| id | 决定 |\n| --- | --- |\n| D-0001 | 做了决定 |\n"
        )
        result = parse_rationale_sections(text)
        self.assertEqual(result["D-0001"], "原型测试通过。来源：PR #173。")
        self.assertIn("旧接口还在用", result["D-0002"])
        self.assertIn("第二行补充", result["D-0002"])

    def test_normalize_map_body_drops_rationale_section(self):
        body = "## Notes\n\n记一笔。\n\n## 拆票理由\n\n地图级理由。\n"
        normalized = normalize_map_body(body)
        self.assertNotIn("## 拆票理由", normalized)
        self.assertIn("## Notes", normalized)


class FakeGitHub:
    repo = "Example/repo"

    def __init__(self, with_rationale=True):
        self.map_body = MAP_BODY if with_rationale else MAP_BODY_NO_RATIONALE
        self.ticket_body = TICKET_BODY if with_rationale else "## Scope\n\n做事。\n"
        self.close_comment = CLOSE_COMMENT if with_rationale else CLOSE_COMMENT_NO_RATIONALE

    def api(self, path, paginate=False, method=None, fields=None, input_json=None):
        if path == "repos/Example/repo/issues/1":
            return {
                "number": 1, "title": "导入图", "body": self.map_body, "state": "open",
                "labels": [{"name": "wayfinder:map"}],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "user": {"login": "test"},
            }
        if path == "repos/Example/repo/issues/1/comments":
            return []
        if path == "repos/Example/repo/issues/1/sub_issues":
            return [{
                "number": 10, "title": "导入票", "body": self.ticket_body, "state": "open",
                "labels": [{"name": "wayfinder:task"}],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "user": {"login": "test"},
            }]
        if path == "repos/Example/repo/issues/10/comments":
            return [{
                "id": 900, "body": self.close_comment,
                "created_at": NOW, "updated_at": NOW, "user": {"login": "test"},
            }]
        if path == "repos/Example/repo/issues/10/dependencies/blocked_by":
            return []
        raise AssertionError(path)


MAP_BODY = (
    "## Destination\n\n**主句：** 第一句。第二句。\n\n"
    "## Destination 覆盖表\n\n"
    "| 句 | 原文片段 | 由哪张票落 |\n| --- | --- | --- |\n"
    "| 1 | 第一句。 | #10 |\n\n"
    "## 拆票理由\n\n地图级理由。\n"
)

MAP_BODY_NO_RATIONALE = (
    "## Destination\n\n**主句：** 第一句。第二句。\n\n"
    "## Destination 覆盖表\n\n"
    "| 句 | 原文片段 | 由哪张票落 |\n| --- | --- | --- |\n"
    "| 1 | 第一句。 | #10 |\n"
)

TICKET_BODY = "## 拆票理由\n\n票级理由。\n\n## Scope\n\n做事。\n"

CLOSE_COMMENT = (
    "## 依据\n\n"
    "- D-0001：决定级理由。来源：评论 C-0001。\n\n"
    "## 四列表\n\n"
    "| id | 决定 | 取代 | 产出文件 |\n| --- | --- | --- | --- |\n"
    "| D-0001 | 做了决定 | 无 | `a.py` |\n"
)

CLOSE_COMMENT_NO_RATIONALE = (
    "## 四列表\n\n"
    "| id | 决定 | 取代 | 产出文件 |\n| --- | --- | --- | --- |\n"
    "| D-0001 | 做了决定 | 无 | `a.py` |\n"
)


class TestGitHubImportParsing(unittest.TestCase):
    def test_build_import_payload_reads_rationales(self):
        with patch("dtlib.importer.GitHub", return_value=FakeGitHub()):
            payload, warnings, issue = build_import_payload("Example/repo", "1")
        self.assertEqual(payload["map"]["split_rationale"], "地图级理由。")
        self.assertEqual(payload["tickets"][0]["split_reason"], "票级理由。")
        self.assertEqual(payload["decisions"][0]["rationale"],
                         "决定级理由。来源：评论 C-0001。")
        self.assertEqual(payload["decisions"][0]["source_ticket"], "10")
        self.assertEqual(warnings, [])

    def test_missing_rationales_stay_empty(self):
        with patch("dtlib.importer.GitHub", return_value=FakeGitHub(with_rationale=False)):
            payload, _, _ = build_import_payload("Example/repo", "1")
        self.assertEqual(payload["map"]["split_rationale"], "")
        self.assertEqual(payload["tickets"][0]["split_reason"], "")
        self.assertEqual(payload["decisions"][0]["rationale"], "")


class TestPayloadImport(unittest.TestCase):
    def test_import_payload_and_reject_duplicate(self):
        home = tempfile.mkdtemp(prefix="dt-payload-")
        service = BoardService(home=home, repo="Example/repo", port=0)
        service.store.ensure_dirs()
        service.store.load()
        payload = {
            "map": {
                "id": "1", "kind": "map", "title": "快照图", "body": "",
                "split_rationale": "快照理由。", "state": "open", "labels": [],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "created_by": "human:test",
                "root": {
                    "id": "D-1-ROOT", "statement": "根句。",
                    "fragments": [{"index": 1, "text": "根句。"}],
                    "output_files": [], "created_at": NOW, "created_by": "human:test",
                },
            },
            "tickets": [{
                "id": "10", "type": "task", "title": "快照票", "body": "",
                "state": "open", "labels": [], "parent": "1", "blocked_by": [],
                "split_reason": "快照票理由。", "derived_from": ["D-1-ROOT"],
                "derived_from_inferred": [], "covers": [],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "created_by": "human:test",
            }],
            "comments": [], "decisions": [], "premises": [], "coverage": [],
            "github": {"issues": {"1": 1, "10": 10}, "comments": {}},
        }
        event, counts = service.import_payload(payload, "agent:test")
        self.assertEqual(event["target"], "payload:1")
        self.assertEqual(counts["tickets"], 1)
        self.assertEqual(service.store.state["issues"]["1"]["split_rationale"],
                         "快照理由。")
        self.assertEqual(service.store.sync["issues"]["10"], 10)
        with self.assertRaises(DtError):
            service.import_payload(payload, "agent:test")

    def test_import_keeps_superseded_status_without_replacement(self):
        home = tempfile.mkdtemp(prefix="dt-payload-")
        service = BoardService(home=home, repo="Example/repo", port=0)
        service.store.ensure_dirs()
        service.store.load()
        payload = {
            "map": {
                "id": "1", "kind": "map", "title": "旧图", "body": "",
                "split_rationale": "", "state": "open", "labels": [],
                "created_at": NOW, "updated_at": NOW, "closed_at": None,
                "created_by": "human:test",
                "root": {
                    "id": "D-M1-ROOT", "statement": "根句。",
                    "fragments": [{"index": 1, "text": "根句。"}],
                    "output_files": [], "created_at": NOW, "created_by": "human:test",
                },
            },
            "tickets": [], "comments": [], "premises": [], "coverage": [],
            "decisions": [{
                "id": "D-M1-003", "statement": "旧结论", "source_ticket": None,
                "output_files": [], "status": "superseded",
            }],
        }
        service.import_payload(payload, "agent:test")
        decision = service.store.state["decisions"]["D-M1-003"]
        self.assertEqual(decision["status"], "superseded")
        self.assertIsNone(decision["superseded_by"])

    def test_cli_accepts_payload_and_github_forms(self):
        parser = build_parser()
        args = parser.parse_args(["import", "--payload", "快照.json"])
        self.assertEqual(args.payload, "快照.json")
        self.assertIsNone(args.source)
        args = parser.parse_args(["import", "github", "139"])
        self.assertEqual(args.map, "139")
        self.assertEqual(args.source, "github")
        args = parser.parse_args([
            "decision", "annotate", "D-0001",
            "--rationale", "理由。", "--source", "C-0018。",
        ])
        self.assertEqual(args.action, "annotate")
        self.assertEqual(args.source, "C-0018。")


if __name__ == "__main__":
    unittest.main()
