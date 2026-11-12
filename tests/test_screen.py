"""屏幕视图测试：分组、边、覆盖、信号和静态文件。不联网。"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from dtlib.commands import Board
from dtlib.service import static_file
from dtlib.store import EventStore
from dtlib.util import DtError
from dtlib.views import board_view


class Base(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="dt-screen-")
        self.store = EventStore(home=self.home, repo="Example/repo")
        self.store.ensure_dirs()
        self.store.load()
        self.board = Board(self.store)

    def append(self, event):
        self.store.append_event(event)
        return event

    def make_map(self, statement="第一句。第二句。", fragments=None):
        event = self.board.issue_create(
            "agent:test", "map", title="屏幕测试地图",
            destination={"statement": statement, "fragments": fragments or ["第一句。", "第二句。"]},
        )
        self.append(event)
        return event["target"], self.store.state["decisions"][f"D-{event['target']}-ROOT"]

    def make_ticket(self, parent, root_id, title="测试票", derived_from=None, covers=None,
                    inferred_from=None):
        event = self.board.issue_create(
            "agent:test", "ticket", title=title, parent=parent, type="task",
            split_reason="屏幕测试的拆票理由", derived_from=derived_from or [root_id],
            covers=covers or [], derived_from_inferred=inferred_from,
        )
        self.append(event)
        return event["target"]

    def signal(self, view, key):
        return [s for s in view["signals"] if s["key"] == key][0]


class TestBoard(Base):
    def test_groups_edges_and_coverage(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root["id"], "产决定的票", covers=[root["fragments"][0]["id"]])
        d1 = self.board.decision_create(
            "agent:test", "第一条决定", source_ticket=t1, output_files=["a.md"])
        self.append(d1)
        d1_id = d1["target"]
        t2 = self.make_ticket(map_id, d1_id, "吃决定的票", derived_from=[d1_id],
                             covers=[root["fragments"][1]["id"]])
        d2 = self.board.decision_create("agent:test", "第二条决定", source_ticket=t2)
        self.append(d2)

        view = board_view(self.store, map_id)
        self.assertEqual(view["map"]["id"], map_id)
        self.assertEqual(view["root"]["id"], root["id"])
        keys = [g["key"] for g in view["groups"]]
        self.assertIn("decision:" + root["id"], keys)
        self.assertIn("decision:" + d1_id, keys)
        self.assertIn("decision:" + d2["target"], keys)

        kinds = {(e["kind"], e["from"], e["to"]) for e in view["edges"]}
        self.assertIn(("derived", "decision:" + root["id"], "ticket:" + t1), kinds)
        self.assertIn(("produced", "ticket:" + t1, "decision:" + d1_id), kinds)
        self.assertIn(("derived", "decision:" + d1_id, "ticket:" + t2), kinds)

        self.assertEqual(view["coverage"][0]["status"], "进行中")
        self.assertEqual(view["coverage"][0]["tickets"][0]["split_reason"], "屏幕测试的拆票理由")
        self.assertEqual(view["counts"]["tickets"], 2)
        self.assertEqual(view["counts"]["decisions"], 3)

    def test_overturn_group_main_and_supersede_edge(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root["id"], "产决定的票")
        d1 = self.board.decision_create("agent:test", "旧决定", source_ticket=t1)
        self.append(d1)
        old_id = d1["target"]
        event = self.board.decision_overturn(
            "agent:test", old_id, "新决定", source_ticket=t1)
        self.append(event)
        new_id = event["payload"]["new_decision"]["id"]

        view = board_view(self.store, map_id)
        group = [g for g in view["groups"] if g["ticket"] == t1][0]
        self.assertEqual(group["main"], new_id)
        self.assertEqual(group["decisions"][0], new_id)
        self.assertIn(old_id, group["decisions"])
        kinds = {(e["kind"], e["from"], e["to"]) for e in view["edges"]}
        self.assertIn(("supersedes", "decision:" + new_id, "decision:" + old_id), kinds)

    def test_overturn_inherits_source_ticket(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root["id"], "产决定的票")
        d1 = self.board.decision_create("agent:test", "旧决定", source_ticket=t1)
        self.append(d1)
        event = self.board.decision_overturn("agent:test", d1["target"], "新决定")
        self.append(event)
        new_id = event["payload"]["new_decision"]["id"]
        self.assertEqual(self.store.state["decisions"][new_id]["source_ticket"], t1)

    def test_signals(self):
        map_id, root = self.make_map()
        # 缺口：第二句没有票接
        t1 = self.make_ticket(map_id, root["id"], "第一张票", covers=[root["fragments"][0]["id"]])
        # 裸决定 + 无源决定
        d1 = self.board.decision_create("agent:test", "没有前提的决定", source_ticket=t1)
        self.append(d1)
        d_orphan = self.board.decision_create("agent:test", "没有来源的决定", source_ticket=None)
        self.append(d_orphan)
        self.make_ticket(map_id, root["id"], "吃无源决定的票", derived_from=[d_orphan["target"]])
        # 破前提
        p = self.board.premise_add("agent:test", d1["target"], "会被判破的前提", [])
        self.append(p)
        judge = self.board.premise_judge("agent:test", p["target"], "已破", ["新证据"], "证据变了")
        self.append(judge)
        # 无主票：新建一张后清空 derived_from
        t2 = self.make_ticket(map_id, root["id"], "会被清空来源的票")
        self.append(self.board.issue_edit(
            "agent:test", t2, {"derived_from": []}))
        # 吃旧决定：票仍挂在被取代的决定上
        d_stale = self.board.decision_create("agent:test", "会被取代的决定", source_ticket=t1)
        self.append(d_stale)
        t3 = self.make_ticket(map_id, d_stale["target"], "挂在旧决定上的票",
                              derived_from=[d_stale["target"]])
        self.append(self.board.decision_overturn(
            "agent:test", d_stale["target"], "取代后的决定", source_ticket=t1))
        # 工作卡住：写一份等待人的工作状态
        self.store.write_workstate({
            "updated_at": "2026-11-12T00:00:00.000Z", "offline": False,
            "tickets": {t1: {"state": "等待人", "note": "等运营者"}},
        })
        # 同步异常
        self.store.sync_record({"type": "mirror", "map": map_id, "on": True})
        self.store.sync_record({
            "type": "sync", "map": map_id, "action": "issue.update",
            "ref": t1, "status": "failed", "detail": "测试失败",
        })

        view = board_view(self.store, map_id)
        self.assertEqual(self.signal(view, "coverage-gap")["count"], 1)
        self.assertEqual(self.signal(view, "bare-decision")["count"], 2)  # 无源决定和新决定都没有前提
        self.assertEqual(self.signal(view, "orphan-decision")["count"], 1)
        self.assertEqual(self.signal(view, "broken-premise")["count"], 1)
        self.assertEqual(self.signal(view, "impact-open")["count"], 2)
        self.assertEqual(self.signal(view, "orphan-ticket")["count"], 1)
        self.assertIn("ticket:" + t3, self.signal(view, "stale-decision")["targets"])
        self.assertIn("ticket:" + t1, self.signal(view, "stuck-ticket")["targets"])
        self.assertEqual(self.signal(view, "sync-error")["count"], 1)
        self.assertEqual(view["sync"]["state"], "失败")
        self.assertEqual(view["workstate"]["tickets"][t1]["state"], "等待人")

        ticket = [t for t in view["tickets"] if t["id"] == t1][0]
        self.assertEqual(ticket["work"], "等待人")
        self.assertEqual(ticket["sync"]["state"], "失败")

    def test_inferred_source_is_dashed_and_confirm_moves_it(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root["id"], "产出来源的票")
        d1 = self.board.decision_create("agent:test", "候选来源", source_ticket=t1)
        self.append(d1)
        t2 = self.make_ticket(map_id, root["id"], "来源待确认的票",
                              inferred_from=[d1["target"]])

        view = board_view(self.store, map_id)
        ticket = [t for t in view["tickets"] if t["id"] == t2][0]
        self.assertEqual(ticket["derived_from_inferred"], [d1["target"]])
        edge = [e for e in view["edges"]
                if e["kind"] == "derived" and e["to"] == "ticket:" + t2
                and e["from"] == "decision:" + d1["target"]][0]
        self.assertTrue(edge["inferred"])

        self.append(self.board.issue_confirm_derived("agent:test", t2))

        view = board_view(self.store, map_id)
        ticket = [t for t in view["tickets"] if t["id"] == t2][0]
        self.assertEqual(ticket["derived_from_inferred"], [])
        self.assertIn(d1["target"], ticket["derived_from"])
        edge = [e for e in view["edges"]
                if e["kind"] == "derived" and e["to"] == "ticket:" + t2
                and e["from"] == "decision:" + d1["target"]][0]
        self.assertFalse(edge["inferred"])

    def test_inferred_source_decision_is_included_in_board(self):
        map_id, root = self.make_map()
        orphan = self.board.decision_create("agent:test", "只在推断边里出现的决定")
        self.append(orphan)
        t1 = self.make_ticket(map_id, root["id"], "用推断来源的票",
                              inferred_from=[orphan["target"]])
        view = board_view(self.store, map_id)
        self.assertIn(orphan["target"], [d["id"] for d in view["decisions"]])
        edge = [e for e in view["edges"]
                if e["kind"] == "derived" and e["from"] == "decision:" + orphan["target"]][0]
        self.assertEqual(edge["to"], "ticket:" + t1)

    def test_import_preserves_inferred_sources(self):
        now = "2026-01-01T00:00:00Z"
        payload = {
            "map": {
                "id": "1", "kind": "map", "title": "导入地图", "body": "",
                "state": "open", "labels": [], "created_at": now, "updated_at": now,
                "closed_at": None, "created_by": "human:test",
                "root": {
                    "id": "D-1-ROOT", "statement": "根句。",
                    "fragments": [{"index": 1, "text": "根句。"}],
                    "output_files": [], "created_at": now, "created_by": "human:test",
                },
            },
            "tickets": [{
                "id": "10", "type": "task", "title": "导入票", "body": "",
                "state": "open", "labels": [], "parent": "1", "blocked_by": [],
                "split_reason": "", "derived_from": ["D-1-ROOT"],
                "derived_from_inferred": ["D-1-ROOT"], "covers": [],
                "created_at": now, "updated_at": now, "closed_at": None,
                "created_by": "human:test",
            }],
            "comments": [], "decisions": [], "premises": [], "coverage": [],
        }
        self.append(self.board.import_event("agent:test", payload, "test:1"))
        self.assertEqual(self.store.state["issues"]["10"]["derived_from_inferred"],
                         ["D-1-ROOT"])

    def test_empty_map(self):
        map_id, root = self.make_map("只有一句。", ["只有一句。"])
        view = board_view(self.store, map_id)
        self.assertEqual(len(view["groups"]), 1)
        self.assertEqual(view["groups"][0]["root"], True)
        self.assertEqual(view["tickets"], [])
        self.assertEqual(view["coverage"][0]["status"], "缺口")

    def test_default_map_and_missing(self):
        map_id, root = self.make_map()
        view = board_view(self.store, None)
        self.assertEqual(view["map"]["id"], map_id)
        with self.assertRaises(DtError):
            board_view(self.store, "9999")

    def test_impact_case_view(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root["id"], "产决定的票")
        d1 = self.board.decision_create("agent:test", "会被推翻的决定", source_ticket=t1)
        self.append(d1)
        event = self.board.decision_overturn("agent:test", d1["target"], "新决定", source_ticket=t1)
        self.append(event)
        view = board_view(self.store, map_id)
        cases = view["impact_cases"]
        self.assertEqual(len(cases), 1)
        self.assertEqual(cases[0]["status"], "open")
        self.assertTrue(cases[0]["items"])
        self.assertEqual(cases[0]["trigger_decision_issue"]["id"], d1["target"])
        self.assertTrue(any(item["object"] for item in cases[0]["items"]))

    def test_static_files(self):
        body, content_type = static_file("index.html")
        self.assertIn(b"<title>", body)
        self.assertIn("text/html", content_type)
        JS, js_type = static_file("app.js")
        self.assertIn(b"go", JS)  # 文件读到了
        self.assertIn("javascript", js_type)
        with self.assertRaises(DtError):
            static_file("../README.md")


class TestGraphLayout(unittest.TestCase):
    @unittest.skipUnless(shutil.which("node"), "没有 node，跳过图布局测试")
    def test_five_layer_tree(self):
        script = os.path.join(HERE, "test_graph_layout.js")
        result = subprocess.run(
            ["node", script], capture_output=True, text=True, cwd=os.path.dirname(HERE))
        self.assertEqual(result.returncode, 0,
                         (result.stdout + result.stderr).strip() or "node 测试失败")


if __name__ == "__main__":
    unittest.main()
