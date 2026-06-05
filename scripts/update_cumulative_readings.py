#!/usr/bin/env python3
"""
Daily cron (00:30 UTC): consume access.log.1 (yesterday's complete log,
left uncompressed by nginx's delaycompress logrotate setting) into
cumulative-readings.json.

Idempotent via consumed_log_dates — re-running the same day is a no-op.
Uses fcntl.flock to prevent concurrent execution with other writers.
Uses atomic tmp→rename write to prevent partial reads by compute_visitors.sh.
"""
import json, os, re, sys, fcntl, tempfile
from datetime import datetime

CUMULATIVE_FILE = '/var/www/rwascope/data/cumulative-readings.json'
ACCESS_LOG_1    = '/var/log/nginx/access.log.1'
LOG_FILE        = '/opt/rwascope/logs/cumulative-readings.log'
DATE_RE         = re.compile(rb'\[(\d{2})/(\w{3})/(\d{4}):')
MONTHS          = {b'Jan':1,b'Feb':2,b'Mar':3,b'Apr':4,b'May':5,b'Jun':6,
                   b'Jul':7,b'Aug':8,b'Sep':9,b'Oct':10,b'Nov':11,b'Dec':12}


def log(msg: str) -> None:
    ts = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(line + '\n')
    except OSError:
        pass


def extract_date(path: str) -> str | None:
    with open(path, 'rb') as f:
        for i, raw in enumerate(f):
            m = DATE_RE.search(raw)
            if m:
                d, mon, y = m.group(1), m.group(2), m.group(3)
                return f"{y.decode()}-{MONTHS.get(mon, 0):02d}-{int(d):02d}"
            if i > 200:
                break
    return None


def count_lines(path: str) -> int:
    with open(path, 'rb') as f:
        return sum(1 for _ in f)


def main() -> None:
    if not os.path.exists(ACCESS_LOG_1):
        log("access.log.1 not found — logrotate may not have run yet, skipping")
        return

    date = extract_date(ACCESS_LOG_1)
    if not date:
        log("ERROR: could not extract date from access.log.1 — skipping")
        return

    with open(CUMULATIVE_FILE, 'r+') as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)

        state = json.load(fh)
        consumed = state.get('consumed_log_dates', [])

        if date in consumed:
            log(f"skip: {date} already consumed — "
                f"cumulative={state['cumulative_pageviews']:,}")
            return

        n = count_lines(ACCESS_LOG_1)
        state['cumulative_pageviews'] = state.get('cumulative_pageviews', 0) + n
        state['consumed_log_dates']   = sorted(set(consumed) | {date})
        state['last_updated_at']      = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

        tmp_fd, tmp_path = tempfile.mkstemp(
            dir=os.path.dirname(CUMULATIVE_FILE),
            prefix='.cumulative-', suffix='.json.tmp'
        )
        with os.fdopen(tmp_fd, 'w') as tf:
            json.dump(state, tf, indent=2)
            tf.flush()
            os.fsync(tf.fileno())
        os.replace(tmp_path, CUMULATIVE_FILE)
        os.chmod(CUMULATIVE_FILE, 0o644)

    log(f"consumed {date}: +{n:,} lines — "
        f"new cumulative={state['cumulative_pageviews']:,}")


if __name__ == '__main__':
    main()
