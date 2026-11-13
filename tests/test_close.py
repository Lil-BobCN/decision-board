"""自动关票：待关票记录、合并触发、安全检查与屏幕信号。"""
from __future__ import annotations

import os
import sys
import tempfile
import threading
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from dtlib.close import CloseWatcher
from dtlib.commands import Board
from dtlib.fold import state_hash
from dtlib.schema import validate_event
from dtlib.store import EventStore
from dtlib.util import DtError
from dtlib.views import board_view, issue_view

SHA = "a" * 40
OTHER_SHA = "b" * 40


class Base(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="dt-close-")
        self.store = EventStore(home=self.home, repo="Example/repo")
        self.store.ensure_dirs()
        self.store.load()
        self.board = Board(self.store)
        self.lock = threading.RLock()

    def append(self, event):
        self.store.append_event(event)
        return event

    def make_map(self, statement="地图终点。"):
        event = self.board.issue_create(
            "agent:test", "map", title="测试地图",
            destination={"statement": statement, "fragments": [statement]},
        )
        self.append(event)
        return event["target"], f"D-{event['target']}-ROOT"

    def make_ticket(self, parent, root_id, title="测试票"):
        event = self.board.issue_create(
            "agent:test", "ticket", title=title, parent=parent, type="task",
            split_reason="测试用", derived_from=[root_id],
        )
        self.append(event)
        return event["target"]

    def prepare(self, ticket, pr=187, sha=SHA, decisions=None):
        event = self.board.close_prepare(
            "agent:test", ticket, pr, sha,
            [
                "四列表：| id | 决定 |\n| {{D1}} | 自动关票 |",
                "改动文件清单",
                "## 依据\n- 来源",
                "五类检查",
            ],
            decisions or [{
                "statement": "自动关票：PR 合并后服务展开待关票记录",
                "output_files": ["中台/dtlib/close.py"],
                "rationale": "合并即确认",
            }],
        )
        self.append(event)
        return event

    def watcher(self, pr_head):
        return CloseWatcher(self.store, "Example/repo", lock=self.lock, pr_head=pr_head,
                            retry_seconds=0, write_retry_seconds=0)

    def merged_tickets(self, ticket, pr=187):
        return {ticket: {"state": "进行中", "pr": {"number": pr, "state": "merged"}}}


class TestPrepareAndRevoke(Base):
    def test_prepare_creates_waiting_record(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        event = self.prepare(ticket)

        self.assertEqual(event["op"], "close.prepare")
        self.assertEqual(event["v"], 5)
        record = self.store.state["close_records"][event["payload"]["record"]]
        self.assertEqual(record["ticket"], ticket)
        self.assertEqual(record["status"], "等合并")
        self.assertEqual(record["pr"], 187)
        self.assertEqual(record["sha"], SHA)
        self.assertEqual(record["written_by"], "agent:test")
        self.assertIn("D-0001", record["comments"][0])
        self.assertEqual(record["decisions"][0]["id"], "D-0001")
        self.assertNotIn("D-0001", self.store.state["decisions"])
        self.assertEqual(self.store.state["counters"]["decision"], 2)

    def test_prepare_replaces_previous_active_record(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        first = self.prepare(ticket)
        second = self.prepare(ticket, pr=188, sha=OTHER_SHA)

        state = self.store.state
        self.assertEqual(state["close_records"][first["payload"]["record"]]["status"], "失效")
        self.assertEqual(state["close_records"][second["payload"]["record"]]["status"], "等合并")

    def test_revoke_invalidates_record(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        event = self.prepare(ticket)
        record_id = event["payload"]["record"]

        self.append(self.board.close_revoke("agent:test", ticket, "不做了"))
        self.assertEqual(self.store.state["close_records"][record_id]["status"], "失效")

        self.append(self.board.issue_state("agent:test", ticket, "closed"))
        self.assertEqual(self.store.state["issues"][ticket]["state"], "closed")

    def test_prepare_requires_four_comments_and_unused_ids(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        with self.assertRaises(DtError):
            self.board.close_prepare(
                "agent:test", ticket, 1, SHA, ["只有一条"], [])
        with self.assertRaises(DtError):
            self.board.close_prepare(
                "agent:test", ticket, 1, SHA,
                ["{{D2}}", "b", "c", "d"],
                [{"statement": "一", "output_files": [], "rationale": ""}])
        with self.assertRaises(DtError):
            self.board.close_prepare("agent:test", ticket, 1, "not-a-sha",
                                     ["a", "b", "c", "d"],
                                     [{"statement": "一", "output_files": [],
                                       "rationale": ""}])


class TestMergeTrigger(Base):
    def test_merged_closes_ticket_once(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]
        watcher = self.watcher(lambda pr: {"state": "MERGED", "headRefOid": SHA})

        watcher.check(self.merged_tickets(ticket))

        state = self.store.state
        self.assertEqual(state["issues"][ticket]["state"], "closed")
        self.assertEqual(state["close_records"][record_id]["status"], "已展开")
        comments = [c for c in state["comments"].values() if c["issue"] == ticket]
        self.assertEqual(len(comments), 4)
        produced = [d for d in state["decisions"].values()
                    if d["source_ticket"] == ticket]
        self.assertEqual(len(produced), 1)
        self.assertEqual(produced[0]["id"], "D-0001")
        self.assertEqual(produced[0]["statement"], "自动关票：PR 合并后服务展开待关票记录")
        self.assertEqual(produced[0]["rationale"], "合并即确认")

        view = issue_view(self.store, ticket)
        self.assertEqual(len(view["comments"]), 4)
        self.assertEqual(len(view["produced_decisions"]), 1)

        watcher.check(self.merged_tickets(ticket))
        comments_after = [c for c in self.store.state["comments"].values()
                          if c["issue"] == ticket]
        self.assertEqual(len(comments_after), 4)

    def test_sha_mismatch_expires_record(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]
        watcher = self.watcher(lambda pr: {"state": "MERGED", "headRefOid": OTHER_SHA})

        watcher.check(self.merged_tickets(ticket))

        record = self.store.state["close_records"][record_id]
        self.assertEqual(self.store.state["issues"][ticket]["state"], "open")
        self.assertEqual(record["status"], "过期")
        self.assertEqual(record["last_check"]["result"], "sha_mismatch")

    def test_closed_pr_expires_record_without_gh(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]
        called = []
        watcher = self.watcher(lambda pr: called.append(pr) or {"state": "MERGED",
                                                                "headRefOid": SHA})

        watcher.check({ticket: {"state": "等待人",
                                "pr": {"number": 187, "state": "closed"}}})

        self.assertEqual(called, [])
        record = self.store.state["close_records"][record_id]
        self.assertEqual(record["status"], "过期")
        self.assertEqual(record["last_check"]["result"], "closed_without_merge")

    def test_other_linked_pr_does_not_trigger(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]
        called = []
        watcher = self.watcher(lambda pr: called.append(pr) or {"state": "MERGED",
                                                                "headRefOid": SHA})

        watcher.check({ticket: {"state": "等待人",
                                "pr": {"number": 188, "state": "closed"}}})

        self.assertEqual(called, [])
        self.assertEqual(self.store.state["close_records"][record_id]["status"], "等合并")
        self.assertEqual(self.store.state["issues"][ticket]["state"], "open")

    def test_gh_failure_marks_unverified_then_recovers(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]
        attempts = {"n": 0}

        def flaky(pr):
            attempts["n"] += 1
            if attempts["n"] == 1:
                raise DtError("gh 调不到")
            return {"state": "MERGED", "headRefOid": SHA}

        watcher = self.watcher(flaky)
        watcher.check(self.merged_tickets(ticket))
        record = self.store.state["close_records"][record_id]
        self.assertEqual(self.store.state["issues"][ticket]["state"], "open")
        self.assertEqual(record["status"], "等合并")
        self.assertEqual(record["verify"], "无法核对")

        watcher.check(self.merged_tickets(ticket))
        self.assertEqual(self.store.state["issues"][ticket]["state"], "closed")
        self.assertEqual(self.store.state["close_records"][record_id]["status"], "已展开")

    def test_write_failure_keeps_record_and_retries(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]
        original = self.store.append_event
        failures = {"n": 0}

        def flaky(event):
            if event["op"] == "issue.close" and failures["n"] == 0:
                failures["n"] += 1
                raise DtError("磁盘满")
            return original(event)

        self.store.append_event = flaky
        watcher = self.watcher(lambda pr: {"state": "MERGED", "headRefOid": SHA})
        watcher.check(self.merged_tickets(ticket))

        self.assertEqual(self.store.state["issues"][ticket]["state"], "open")
        self.assertEqual(self.store.state["close_records"][record_id]["status"], "等合并")
        errors = self.store.read_workstate().get("close_errors") or {}
        self.assertIn(record_id, errors)

        self.store.append_event = original
        watcher.check(self.merged_tickets(ticket))
        self.assertEqual(self.store.state["issues"][ticket]["state"], "closed")
        self.assertEqual(self.store.state["close_records"][record_id]["status"], "已展开")
        errors = self.store.read_workstate().get("close_errors") or {}
        self.assertNotIn(record_id, errors)

    def test_missing_record_signal(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        self.store.write_workstate({
            "updated_at": "2026-01-01T00:00:00.000Z", "offline": False,
            "tickets": {ticket: {"state": "等待人",
                                 "pr": {"number": 187, "state": "merged"}}},
        })
        view = board_view(self.store, map_id)
        signal = [s for s in view["signals"] if s["key"] == "close-missing"][0]
        self.assertEqual(signal["count"], 1)
        self.assertIn("ticket:" + ticket, signal["targets"])


class TestIssueCloseGate(Base):
    def test_close_refused_until_force(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]

        with self.assertRaises(DtError):
            self.append(self.board.issue_state("agent:test", ticket, "closed"))
        with self.assertRaises(DtError):
            self.board.issue_state("agent:test", ticket, "closed", force=True)

        self.append(self.board.issue_state("human:ops", ticket, "closed", force=True))
        self.assertEqual(self.store.state["issues"][ticket]["state"], "closed")
        self.assertEqual(self.store.state["close_records"][record_id]["status"], "失效")


class TestSignalsAndHash(Base):
    def test_screen_work_label_and_signals(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        prep = self.prepare(ticket)
        record_id = prep["payload"]["record"]

        view = board_view(self.store, map_id)
        entry = [t for t in view["tickets"] if t["id"] == ticket][0]
        self.assertEqual(entry["work"], "等合并")
        self.assertEqual(entry["close_record"]["id"], record_id)

        self.append(self.board.close_mark(
            "agent:service", ticket, record_id, verify="无法核对",
            check="gh_unavailable", detail="gh 调不到"))
        view = board_view(self.store, map_id)
        signal = [s for s in view["signals"] if s["key"] == "close-unverified"][0]
        self.assertEqual(signal["count"], 1)

        self.store.write_workstate({
            "updated_at": "2026-01-01T00:00:00.000Z", "offline": False,
            "tickets": {},
            "close_errors": {record_id: {"message": "磁盘满",
                                         "at": "2026-01-01T00:00:00.000Z"}},
        })
        view = board_view(self.store, map_id)
        signal = [s for s in view["signals"] if s["key"] == "close-write-failed"][0]
        self.assertEqual(signal["count"], 1)

    def test_expired_and_sha_signals(self):
        map_id, root = self.make_map()
        t1 = self.make_ticket(map_id, root, "关闭的 PR")
        t2 = self.make_ticket(map_id, root, "SHA 不符的 PR")
        r1 = self.prepare(t1)["payload"]["record"]
        r2 = self.prepare(t2, pr=188, sha=OTHER_SHA)["payload"]["record"]
        self.append(self.board.close_mark(
            "agent:service", t1, r1, status="过期",
            check="closed_without_merge", detail="PR 关闭未合并"))
        self.append(self.board.close_mark(
            "agent:service", t2, r2, status="过期",
            check="sha_mismatch", detail="SHA 不符"))

        view = board_view(self.store, map_id)
        expired = [s for s in view["signals"] if s["key"] == "close-expired"][0]
        sha = [s for s in view["signals"] if s["key"] == "close-sha"][0]
        self.assertIn("ticket:" + t1, expired["targets"])
        self.assertNotIn("ticket:" + t2, expired["targets"])
        self.assertIn("ticket:" + t2, sha["targets"])

    def test_hash_stable_with_records(self):
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        self.prepare(ticket)
        first = state_hash(self.store.state)
        self.store.rebuild()
        self.assertEqual(first, state_hash(self.store.state))


class TestWorkStatePR(Base):
    def test_linked_pr_prefers_merged(self):
        from dtlib.workstate import WorkStatePoller
        map_id, root = self.make_map()
        ticket = self.make_ticket(map_id, root)
        poller = WorkStatePoller(self.store, "Example/repo", orca_bin="false")
        poller._repo_keys = {"r1": "github.com/example/repo"}

        tickets = poller.compute_tickets([
            {"repoId": "r1", "linkedIssue": ticket, "status": "working",
             "linkedPR": {"number": 187, "state": "open", "title": "旧", "url": "u"}},
            {"repoId": "r1", "linkedIssue": ticket, "status": "working",
             "linkedPR": {"number": 188, "state": "merged", "title": "新", "url": "v"}},
        ])
        self.assertEqual(tickets[ticket]["pr"]["number"], 188)
        self.assertEqual(tickets[ticket]["pr"]["state"], "merged")


class TestSchema(unittest.TestCase):
    def event(self, op, payload):
        return {
            "v": 5, "seq": 1, "ts": "2026-01-01T00:00:00Z",
            "actor": "agent:test", "op": op, "target": "I-0001",
            "payload": payload, "reason": None,
        }

    def test_prepare_payload_shape(self):
        validate_event(self.event("close.prepare", {
            "record": "CL-0001", "pr": 1, "sha": SHA,
            "comments": ["a", "b", "c", "d"],
            "decisions": [{"id": "D-0001", "statement": "决定",
                           "output_files": [], "rationale": ""}],
        }))
        with self.assertRaises(DtError):
            validate_event(self.event("close.prepare", {
                "record": "CL-0001", "pr": 1, "sha": SHA,
                "comments": ["a", "b", "c"], "decisions": [],
            }))

    def test_issue_close_payload_shape(self):
        validate_event(self.event("issue.close", {
            "record": "CL-0001", "pr": 1,
            "comments": [{"id": "C-0001", "body": "a"},
                         {"id": "C-0002", "body": "b"},
                         {"id": "C-0003", "body": "c"},
                         {"id": "C-0004", "body": "d"}],
            "decisions": [{"id": "D-0001", "statement": "决定",
                           "output_files": [], "rationale": ""}],
        }))


if __name__ == "__main__":
    unittest.main()
