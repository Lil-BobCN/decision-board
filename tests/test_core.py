"""内核单元测试：不联网，不碰真实数据目录。"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from dtlib.commands import Board, impact_range
from dtlib.fold import coverage_rows, current_root, decision_red, state_hash
from dtlib.schema import validate_event
from dtlib.store import EventStore
from dtlib.util import DtError
from dtlib.workstate import WorkStatePoller


class Base(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="dt-test-")
        self.store = EventStore(home=self.home, repo="Example/repo")
        self.store.ensure_dirs()
        self.store.load()
        self.board = Board(self.store)

    def append(self, event):
        self.store.append_event(event)
        return event

    def make_map(self, statement="地图终点。", fragments=None):
        event = self.board.issue_create(
            "agent:test", "map", title="测试地图",
            destination={"statement": statement, "fragments": fragments or ["地图终点。"]},
        )
        self.append(event)
        return event["target"], self.store.state["decisions"][f"D-{event['target']}-ROOT"]

    def make_ticket(self, parent, root_id, title="测试票", derived_from=None, covers=None):
        event = self.board.issue_create(
            "agent:test", "ticket", title=title, parent=parent, type="task",
            split_reason="测试用", derived_from=derived_from or [root_id],
            covers=covers or [],
        )
        self.append(event)
        return event["target"]


class TestFold(Base):
    def test_map_and_ticket(self):
        map_id, root = self.make_map("第一句。第二句。", ["第一句。", "第二句。"])
        self.assertEqual(map_id, "I-0001")
        self.assertEqual(root["id"], "D-I-0001-ROOT")
        ticket = self.make_ticket(map_id, root["id"], covers=[root["fragments"][0]["id"]])
        self.assertEqual(ticket, "I-0002")
        rows = coverage_rows(self.store.state, map_id)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["status"], "进行中")
        self.assertEqual(rows[1]["status"], "缺口")
        self.store.append_event(self.board.issue_state("agent:test", ticket, "closed"))
        rows = coverage_rows(self.store.state, map_id)
        self.assertEqual(rows[0]["status"], "已落")

    def test_comment_edit_delete(self):
        map_id, _ = self.make_map()
        event = self.board.comment_add("agent:test", map_id, "第一版")
        self.append(event)
        cid = event["target"]
        self.assertEqual(self.store.state["comments"][cid]["body"], "第一版")
        self.append(self.board.comment_edit("agent:test", cid, "第二版"))
        self.assertEqual(self.store.state["comments"][cid]["body"], "第二版")
        self.append(self.board.comment_delete("agent:test", cid))
        self.assertTrue(self.store.state["comments"][cid]["deleted"])
        self.assertEqual(self.store.state["comments"][cid]["body"], "")
        with self.assertRaises(DtError):
            self.store.append_event(self.board.comment_edit("agent:test", cid, "第三版"))

    def test_block_cycle(self):
        map_id, root = self.make_map()
        a = self.make_ticket(map_id, root["id"], "A")
        b = self.make_ticket(map_id, root["id"], "B")
        self.append(self.board.issue_block("agent:test", a, [b], []))
        with self.assertRaises(DtError):
            self.store.append_event(self.board.issue_block("agent:test", b, [a], []))
        with self.assertRaises(DtError):
            self.store.append_event(self.board.issue_block("agent:test", b, [], []))

    def test_hash_stable(self):
        map_id, root = self.make_map("一句。")
        self.make_ticket(map_id, root["id"], covers=[root["fragments"][0]["id"]])
        first = state_hash(self.store.state)
        self.store.rebuild()
        self.assertEqual(first, state_hash(self.store.state))
        os.unlink(self.store.db_path)
        self.store.rebuild()
        self.assertEqual(first, state_hash(self.store.state))


class TestDecisionsAndImpact(Base):
    def _setup_chain(self):
        map_id, root = self.make_map("根句。")
        t1 = self.make_ticket(map_id, root["id"], "产决定的票")
        d1 = self.board.decision_create(
            "agent:test", "第一条决定", source_ticket=t1, output_files=["a.md"])
        self.append(d1)
        d1_id = d1["target"]
        t2 = self.make_ticket(map_id, d1_id, "从决定拆出的票", derived_from=[d1_id])
        d2 = self.board.decision_create(
            "agent:test", "第二条决定", source_ticket=t2, output_files=["b.md"])
        self.append(d2)
        return map_id, root, t1, d1_id, t2, d2["target"]

    def test_decisions_created(self):
        _, root, t1, d1, t2, d2 = self._setup_chain()
        self.assertEqual(d1, "D-0001")
        self.assertEqual(d2, "D-0002")
        self.assertEqual(self.store.state["decisions"][d1]["source_ticket"], t1)
        self.assertEqual(self.store.state["issues"][t2]["derived_from"], [d1])

    def test_overturn_range(self):
        _, root, t1, d1, t2, d2 = self._setup_chain()
        event = self.board.decision_overturn(
            "agent:test", d1, "新的第一条决定", source_ticket=t1)
        items = event["payload"]["impact_items"]
        refs = {(i["kind"], i["ref"]) for i in items}
        self.assertIn(("ticket", t2), refs)
        self.assertIn(("decision", d2), refs)
        self.assertIn(("ticket", t1), refs)
        self.assertNotIn(("decision", d1), refs)
        self.assertNotIn(("decision", event["payload"]["new_decision"]["id"]), refs)
        self.append(event)
        self.assertEqual(self.store.state["decisions"][d1]["status"], "superseded")
        case = self.store.state["impact_cases"][event["payload"]["impact_case"]]
        self.assertEqual(case["trigger"], "overturn")
        self.assertEqual(len(case["items"]), len(items))

    def test_premise_broken_and_actions(self):
        map_id, root = self.make_map("根句。")
        t1 = self.make_ticket(map_id, root["id"], "产决定的票")
        event = self.board.decision_create(
            "agent:test", "会被推翻的决定", source_ticket=t1, output_files=[])
        self.append(event)
        d1 = event["target"]
        p = self.board.premise_add("agent:test", d1, "这句话成立", ["#142"])
        self.append(p)
        pid = p["target"]
        self.assertEqual(self.store.state["premises"][pid]["state"], "未验")
        judge = self.board.premise_judge("agent:test", pid, "已破", ["新证据"], "证据变了")
        self.append(judge)
        self.assertTrue(decision_red(self.store.state, self.store.state["decisions"][d1]))
        case_id = judge["payload"]["impact_case"]
        case = self.store.state["impact_cases"][case_id]
        refs = {(i["kind"], i["ref"]) for i in case["items"]}
        self.assertIn(("decision", d1), refs)
        self.assertIn(("ticket", t1), refs)
        self.append(self.board.impact_act("agent:test", case_id, "decision", d1, "仍成立", "仍然成立"))
        self.assertFalse(decision_red(self.store.state, self.store.state["decisions"][d1]))
        self.append(self.board.impact_act("agent:test", case_id, "ticket", t1, "保留", "留着"))
        self.append(self.board.impact_close("agent:test", case_id, "处理完了"))
        self.assertEqual(self.store.state["impact_cases"][case_id]["status"], "closed")

    def test_premise_edit_locked_after_judge(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root["id"])
        d = self.board.decision_create("agent:test", "决定", source_ticket=t1)
        self.append(d)
        p = self.board.premise_add("agent:test", d["target"], "陈述", [])
        self.append(p)
        self.append(self.board.premise_edit("agent:test", p["target"], statement="改过的陈述"))
        self.assertEqual(self.store.state["premises"][p["target"]]["statement"], "改过的陈述")
        self.append(self.board.premise_judge("agent:test", p["target"], "成立", [], "证据"))
        with self.assertRaises(DtError):
            self.store.append_event(self.board.premise_edit("agent:test", p["target"], statement="再改"))

    def test_direct_issue_create_requires_derived_from(self):
        map_id, root = self.make_map()
        with self.assertRaises(DtError):
            self.board.issue_create(
                "agent:test", "ticket", title="缺派生", parent=map_id, type="task",
                split_reason="测试", derived_from=[])


class TestStore(Base):
    def test_torn_tail(self):
        map_id, root = self.make_map()
        with open(self.store.events_path, "ab") as f:
            f.write(b'{"v":2,"seq":2,"ts":')
        store = EventStore(home=self.home, repo="Example/repo")
        store.ensure_dirs()
        store.load()
        self.assertEqual(store.last_seq, 1)
        torn = [p for p in os.listdir(self.home) if ".torn-" in p]
        self.assertEqual(len(torn), 1)

    def test_seq_gap_refused(self):
        map_id, root = self.make_map()
        event = self.board.issue_create(
            "agent:test", "ticket", title="下一张", parent=map_id, type="task",
            split_reason="测试", derived_from=[root["id"]])
        event["seq"] = 3
        with self.assertRaises(DtError):
            self.store.append_event(event)

    def test_unknown_op_refused(self):
        with self.assertRaises(DtError):
            validate_event({
                "v": 2, "seq": 1, "ts": "2026-01-01T00:00:00Z", "actor": "agent:x",
                "op": "nope", "target": "x", "payload": {}, "reason": None,
            })


class TestWorkState(unittest.TestCase):
    def setUp(self):
        class FakeStore:
            state = {
                "issues": {
                    "1": {"id": "1", "kind": "map", "state": "open", "blocked_by": []},
                    "2": {"id": "2", "kind": "ticket", "state": "open", "blocked_by": [],
                          "parent": "1"},
                    "3": {"id": "3", "kind": "ticket", "state": "open", "blocked_by": ["99"],
                          "parent": "1"},
                },
                "premises": {}, "decisions": {},
            }
            def read_workstate(self):
                return {"tickets": {}}
            def write_workstate(self, data):
                self.written = data
            def _log(self, message):
                pass
        self.store = FakeStore()
        self.poller = WorkStatePoller(self.store, "Example/repo", orca_bin="false")
        self.poller._repo_keys = {"r1": "github.com/example/repo"}

    def test_ticket_of(self):
        self.assertEqual(self.poller._ticket_of({"linkedIssue": 2}), "2")
        self.assertEqual(self.poller._ticket_of({"branch": "Lil-BobCN/issue-2"}), "2")
        self.assertIsNone(self.poller._ticket_of({"branch": "main"}))

    def test_merge_status(self):
        self.assertEqual(self.poller._merge_status([])[0], "未领取")
        self.assertEqual(self.poller._merge_status([{"status": "working"}])[0], "进行中")
        self.assertEqual(self.poller._merge_status([{"status": "permission"}])[0], "等待人")
        self.assertEqual(self.poller._merge_status([{"status": "done"}])[0], "等待人")
        self.assertEqual(
            self.poller._merge_status([{"status": "active", "agents": [{"state": "working"}]}])[0],
            "进行中")
        self.assertEqual(
            self.poller._merge_status([{"status": "active", "agents": [{"state": "done"}]}])[0],
            "等待人")

    def test_blocked_wins(self):
        tickets = self.poller.compute_tickets([
            {"repoId": "r1", "linkedIssue": 2, "status": "working"},
            {"repoId": "r1", "linkedIssue": 3, "status": "working"},
        ])
        self.assertEqual(tickets["2"]["state"], "进行中")
        self.assertEqual(tickets["3"]["state"], "被挡")


class TestAdrExample(Base):
    """ADR 0006 的例子：D-0012 取代 D-0011e。"""

    def test_full_example(self):
        now = "2026-01-01T00:00:00Z"
        payload = {
            "map": {
                "id": "139", "kind": "map", "title": "例子地图", "body": "",
                "state": "open", "labels": [],
                "created_at": now, "updated_at": now, "closed_at": None,
                "created_by": "human:test",
                "root": {
                    "id": "D-139-ROOT", "statement": "根句。",
                    "fragments": [{"index": 1, "text": "根句。"}],
                    "output_files": [], "created_at": now, "created_by": "human:test",
                },
            },
            "tickets": [
                {"id": "141", "type": "grilling", "title": "事件模型", "body": "",
                 "state": "closed", "labels": [], "parent": "139", "blocked_by": [],
                 "split_reason": "", "derived_from": ["D-139-ROOT"], "covers": [],
                 "created_at": now, "updated_at": now, "closed_at": now,
                 "created_by": "human:test"},
                {"id": "149", "type": "grilling", "title": "图票模型", "body": "",
                 "state": "open", "labels": [], "parent": "139", "blocked_by": [],
                 "split_reason": "", "derived_from": ["D-0011e"], "covers": [],
                 "created_at": now, "updated_at": now, "closed_at": None,
                 "created_by": "human:test"},
                {"id": "145", "type": "task", "title": "实现内核", "body": "",
                 "state": "open", "labels": [], "parent": "139", "blocked_by": [],
                 "split_reason": "", "derived_from": ["D-0011e"], "covers": [],
                 "created_at": now, "updated_at": now, "closed_at": None,
                 "created_by": "human:test"},
                {"id": "147", "type": "task", "title": "验收", "body": "",
                 "state": "open", "labels": [], "parent": "139", "blocked_by": [],
                 "split_reason": "", "derived_from": ["D-0011e"], "covers": [],
                 "created_at": now, "updated_at": now, "closed_at": None,
                 "created_by": "human:test"},
            ],
            "comments": [], "premises": [], "coverage": [],
            "decisions": [
                {"id": "D-0011e", "statement": "v1 的 op 清单 14 个",
                 "source_ticket": "141", "output_files": [], "created_at": now,
                 "created_by": "human:test"},
                {"id": "D-0012h", "statement": "新增 decision.void",
                 "source_ticket": "149", "output_files": [], "created_at": now,
                 "created_by": "human:test"},
            ],
            "github": {"issues": {"139": 139}, "comments": {}},
        }
        self.store.append_event(self.board.import_event("agent:test", payload, "github:139"))
        items = impact_range(self.store.state, "D-0011e", "overturn")
        refs = {(i["kind"], i["ref"]) for i in items}
        self.assertEqual(refs, {
            ("decision", "D-0012h"),
            ("ticket", "141"), ("ticket", "149"),
            ("ticket", "145"), ("ticket", "147"),
        })
        event = {
            "v": 2, "seq": self.store.last_seq + 1, "ts": now,
            "actor": "agent:test", "op": "decision.overturn", "target": "D-0011e",
            "payload": {
                "new_decision": {
                    "id": "D-0012", "statement": "地图是带 kind: map 的 issue",
                    "source_ticket": "149", "output_files": [],
                },
                "impact_case": "IC-0001", "impact_items": items,
            },
            "reason": "ADR 0006 的例子",
        }
        self.store.append_event(event)
        self.assertEqual(self.store.state["decisions"]["D-0011e"]["superseded_by"], "D-0012")
        case = self.store.state["impact_cases"]["IC-0001"]
        self.assertEqual(case["trigger"], "overturn")
        self.assertEqual(len(case["items"]), 5)
        # 逐项处理
        self.store.append_event(self.board.impact_act("agent:test", "IC-0001", "ticket", "141", "保留", "已完成"))
        self.store.append_event(self.board.impact_act("agent:test", "IC-0001", "decision", "D-0012h", "仍成立", "v2 仍要"))
        self.store.append_event(self.board.impact_act("agent:test", "IC-0001", "ticket", "149", "保留", "推翻来源"))
        self.store.append_event(self.board.impact_act("agent:test", "IC-0001", "ticket", "145", "改范围", "按 v2 实现", body="新正文"))
        self.store.append_event(self.board.impact_act("agent:test", "IC-0001", "ticket", "147", "改范围", "按 v2 核对", body="新正文"))
        self.store.append_event(self.board.impact_close("agent:test", "IC-0001", "处理完"))
        self.assertEqual(self.store.state["impact_cases"]["IC-0001"]["status"], "closed")
        self.assertEqual(self.store.state["issues"]["145"]["body"], "新正文")


class TestV1(Base):
    def test_v1_events_fold(self):
        now = "2026-01-01T00:00:00Z"
        self.store.append_event({
            "v": 1, "seq": 1, "ts": now, "actor": "human:test", "op": "import",
            "target": "github:1", "reason": None,
            "payload": {
                "map": {"id": "1", "title": "旧图", "body": "", "state": "open",
                        "labels": [], "created_at": now},
                "tickets": [{"id": "2", "title": "旧票", "body": "", "state": "open",
                             "labels": [], "parent": "1", "created_at": now}],
                "decisions": [{"id": "D-0001", "statement": "旧决定", "group": "g",
                               "source_ticket": "2", "output_files": [],
                               "created_at": now}],
                "premises": [], "coverage": [],
            },
        })
        self.assertEqual(self.store.state["issues"]["1"]["kind"], "map")
        self.assertEqual(self.store.state["issues"]["2"]["type"], "task")
        self.store.append_event({
            "v": 1, "seq": 2, "ts": now, "actor": "human:test", "op": "issue.create",
            "target": "I-0001", "reason": None,
            "payload": {"title": "v1 票", "body": "", "labels": [], "parent": "1",
                        "state": "open"},
        })
        self.assertEqual(self.store.state["issues"]["I-0001"]["kind"], "ticket")
        self.store.append_event({
            "v": 1, "seq": 3, "ts": now, "actor": "human:test", "op": "decision.overturn",
            "target": "D-0001", "reason": "v1 测试",
            "payload": {"new_decision": {"statement": "新决定", "group": "g",
                                         "source_ticket": "2", "output_files": []}},
        })
        self.assertEqual(self.store.state["decisions"]["D-0001"]["status"], "superseded")
        self.assertEqual(self.store.state["decisions"]["D-0001"]["superseded_by"], "D-0002")
        self.assertEqual(self.store.state["decisions"]["D-0002"]["statement"], "新决定")


if __name__ == "__main__":
    unittest.main()
