#!/usr/bin/env python3
"""
generate_data_milestones.py — RWA-Index Data Milestone Generator

Reads the latest leaderboard.json from DeFiLlama data and detects TVL milestones,
writing new intelligence_items (event_type='data_milestone') to intelligence.json.

Cron: 0 3 * * * python3 /opt/rwascope-backend/scripts/generate_data_milestones.py
      (runs after fetch_leaderboard.py which runs at 0 2 * * *)

Trigger thresholds:
  - Global TVL crosses $10B / $20B / $50B / $100B
  - Protocol TVL crosses $1B / $5B / $10B
  - Protocol week-over-week growth > 10%
"""
from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import date, datetime, timezone
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("generate_data_milestones")

LEADERBOARD_PATH = os.environ.get(
    "LEADERBOARD_JSON_PATH",
    "/var/www/rwascope/data/leaderboard.json",
)
SEED_LEADERBOARD = os.path.join(
    os.path.dirname(__file__), "../../web/public/data/leaderboard.json"
)
INTELLIGENCE_PATH = os.environ.get(
    "INTELLIGENCE_JSON_PATH",
    os.path.join(os.path.dirname(__file__), "../../web/public/data/intelligence/intelligence.json"),
)
STATE_FILE = os.path.join(os.path.dirname(__file__), ".milestone_state.json")

# TVL thresholds in USD
GLOBAL_TVL_THRESHOLDS = [10e9, 20e9, 50e9, 100e9]
PROTOCOL_TVL_THRESHOLDS = [1e9, 5e9, 10e9]
GROWTH_THRESHOLD = 0.10  # 10% WoW


def _load_json(path: str, fallback: str | None = None) -> Any:
    for p in [path, fallback]:
        if p and os.path.exists(p):
            try:
                with open(p, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as exc:
                log.warning("Failed to read %s: %s", p, exc)
    return None


def _load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"crossed_global": [], "crossed_protocols": {}, "last_tvl": {}}


def _save_state(state: dict) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def _usd(v: float) -> str:
    if v >= 1e9:
        return f"${v/1e9:.0f}B"
    if v >= 1e6:
        return f"${v/1e6:.0f}M"
    return f"${v:.0f}"


def _make_item(
    title: str,
    summary: str,
    capital_flow: str,
    significance: str,
    tags: list[str],
) -> dict:
    today = date.today().isoformat()
    return {
        "id": f"data-milestone-{uuid.uuid4().hex[:8]}",
        "category": "global_policy",
        "region": "global",
        "event_type": "data_milestone",
        "is_data_snapshot": True,
        "source_entity": "DeFiLlama",
        "title": title,
        "event_date": today,
        "source_url": "https://defillama.com/",
        "source_name": "DeFiLlama",
        "policy_summary": summary,
        "key_changes": [],
        "market_impact": {
            "benefited_sectors": ["RWA tokenization platforms"],
            "affected_entity_types": [],
            "capital_flow": capital_flow,
            "hk_relevance": None,
        },
        "rwa_relevant": True,
        "tags": tags,
        "significance": significance,
        "timeline_significance": "",
        "source_note": "Auto-generated from DeFiLlama data · verify against source",
    }


def detect_milestones(leaderboard: dict, state: dict) -> list[dict]:
    items: list[dict] = []
    protocols: list[dict] = leaderboard.get("protocols", leaderboard.get("items", []))

    # Compute global TVL
    global_tvl = sum(float(p.get("tvl", 0) or 0) for p in protocols)

    # Global threshold crossings
    crossed_global: list[float] = state.get("crossed_global", [])
    for threshold in GLOBAL_TVL_THRESHOLDS:
        if global_tvl >= threshold and threshold not in crossed_global:
            items.append(_make_item(
                title=f"Global RWA TVL Crosses {_usd(threshold)}",
                summary=f"Total value locked across tracked RWA/tokenization protocols reached {_usd(global_tvl)}, surpassing the {_usd(threshold)} milestone. Data sourced from DeFiLlama.",
                capital_flow=f"Aggregate institutional capital in tokenized assets exceeded {_usd(threshold)}, indicating sustained growth in on-chain RWA adoption.",
                significance="landmark" if threshold >= 50e9 else "major",
                tags=["tvl", "data", "defillama", "milestone"],
            ))
            crossed_global.append(threshold)
    state["crossed_global"] = crossed_global

    # Per-protocol threshold crossings + growth detection
    crossed_protocols: dict[str, list[float]] = state.get("crossed_protocols", {})
    last_tvl: dict[str, float] = state.get("last_tvl", {})

    for protocol in protocols:
        name = protocol.get("name", "")
        tvl = float(protocol.get("tvl", 0) or 0)
        if not name or tvl <= 0:
            continue

        slug = name.lower().replace(" ", "-")
        crossed = crossed_protocols.get(slug, [])

        for threshold in PROTOCOL_TVL_THRESHOLDS:
            if tvl >= threshold and threshold not in crossed:
                items.append(_make_item(
                    title=f"{name} TVL Crosses {_usd(threshold)}",
                    summary=f"{name} total value locked reached {_usd(tvl)}, crossing the {_usd(threshold)} milestone. Source: DeFiLlama.",
                    capital_flow=f"{name} has accumulated {_usd(tvl)} in tokenized assets, reflecting institutional confidence in this RWA protocol.",
                    significance="major" if threshold >= 5e9 else "notable",
                    tags=["tvl", name.lower(), "data", "defillama"],
                ))
                crossed.append(threshold)
        crossed_protocols[slug] = crossed

        # Week-over-week growth
        prev_tvl = last_tvl.get(slug, 0)
        if prev_tvl > 0 and tvl > prev_tvl:
            growth = (tvl - prev_tvl) / prev_tvl
            if growth >= GROWTH_THRESHOLD:
                items.append(_make_item(
                    title=f"{name} TVL Up {growth*100:.0f}% (week-over-week)",
                    summary=f"{name} TVL increased from {_usd(prev_tvl)} to {_usd(tvl)}, a {growth*100:.1f}% week-over-week gain. Source: DeFiLlama.",
                    capital_flow=f"Weekly inflows into {name} accelerated significantly, suggesting institutional accumulation or a major product launch.",
                    significance="notable",
                    tags=["tvl", "growth", name.lower(), "data"],
                ))

        last_tvl[slug] = tvl

    state["crossed_protocols"] = crossed_protocols
    state["last_tvl"] = last_tvl
    return items


def main() -> None:
    leaderboard = _load_json(LEADERBOARD_PATH, SEED_LEADERBOARD)
    if not leaderboard:
        log.error("No leaderboard data found. Aborting.")
        return

    intelligence = _load_json(INTELLIGENCE_PATH)
    if not intelligence:
        log.error("No intelligence.json found. Aborting.")
        return

    state = _load_state()
    new_items = detect_milestones(leaderboard, state)

    if not new_items:
        log.info("No new milestones detected.")
        _save_state(state)
        return

    existing_ids = {i.get("id") for i in intelligence.get("intelligence_items", [])}
    added = 0
    for item in new_items:
        if item["id"] not in existing_ids:
            intelligence["intelligence_items"].append(item)
            log.info("Added milestone: %s", item["title"])
            added += 1

    intelligence["meta"]["last_compiled"] = date.today().isoformat()

    with open(INTELLIGENCE_PATH, "w", encoding="utf-8") as f:
        json.dump(intelligence, f, indent=2, ensure_ascii=False)

    _save_state(state)
    log.info("Done. Added %d milestone item(s) to intelligence.json.", added)


if __name__ == "__main__":
    main()
