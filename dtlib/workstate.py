"""工作状态：每 2 秒问一次 orca，写 workstate.json。"""
from __future__ import annotations

import json
import re
import subprocess
import threading
import time

from .fold import open_blockers
from .util import now_ts

STATUS_ORDER = {"permission": 0, "working": 1, "done": 2, "active": 3, "inactive": 4}


class WorkStatePoller:
    def __init__(self, store, repo, interval=2.0, orca_bin="orca"):
        self.store = store
        self.repo = repo
        self.interval = interval
        self.orca_bin = orca_bin
        self._stop = threading.Event()
        self._thread = None
        self._failures = 0
        self._repo_keys = None
        self._last = None

    def start(self):
        self._thread = threading.Thread(target=self._loop, name="workstate", daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=3)

    def _loop(self):
        while not self._stop.wait(self.interval):
            try:
                self.poll_once()
            except Exception as exc:
                self.store._log(f"工作状态轮询失败：{exc}")

    def _run(self, args, timeout):
        try:
            result = subprocess.run(
                [self.orca_bin] + args, capture_output=True, text=True, timeout=timeout)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return None
        if result.returncode != 0:
            return None
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return None

    def repo_keys(self):
        if self._repo_keys:
            return self._repo_keys
        data = self._run(["repo", "list", "--json"], timeout=3.0)
        keys = {}
        if data and data.get("ok"):
            for repo in (data.get("result") or {}).get("repos", []):
                identity = repo.get("gitRemoteIdentity") or {}
                key = identity.get("canonicalKey")
                if key:
                    keys[repo["id"]] = key.lower()
        self._repo_keys = keys
        return keys

    def poll_once(self, force=False):
        data = self._run(["worktree", "ps", "--json", "--limit", "1000"], timeout=1.5)
        if data is None or not data.get("ok"):
            self._failures += 1
            if self._failures >= 2 or force:
                self._write(offline=True, tickets=self._last_tickets() or {})
            return self.store.read_workstate()
        self._failures = 0
        result = data.get("result") or {}
        worktrees = result.get("worktrees") or []
        if result.get("truncated"):
            bigger = self._run(["worktree", "ps", "--json", "--limit", "5000"], timeout=2.5)
            if bigger and bigger.get("ok"):
                worktrees = (bigger.get("result") or {}).get("worktrees") or worktrees
        tickets = self.compute_tickets(worktrees)
        self._last = tickets
        self._write(offline=False, tickets=tickets)
        return self.store.read_workstate()

    def _last_tickets(self):
        if self._last is not None:
            return self._last
        old = self.store.read_workstate()
        return old.get("tickets") or {}

    def _write(self, offline, tickets):
        old = self.store.read_workstate()
        old_tickets = old.get("tickets") or {}
        merged = {}
        stamp = now_ts()
        for tid, entry in tickets.items():
            previous = old_tickets.get(tid) or {}
            started = previous.get("state_started_at") if previous.get("state") == entry["state"] else stamp
            merged[tid] = {
                "state": entry["state"],
                "state_started_at": started or stamp,
                "last_synced_at": stamp,
                "last_activity_at": entry.get("last_activity_at"),
                "note": entry.get("note"),
            }
        self.store.write_workstate({
            "updated_at": stamp,
            "offline": offline,
            "repo": self.repo,
            "tickets": merged,
        })

    def compute_tickets(self, worktrees):
        state = self.store.state
        keys = self.repo_keys()
        wanted = f"github.com/{self.repo}".lower()
        repo_ids = {rid for rid, key in keys.items() if key == wanted}
        by_ticket = {}
        for wt in worktrees:
            if wt.get("isArchived"):
                continue
            if wt.get("repoId") not in repo_ids:
                continue
            tid = self._local_ticket_id(self._ticket_of(wt))
            if not tid:
                continue
            ticket = state["issues"].get(tid)
            if not ticket or ticket["kind"] != "ticket":
                continue
            by_ticket.setdefault(tid, []).append(wt)

        result = {}
        for ticket in state["issues"].values():
            if ticket["kind"] != "ticket" or ticket["state"] != "open":
                continue
            tids = [ticket["id"]]
            wts = []
            for tid in tids:
                wts.extend(by_ticket.get(tid, []))
            blocked = open_blockers(state, ticket["id"])
            status, note = self._merge_status(wts)
            if blocked:
                note = "有未关闭的阻塞项：" + "、".join(blocked)
                if wts:
                    note += "；该票有 worktree 在跑"
                status = "被挡"
            activity = max([w.get("lastActivityAt") or 0 for w in wts], default=None)
            result[ticket["id"]] = {
                "state": status,
                "last_activity_at": activity,
                "note": note or None,
            }
        return result

    def _local_ticket_id(self, tid):
        """GitHub 号换成中台本地票号；本地号能直接命中时原样返回。"""
        if not tid:
            return tid
        if tid in self.store.state["issues"]:
            return tid
        sync = getattr(self.store, "sync", None) or {}
        for local, number in (sync.get("issues") or {}).items():
            if str(number) == tid:
                return str(local)
        return tid

    def _ticket_of(self, wt):
        linked = wt.get("linkedIssue")
        if isinstance(linked, dict):
            linked = linked.get("number") or linked.get("id")
        if linked is not None:
            return str(linked)
        branch = wt.get("branch") or ""
        match = re.search(r"issue-(\d+)", branch)
        return match.group(1) if match else None

    def _merge_status(self, worktrees):
        if not worktrees:
            return "未领取", None
        statuses = [w.get("status") for w in worktrees]
        if "permission" in statuses:
            return "等待人", None
        if "working" in statuses:
            return "进行中", None
        # done / active / inactive 都归等待人；active 里有在跑的 agent 才算进行中
        for wt in worktrees:
            agents = wt.get("agents") or []
            states = [a.get("state") for a in agents]
            if wt.get("status") == "active" and any(s == "working" for s in states):
                return "进行中", None
        return "等待人", None
