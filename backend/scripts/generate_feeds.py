#!/usr/bin/env python3
"""
Read intelligence.json + briefs-archive.json, append current week (if not
already present), then regenerate weekly-brief.xml from the latest 20 archive
entries.  Idempotent: uses period_start as the dedup key.

Cron: 5 8 * * 1  (Monday 08:05 UTC — runs 5 min after fetch_intelligence --weekly)
Log:  /opt/rwascope/logs/generate-feeds.log
"""
import fcntl
import json
import logging
import os
import sys
import tempfile
from datetime import datetime, timezone
from xml.sax.saxutils import escape

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("generate_feeds")

INTEL_FILE   = os.environ.get("INTEL_FILE",   "/var/www/rwascope/data/intelligence/intelligence.json")
ARCHIVE_FILE = os.environ.get("ARCHIVE_FILE", "/var/www/rwascope/data/intelligence/briefs-archive.json")
FEED_OUT     = os.environ.get("FEED_OUT",     "/var/www/rwascope/feeds/weekly-brief.xml")
LOG_FILE     = "/opt/rwascope/logs/generate-feeds.log"
FEED_MAX     = 20
SITE_URL     = "https://rwa-index.com"


def _file_log(msg: str) -> None:
    try:
        with open(LOG_FILE, "a") as f:
            f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")
    except OSError:
        pass


def atomic_write(path: str, content: bytes) -> None:
    d = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".feed-", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
        os.chmod(path, 0o644)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def build_entry_html(brief: dict) -> str:
    highlights = brief.get("highlights", [])
    if highlights:
        items = "".join(f"<li>{escape(h)}</li>" for h in highlights)
        return f"<ul>{items}</ul><p><em>AI-generated summary — verify against source.</em></p>"
    return ""


def main() -> int:
    # 1. Load intelligence.json
    try:
        with open(INTEL_FILE, encoding="utf-8") as f:
            intel = json.load(f)
    except OSError as e:
        msg = f"ERROR: cannot read {INTEL_FILE}: {e}"
        log.error(msg); _file_log(msg); return 1

    brief = intel.get("weekly_brief")
    if not brief:
        msg = "ERROR: no weekly_brief block in intelligence.json"
        log.error(msg); _file_log(msg); return 1

    period_start = brief.get("period_start")
    if not period_start:
        msg = "ERROR: weekly_brief missing period_start"
        log.error(msg); _file_log(msg); return 1

    # 2. Load + update archive (exclusive lock so concurrent runs are safe)
    try:
        with open(ARCHIVE_FILE, "r+", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            archive = json.load(f)
            briefs: list[dict] = archive.get("briefs", [])
            existing = {b.get("period_start") for b in briefs}

            if period_start in existing:
                log.info("period_start %s already in archive — skipping append", period_start)
                _file_log(f"period_start {period_start} already in archive, skipping append")
            else:
                new_entry = {
                    "period_start":  period_start,
                    "period_end":    brief.get("period_end"),
                    "headline":      brief.get("headline") or f"Weekly Brief · Week of {period_start}",
                    "highlights":    brief.get("highlights", []),
                    "generated_at":  brief.get("generated_at") or datetime.now(timezone.utc).isoformat(),
                }
                briefs.insert(0, new_entry)  # newest first
                archive["briefs"] = briefs
                archive["last_updated_at"] = datetime.now(timezone.utc).isoformat()
                f.seek(0)
                f.truncate()
                json.dump(archive, f, indent=2, ensure_ascii=False)
                msg = f"appended period_start={period_start} to archive (now {len(briefs)} entries)"
                log.info(msg); _file_log(msg)
    except OSError as e:
        msg = f"ERROR: cannot open {ARCHIVE_FILE}: {e}"
        log.error(msg); _file_log(msg); return 1

    # 3. Build Atom feed from latest N entries
    feed_entries = briefs[:FEED_MAX]
    now_iso = datetime.now(timezone.utc).isoformat()

    entries_xml: list[str] = []
    for b in feed_entries:
        ps       = b["period_start"]
        title    = escape(b.get("headline") or f"Weekly Brief · Week of {ps}")
        pub      = b.get("generated_at") or f"{ps}T08:00:00+00:00"
        entry_id = f"{SITE_URL}/intelligence/briefs/{ps}"
        content  = build_entry_html(b)
        entries_xml.append(
            f"  <entry>\n"
            f"    <id>{entry_id}</id>\n"
            f"    <title>{title}</title>\n"
            f"    <link href=\"{SITE_URL}/intelligence\"/>\n"
            f"    <published>{pub}</published>\n"
            f"    <updated>{pub}</updated>\n"
            f"    <author><name>HKUST RWAscope</name></author>\n"
            f"    <content type=\"html\"><![CDATA[{content}]]></content>\n"
            f"  </entry>"
        )

    feed_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<feed xmlns="http://www.w3.org/2005/Atom">\n'
        f'  <title>RWAscope · Weekly Brief</title>\n'
        f'  <subtitle>Global RWA Intelligence — published Mondays 08:00 UTC</subtitle>\n'
        f'  <link href="{SITE_URL}/feeds/weekly-brief.xml" rel="self"/>\n'
        f'  <link href="{SITE_URL}/intelligence"/>\n'
        f'  <id>{SITE_URL}/feeds/weekly-brief.xml</id>\n'
        f'  <updated>{now_iso}</updated>\n'
        f'  <author><name>HKUST RWAscope</name></author>\n'
        + "\n".join(entries_xml) + "\n"
        "</feed>\n"
    )

    atomic_write(FEED_OUT, feed_xml.encode("utf-8"))
    msg = f"feed written: {len(feed_entries)} entries → {FEED_OUT}"
    log.info(msg); _file_log(msg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
