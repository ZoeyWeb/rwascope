"""
CMC Tokenized Assets Fetcher

Pulls 5 RWA-related CMC categories (Tokenized Stock/Gold/Silver/ETFs/T-Bills)
and upserts all coins into tokenized_assets + tokenized_category_summary tables.

Run: python scripts/fetch_tokenized_assets.py
Cron: 15 */6 * * * cd /opt/rwascope-backend && /opt/rwascope-backend/venv/bin/python scripts/fetch_tokenized_assets.py >> /tmp/rwascope-cmc.log 2>&1
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from app.models.market import TokenizedAsset, TokenizedCategorySummary

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("fetch_tokenized_assets")

CMC_BASE = "https://pro-api.coinmarketcap.com"
_key_path = Path("/etc/rwascope/cmc.key")
KEY = _key_path.read_text().strip() if _key_path.exists() else os.environ.get("CMC_API_KEY", "")
HEADERS = {"X-CMC_PRO_API_KEY": KEY, "Accept": "application/json"}

CATEGORY_NAME_MAP = {
    "Tokenized Stock": "stock",
    "Tokenized Gold": "gold",
    "Tokenized Silver": "silver",
    "Tokenized ETFs": "etf",
    "Tokenized Treasury Bills (T-Bills)": "tbill",
}


def cmc_get(path: str, **params) -> dict:
    r = requests.get(f"{CMC_BASE}{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    body = r.json()
    status = body.get("status", {})
    log.info("%s  credits=%s  ec=%s", path, status.get("credit_count"), status.get("error_code"))
    return body


def resolve_categories() -> dict:
    body = cmc_get("/v1/cryptocurrency/categories", limit=200)
    out: dict = {}
    for c in body["data"]:
        key = CATEGORY_NAME_MAP.get(c["name"])
        if key:
            out[key] = {
                "id": c["id"],
                "name": c["name"],
                "num_tokens": c.get("num_tokens"),
                "market_cap": c.get("market_cap"),
                "avg_change_24h": c.get("avg_price_change"),
            }
    missing = set(CATEGORY_NAME_MAP.values()) - set(out.keys())
    if missing:
        log.warning("categories not found in CMC response: %s", missing)
    log.info("resolved %d categories: %s", len(out), list(out.keys()))
    return out


def fetch_category_tokens(cmc_cat_id: str) -> list:
    body = cmc_get("/v1/cryptocurrency/category", id=cmc_cat_id, limit=200)
    return body["data"]["coins"]


async def upsert(session: AsyncSession, cats: dict) -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for key, meta in cats.items():
        row = await session.get(TokenizedCategorySummary, key)
        payload = dict(
            cmc_category_id=meta["id"],
            cmc_category_name=meta["name"],
            num_tokens=meta["num_tokens"],
            market_cap_usd=meta["market_cap"],
            avg_price_change_24h=meta["avg_change_24h"],
        )
        if row:
            for k, v in payload.items():
                setattr(row, k, v)
        else:
            session.add(TokenizedCategorySummary(category=key, **payload))

    seen_ids: set = set()
    for key, meta in cats.items():
        try:
            coins = fetch_category_tokens(meta["id"])
        except Exception as e:
            log.error("fetch category %s (%s) failed: %s", key, meta["id"], e)
            continue

        for c in coins:
            tid = str(c["id"])
            seen_ids.add(tid)
            quote = (c.get("quote") or {}).get("USD") or {}
            platform = c.get("platform") or {}

            raw_ts = quote.get("last_updated")
            if raw_ts:
                try:
                    last_updated = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    last_updated = now
            else:
                last_updated = now

            payload = dict(
                symbol=c.get("symbol"),
                name=c.get("name"),
                category=key,
                cmc_rank=c.get("cmc_rank"),
                price_usd=quote.get("price"),
                market_cap_usd=quote.get("market_cap"),
                volume_24h_usd=quote.get("volume_24h"),
                percent_change_1h=quote.get("percent_change_1h"),
                percent_change_24h=quote.get("percent_change_24h"),
                percent_change_7d=quote.get("percent_change_7d"),
                network=platform.get("name"),
                last_updated=last_updated,
            )
            row = await session.get(TokenizedAsset, tid)
            if row:
                for k, v in payload.items():
                    setattr(row, k, v)
            else:
                session.add(TokenizedAsset(id=tid, **payload))

    await session.commit()
    log.info("upsert done — %d unique tokens across %d categories", len(seen_ids), len(cats))


async def main() -> None:
    cats = resolve_categories()
    if not cats:
        log.error("no categories resolved, aborting")
        sys.exit(1)

    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with session_factory() as session:
        await upsert(session, cats)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
