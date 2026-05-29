import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.market import TokenizedAsset, TokenizedCategorySummary
from app.schemas.market import MarketSnapshot, TokenizedAssetRead, TokenizedCategorySummaryRead

router = APIRouter(prefix="/market", tags=["market"])

_CACHE: dict = {"ts": 0.0, "payload": None}
_TTL = 300  # 5 min; cron refreshes every 6h

COVERAGE_NOTE = (
    "Coverage based on CoinMarketCap's public token universe. "
    "Permissioned tokenized treasuries (BlackRock BUIDL, Ondo OUSG, Franklin BENJI) "
    "and most tokenized real estate (RealT, Lofty) are not indexed by CMC and absent here. "
    "Cross-reference RWA.xyz and DeFiLlama for institutional-grade coverage."
)


@router.get("/tokenized", response_model=MarketSnapshot)
async def tokenized_snapshot(db: AsyncSession = Depends(get_db)):
    now = time.time()
    if _CACHE["payload"] and now - _CACHE["ts"] < _TTL:
        return _CACHE["payload"]

    sum_rows = (await db.execute(
        select(TokenizedCategorySummary)
    )).scalars().all()

    asset_rows = (await db.execute(
        select(TokenizedAsset).order_by(TokenizedAsset.market_cap_usd.desc().nullslast())
    )).scalars().all()

    fetched_timestamps = [r.fetched_at for r in sum_rows if r.fetched_at] + \
                         [r.fetched_at for r in asset_rows if r.fetched_at]
    last_fetched = max(fetched_timestamps) if fetched_timestamps else datetime.now(timezone.utc)

    payload = MarketSnapshot(
        summary=[TokenizedCategorySummaryRead.model_validate(r) for r in sum_rows],
        assets=[TokenizedAssetRead.model_validate(r) for r in asset_rows],
        coverage_note=COVERAGE_NOTE,
        last_fetched=last_fetched,
    )
    _CACHE["ts"] = now
    _CACHE["payload"] = payload
    return payload
