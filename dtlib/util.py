"""共用工具：错误、时间、JSON、路径、actor。"""
from __future__ import annotations

import getpass
import hashlib
import json
import os
import re
import sys
import tempfile
from datetime import datetime, timezone

# 退出码
EXIT_OK = 0
EXIT_BUSINESS = 1
EXIT_USAGE = 2
EXIT_SERVICE = 3
EXIT_UNKNOWN = 4

EXIT_NAMES = {
    EXIT_OK: "成功",
    EXIT_BUSINESS: "业务错误",
    EXIT_USAGE: "用法错误",
    EXIT_SERVICE: "服务不可用",
    EXIT_UNKNOWN: "写入结果未知",
}

# 表示「调用方没传这个字段」，和 None 区分。
UNSET = object()


class DtError(Exception):
    """带退出码的错误。"""

    def __init__(self, message, code=EXIT_BUSINESS, detail=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.detail = detail


def now_ts():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def parse_ts(value):
    if not value:
        return None
    text = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def sha256_hex(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def split_list(value):
    """把逗号或顿号分隔的字符串拆成列表；全角逗号不拆。"""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    text = str(value).strip()
    if not text or text == "无":
        return []
    parts = re.split(r"[,、]", text)
    return [p.strip() for p in parts if p.strip()]


def split_paths(value):
    """产出文件列：逗号或顿号拆分，文件名里的全角逗号不拆。"""
    return split_list(value)


def is_tty():
    try:
        return sys.stdin.isatty()
    except Exception:
        return False


def current_actor(explicit=None):
    if explicit:
        actor = explicit
    elif os.environ.get("GRILLING_ACTOR"):
        actor = os.environ["GRILLING_ACTOR"]
    elif is_tty():
        try:
            actor = "human:" + getpass.getuser()
        except Exception:
            actor = "human:unknown"
    else:
        actor = "agent:unknown"
    if not re.match(r"^(human|agent):.+$", actor):
        raise DtError("actor 格式应为 human:<名字> 或 agent:<名字>", EXIT_USAGE)
    return actor


def default_data_dir():
    return os.path.expanduser(os.environ.get("GRILLING_HOME", "~/.grilling/中台"))


def atomic_write_json(path, data):
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".tmp-", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write("\n")
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def read_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default
    except json.JSONDecodeError as exc:
        raise DtError(f"{path} 不是合法 JSON：{exc}", EXIT_BUSINESS)


def print_json(data):
    json.dump(data, sys.stdout, ensure_ascii=False, indent=2, sort_keys=True)
    sys.stdout.write("\n")


def eprint(*args):
    print(*args, file=sys.stderr)


def require(condition, message, code=EXIT_USAGE):
    if not condition:
        raise DtError(message, code)


def check_actor(actor):
    if not re.match(r"^(human|agent):.+$", actor or ""):
        raise DtError("actor 格式应为 human:<名字> 或 agent:<名字>", EXIT_USAGE)
    return actor
