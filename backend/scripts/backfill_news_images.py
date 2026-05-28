"""
One-time backfill: fetch og:image for existing news items that have no image_url.

Run: python3 scripts/backfill_news_images.py
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from scripts._image_utils import download_image, fetch_og_image

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

DELAY_BETWEEN_ITEMS = 0.5  # seconds — be gentle on source sites


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with session_factory() as session:
        rows = (await session.execute(
            text("""
                SELECT id, source_url
                FROM intelligence_items
                WHERE image_url IS NULL
                  AND tier = 'news'
                  AND source_url IS NOT NULL
                ORDER BY created_at DESC
            """)
        )).fetchall()

    total = len(rows)
    logger.info("Found %d news items without image_url", total)

    ok = 0
    failed = 0

    async with session_factory() as session:
        for i, (item_id, source_url) in enumerate(rows, 1):
            img_url = fetch_og_image(source_url)
            local_path = download_image(img_url, str(item_id)) if img_url else None

            if local_path:
                await session.execute(
                    text("UPDATE intelligence_items SET image_url = :p WHERE id = :id"),
                    {"p": local_path, "id": item_id},
                )
                await session.commit()
                ok += 1
                logger.info("[%d/%d] ✓ %s → %s", i, total, str(item_id)[:8], local_path)
            else:
                failed += 1
                logger.info("[%d/%d] — no image for %s", i, total, str(source_url)[:60])

            time.sleep(DELAY_BETWEEN_ITEMS)

    await engine.dispose()
    logger.info(
        "Backfill complete — success: %d / fallback (no image): %d / total: %d",
        ok, failed, total,
    )


if __name__ == "__main__":
    asyncio.run(main())
