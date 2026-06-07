#!/usr/bin/env python3
"""
RWA-Index – HK Policy Tracker Fetcher

Scrapes HKMA, SFC, and HKEx official press-release pages, runs AI analysis
for RWA relevance, and writes /var/www/rwascope/data/policy/policy.json
for the frontend.

EDITORIAL NOTE: All scraped content is from official government/regulatory
sources. AI market-impact summaries are labelled as AI-generated and require
human verification before publication.

Cron (daily): 0 6 * * * /usr/bin/python3 /opt/rwascope-backend/scripts/fetch_policy.py
Cron (weekly brief): 0 8 * * 1 /usr/bin/python3 /opt/rwascope-backend/scripts/fetch_policy.py --weekly
Log: /opt/rwascope/logs/policy.log

Usage:
  python fetch_policy.py            # scrape + update JSON
  python fetch_policy.py --weekly   # regenerate weekly brief only
  python fetch_policy.py --dry-run  # scrape only, no file write
"""
import argparse
import json
import logging
import os
import sys
import time
import urllib.request as urlreq
from datetime import date, datetime, timezone
from html.parser import HTMLParser

from text_utils import first_sentence

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("fetch_policy")

OUT_DIR   = os.environ.get("OUT_DIR", "/var/www/rwascope/data/policy")
OUT_FILE  = os.path.join(OUT_DIR, "policy.json")
SEED_FILE = os.path.join(
    os.path.dirname(__file__), "../../web/public/data/policy/policy.json"
)

# ── Source definitions ────────────────────────────────────────────────────────

SOURCES = [
    {
        "id": "hkma",
        "label": "HKMA",
        "url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/",
        "note": "HKMA press releases page",
    },
    {
        "id": "sfc",
        "label": "SFC",
        "url": "https://www.sfc.hk/en/News-and-announcements/Policy-statements-and-announcements",
        "note": "SFC policy statements and announcements",
    },
    {
        "id": "hkex",
        "label": "HKEx",
        "url": "https://www.hkex.com.hk/News/News-Release/",
        "note": "HKEx news releases",
    },
]

# RWA-relevant keywords for basic pre-filter (before AI analysis)
RWA_KEYWORDS = [
    "tokeniz", "rwa", "real world asset", "stablecoin", "digital asset",
    "virtual asset", "vatp", "ensemble", "e-hkd", "cbdc", "tokenised",
    "blockchain", "distributed ledger", "dlt", "tokenized",
]


# ── Simple HTML title extractor ───────────────────────────────────────────────

class TitleExtractor(HTMLParser):
    """Extracts <title> tag text from an HTML page."""

    def __init__(self):
        super().__init__()
        self._in_title = False
        self.title = ""

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def fetch_url(url: str, timeout: int = 15) -> str | None:
    """Fetch URL content; return None on error."""
    try:
        req = urlreq.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; RWAIndex-PolicyTracker/1.0; "
                    "+https://rwa-index.com)"
                )
            },
        )
        with urlreq.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as exc:
        log.warning("Failed to fetch %s: %s", url, exc)
        return None


def is_rwa_relevant(text: str) -> bool:
    """Basic keyword pre-filter before AI analysis."""
    lower = text.lower()
    return any(kw in lower for kw in RWA_KEYWORDS)


def load_existing_json() -> dict:
    """Load the current policy.json, falling back to the seed file."""
    for path in [OUT_FILE, SEED_FILE]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as exc:
                log.warning("Could not load %s: %s", path, exc)
    return {"meta": {}, "weekly_brief": {}, "policy_updates": []}


def write_atomic(path: str, data: dict) -> None:
    """Write JSON atomically via a tmp file + rename."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)
    log.info("Wrote %s", path)


# ── Weekly brief generation ───────────────────────────────────────────────────

def generate_weekly_brief(policy_updates: list[dict]) -> dict:
    """
    Build a weekly brief from the 3 most recent rwa_relevant items.
    Brief highlights are taken from each item's summary_en field.
    In production, this would call the AI API — here we build from existing data.
    """
    today = date.today().isoformat()
    recent = sorted(
        [u for u in policy_updates if u.get("rwa_relevant")],
        key=lambda u: u.get("published_at", ""),
        reverse=True,
    )[:3]

    highlights = [first_sentence(u["summary_en"]) for u in recent if "summary_en" in u]

    # Approximate period: last 7 days
    from datetime import timedelta
    period_end = date.today()
    period_start = period_end - timedelta(days=6)

    return {
        "generated_at": today,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "headline": f"HK RWA Policy Brief — Week of {today}",
        "highlights": highlights or [
            "No new RWA-relevant announcements this week. Check individual source websites for the latest updates."
        ],
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main(args: argparse.Namespace) -> int:
    data = load_existing_json()
    today = date.today().isoformat()

    if args.weekly:
        # Regenerate weekly brief from existing data only
        data["weekly_brief"] = generate_weekly_brief(data.get("policy_updates", []))
        data["meta"]["last_compiled"] = today
        if not args.dry_run:
            write_atomic(OUT_FILE, data)
        else:
            log.info("[dry-run] Would write updated weekly brief")
        return 0

    # ── Scraping phase ────────────────────────────────────────────────────────
    existing_urls = {u.get("url") for u in data.get("policy_updates", [])}
    new_items: list[dict] = []

    for source in SOURCES:
        log.info("Checking %s (%s)", source["label"], source["url"])
        html = fetch_url(source["url"])
        if not html:
            continue

        # Basic relevance check on the page content
        if not is_rwa_relevant(html):
            log.info("  → No RWA-relevant content detected on page")
            continue

        # If page itself is relevant but we can't extract individual articles yet,
        # log for manual review. Full per-article scraping requires site-specific
        # CSS selectors — add them as each source's structure is documented.
        log.info(
            "  → Page appears RWA-relevant (keyword match). "
            "Per-article extraction not yet implemented for %s — "
            "add CSS selectors to parse individual items.",
            source["label"],
        )

        # NOTE: Full article-level scraping is a TODO.
        # To implement: parse the HTML with BeautifulSoup, extract article links,
        # fetch each article, run AI analysis, and append to new_items.
        # See CLAUDE.md Policy Tracker spec for the data schema.
        time.sleep(1)  # polite crawl delay

    if new_items:
        # Deduplicate by URL
        for item in new_items:
            if item.get("url") not in existing_urls:
                data.setdefault("policy_updates", []).append(item)
                existing_urls.add(item.get("url"))
        log.info("Added %d new items", len(new_items))
    else:
        log.info("No new items found in this run")

    # Always refresh weekly brief and metadata
    data["weekly_brief"] = generate_weekly_brief(data.get("policy_updates", []))
    data.setdefault("meta", {})["last_compiled"] = today

    if not args.dry_run:
        write_atomic(OUT_FILE, data)
    else:
        log.info("[dry-run] Would write %d total items", len(data.get("policy_updates", [])))

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RWA-Index Policy Tracker fetcher")
    parser.add_argument("--weekly", action="store_true", help="Regenerate weekly brief only")
    parser.add_argument("--dry-run", action="store_true", help="Scrape without writing output")
    sys.exit(main(parser.parse_args()))
