#!/usr/bin/env python3
"""
Weekly RWA Intelligence Brief mailer.

Reads the current intelligence.json (written by fetch_intelligence.py --weekly),
queries active newsletter subscribers, and sends each one the weekly brief via Resend.

Cron: 0 9 * * 1  (Monday 09:00 HKT — runs after fetch_intelligence.py --weekly at 08:00)
Log:  /opt/rwascope/logs/newsletter.log

Usage:
  python scripts/send_weekly_policy.py
  python scripts/send_weekly_policy.py --dry-run   # print recipients, don't send
"""
import argparse
import json
import logging
import sys
from pathlib import Path

# Allow running from the backend/ directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.newsletter import NewsletterSubscriber
from app.core.email import send_weekly_policy_brief

INTELLIGENCE_JSON = Path("/var/www/rwascope/data/intelligence/intelligence.json")
# Fallback for local dev
INTELLIGENCE_JSON_DEV = (
    Path(__file__).resolve().parent.parent.parent
    / "web/public/data/intelligence/intelligence.json"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


def load_intelligence() -> dict:
    path = INTELLIGENCE_JSON if INTELLIGENCE_JSON.exists() else INTELLIGENCE_JSON_DEV
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main(dry_run: bool = False) -> None:
    data = load_intelligence()
    brief = data.get("weekly_brief")
    if not brief or not brief.get("highlights"):
        logger.error("No weekly_brief found in intelligence.json — run fetch_intelligence.py --weekly first")
        sys.exit(1)

    all_items = data.get("intelligence_items", [])
    week_count = sum(
        1 for item in all_items
        if item.get("rwa_relevant") and item.get("event_date", "") >= brief["period_start"]
    )

    engine = create_engine(settings.sync_database_url)
    with Session(engine) as session:
        rows = session.execute(
            select(NewsletterSubscriber).where(NewsletterSubscriber.is_active.is_(True))
        ).scalars().all()

    logger.info(
        "Weekly brief '%s' | %d subscriber(s) | %d item(s) | dry_run=%s",
        brief["headline"], len(rows), week_count, dry_run,
    )

    sent = skipped = 0
    for sub in rows:
        if dry_run:
            logger.info("  DRY RUN → %s", sub.email)
            continue
        ok = send_weekly_policy_brief(
            to=sub.email,
            unsubscribe_token=sub.unsubscribe_token,
            headline=brief["headline"],
            period_start=brief["period_start"],
            period_end=brief["period_end"],
            highlights=brief["highlights"],
            item_count=week_count,
        )
        if ok:
            sent += 1
        else:
            skipped += 1
            logger.warning("Failed to send to %s", sub.email)

    if not dry_run:
        logger.info("Done. sent=%d failed=%d", sent, skipped)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
