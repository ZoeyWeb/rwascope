#!/usr/bin/env python3
"""
RWA-Index – Daily TVL Snapshot

Reads the current leaderboard.json (written by fetch_leaderboard.py at 02:00 UTC)
and writes a dated snapshot. Snapshots enable future local change calculations
independent of DeFiLlama's own change_Nd fields.

Run after fetch_leaderboard.py:
  Cron: 5 2 * * * python3 /opt/rwascope-backend/scripts/snapshot_leaderboard.py
  Log:  /opt/rwascope-backend/logs/snapshot.log
"""
import json
import logging
import os
from datetime import datetime, timezone, timedelta

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("snapshot")

DATA_DIR      = os.environ.get("DATA_DIR", "/var/www/rwascope/data")
LEADERBOARD   = os.path.join(DATA_DIR, "leaderboard.json")
SNAPSHOT_DIR  = os.path.join(DATA_DIR, "snapshots")
INDEX_FILE    = os.path.join(SNAPSHOT_DIR, "index.json")
RETENTION_DAYS = 90


def atomic_write(path: str, obj: dict) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    os.replace(tmp, path)


def run() -> None:
    if not os.path.exists(LEADERBOARD):
        log.error("leaderboard.json not found at %s — aborting", LEADERBOARD)
        raise SystemExit(1)

    with open(LEADERBOARD) as f:
        data = json.load(f)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Extract only the fields needed for historical comparison
    protocols = [
        {
            "slug":      p["slug"],
            "tvl":       p["tvl"],
            "change_1d": p.get("change_1d", 0),
            "change_7d": p.get("change_7d", 0),
            "rank":      p.get("rank"),
        }
        for p in data.get("protocols", [])
    ]

    os.makedirs(SNAPSHOT_DIR, exist_ok=True)

    snapshot_file = os.path.join(SNAPSHOT_DIR, f"leaderboard-{today}.json")
    snapshot = {
        "date":           today,
        "captured_at":    datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "protocol_count": len(protocols),
        "protocols":      protocols,
    }
    atomic_write(snapshot_file, snapshot)
    log.info("Snapshot written → %s (%d protocols)", snapshot_file, len(protocols))

    # Update index — keep only dates within retention window
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).strftime("%Y-%m-%d")

    index: dict = {"dates": []}
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE) as f:
            index = json.load(f)

    dates: list[str] = index.get("dates", [])
    if today not in dates:
        dates.append(today)
    dates = sorted(d for d in dates if d >= cutoff)

    # Delete on-disk files for pruned dates
    for fname in os.listdir(SNAPSHOT_DIR):
        if not fname.startswith("leaderboard-") or not fname.endswith(".json"):
            continue
        date_part = fname[len("leaderboard-"):-len(".json")]
        if date_part < cutoff and date_part != today:
            try:
                os.remove(os.path.join(SNAPSHOT_DIR, fname))
                log.info("Pruned old snapshot: %s", fname)
            except OSError as e:
                log.warning("Could not remove %s: %s", fname, e)

    atomic_write(INDEX_FILE, {
        "updated_at":      datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "retention_days":  RETENTION_DAYS,
        "available_dates": dates,
    })
    log.info("Index updated — %d snapshots available", len(dates))


if __name__ == "__main__":
    run()
