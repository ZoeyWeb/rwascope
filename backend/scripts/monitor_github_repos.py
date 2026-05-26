"""
GitHub release monitor for intelligence item collection.

Polls a list of RWA project repositories for new releases in the last 30 days,
then inserts pending intelligence_items records.

Run: python3 scripts/monitor_github_repos.py
Cron: 0 */6 * * * python3 /opt/rwascope-backend/scripts/monitor_github_repos.py

Required env var (backend/.env):
  GITHUB_TOKEN — GitHub personal access token (read:public_repo scope is enough)
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import uuid
from datetime import date, datetime, timezone, timedelta

import requests

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

GITHUB_TOKEN = settings.github_token
LOOKBACK_DAYS = 30

logger.debug(
    "GitHub config — token=%s",
    (GITHUB_TOKEN[:4] + "..." if GITHUB_TOKEN else "<not set>"),
)

GITHUB_REPOS = [
    "ondofinance/usdy-contracts",
    "centrifuge/tinlake",
    "maple-labs/maple-core",
    "goldfinch-eng/mono",
    "mstable/mStable-contracts",
    "centrifuge/apps",
    "credbull/credbull-defi",
]

_GITHUB_API = "https://api.github.com"
_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if GITHUB_TOKEN:
    _HEADERS["Authorization"] = f"token {GITHUB_TOKEN}"


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_releases(owner: str, repo: str) -> list[dict] | None:
    """Fetch releases for a repo. Returns None on rate-limit. Empty list on 404."""
    url = f"{_GITHUB_API}/repos/{owner}/{repo}/releases"
    for attempt in (1, 2):
        try:
            resp = requests.get(url, headers=_HEADERS, timeout=15)
        except requests.RequestException as exc:
            logger.warning("[%s/%s] request error (attempt %d): %s", owner, repo, attempt, exc)
            if attempt == 2:
                return []
            continue

        if resp.status_code == 404:
            logger.warning("[%s/%s] repo not found or private — skipping", owner, repo)
            return []
        if resp.status_code == 403 and "rate limit" in resp.text.lower():
            logger.error("GitHub API rate limit exceeded — aborting")
            return None  # signal to abort all further processing
        if resp.status_code != 200:
            logger.warning("[%s/%s] unexpected status %d — skipping", owner, repo, resp.status_code)
            return []
        return resp.json()

    return []


def _parse_published(iso: str | None) -> date | None:
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).date()
    except Exception:
        return None


# ── Main logic ─────────────────────────────────────────────────────────────────

async def process_repo(
    repo_path: str,
    session: AsyncSession,
    cutoff: date,
    stats: dict,
) -> bool:
    """Returns False if caller should abort (rate limit hit)."""
    owner, repo = repo_path.split("/", 1)
    releases = _get_releases(owner, repo)
    if releases is None:
        return False  # rate limit — abort

    fetched = len(releases)
    inserted = 0
    skipped = 0

    for rel in releases:
        pub_date = _parse_published(rel.get("published_at") or rel.get("created_at"))
        if pub_date and pub_date < cutoff:
            skipped += 1
            continue

        tag = rel.get("tag_name", "")
        html_url = rel.get("html_url", "")
        name = rel.get("name") or tag
        body = (rel.get("body") or "")[:300].strip()
        title = f"{repo} {tag} released"
        if name and name != tag:
            title = f"{repo} {name} released"

        if not html_url:
            skipped += 1
            continue

        # Dedup
        existing = await session.execute(
            text("SELECT 1 FROM intelligence_items WHERE source_url = :url"),
            {"url": html_url},
        )
        if existing.first():
            skipped += 1
            continue

        await session.execute(
            text("""
                INSERT INTO intelligence_items
                  (id, category, region, title, event_date, source_url,
                   raw_content, policy_summary, rwa_relevant, status,
                   event_type, is_data_snapshot, source_entity, data_source, significance)
                VALUES
                  (:id, 'global_policy', 'global', :title, :event_date, :source_url,
                   :raw_content, :policy_summary, true, 'pending',
                   'project', false, :source_entity, 'github', 'notable')
            """),
            {
                "id": uuid.uuid4(),
                "title": title[:500],
                "event_date": pub_date,
                "source_url": html_url,
                "raw_content": body,
                "policy_summary": body[:200] if body else title,
                "source_entity": owner,
            },
        )
        await session.commit()
        inserted += 1

    stats["fetched"] += fetched
    stats["inserted"] += inserted
    stats["skipped"] += skipped
    logger.info("[%s/%s] fetched=%d  inserted=%d  skipped=%d", owner, repo, fetched, inserted, skipped)
    return True


async def main() -> None:
    if not GITHUB_TOKEN:
        logger.warning("GITHUB_TOKEN not set — requests are unauthenticated (60 req/h limit)")

    cutoff = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).date()
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    stats = {"fetched": 0, "inserted": 0, "skipped": 0}

    async with session_factory() as session:
        for repo_path in GITHUB_REPOS:
            ok = await process_repo(repo_path, session, cutoff, stats)
            if not ok:
                logger.error("Aborting remaining repos due to rate limit")
                break

    await engine.dispose()
    logger.info(
        "GitHub run complete — fetched=%d  inserted=%d  skipped=%d",
        stats["fetched"], stats["inserted"], stats["skipped"],
    )


if __name__ == "__main__":
    asyncio.run(main())
