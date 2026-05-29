from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TokenizedAssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    symbol: str
    name: str
    category: str
    cmc_rank: Optional[int] = None
    price_usd: Optional[float] = None
    market_cap_usd: Optional[float] = None
    volume_24h_usd: Optional[float] = None
    percent_change_1h: Optional[float] = None
    percent_change_24h: Optional[float] = None
    percent_change_7d: Optional[float] = None
    network: Optional[str] = None
    last_updated: Optional[datetime] = None
    fetched_at: Optional[datetime] = None


class TokenizedCategorySummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str
    cmc_category_id: str
    cmc_category_name: str
    num_tokens: Optional[int] = None
    market_cap_usd: Optional[float] = None
    avg_price_change_24h: Optional[float] = None
    fetched_at: Optional[datetime] = None


class MarketSnapshot(BaseModel):
    summary: list[TokenizedCategorySummaryRead]
    assets: list[TokenizedAssetRead]
    coverage_note: str
    last_fetched: datetime
