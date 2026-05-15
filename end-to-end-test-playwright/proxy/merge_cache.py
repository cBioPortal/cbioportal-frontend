#!/usr/bin/env python3
"""
Merge per-shard SQLite caches produced by the Playwright shards into a
single union file that the merge_playwright_cache CircleCI job hands
back to save_cache. INSERT OR IGNORE keeps the first occurrence of each
key — duplicates across shards (anything they all hit) cost nothing.

Usage:  merge_cache.py <shards-dir> <output-path>

The shards-dir is expected to contain one or more *.sqlite files
(typically pw-cache-shards/cache-${CIRCLE_NODE_INDEX}.sqlite), each
with the same schema as proxy/cache_addon.py creates. A missing or
empty shards-dir is not an error — it just produces an empty merged
file, which the next workflow run will populate from scratch.
"""

from __future__ import annotations

import glob
import os
import sqlite3
import sys


SCHEMA = """
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    status INTEGER NOT NULL,
    headers TEXT NOT NULL,
    body BLOB NOT NULL
)
"""


def main(shards_dir: str, output_path: str) -> int:
    out_parent = os.path.dirname(output_path)
    if out_parent:
        os.makedirs(out_parent, exist_ok=True)
    if os.path.exists(output_path):
        os.remove(output_path)

    dst = sqlite3.connect(output_path)
    dst.execute(SCHEMA)

    # Exclude the output file in case it lives inside shards_dir (glob
    # is happy to pick it up otherwise and SQLite then refuses to read
    # it while we're writing to the same handle).
    output_abs = os.path.abspath(output_path)
    shard_files = sorted(
        p for p in glob.glob(os.path.join(shards_dir, "*.sqlite"))
        if os.path.abspath(p) != output_abs
    )
    if not shard_files:
        print(f"[merge] no shard caches in {shards_dir}; writing empty file")
        dst.commit()
        dst.close()
        return 0

    total_rows = 0
    for path in shard_files:
        try:
            src = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        except sqlite3.Error as exc:
            print(f"[merge] skipping unreadable {path}: {exc}")
            continue
        try:
            rows = src.execute(
                "SELECT key, status, headers, body FROM cache"
            ).fetchall()
        except sqlite3.Error as exc:
            print(f"[merge] skipping {path} (no cache table?): {exc}")
            src.close()
            continue
        src.close()
        dst.executemany(
            "INSERT OR IGNORE INTO cache (key, status, headers, body) "
            "VALUES (?, ?, ?, ?)",
            rows,
        )
        print(f"[merge] {path}: {len(rows)} rows")
        total_rows += len(rows)

    dst.commit()
    final_count = dst.execute("SELECT COUNT(*) FROM cache").fetchone()[0]
    final_size = dst.execute(
        "SELECT COALESCE(SUM(LENGTH(body)), 0) FROM cache"
    ).fetchone()[0]
    dst.close()

    print(
        f"[merge] merged {len(shard_files)} shard(s); "
        f"{total_rows} rows in, {final_count} unique rows out "
        f"({final_size / 1024 / 1024:.1f} MB body data)"
    )
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <shards-dir> <output-path>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
