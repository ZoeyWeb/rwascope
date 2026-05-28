import uuid
from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


# ── Narrative Thread ──────────────────────────────────────────────────────────

class NarrativeThreadCreate(BaseModel):
    slug: str = Field(..., max_length=200)
    name: str = Field(..., max_length=300)
    description: Optional[str] = Field(None, max_length=2000)
    status: str = Field("active", max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    related_event_ids: list[str] = []
    expected_next_events: Optional[list] = None


class NarrativeThreadUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    related_event_ids: Optional[list[str]] = None
    expected_next_events: Optional[list] = None


class NarrativeThreadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    description: Optional[str]
    status: str
    color: Optional[str]
    related_event_ids: list[str]
    expected_next_events: Optional[list] = None
    # weekly_new_count is computed at query time, not stored
    weekly_new_count: int = 0
    created_at: datetime
    updated_at: datetime


# ── Editor Note ───────────────────────────────────────────────────────────────

class EditorNoteCreate(BaseModel):
    week_label: str = Field(..., max_length=50)
    title: Optional[str] = Field(None, max_length=300)
    content: str = Field(..., max_length=20000)
    related_event_ids: list[str] = []
    author: str = Field("RWAscope Research", max_length=200)
    status: str = Field("draft", max_length=50)
    published_at: Optional[datetime] = None


class EditorNoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    content: Optional[str] = Field(None, max_length=20000)
    related_event_ids: Optional[list[str]] = None
    author: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, max_length=50)
    published_at: Optional[datetime] = None


class EditorNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    week_label: str
    published_at: Optional[datetime]
    title: Optional[str]
    content: str
    related_event_ids: list[str]
    author: str
    status: str
    created_at: datetime


# ── Intelligence Item (DB-backed) ─────────────────────────────────────────────

class IntelligenceItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: Optional[str]
    region: Optional[str]
    title: str
    event_date: Optional[date]
    source_url: Optional[str]
    policy_summary: Optional[str]
    market_impact: Optional[dict]
    rwa_relevant: bool
    status: str
    event_type: str
    is_data_snapshot: bool
    source_entity: Optional[str]
    data_source: Optional[str]
    significance: Optional[str]
    narrative_impact_note: Optional[str] = None
    policy_impact: Optional[dict] = None
    tier: Literal['milestone', 'news', 'forward'] = 'news'
    stablecoin_relevant: bool = False
    image_url: Optional[str] = None
    created_at: datetime


class IntelligenceItemUpdate(BaseModel):
    title: Optional[str] = None
    policy_summary: Optional[str] = None
    market_impact: Optional[dict] = None
    policy_impact: Optional[dict] = None
    narrative_impact_note: Optional[str] = None
    rwa_relevant: Optional[bool] = None
    event_date: Optional[date] = None
    category: Optional[str] = None
    region: Optional[str] = None
    significance: Optional[str] = None
    event_type: Optional[str] = None


# ── Narrative Subscription ─────────────────────────────────────────────────────

class NarrativeSubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    narrative_id: uuid.UUID
    notification_preference: str
    subscribed_at: datetime
