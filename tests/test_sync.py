"""同步计划与执行的测试：用假的 gh 客户端，不联网。"""
from __future__ import annotations

import os
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from dtlib.commands import Board
from dtlib.store import EventStore
from dtlib.sync import compute_plan, execute_plan


class FakeGitHub:
    instances = []

    def __init__(self, repo, gh_bin="gh"):
        self.repo = repo
        self.issues = {}
        self.comments = {}
        self.subs = {}
        self.blocked = {}
        self.next_number = 200
        self.next_comment = 900
        FakeGitHub.instances.append(self)

    def add_issue(self, number, title, body="", state="open", labels=None):
        self.issues[number] = {
            "number": number, "id": number * 10, "title": title, "body": body,
            "state": state,
            "labels": [{"name": x} for x in (labels or [])],
        }

    def api(self, path, paginate=False, method=None, fields=None, input_json=None):
        prefix = f"repos/{self.repo}/"
        if not path.startswith(prefix):
            raise AssertionError(path)
        rest = path[len(prefix):]
        method = method or "GET"
        if rest.startswith("issues/comments/"):
            cid = int(rest.rsplit("/", 1)[1])
            for items in self.comments.values():
                for item in items:
                    if int(item["id"]) == cid:
                        if method == "DELETE":
                            items.remove(item)
                            return {}
                        if method == "PATCH":
                            item["body"] = input_json["body"]
                            return item
            raise AssertionError(f"comment {cid} not found")
        parts = rest.split("/")
        if parts[0] != "issues":
            raise AssertionError(path)
        if len(parts) == 1 and method == "POST":
            number = self.next_number
            self.next_number += 1
            self.add_issue(number, input_json["title"], input_json.get("body", ""),
                           labels=input_json.get("labels") or [])
            return self.issues[number]
        number = int(parts[1])
        if len(parts) == 2 and method == "GET":
            return self.issues[number]
        if len(parts) == 2 and method == "PATCH":
            issue = self.issues[number]
            for key in ("title", "body", "state"):
                if key in input_json:
                    issue[key] = input_json[key]
            return issue
        if len(parts) == 3 and parts[2] == "sub_issues" and method == "GET":
            return [self.issues[n] for n in self.subs.get(number, [])]
        if len(parts) == 3 and parts[2] == "sub_issues":
            raise AssertionError("sub_issues write goes through gh issue edit")
        if len(parts) == 3 and parts[2] == "comments":
            if method == "GET":
                return self.comments.get(number, [])
            if method == "POST":
                cid = self.next_comment
                self.next_comment += 1
                item = {"id": cid, "body": input_json["body"]}
                self.comments.setdefault(number, []).append(item)
                return item
        if len(parts) == 4 and parts[2] == "dependencies" and parts[3] == "blocked_by":
            return [self.issues[n] for n in self.blocked.get(number, [])]
        if len(parts) == 3 and parts[2] == "labels" and method == "PUT":
            self.issues[number]["labels"] = [{"name": x} for x in input_json["labels"]]
            return [{"name": x} for x in input_json["labels"]]
        raise AssertionError(f"{method} {path}")


class TestSync(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="dt-sync-")
        self.store = EventStore(home=self.home, repo="Example/repo")
        self.store.ensure_dirs()
        self.store.load()
        self.board = Board(self.store)
        self.map_id = self._make_map()
        FakeGitHub.instances = []

    def _make_map(self):
        now = "2026-01-01T00:00:00Z"
        payload = {
            "map": {
                "id": "139", "kind": "map", "title": "本机地图", "body": "",
                "state": "open", "labels": [],
                "created_at": now, "updated_at": now, "closed_at": None,
                "created_by": "agent:test",
                "root": {
                    "id": "D-139-ROOT",
                    "statement": "第一句。第二句。",
                    "fragments": [{"index": 1, "text": "第一句。"},
                                  {"index": 2, "text": "第二句。"}],
                    "output_files": [], "created_at": now, "created_by": "agent:test",
                },
            },
            "tickets": [], "comments": [], "decisions": [], "premises": [],
            "coverage": [], "github": {"issues": {"139": 139}, "comments": {}},
        }
        event = self.board.import_event("agent:test", payload, "github:139")
        self.store.append_event(event)
        return "139"

    def _ticket(self):
        event = self.board.issue_create(
            "agent:test", "ticket", title="新票", body="票正文", parent=self.map_id,
            type="task", split_reason="测试拆出", derived_from=[f"D-{self.map_id}-ROOT"],
        )
        self.store.append_event(event)
        return event["target"]

    def _fake(self, map_number=139, selected=False):
        fake = FakeGitHub("Example/repo")
        fake.add_issue(map_number, "本机地图", "")
        if selected:
            fake.issues[map_number]["labels"] = [{"name": "wayfinder:map"}]
        return fake

    def test_create_and_sync_roundtrip(self):
        ticket = self._ticket()
        comment = self.board.comment_add("agent:test", ticket, "新评论")
        self.store.append_event(comment)
        fake = self._fake(selected=True)
        with patch("dtlib.sync.GitHub", return_value=fake):
            plan = compute_plan(self.store, "Example/repo", self.map_id)
        kinds = [a["kind"] for a in plan["actions"]]
        self.assertIn("issue.create", kinds)
        self.assertIn("parent.add", kinds)
        self.assertIn("comment.create", kinds)
        self.assertIn("map.body", kinds)

        edits = []

        def fake_edit(repo, number, *flags, gh_bin="gh"):
            edits.append((number, flags))
            if "--add-sub-issue" in flags:
                child = int(flags[flags.index("--add-sub-issue") + 1])
                fake.subs.setdefault(int(number), []).append(child)
            if "--add-blocked-by" in flags:
                blocker = int(flags[flags.index("--add-blocked-by") + 1])
                fake.blocked.setdefault(int(number), []).append(blocker)

        with patch("dtlib.sync.GitHub", return_value=fake), \
                patch("dtlib.sync._gh_edit", side_effect=fake_edit):
            result = execute_plan(self.store, "Example/repo", self.map_id, plan)
        self.assertTrue(result["ok"])
        self.assertEqual(self.store.sync["issues"][ticket], 200)
        with patch("dtlib.sync.GitHub", return_value=fake):
            plan2 = compute_plan(self.store, "Example/repo", self.map_id)
        self.assertEqual(plan2["actions"], [], plan2)

    def test_comment_map_uses_remote_id(self):
        ticket = self._ticket()
        comment = self.board.comment_add("agent:test", ticket, "同正文评论")
        self.store.append_event(comment)
        fake = self._fake(selected=True)
        fake.add_issue(200, "新票", "票正文", labels=["wayfinder:task"])
        fake.subs[139] = [200]
        self.store.sync_record({"type": "mapping", "kind": "issue",
                                "local": ticket, "github": 200})
        fake.comments[200] = [{"id": 901, "body": "同正文评论"}]

        with patch("dtlib.sync.GitHub", return_value=fake):
            plan = compute_plan(self.store, "Example/repo", self.map_id)
        maps = [a for a in plan["actions"] if a["kind"] == "comment.map"]
        self.assertEqual(len(maps), 1, plan["actions"])

        with patch("dtlib.sync.GitHub", return_value=fake):
            result = execute_plan(self.store, "Example/repo", self.map_id, plan)
        self.assertTrue(result["ok"], result)
        self.assertEqual(self.store.sync["comments"][comment["target"]], 901)

    def test_state_and_comment_edit_delete(self):
        ticket = self._ticket()
        fake = self._fake(selected=True)
        fake.add_issue(200, "新票", "票正文", labels=["wayfinder:task"])
        fake.subs[139] = [200]
        self.store.sync_record({"type": "mapping", "kind": "issue", "local": ticket,
                                "github": 200})
        fake.issues[139]["state"] = "open"
        self.store.append_event(self.board.issue_state("agent:test", ticket, "closed"))
        comment = self.board.comment_add("agent:test", ticket, "旧评论")
        self.store.append_event(comment)
        fake.comments[200] = [{"id": 901, "body": "旧评论"}]
        self.store.sync_record({"type": "mapping", "kind": "comment",
                                "local": comment["target"], "github": 901})
        with patch("dtlib.sync.GitHub", return_value=fake):
            plan = compute_plan(self.store, "Example/repo", self.map_id)
        kinds = [a["kind"] for a in plan["actions"]]
        self.assertIn("issue.state", kinds)
        # 改评论
        self.store.append_event(self.board.comment_edit("agent:test", comment["target"], "新评论"))
        with patch("dtlib.sync.GitHub", return_value=fake):
            plan = compute_plan(self.store, "Example/repo", self.map_id)
        self.assertIn("comment.edit", [a["kind"] for a in plan["actions"]])
        # 删评论
        self.store.append_event(self.board.comment_delete("agent:test", comment["target"]))
        with patch("dtlib.sync.GitHub", return_value=fake):
            plan = compute_plan(self.store, "Example/repo", self.map_id)
        self.assertIn("comment.delete", [a["kind"] for a in plan["actions"]])

    def test_mirror_off_refuses(self):
        self.store.sync_record({"type": "mirror", "map": self.map_id, "on": False})
        fake = self._fake()
        with patch("dtlib.sync.GitHub", return_value=fake):
            with self.assertRaises(Exception):
                execute_plan(self.store, "Example/repo", self.map_id,
                             compute_plan(self.store, "Example/repo", self.map_id))


if __name__ == "__main__":
    unittest.main()
