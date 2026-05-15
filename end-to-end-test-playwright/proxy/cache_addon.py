"""
mitmproxy addon: caching forward proxy for the Playwright e2e suite.

Loaded by `mitmdump -s proxy/cache_addon.py` via scripts/run-with-cache-proxy.sh.
Two cache tiers:

  • L1 — in-process dict, populated on every response and consulted
    first. Survives only for the lifetime of the mitmdump process
    (i.e. one shard / one local run).
  • L2 — optional SQLite file at PW_CACHE_DB. Consulted on L1 miss; new
    entries are written through to disk. Multiple shards can each point
    at the same restored copy of the file; the merge_playwright_cache
    CircleCI job unions all shard outputs and re-saves the result so
    the next workflow run starts with a populated cache.

Configuration via env vars:
  PW_CACHE_HOSTS      comma-separated host suffix allowlist
                      (default: "cbioportal.org")
  PW_CACHE_STATUSES   comma-separated cacheable status codes
                      (default: "200,203,204,300,301,304,404")
  PW_CACHE_LOG        "1" to log every hit/miss
  PW_CACHE_DB         path to the SQLite cache file. Unset → L1 only.

Design notes:
  * Cache key is sha256(method + "\0" + url + "\0" + body). The body is
    included so different POST /fetch payloads cache as separate entries.
  * Set-Cookie is intentionally preserved on cached responses —
    cbioportal's session (JSESSIONID) needs to survive cache replays.
  * Content-Encoding / Content-Length / Transfer-Encoding are dropped
    because we store flow.response.content (already decoded by
    mitmproxy); leaving those headers would lie about the wire format.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import sqlite3
import threading
from typing import Dict, Optional, Tuple

from mitmproxy import http

# mitmproxy 11.x removed ctx.log in favour of stdlib logging. Configure a
# named logger so [cache] lines are clearly attributable in the mitmdump
# output (and survive any termlog filter).
log = logging.getLogger("cache")
log.setLevel(logging.INFO)


def _env_list(name: str, default: str) -> list[str]:
    # Treat an empty env var the same as an unset one — docker-test.sh
    # forwards env vars as `-e NAME="${NAME:-}"`, which materialises as
    # an empty string inside the container when the host left it unset.
    raw = os.environ.get(name) or default
    return [item.strip() for item in raw.split(",") if item.strip()]


ALLOWED_HOST_SUFFIXES = tuple(_env_list("PW_CACHE_HOSTS", "cbioportal.org"))
CACHEABLE_STATUSES = frozenset(
    int(s) for s in _env_list("PW_CACHE_STATUSES", "200,203,204,300,301,304,404")
)
LOG_ENABLED = os.environ.get("PW_CACHE_LOG") == "1"
DB_PATH = os.environ.get("PW_CACHE_DB") or None


def _log(msg: str) -> None:
    if LOG_ENABLED:
        log.warning(f"[cache] {msg}")


def _host_allowed(host: str) -> bool:
    host = host.lower()
    return any(
        host == suffix or host.endswith("." + suffix)
        for suffix in ALLOWED_HOST_SUFFIXES
    )


def _cache_key(flow: http.HTTPFlow) -> str:
    req = flow.request
    h = hashlib.sha256()
    h.update(req.method.encode("utf-8"))
    h.update(b"\0")
    h.update(req.url.encode("utf-8"))
    h.update(b"\0")
    h.update(req.raw_content or b"")
    return h.hexdigest()


_HEADERS_TO_DROP = ("content-encoding", "content-length", "transfer-encoding")


def _clean_headers(headers: http.Headers) -> http.Headers:
    cleaned = headers.copy()
    for name in _HEADERS_TO_DROP:
        if name in cleaned:
            del cleaned[name]
    return cleaned


# --- header (de)serialisation for the SQLite tier ---------------------
# mitmproxy stores headers as a list of (bytes, bytes) tuples. We encode
# them as a JSON list of [str, str] pairs using latin-1, which is a
# lossless round-trip for any byte sequence and keeps the on-disk format
# trivially diff-able if someone needs to inspect the cache file.

def _headers_to_json(headers: http.Headers) -> str:
    return json.dumps(
        [[k.decode("latin-1"), v.decode("latin-1")] for k, v in headers.fields]
    )


def _headers_from_json(s: str) -> http.Headers:
    return http.Headers(
        [(k.encode("latin-1"), v.encode("latin-1")) for k, v in json.loads(s)]
    )


class ResponseCache:
    def __init__(self) -> None:
        self._store: Dict[str, Tuple[int, http.Headers, bytes]] = {}
        self._lock = threading.Lock()
        self._hits = 0
        self._db_hits = 0
        self._misses = 0
        self._stored = 0
        self._db: Optional[sqlite3.Connection] = None
        if DB_PATH:
            parent = os.path.dirname(DB_PATH)
            if parent:
                os.makedirs(parent, exist_ok=True)
            # check_same_thread=False because mitmproxy may dispatch
            # hooks from worker threads in some flow types. isolation
            # level=None puts SQLite in autocommit so each INSERT is
            # durable without an explicit commit() — cheap insurance
            # against losing entries if mitmdump is force-killed.
            self._db = sqlite3.connect(
                DB_PATH, check_same_thread=False, isolation_level=None
            )
            self._db.execute(
                """
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    status INTEGER NOT NULL,
                    headers TEXT NOT NULL,
                    body BLOB NOT NULL
                )
                """
            )
            log.warning(f"[cache] SQLite backing enabled at {DB_PATH}")

    def _db_get(
        self, key: str
    ) -> Optional[Tuple[int, http.Headers, bytes]]:
        if self._db is None:
            return None
        row = self._db.execute(
            "SELECT status, headers, body FROM cache WHERE key = ?", (key,)
        ).fetchone()
        if row is None:
            return None
        status, headers_json, body = row
        return status, _headers_from_json(headers_json), body

    def _db_put(
        self, key: str, status: int, headers: http.Headers, body: bytes
    ) -> None:
        if self._db is None:
            return
        try:
            self._db.execute(
                "INSERT OR IGNORE INTO cache (key, status, headers, body) "
                "VALUES (?, ?, ?, ?)",
                (key, status, _headers_to_json(headers), body),
            )
        except sqlite3.Error as exc:
            log.warning(f"[cache] sqlite write failed for {key[:12]}: {exc}")

    def request(self, flow: http.HTTPFlow) -> None:
        if not _host_allowed(flow.request.host):
            return
        key = _cache_key(flow)
        with self._lock:
            entry = self._store.get(key)
        if entry is not None:
            self._hits += 1
            _log(f"hit    {flow.request.method} {flow.request.url}")
        else:
            entry = self._db_get(key)
            if entry is not None:
                with self._lock:
                    self._store[key] = entry
                self._db_hits += 1
                _log(f"db-hit {flow.request.method} {flow.request.url}")
        if entry is None:
            self._misses += 1
            _log(f"miss   {flow.request.method} {flow.request.url}")
            return
        status, headers, body = entry
        flow.response = http.Response.make(status, body, headers)

    def response(self, flow: http.HTTPFlow) -> None:
        if flow.response is None:
            return
        if not _host_allowed(flow.request.host):
            return
        if flow.response.status_code not in CACHEABLE_STATUSES:
            return
        key = _cache_key(flow)
        with self._lock:
            if key in self._store:
                return  # already cached, don't overwrite with the replay
            headers = _clean_headers(flow.response.headers)
            body = flow.response.content or b""
            self._store[key] = (flow.response.status_code, headers, body)
            self._stored += 1
        self._db_put(key, flow.response.status_code, headers, body)
        _log(f"store  {flow.request.method} {flow.request.url}")

    def done(self) -> None:
        total = self._hits + self._db_hits + self._misses
        log.warning(
            f"[cache] summary: {self._hits} L1 hits / {self._db_hits} L2 hits / "
            f"{self._misses} misses ({total} allowlisted requests), "
            f"{self._stored} entries newly stored. "
            f"allowlist={list(ALLOWED_HOST_SUFFIXES)} db={DB_PATH or '(none)'}"
        )
        if self._db is not None:
            try:
                self._db.close()
            except sqlite3.Error:
                pass


addons = [ResponseCache()]
