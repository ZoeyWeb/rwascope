import uuid
from datetime import date, datetime
from sqlalchemy import Boolean, Date, ForeignKey, String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from app.database import Base


class IntelligenceItem(Base):
    __tablename__ = "intelligence_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    region: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    source_url: Mapped[str | None] = mapped_column(String(2000), nullable=True, unique=True)
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    policy_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    market_impact: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    rwa_relevant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    # New fields from Task 0
    event_type: Mapped[str] = mapped_column(String(20), nullable=False, default="regulation")
    is_data_snapshot: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source_entity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_source: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    significance: Mapped[str | None] = mapped_column(String(20), nullable=True)
    narrative_impact_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    policy_impact: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tier: Mapped[str] = mapped_column(String(20), nullable=False, default="news")
    stablecoin_relevant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class NarrativeThread(Base):
    __tablename__ = "narrative_threads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    related_event_ids: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    expected_next_events: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class EditorNote(Base):
    __tablename__ = "editor_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    week_label: Mapped[str] = mapped_column(String(50), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    related_event_ids: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    author: Mapped[str] = mapped_column(String(100), nullable=False, default="RWAscope Research")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserNarrativeSubscription(Base):
    __tablename__ = "user_narrative_subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narrative_threads.id", ondelete="CASCADE"), primary_key=True
    )
    notification_preference: Mapped[str] = mapped_column(String(10), nullable=False, default="web")
    subscribed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
