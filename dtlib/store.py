"""数据目录、事件日志、索引库、同步日志、工作状态和快照。"""
from __future__ import annotations

import copy
import glob
import json
import os
import shutil
import sqlite3
import subprocess
import threading
import time

from .fold import apply_event, empty_state, fold_events, state_hash
from .schema import validate_event
from .util import DtError, atomic_write_json, now_ts, read_json

GITIGNORE = """\
board.db
board.db-journal
board.db-wal
board.db-shm
service.json
service.log
*.log
*.lock
events.jsonl.torn-*
workstate.json
backups/
.tmp-*
"""


class EventStore:
    def __init__(self, home=None, repo=None):
        from .util import default_data_dir
        self.home = os.path.abspath(home or default_data_dir())
        self.repo = repo
        self.events_path = os.path.join(self.home, "events.jsonl")
        self.db_path = os.path.join(self.home, "board.db")
        self.sync_path = os.path.join(self.home, "sync.jsonl")
        self.workstate_path = os.path.join(self.home, "workstate.json")
        self.service_path = os.path.join(self.home, "service.json")
        self.log_path = os.path.join(self.home, "service.log")
        self.lock_path = os.path.join(self.home, "service.lock")
        self.backups_dir = os.path.join(self.home, "backups")
        self.events = []
        self.state = empty_state()
        self.sync = {"issues": {}, "comments": {}, "mirror": {}, "position": {}, "history": []}
        self._lock = threading.RLock()
        self._dirty_since = None
        self._last_commit = 0.0
        self._append_callbacks = []

    # ---------- 启动 ----------

    def ensure_dirs(self):
        os.makedirs(self.home, exist_ok=True)
        os.makedirs(self.backups_dir, exist_ok=True)
        ignore_path = os.path.join(self.home, ".gitignore")
        if not os.path.exists(ignore_path):
            with open(ignore_path, "w", encoding="utf-8") as f:
                f.write(GITIGNORE)
        self._git_init()

    def load(self):
        self.events = self._read_events()
        self.state = fold_events(self.events)
        self._load_sync()
        self._ensure_import_mappings()
        self._write_board_db()
        return self.state

    def _read_events(self):
        if not os.path.exists(self.events_path):
            open(self.events_path, "a", encoding="utf-8").close()
            return []
        with open(self.events_path, "rb") as f:
            data = f.read()
        if not data:
            return []
        pieces = data.split(b"\n")
        complete = pieces[:-1]  # 每组后面都有一个 \n
        tail = pieces[-1]
        events = []
        offsets = []
        offset = 0
        for index, piece in enumerate(complete):
            offsets.append((offset, offset + len(piece) + 1))
            offset += len(piece) + 1
            if piece == b"":
                raise DtError(f"events.jsonl 第 {index + 1} 行是空行，拒绝启动")
            try:
                event = json.loads(piece.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise DtError(f"events.jsonl 第 {index + 1} 行不是合法 JSON：{exc}")
            events.append(validate_event(event, index + 1))
        if tail:
            # 最后一段没有换行：当作残片处理
            try:
                event = json.loads(tail.decode("utf-8"))
                validate_event(event, len(complete) + 1)
                complete_event = event
            except Exception:
                complete_event = None
            if complete_event is None:
                self._move_torn(offset, data)
            else:
                # 合法但缺换行：补一个换行，保留事件
                with open(self.events_path, "ab") as f:
                    f.write(b"\n")
                events.append(complete_event)
        for expected, event in enumerate(events, start=1):
            if event["seq"] != expected:
                raise DtError(
                    f"events.jsonl 的 seq 不连续：第 {expected} 条事件的 seq 是 {event['seq']}")
        return events

    def _move_torn(self, offset, data):
        stamp = now_ts().replace(":", "").replace(".", "")
        torn_path = self.events_path + f".torn-{stamp}"
        with open(torn_path, "wb") as f:
            f.write(data[offset:])
        with open(self.events_path, "r+b") as f:
            f.truncate(offset)
        self._log(f"最后一行不完整，已移到 {torn_path}")

    def _log(self, message):
        try:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(f"{now_ts()} {message}\n")
        except OSError:
            pass

    # ---------- 写 ----------

    @property
    def last_seq(self):
        return self.events[-1]["seq"] if self.events else 0

    def append_event(self, event):
        with self._lock:
            validate_event(event)
            if event["seq"] != self.last_seq + 1:
                raise DtError(f"事件 seq 不连续：期望 {self.last_seq + 1}，收到 {event['seq']}")
            new_state = copy.deepcopy(self.state)
            apply_event(new_state, event)
            line = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
            with open(self.events_path, "a", encoding="utf-8") as f:
                f.write(line + "\n")
                f.flush()
                os.fsync(f.fileno())
            self.events.append(event)
            self.state = new_state
            self._write_board_db()
            self._dirty_since = self._dirty_since or time.time()
            for callback in self._append_callbacks:
                try:
                    callback(event)
                except Exception as exc:
                    self._log(f"事件回调失败：{exc}")
            return event

    def on_append(self, callback):
        self._append_callbacks.append(callback)

    def rebuild(self):
        with self._lock:
            self.backup_events()
            self.events = self._read_events()
            self.state = fold_events(self.events)
            self._write_board_db()
            return state_hash(self.state)

    def backup_events(self):
        if not os.path.exists(self.events_path):
            return
        stamp = now_ts().replace(":", "").replace(".", "")
        shutil.copy2(self.events_path, os.path.join(self.backups_dir, f"events-{stamp}.jsonl"))
        backups = sorted(glob.glob(os.path.join(self.backups_dir, "events-*.jsonl")))
        for path in backups[:-10]:
            try:
                os.unlink(path)
            except OSError:
                pass

    def _write_board_db(self):
        try:
            self._write_board_db_once()
        except sqlite3.DatabaseError as exc:
            self._log(f"board.db 损坏，删掉重建：{exc}")
            try:
                os.unlink(self.db_path)
            except OSError:
                pass
            try:
                self._write_board_db_once()
            except sqlite3.Error as exc2:
                self._log(f"写 board.db 失败：{exc2}")

    def _write_board_db_once(self):
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
            conn.execute(
                "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
                ("state_hash", state_hash(self.state)),
            )
            conn.execute(
                "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
                ("last_seq", str(self.last_seq)),
            )
            conn.execute(
                "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
                ("state_json", json.dumps(self.state, ensure_ascii=False, sort_keys=True)),
            )
            conn.commit()
        finally:
            conn.close()

    def hash(self):
        return state_hash(self.state)

    def write_service_info(self, port, pid):
        atomic_write_json(self.service_path, {
            "port": port,
            "pid": pid,
            "started_at": now_ts(),
            "data_dir": self.home,
            "repo": self.repo,
        })

    def read_service_info(self):
        return read_json(self.service_path, None)

    # ---------- 同步日志 ----------

    def _load_sync(self):
        self.sync = {"issues": {}, "comments": {}, "mirror": {}, "position": {}, "history": []}
        if not os.path.exists(self.sync_path):
            return
        with open(self.sync_path, encoding="utf-8") as f:
            for line_no, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise DtError(f"sync.jsonl 第 {line_no} 行不是合法 JSON：{exc}")
                self._apply_sync_record(record)

    def _apply_sync_record(self, record):
        kind = record.get("type")
        if kind == "mapping":
            table = self.sync["issues" if record["kind"] == "issue" else "comments"]
            table[str(record["local"])] = record["github"]
        elif kind == "mirror":
            self.sync["mirror"][str(record["map"])] = bool(record["on"])
        elif kind == "position":
            self.sync["position"][str(record["map"])] = record.get("at")
        elif kind == "sync":
            self.sync["history"].append(record)
            self.sync["history"] = self.sync["history"][-200:]
        else:
            self._log(f"不认识的同步日志类型：{kind}")

    def sync_record(self, record):
        record = dict(record)
        record.setdefault("ts", now_ts())
        with open(self.sync_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
            f.flush()
        self._apply_sync_record(record)

    def _ensure_import_mappings(self):
        for event in self.events:
            if event["op"] != "import":
                continue
            github = event["payload"].get("github") or {}
            for local, number in (github.get("issues") or {}).items():
                self.sync["issues"].setdefault(str(local), number)
            for local, number in (github.get("comments") or {}).items():
                self.sync["comments"].setdefault(str(local), number)

    def mirror_on(self, map_id):
        if map_id in self.sync["mirror"]:
            return self.sync["mirror"][map_id]
        return str(map_id).isdigit()

    # ---------- 工作状态 ----------

    def read_workstate(self):
        return read_json(self.workstate_path, {"updated_at": None, "offline": True, "tickets": {}})

    def write_workstate(self, data):
        atomic_write_json(self.workstate_path, data)

    # ---------- 快照 ----------

    def _git(self, *args, check=False):
        try:
            return subprocess.run(
                ["git", "-C", self.home] + list(args),
                capture_output=True, text=True, timeout=20,
            )
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            if check:
                raise DtError(f"git 不可用：{exc}")
            return None

    def _git_init(self):
        if os.path.isdir(os.path.join(self.home, ".git")):
            return
        result = self._git("init", "-b", "main")
        if result is not None and result.returncode == 0:
            self._log("数据目录已初始化 git 仓")
        else:
            self._log("数据目录初始化 git 失败，跳过版本记录")

    def mark_dirty(self):
        self._dirty_since = self._dirty_since or time.time()

    def maybe_commit(self, force=False):
        with self._lock:
            now = time.time()
            if not self._dirty_since:
                return False
            if not force:
                if now - self._dirty_since < 60:
                    return False
                if now - self._last_commit < 600:
                    return False
            self._git("add", "-A")
            message = f"事件 {self.last_seq}：{now_ts()}"
            result = self._git("commit", "-m", message)
            if result is None or result.returncode != 0:
                output = (result.stderr if result else "").strip()
                if "nothing to commit" not in output:
                    self._log(f"git 提交失败：{output}")
                self._dirty_since = None
                self._last_commit = now
                return False
            self._dirty_since = None
            self._last_commit = now
            return True
