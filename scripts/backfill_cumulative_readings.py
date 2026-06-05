#!/usr/bin/env python3
"""
One-shot backfill: scan all access.log.*.gz, extract date from first log line,
accumulate raw line counts into cumulative-readings.json.

Idempotent: skips files whose date is already in consumed_log_dates AND whose
basename is already in backfill_source_files. May-25 two-file collision is
handled by summing both into the same ISO-date bucket before committing.

Run once before the daily cron is active. Safe to re-run after a crash.
"""
import gzip, json, os, re, sys, fcntl, tempfile, glob
from datetime import datetime
from pathlib import Path

CUMULATIVE_FILE = '/var/www/rwascope/data/cumulative-readings.json'
LOG_DIR = '/var/log/nginx'
DATE_RE = re.compile(rb'\[(\d{2})/(\w{3})/(\d{4}):')
MONTHS = {b'Jan':1,b'Feb':2,b'Mar':3,b'Apr':4,b'May':5,b'Jun':6,
          b'Jul':7,b'Aug':8,b'Sep':9,b'Oct':10,b'Nov':11,b'Dec':12}


def extract_date(path):
    """Return YYYY-MM-DD from first matching nginx log line in a .gz file."""
    try:
        with gzip.open(path, 'rb') as f:
            for i, raw in enumerate(f):
                m = DATE_RE.search(raw)
                if m:
                    d, mon, y = m.group(1), m.group(2), m.group(3)
                    return f"{y.decode()}-{MONTHS.get(mon, 0):02d}-{int(d):02d}"
                if i > 200:
                    break
    except Exception as e:
        print(f"  WARN: failed to read {path}: {e}", file=sys.stderr)
    return None


def count_lines(path):
    with gzip.open(path, 'rb') as f:
        return sum(1 for _ in f)


def main():
    os.makedirs(os.path.dirname(CUMULATIVE_FILE), exist_ok=True)

    # backfill only processes .gz archives — access.log.1 is left to daily cron
    gz_files = sorted(glob.glob(f'{LOG_DIR}/access.log.*.gz'))
    print(f"Found {len(gz_files)} .gz archives.")

    with open(CUMULATIVE_FILE, 'r+') as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)

        state = json.load(fh)

        if state.get('backfill_completed'):
            print(f"backfill_completed=true — nothing to do. "
                  f"cumulative={state['cumulative_pageviews']:,}")
            return

        consumed_dates = set(state.get('consumed_log_dates', []))
        done_files     = set(state.get('backfill_source_files', []))

        # Accumulate per-date totals (handles two .gz files landing on same date)
        per_date: dict[str, int] = {}
        new_sources: list[str]   = []

        for gz in gz_files:
            base = os.path.basename(gz)
            if base in done_files:
                print(f"  SKIP {base}: already in backfill_source_files")
                continue

            date = extract_date(gz)
            if not date:
                print(f"  SKIP {base}: could not extract date from first line")
                continue

            n = count_lines(gz)
            per_date[date] = per_date.get(date, 0) + n
            new_sources.append(base)
            flag = " ← date collision, summed" if date in per_date and per_date[date] != n else ""
            print(f"  ADD  {base}: date={date}, lines={n:,}{flag}")

        # Commit aggregated totals
        added_total = 0
        for date, count in sorted(per_date.items()):
            if date not in consumed_dates:
                state['cumulative_pageviews'] = state.get('cumulative_pageviews', 0) + count
                consumed_dates.add(date)
                added_total += count
                print(f"  => committed {date}: +{count:,}")

        state['consumed_log_dates']   = sorted(consumed_dates)
        state['backfill_source_files'] = sorted(set(done_files) | set(new_sources))
        state['backfill_completed']   = True
        state['last_updated_at']      = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

        # Atomic write: tmp → fsync → rename (never truncate in-place)
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

    print(f"\nBackfill complete.")
    print(f"  Files processed : {len(new_sources)}")
    print(f"  Dates consumed  : {len(per_date)}")
    print(f"  Lines added     : {added_total:,}")
    print(f"  cumulative_pageviews = {state['cumulative_pageviews']:,}")


if __name__ == '__main__':
    main()
