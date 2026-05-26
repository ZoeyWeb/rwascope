#!/usr/bin/env python3
"""
auto_enrich_narratives.py — AI enrichment for narrative threads and intelligence items.

Steps
-----
1. Load all active narrative_threads from DB.
2. For each narrative missing a description (or --force):
     - Call DeepSeek → description (80-120 words) + 3 expected_next_events.
     - Update DB.
3. Load all non-rejected rwa_relevant intelligence_items from DB.
4. For each item missing policy_impact (or --force):
     - Call DeepSeek → 4-layer PolicyImpact JSON.
5. For each item, call DeepSeek → match narrative slugs (content similarity).
6. Apply all narrative → item links and commit.

Usage (from backend/ directory, venv activated):
    python scripts/auto_enrich_narratives.py
    python scripts/auto_enrich_narratives.py --force          # re-enrich everything
    python scripts/auto_enrich_narratives.py --narratives     # narrative threads only
    python scripts/auto_enrich_narratives.py --items          # intelligence items only
    python scripts/auto_enrich_narratives.py --limit 20       # cap items processed
    python scripts/auto_enrich_narratives.py --concurrency 5  # API parallelism

Cron:
    0 3 * * * python3 /opt/rwascope-backend/scripts/auto_enrich_narratives.py
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm.attributes import flag_modified

from app.config import settings
from app.models.intelligence import IntelligenceItem, NarrativeThread

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )


def _parse_json(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        lines = [ln for ln in text.split("\n") if not ln.startswith("```")]
        text = "\n".join(lines).strip()
    return json.loads(text)


async def _with_retry(coro_fn, label: str, max_retries: int = 3, base_delay: float = 2.0):
    """Call an async factory with exponential-backoff retry. Raises on final failure."""
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            return await coro_fn()
        except Exception as exc:
            last_exc = exc
            delay = base_delay * (2 ** attempt)
            logger.warning(
                "[retry] %s — attempt %d/%d failed: %s — retry in %.1fs",
                label, attempt + 1, max_retries, exc, delay,
            )
            await asyncio.sleep(delay)
    raise last_exc  # type: ignore[misc]


# ── Narrative enrichment ───────────────────────────────────────────────────────

_NARRATIVE_SYS = """\
You are an institutional RWA intelligence analyst writing metadata for a professional
policy-intelligence platform. Output valid JSON only — no prose outside the JSON object.

Rules:
- description: 80-120 words. Explain the core regulatory or market logic driving this
  narrative arc. Neutral, analytical; no investment advice or speculative claims.
- expected_next_events: exactly 3 items in chronological order, each with:
    quarter      — upcoming quarter string, e.g. "Q3 2026" or "Q1 2027"
    description  — 1-2 sentences on what is expected to happen
    impact       — 1-2 sentences on resulting market or regulatory impact
  Base on verifiable regulatory timelines. Use "expected" or "estimated" for uncertain items.
"""


async def _enrich_narrative(narr: NarrativeThread, ds: AsyncOpenAI) -> dict | None:
    prompt = (
        f'Narrative thread: "{narr.name}"\n'
        f"Current description: {narr.description or '(none)'}\n"
        f"Related event count: {len(narr.related_event_ids or [])}\n\n"
        "Return JSON:\n"
        "{\n"
        '  "description": "<80-120 words>",\n'
        '  "expected_next_events": [\n'
        '    {"quarter": "...", "description": "...", "impact": "..."},\n'
        "    ... (exactly 3 items)\n"
        "  ]\n"
        "}"
    )

    async def _call():
        r = await ds.chat.completions.create(
            model=settings.deepseek_model,
            messages=[
                {"role": "system", "content": _NARRATIVE_SYS},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=1024,
            timeout=30,
        )
        return _parse_json(r.choices[0].message.content or "{}")

    try:
        result = await _with_retry(_call, label=f"narrative/{narr.slug}")
        logger.info("[narrative] enriched  slug=%s", narr.slug)
        return result
    except Exception as exc:
        logger.error("[narrative] FAILED    slug=%s  err=%s", narr.slug, exc)
        return None


# ── Policy-impact generation ───────────────────────────────────────────────────

_IMPACT_SYS = """\
You are an institutional RWA intelligence analyst. Generate a 4-layer Policy→Market
impact analysis for each regulatory event. Output valid JSON only.

Schema:
{
  "benefited_sectors":  ["<sector type>", ...],  // 2-4 items; sector TYPES, not company names
  "affected_entities":  ["<entity type>", ...],  // 2-4 items; entity TYPES negatively impacted
  "capital_flow": {
    "from":             "<source of capital reallocation>",
    "to":               "<destination of capital reallocation>",
    "estimated_scale":  "<scale estimate, or null>",
    "timeframe":        "<timeframe, or null>"
  }
}

Rules:
- Describe sector/entity *types* only — never invent specific company names.
- capital_flow describes where capital will move as a result of this policy event.
- estimated_scale: use ranges like "USD 5-20B" or "undisclosed"; null if not applicable.
- Objective analysis only; no investment advice.
"""


async def _generate_policy_impact(item: IntelligenceItem, ds: AsyncOpenAI) -> dict | None:
    summary = item.policy_summary or (item.raw_content or "")[:600]
    prompt = (
        f"Title: {item.title}\n"
        f"Region: {item.region} | Event type: {item.event_type} | Date: {item.event_date}\n"
        f"Summary: {summary}\n\n"
        "Generate a PolicyImpact JSON for this event."
    )

    async def _call():
        r = await ds.chat.completions.create(
            model=settings.deepseek_model,
            messages=[
                {"role": "system", "content": _IMPACT_SYS},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=768,
            timeout=30,
        )
        return _parse_json(r.choices[0].message.content or "{}")

    try:
        result = await _with_retry(_call, label=f"impact/{item.id}")
        logger.info("[item]  policy_impact  id=%s  title=%.50s", item.id, item.title)
        return result
    except Exception as exc:
        logger.error("[item]  FAILED impact  id=%s  err=%s", item.id, exc)
        return None


# ── Narrative matching ─────────────────────────────────────────────────────────

_MATCH_SYS = """\
You are an RWA intelligence classifier. Match intelligence events to relevant narrative
threads. Return valid JSON only: {"matching_slugs": ["slug1", ...]}
Return an empty list when no clear topical match exists. Include a slug only if the event
clearly and directly advances or is part of that narrative arc.
"""


async def _match_narratives(
    item: IntelligenceItem,
    narratives: list[NarrativeThread],
    ds: AsyncOpenAI,
) -> list[str]:
    if not narratives:
        return []

    narr_list = "\n".join(f"  - {n.slug}: {n.name}" for n in narratives)
    prompt = (
        f"Event: {item.title}\n"
        f"Region: {item.region} | Type: {item.event_type}\n"
        f"Summary: {(item.policy_summary or '')[:300]}\n\n"
        f"Available narrative slugs:\n{narr_list}\n\n"
        'Which slugs clearly match this event? Return: {"matching_slugs": [...]}'
    )

    valid_slugs = {n.slug for n in narratives}

    async def _call():
        r = await ds.chat.completions.create(
            model=settings.deepseek_model,
            messages=[
                {"role": "system", "content": _MATCH_SYS},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=128,
            timeout=15,
        )
        result = _parse_json(r.choices[0].message.content or "{}")
        return [s for s in result.get("matching_slugs", []) if s in valid_slugs]

    try:
        return await _with_retry(_call, label=f"match/{item.id}")
    except Exception as exc:
        logger.error("[item]  FAILED match   id=%s  err=%s", item.id, exc)
        return []


# ── Main ───────────────────────────────────────────────────────────────────────

async def main(
    *,
    force: bool,
    narratives_only: bool,
    items_only: bool,
    limit: int | None,
    concurrency: int,
) -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    ds = _client()
    sem = asyncio.Semaphore(concurrency)

    stats: dict[str, int] = {
        "narr_enriched": 0, "narr_skipped": 0, "narr_failed": 0,
        "item_enriched": 0, "item_skipped": 0, "item_failed": 0,
        "links_added": 0,
    }

    async with async_session() as session:

        # ── 1. Load active narrative threads ──────────────────────────────────
        rows = await session.execute(
            select(NarrativeThread).where(NarrativeThread.status == "active")
        )
        narratives: list[NarrativeThread] = list(rows.scalars().all())
        logger.info("[state] %d active narrative threads", len(narratives))
        narrative_by_slug: dict[str, NarrativeThread] = {n.slug: n for n in narratives}

        # ── 2. Enrich narrative threads ────────────────────────────────────────
        if not items_only:
            async def _do_narrative(narr: NarrativeThread) -> None:
                async with sem:
                    if not force and narr.description:
                        logger.info("[narrative] skip      slug=%s (has description)", narr.slug)
                        stats["narr_skipped"] += 1
                        return
                    result = await _enrich_narrative(narr, ds)
                    if result:
                        desc = result.get("description", "").strip()
                        next_evts = result.get("expected_next_events")
                        if desc:
                            narr.description = desc
                        if next_evts and isinstance(next_evts, list):
                            narr.expected_next_events = next_evts
                            flag_modified(narr, "expected_next_events")
                        stats["narr_enriched"] += 1
                    else:
                        stats["narr_failed"] += 1

            await asyncio.gather(*[_do_narrative(n) for n in narratives])
            await session.commit()
            logger.info(
                "[narrative] done — enriched=%d  skipped=%d  failed=%d",
                stats["narr_enriched"], stats["narr_skipped"], stats["narr_failed"],
            )

        if narratives_only:
            await engine.dispose()
            return

        # ── 3. Load intelligence items ─────────────────────────────────────────
        q = (
            select(IntelligenceItem)
            .where(
                IntelligenceItem.rwa_relevant == True,
                IntelligenceItem.status != "rejected",
            )
            .order_by(IntelligenceItem.created_at.desc())
        )
        if limit:
            q = q.limit(limit)

        rows = await session.execute(q)
        items: list[IntelligenceItem] = list(rows.scalars().all())
        logger.info("[state] %d items to process (limit=%s)", len(items), limit)

        # ── 4. Generate policy_impact for each item ────────────────────────────
        async def _do_impact(item: IntelligenceItem) -> None:
            async with sem:
                if not force and item.policy_impact:
                    stats["item_skipped"] += 1
                    return
                result = await _generate_policy_impact(item, ds)
                if result:
                    item.policy_impact = result
                    flag_modified(item, "policy_impact")
                    stats["item_enriched"] += 1
                else:
                    stats["item_failed"] += 1

        await asyncio.gather(*[_do_impact(i) for i in items])
        await session.commit()
        logger.info(
            "[item] impact done — enriched=%d  skipped=%d  failed=%d",
            stats["item_enriched"], stats["item_skipped"], stats["item_failed"],
        )

        # ── 5. Match items to narratives ───────────────────────────────────────
        # Collect (item_id_str, slug) pairs without in-flight mutation races.
        pending_links: list[tuple[str, str]] = []

        async def _do_match(item: IntelligenceItem) -> None:
            async with sem:
                matched = await _match_narratives(item, narratives, ds)
                for slug in matched:
                    pending_links.append((str(item.id), slug))
                if matched:
                    logger.info(
                        "[item]  matched  id=%s → %s",
                        str(item.id)[:8], ", ".join(matched),
                    )

        await asyncio.gather(*[_do_match(i) for i in items])

        # Apply links (sequential, no race conditions)
        for item_id_str, slug in pending_links:
            narr = narrative_by_slug.get(slug)
            if narr:
                current = set(narr.related_event_ids or [])
                if item_id_str not in current:
                    narr.related_event_ids = list(current | {item_id_str})
                    flag_modified(narr, "related_event_ids")
                    stats["links_added"] += 1

        await session.commit()

    logger.info(
        "[done] narratives: %d enriched / %d skipped / %d failed",
        stats["narr_enriched"], stats["narr_skipped"], stats["narr_failed"],
    )
    logger.info(
        "[done] items: %d enriched / %d skipped / %d failed | %d narrative links added",
        stats["item_enriched"], stats["item_skipped"], stats["item_failed"],
        stats["links_added"],
    )
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Auto-enrich narrative threads and intelligence items via DeepSeek"
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-enrich fields even when they already have values",
    )
    parser.add_argument(
        "--narratives", action="store_true",
        help="Process narrative threads only (skip intelligence items)",
    )
    parser.add_argument(
        "--items", action="store_true",
        help="Process intelligence items only (skip narrative threads)",
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Maximum number of intelligence items to process",
    )
    parser.add_argument(
        "--concurrency", type=int, default=3,
        help="Maximum concurrent DeepSeek API calls (default: 3)",
    )
    args = parser.parse_args()

    asyncio.run(main(
        force=args.force,
        narratives_only=args.narratives,
        items_only=args.items,
        limit=args.limit,
        concurrency=args.concurrency,
    ))
