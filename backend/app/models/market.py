from sqlalchemy import Column, String, Float, Integer, DateTime, Index
from sqlalchemy.sql import func
from app.database import Base


class TokenizedAsset(Base):
    __tablename__ = "tokenized_assets"

    id = Column(String, primary_key=True)
    symbol = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    cmc_rank = Column(Integer)
    price_usd = Column(Float)
    market_cap_usd = Column(Float)
    volume_24h_usd = Column(Float)
    percent_change_1h = Column(Float)
    percent_change_24h = Column(Float)
    percent_change_7d = Column(Float)
    network = Column(String)
    last_updated = Column(DateTime)
    fetched_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (Index("ix_tokenized_assets_cat_mcap", "category", "market_cap_usd"),)


class TokenizedCategorySummary(Base):
    __tablename__ = "tokenized_category_summary"

    category = Column(String, primary_key=True)
    cmc_category_id = Column(String, nullable=False)
    cmc_category_name = Column(String, nullable=False)
    num_tokens = Column(Integer)
    market_cap_usd = Column(Float)
    avg_price_change_24h = Column(Float)
    fetched_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
