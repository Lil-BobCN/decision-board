"""本机 HTTP 服务：唯一写者、SSE、命令入口。"""
from __future__ import annotations

import fcntl
import json
import os
import queue
import signal
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .commands import Board, dispatch
from .importer import build_import_payload, detect_repo
from .store import EventStore
from .sync import compute_plan, execute_plan
from .util import (
    DtError, EXIT_BUSINESS, EXIT_SERVICE, check_actor, current_actor, now_ts,
)
from .views import (
    coverage_view, decision_view, impact_list, impact_view, issue_view,
    premise_view, sync_view, workstate_view,
)
from .workstate import WorkStatePoller

DEFAULT_PORT = 8788


class BoardService:
    def __init__(self, home=None, port=None, repo=None):
        self.home = home
        self.port = int(port or os.environ.get("GRILLING_PORT") or DEFAULT_PORT)
        self.repo = repo or os.environ.get("GRILLING_REPO") or detect_repo(os.getcwd())
        self.store = EventStore(home=home, repo=self.repo)
        self.lock = threading.RLock()
        self.subscribers = []
        self.workstate = WorkStatePoller(self.store, self.repo)
        self.httpd = None
        self._lock_fd = None
        self._stop = threading.Event()
        self._committer = None

    # ---------- 启动 ----------

    def acquire_lock(self):
        os.makedirs(self.store.home, exist_ok=True)
        self._lock_fd = open(self.store.lock_path, "w")
        try:
            fcntl.flock(self._lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            info = self.store.read_service_info() or {}
            pid = info.get("pid")
            raise DtError(
                f"已有中台服务在运行（pid {pid}，端口 {info.get('port')}）；先停掉它",
                EXIT_SERVICE)
        self._lock_fd.write(str(os.getpid()))
        self._lock_fd.flush()

    def run(self):
        self.acquire_lock()
        self.store.ensure_dirs()
        self.store.load()
        self.store.write_service_info(self.port, os.getpid())
        self.store.on_append(self.broadcast)
        self.workstate.start()
        self._committer = threading.Thread(target=self._commit_loop, name="git-commit", daemon=True)
        self._committer.start()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", self.port), Handler)
        self.httpd.daemon_threads = True
        self.httpd.service = self
        print(f"中台服务：http://127.0.0.1:{self.port}  pid={os.getpid()}  数据={self.store.home}", flush=True)
        signal.signal(signal.SIGTERM, self._signal)
        signal.signal(signal.SIGINT, self._signal)
        try:
            self.httpd.serve_forever(poll_interval=0.5)
        finally:
            self.shutdown()

    def _signal(self, signum, frame):
        self._stop.set()
        if self.httpd:
            threading.Thread(target=self.httpd.shutdown, daemon=True).start()

    def shutdown(self):
        self._stop.set()
        self.workstate.stop()
        try:
            self.store.maybe_commit(force=True)
        except Exception as exc:
            self.store._log(f"退出前提交失败：{exc}")
        try:
            if os.path.exists(self.store.service_path):
                os.unlink(self.store.service_path)
        except OSError:
            pass
        if self._lock_fd:
            try:
                fcntl.flock(self._lock_fd, fcntl.LOCK_UN)
                self._lock_fd.close()
            except OSError:
                pass

    def _commit_loop(self):
        while not self._stop.wait(5):
            try:
                self.store.maybe_commit()
            except Exception as exc:
                self.store._log(f"定时提交失败：{exc}")

    # ---------- 广播 ----------

    def broadcast(self, event):
        for q in list(self.subscribers):
            try:
                q.put_nowait(event)
            except queue.Full:
                pass

    # ---------- 命令 ----------

    def execute(self, op, args, actor, reason=None):
        actor = check_actor(actor)
        with self.lock:
            event = dispatch(Board(self.store), op, args, actor, reason)
            self.store.append_event(event)
        return event

    def import_github(self, map_number, actor):
        actor = check_actor(actor)
        source = f"github:{map_number}"
        with self.lock:
            if str(map_number) in self.store.state["issues"]:
                raise DtError(f"地图 {map_number} 已经导入过了")
            for event in self.store.events:
                if event["op"] == "import" and event["target"] == source:
                    raise DtError(f"地图 {map_number} 已经导入过了")
        payload, warnings, issue = build_import_payload(
            self.repo, map_number,
            start_comment=self.store.state["counters"]["comment"])
        with self.lock:
            event = Board(self.store).import_event(actor, payload, source)
            self.store.append_event(event)
        for local, number in (payload.get("github") or {}).get("issues", {}).items():
            self.store.sync_record({"type": "mapping", "kind": "issue",
                                    "local": local, "github": number})
        for local, number in (payload.get("github") or {}).get("comments", {}).items():
            self.store.sync_record({"type": "mapping", "kind": "comment",
                                    "local": local, "github": number})
        counts = {
            "tickets": len(payload["tickets"]),
            "comments": len(payload["comments"]),
            "decisions": len(payload["decisions"]),
            "coverage": len(payload["coverage"]),
        }
        return event, warnings, counts

    def sync_check(self, map_id):
        with self.lock:
            if not self.store.mirror_on(map_id):
                raise DtError(f"地图 {map_id} 的镜像开关是关的")
            return compute_plan(self.store, self.repo, map_id)

    def sync_run(self, map_id):
        with self.lock:
            if not self.store.mirror_on(map_id):
                raise DtError(f"地图 {map_id} 的镜像开关是关的")
            plan = compute_plan(self.store, self.repo, map_id)
            return execute_plan(self.store, self.repo, map_id, plan)

    def set_mirror(self, map_id, on):
        if map_id not in self.store.state["issues"]:
            raise DtError(f"找不到地图 {map_id}")
        self.store.sync_record({"type": "mirror", "map": map_id, "on": bool(on)})
        return {"map": map_id, "on": bool(on)}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        service = getattr(self.server, "service", None)
        if service:
            service.store._log(f"{self.address_string()} {fmt % args}")

    @property
    def service(self):
        return self.server.service

    def _send(self, data, status=200, content_type="application/json; charset=utf-8"):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _ok(self, data):
        self._send({"ok": True, "data": data})

    def _error(self, exc):
        code = exc.code if isinstance(exc, DtError) else EXIT_BUSINESS
        self._send({"ok": False, "error": str(exc), "code": code})

    def _read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise DtError(f"请求体不是合法 JSON：{exc}", EXIT_BUSINESS)

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        try:
            body = self._read_body()
            if path == "/command":
                event = self.service.execute(
                    body["op"], body.get("args") or {},
                    body.get("actor") or current_actor(), body.get("reason"))
                self._ok({"event": event, "id": event["target"]})
            elif path == "/import":
                event, warnings, counts = self.service.import_github(
                    str(body["map"]), body.get("actor") or current_actor())
                self._ok({"event": event, "warnings": warnings, "counts": counts})
            elif path == "/sync/check":
                self._ok(self.service.sync_check(str(body["map"])))
            elif path == "/sync/run":
                self._ok(self.service.sync_run(str(body["map"])))
            elif path == "/mirror":
                self._ok(self.service.set_mirror(str(body["map"]), bool(body.get("on"))))
            elif path == "/rebuild":
                with self.service.lock:
                    self._ok({"hash": self.service.store.rebuild(),
                              "seq": self.service.store.last_seq})
            elif path == "/snapshot":
                self._ok({"committed": self.service.store.maybe_commit(force=True)})
            elif path == "/status":
                self._ok(self.service.workstate.poll_once(force=True))
            else:
                self._send({"ok": False, "error": "没有这个接口", "code": 2}, 404)
        except (DtError, KeyError) as exc:
            self._error(exc)
        except Exception as exc:
            self.service.store._log(f"POST {path} 失败：{exc}")
            self._send({"ok": False, "error": f"服务内部错误：{exc}", "code": EXIT_BUSINESS})

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        try:
            if path == "/health":
                self._ok({
                    "pid": os.getpid(),
                    "seq": self.service.store.last_seq,
                    "hash": self.service.store.hash(),
                    "data_dir": self.service.store.home,
                    "repo": self.service.repo,
                })
            elif path == "/state":
                with self.service.lock:
                    self._ok({
                        "state": self.service.store.state,
                        "hash": self.service.store.hash(),
                        "seq": self.service.store.last_seq,
                    })
            elif path == "/events":
                self._sse(query)
            elif path == "/impact":
                self._ok(impact_list(self.service.store))
            elif path.startswith("/issue/"):
                self._ok(issue_view(self.service.store, path.split("/", 2)[2]))
            elif path.startswith("/decision/"):
                self._ok(decision_view(self.service.store, path.split("/", 2)[2]))
            elif path.startswith("/premise/"):
                self._ok(premise_view(self.service.store, path.split("/", 2)[2]))
            elif path.startswith("/impact/"):
                self._ok(impact_view(self.service.store, path.split("/", 2)[2]))
            elif path.startswith("/coverage/"):
                self._ok(coverage_view(self.service.store, path.split("/", 2)[2]))
            elif path == "/workstate":
                self._ok(workstate_view(self.service.store))
            elif path.startswith("/sync/"):
                self._ok(sync_view(self.service.store, path.split("/", 2)[2]))
            elif path == "/":
                self._html()
            else:
                self._send({"ok": False, "error": "没有这个接口", "code": 2}, 404)
        except (DtError, KeyError) as exc:
            self._error(exc)
        except Exception as exc:
            self.service.store._log(f"GET {path} 失败：{exc}")
            self._send({"ok": False, "error": f"服务内部错误：{exc}", "code": EXIT_BUSINESS})

    def _html(self):
        body = """<!doctype html><meta charset="utf-8">
<title>决策中台</title>
<body style="font-family:system-ui;max-width:42rem;margin:4rem auto;line-height:1.7">
<h1>决策中台</h1>
<p>内核已在本机运行。屏幕在《实现屏幕：完整内容、编辑与同步状态》里实现。</p>
<ul>
<li><a href="/state">/state</a> 当前状态</li>
<li><a href="/impact">/impact</a> 影响清单</li>
<li><a href="/workstate">/workstate</a> 工作状态</li>
<li><a href="/events">/events</a> 事件流（SSE）</li>
</ul>
</body>""".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _sse(self, query):
        since = int((query.get("since") or ["0"])[0])
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        q = queue.Queue(maxsize=1000)
        self.service.subscribers.append(q)
        try:
            for event in list(self.service.store.events):
                if event["seq"] > since:
                    self._sse_write(event)
            while True:
                try:
                    event = q.get(timeout=15)
                except queue.Empty:
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
                    continue
                self._sse_write(event)
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            try:
                self.service.subscribers.remove(q)
            except ValueError:
                pass

    def _sse_write(self, event):
        data = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
        self.wfile.write(f"id: {event['seq']}\ndata: {data}\n\n".encode("utf-8"))
        self.wfile.flush()


def serve(home=None, port=None, repo=None):
    service = BoardService(home=home, port=port, repo=repo)
    service.run()
    return 0
