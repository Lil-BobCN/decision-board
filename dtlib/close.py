"""自动关票：看工作状态里的 PR，核对 SHA，展开待关票记录。"""
from __future__ import annotations

import json
import subprocess
import time

from .commands import Board
from .util import DtError, UNSET, now_ts


class CloseWatcher:
    def __init__(self, store, repo, lock=None, pr_head=None, gh_bin="gh",
                 timeout=10, retry_seconds=30, write_retry_seconds=2):
        self.store = store
        self.repo = repo
        self.lock = lock
        self.pr_head = pr_head or self._gh_pr_head
        self.gh_bin = gh_bin
        self.timeout = timeout
        self.retry_seconds = retry_seconds
        self.write_retry_seconds = write_retry_seconds
        self._retry_at = {}

    def check(self, tickets):
        """tickets 来自 WorkStatePoller：{票号: {"pr": {...}}}。"""
        if self.lock is not None:
            with self.lock:
                self._check(tickets or {})
        else:
            self._check(tickets or {})

    def _check(self, tickets):
        state = self.store.state
        for record_id in list(state["close_records"]):
            record = self.store.state["close_records"].get(record_id)
            if not record:
                continue
            if record["status"] != "等合并":
                self._clear_error(record_id)
                continue
            ticket = self.store.state["issues"].get(record["ticket"])
            if not ticket or ticket["state"] != "open":
                continue
            pr = (tickets.get(record["ticket"]) or {}).get("pr")
            if not pr:
                continue
            pr_state = str(pr.get("state") or "").lower()
            if pr_state == "closed":
                self._mark(record, status="过期", check="closed_without_merge",
                           detail=f"PR #{record['pr']} 已关闭但没有合并")
                continue
            if pr_state != "merged":
                continue
            now = time.time()
            if self._retry_at.get(record["id"], 0) > now:
                continue
            try:
                data = self.pr_head(record["pr"])
            except Exception as exc:
                self._retry_at[record["id"]] = now + self.retry_seconds
                self.store._log(
                    f"待关票记录 {record['id']} 核对 PR #{record['pr']} 失败：{exc}")
                if record.get("verify") != "无法核对":
                    self._mark(record, verify="无法核对", check="gh_unavailable",
                               detail=str(exc))
                continue
            gh_state = str(data.get("state") or "").upper()
            if gh_state == "CLOSED":
                self._mark(record, status="过期", check="closed_without_merge",
                           detail=f"PR #{record['pr']} 在 GitHub 上是关闭未合并")
                continue
            if gh_state != "MERGED":
                if record.get("verify") == "无法核对":
                    self._mark(record, verify=None, check="waiting_merge",
                               detail=f"PR #{record['pr']} 还没合并")
                continue
            head = data.get("headRefOid") or ""
            if head != record["sha"]:
                self._mark(
                    record, status="过期", check="sha_mismatch",
                    detail=(f"PR head {head[:7] or '空'} 与记录 {record['sha'][:7]} 不一致"))
                continue
            if record.get("verify") == "无法核对":
                self._mark(record, verify=None, check="merged", detail="合并已核对")
            self._close(record)

    def _mark(self, record, status=None, verify=UNSET, check=None, detail=None):
        board = Board(self.store)
        try:
            event = board.close_mark(
                "agent:service", record["ticket"], record["id"],
                status=status, verify=verify, check=check, detail=detail)
            self.store.append_event(event)
        except Exception as exc:
            self.store._log(f"待关票记录 {record['id']} 标记失败：{exc}")

    def _close(self, record):
        board = Board(self.store)
        try:
            event = board.issue_close("agent:service", record["id"])
            self.store.append_event(event)
        except Exception as exc:
            self.store._log(f"待关票记录 {record['id']} 自动关票失败：{exc}")
            self._retry_at[record["id"]] = time.time() + self.write_retry_seconds
            self._write_error(record["id"], str(exc))
            return
        self._retry_at.pop(record["id"], None)
        self._clear_error(record["id"])

    def _write_error(self, record_id, message):
        workstate = self.store.read_workstate()
        errors = dict(workstate.get("close_errors") or {})
        errors[record_id] = {"message": message, "at": now_ts()}
        workstate["close_errors"] = errors
        self.store.write_workstate(workstate)

    def _clear_error(self, record_id):
        workstate = self.store.read_workstate()
        errors = dict(workstate.get("close_errors") or {})
        if record_id in errors:
            del errors[record_id]
            workstate["close_errors"] = errors
            self.store.write_workstate(workstate)

    def _gh_pr_head(self, pr_number):
        try:
            result = subprocess.run(
                [self.gh_bin, "-R", self.repo, "pr", "view", str(pr_number),
                 "--json", "state,headRefOid"],
                capture_output=True, text=True, timeout=self.timeout)
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            raise DtError(f"gh 调不到：{exc}")
        if result.returncode != 0:
            message = (result.stderr or result.stdout).strip()
            raise DtError(message or "gh 返回失败")
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise DtError(f"gh 输出不是合法 JSON：{exc}")
