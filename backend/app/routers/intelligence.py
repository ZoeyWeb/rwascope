"""
Intelligence router — global RWA policy intelligence v2.

GET  /api/intelligence              list items; supports category/region/event_type/is_data_snapshot filters
GET  /api/intelligence/dashboard    aggregated dashboard data (highlights, forward_view, narratives, region_activity, editor_note, recent_timeline)
GET  /api/intelligence/hk           HK Observation entries only
GET  /api/intelligence/weekly       weekly brief card (cached 6h)
GET  /api/intelligence/narratives           list active narrative threads
GET  /api/intelligence/narratives/:slug     events for a single narrative
GET  /api/intelligence/editor-notes         recent editor notes (published)
POST /api/intelligence/editor-notes         create editor note (admin)
GET  /api/intelligence/data-milestones      recent data snapshot events (30 days)
POST /api/intelligence/refresh      admin only — trigger fetch_intelligence.py
GET  /api/intelligence/:item_id     single item
"""
import json
import logging
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import AdminUser, CurrentUser, get_db
from app.models.intelligence import EditorNote, IntelligenceItem, NarrativeThread, UserNarrativeSubscription
from app.schemas.intelligence import (
    EditorNoteCreate,
    EditorNoteOut,
    IntelligenceItemOut,
    IntelligenceItemUpdate,
    NarrativeSubscriptionOut,
    NarrativeThreadOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intelligence", tags=["intelligence"])

_DATA_PATH = os.environ.get(
    "INTELLIGENCE_JSON_PATH",
    os.path.join(os.path.dirname(__file__), "../../../web/public/data/intelligence/intelligence.json"),
)
_CACHE_TTL = 60  # 1 minute — bust quickly after deploy
_cache: dict = {"data": None, "expires_at": 0.0}


def _load() -> dict:
    now = time.time()
    if _cache["data"] is not None and now < _cache["expires_at"]:
        return _cache["data"]
    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            data = json.load(f)
        _cache["data"] = data
        _cache["expires_at"] = now + _CACHE_TTL
        return data
    except FileNotFoundError:
        logger.error("intelligence.json not found at %s", _DATA_PATH)
        return {"intelligence_items": [], "weekly_brief": None, "meta": {}}
    except json.JSONDecodeError as exc:
        logger.error("intelligence.json is malformed: %s", exc)
        return {"intelligence_items": [], "weekly_brief": None, "meta": {}}


def _bust_cache() -> None:
    _cache["data"] = None
    _cache["expires_at"] = 0.0


def _db_item_to_dict(item: IntelligenceItem) -> dict:
    """Normalise a DB IntelligenceItem into the same shape as JSON file items."""
    mi = item.market_impact or {}
    return {
        "id": str(item.id),
        "category": item.category or "global_policy",
        "region": item.region or "global",
        "title": item.title,
        "event_date": item.event_date.isoformat() if item.event_date else "",
        "source_url": item.source_url or "",
        "source_name": item.source_entity or item.data_source or "",
        "policy_summary": item.policy_summary or "",
        "key_changes": [],
        "market_impact": {
            "benefited_sectors": mi.get("benefited_sectors", []),
            "affected_entity_types": mi.get("affected_entity_types", []),
            "capital_flow": mi.get("capital_flow", ""),
            "hk_relevance": mi.get("hk_relevance"),
        },
        "rwa_relevant": item.rwa_relevant,
        "tags": [],
        "significance": item.significance,
        "event_type": item.event_type,
        "is_data_snapshot": item.is_data_snapshot,
        "source_entity": item.source_entity,
        "is_forward_view": False,
        "tier": item.tier or "news",
    }


async def _load_merged(db: AsyncSession) -> dict:
    """JSON base content merged with DB-published items, deduped by source_url."""
    json_data = _load()
    json_items = json_data.get("intelligence_items", [])
    json_urls = {i.get("source_url") for i in json_items if i.get("source_url")}

    stmt = (
        select(IntelligenceItem)
        .where(IntelligenceItem.status == "published")
        .order_by(IntelligenceItem.event_date.desc())
    )
    result = await db.execute(stmt)
    db_dicts = [
        _db_item_to_dict(i)
        for i in result.scalars().all()
        if not (i.source_url and i.source_url in json_urls)
    ]

    return {**json_data, "intelligence_items": json_items + db_dicts}


def _days_ago(n: int) -> str:
    """Return ISO date string for n days ago."""
    return (datetime.now(timezone.utc) - timedelta(days=n)).strftime("%Y-%m-%d")


# ── Public GET endpoints ───────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Single aggregated request for the Intelligence Dashboard page."""
    data = await _load_merged(db)
    all_items = data.get("intelligence_items", [])
    rwa_items = [i for i in all_items if i.get("rwa_relevant", True)]

    cutoff_7d = _days_ago(7)
    cutoff_30d = _days_ago(30)

    # Block A: highlights — landmark/major in last 7 days, up to 3
    highlights = sorted(
        [
            i for i in rwa_items
            if i.get("event_date", "") >= cutoff_7d
            and i.get("significance") in ("landmark", "major")
            and not i.get("is_forward_view")
        ],
        key=lambda i: i.get("event_date", ""),
        reverse=True,
    )[:3]

    # Block B: forward view
    forward_view = sorted(
        [i for i in all_items if i.get("is_forward_view")],
        key=lambda i: i.get("event_date", ""),
    )

    # Block D: region activity — milestone-only, all-time (not date-windowed)
    region_activity: dict[str, int] = {}
    for item in rwa_items:
        if not item.get("is_forward_view") and item.get("tier") == "milestone":
            r = item.get("region", "global")
            region_activity[r] = region_activity.get(r, 0) + 1

    # Block F: recent timeline (first 20 non-forward-view)
    recent_timeline = sorted(
        [i for i in rwa_items if not i.get("is_forward_view")],
        key=lambda i: i.get("event_date", ""),
        reverse=True,
    )[:20]

    # Narratives from DB with weekly_new_count
    stmt = select(NarrativeThread).where(NarrativeThread.status == "active").order_by(NarrativeThread.created_at)
    result = await db.execute(stmt)
    db_narratives = result.scalars().all()

    narratives_out = []
    for n in db_narratives:
        # Count items in last 7 days that reference this narrative's related_event_ids
        weekly_ids = set(n.related_event_ids)
        weekly_count = sum(
            1 for i in rwa_items
            if i.get("id") in weekly_ids and i.get("event_date", "") >= cutoff_7d
        )
        d = NarrativeThreadOut.model_validate(n)
        narratives_out.append({**d.model_dump(), "weekly_new_count": weekly_count})

    # Latest published editor note
    stmt_note = (
        select(EditorNote)
        .where(EditorNote.status == "published")
        .order_by(EditorNote.published_at.desc())
        .limit(1)
    )
    result_note = await db.execute(stmt_note)
    editor_note_obj = result_note.scalar_one_or_none()
    editor_note = EditorNoteOut.model_validate(editor_note_obj).model_dump() if editor_note_obj else None

    return {
        "highlights": highlights,
        "forward_view": forward_view,
        "narratives": narratives_out,
        "region_activity": region_activity,
        "editor_note": editor_note,
        "recent_timeline": recent_timeline,
    }


@router.get("")
async def list_intelligence(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, description="comma-separated: regulation,institutional,project,research,data_milestone"),
    is_data_snapshot: Optional[bool] = Query(None),
    narrative_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    data = await _load_merged(db)
    items = data.get("intelligence_items", [])

    if category:
        items = [i for i in items if i.get("category") == category]
    if region:
        regions = [r.strip() for r in region.split(",")]
        items = [i for i in items if i.get("region") in regions]
    if event_type:
        types = [t.strip() for t in event_type.split(",")]
        items = [i for i in items if i.get("event_type", "regulation") in types]
    if is_data_snapshot is not None:
        items = [i for i in items if bool(i.get("is_data_snapshot", False)) == is_data_snapshot]

    # Filter by narrative slug
    if narrative_id:
        stmt_n = select(NarrativeThread).where(NarrativeThread.slug == narrative_id)
        result_n = await db.execute(stmt_n)
        narr = result_n.scalar_one_or_none()
        if narr:
            allowed = set(narr.related_event_ids)
            items = [i for i in items if i.get("id") in allowed]

    items_sorted = sorted(items, key=lambda i: i.get("event_date", ""), reverse=True)
    total = len(items_sorted)
    page = items_sorted[offset: offset + limit]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": page,
        "meta": data.get("meta", {}),
    }


@router.get("/hk")
async def list_hk_intelligence(db: AsyncSession = Depends(get_db)):
    data = await _load_merged(db)
    items = data.get("intelligence_items", [])
    hk_items = [i for i in items if i.get("region") == "hk"]
    hk_items_sorted = sorted(hk_items, key=lambda i: i.get("event_date", ""), reverse=True)
    return {
        "total": len(hk_items_sorted),
        "items": hk_items_sorted,
        "meta": data.get("meta", {}),
    }


@router.get("/weekly")
async def weekly_brief():
    data = _load()
    brief = data.get("weekly_brief")
    if not brief:
        raise HTTPException(status_code=404, detail="Weekly brief not yet generated.")
    return brief


@router.get("/data-milestones")
async def list_data_milestones(db: AsyncSession = Depends(get_db)):
    """Return data_milestone events from the last 30 days."""
    data = await _load_merged(db)
    items = data.get("intelligence_items", [])
    cutoff = _days_ago(30)
    milestones = [
        i for i in items
        if i.get("event_type") == "data_milestone"
        and i.get("event_date", "") >= cutoff
    ]
    milestones_sorted = sorted(milestones, key=lambda i: i.get("event_date", ""), reverse=True)
    return {"total": len(milestones_sorted), "items": milestones_sorted}


# ── Narrative threads ──────────────────────────────────────────────────────────

@router.get("/narratives")
async def list_narratives(db: AsyncSession = Depends(get_db)):
    stmt = select(NarrativeThread).where(NarrativeThread.status == "active").order_by(NarrativeThread.created_at)
    result = await db.execute(stmt)
    narratives = result.scalars().all()

    data = _load()
    all_items = data.get("intelligence_items", [])
    cutoff_7d = _days_ago(7)

    out = []
    for n in narratives:
        weekly_ids = set(n.related_event_ids)
        weekly_count = sum(
            1 for i in all_items
            if i.get("id") in weekly_ids and i.get("event_date", "") >= cutoff_7d
        )
        d = NarrativeThreadOut.model_validate(n)
        out.append({**d.model_dump(), "weekly_new_count": weekly_count})

    return {"total": len(out), "narratives": out}


@router.get("/narratives/subscribed")
async def get_subscribed_narratives(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Return narrative slugs the current user is subscribed to."""
    stmt = (
        select(UserNarrativeSubscription)
        .where(UserNarrativeSubscription.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    subs = result.scalars().all()
    # Resolve narrative slugs
    narrative_ids = [s.narrative_id for s in subs]
    if not narrative_ids:
        return {"subscribed_slugs": []}
    stmt_n = select(NarrativeThread).where(NarrativeThread.id.in_(narrative_ids))
    result_n = await db.execute(stmt_n)
    narratives = result_n.scalars().all()
    return {"subscribed_slugs": [n.slug for n in narratives]}


@router.get("/narratives/{slug}/timeline")
async def get_narrative_timeline(slug: str, db: AsyncSession = Depends(get_db)):
    """Return narrative metadata + events in ASC order + expected_next_events."""
    stmt = select(NarrativeThread).where(NarrativeThread.slug == slug)
    result = await db.execute(stmt)
    narr = result.scalar_one_or_none()
    if not narr:
        raise HTTPException(status_code=404, detail="Narrative not found.")

    data = await _load_merged(db)
    all_items = data.get("intelligence_items", [])
    allowed = set(narr.related_event_ids)
    past_events = sorted(
        [i for i in all_items if i.get("id") in allowed and not i.get("is_forward_view")],
        key=lambda i: i.get("event_date", ""),
    )
    return {
        "narrative": NarrativeThreadOut.model_validate(narr),
        "past_events": past_events,
        "expected_events": narr.expected_next_events or [],
    }


@router.post("/narratives/{slug}/subscribe", response_model=NarrativeSubscriptionOut)
async def subscribe_narrative(
    slug: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(NarrativeThread).where(NarrativeThread.slug == slug)
    result = await db.execute(stmt)
    narr = result.scalar_one_or_none()
    if not narr:
        raise HTTPException(status_code=404, detail="Narrative not found.")

    # Upsert: skip if already subscribed
    existing = await db.execute(
        select(UserNarrativeSubscription).where(
            UserNarrativeSubscription.user_id == current_user.id,
            UserNarrativeSubscription.narrative_id == narr.id,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        return sub

    sub = UserNarrativeSubscription(user_id=current_user.id, narrative_id=narr.id)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/narratives/{slug}/subscribe", status_code=204)
async def unsubscribe_narrative(
    slug: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(NarrativeThread).where(NarrativeThread.slug == slug)
    result = await db.execute(stmt)
    narr = result.scalar_one_or_none()
    if not narr:
        raise HTTPException(status_code=404, detail="Narrative not found.")

    existing = await db.execute(
        select(UserNarrativeSubscription).where(
            UserNarrativeSubscription.user_id == current_user.id,
            UserNarrativeSubscription.narrative_id == narr.id,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        await db.delete(sub)
        await db.commit()


@router.get("/narratives/{slug}")
async def get_narrative(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(NarrativeThread).where(NarrativeThread.slug == slug)
    result = await db.execute(stmt)
    narr = result.scalar_one_or_none()
    if not narr:
        raise HTTPException(status_code=404, detail="Narrative not found.")

    data = _load()
    all_items = data.get("intelligence_items", [])
    allowed = set(narr.related_event_ids)
    events = sorted(
        [i for i in all_items if i.get("id") in allowed],
        key=lambda i: i.get("event_date", ""),
        reverse=True,
    )
    return {
        "narrative": NarrativeThreadOut.model_validate(narr),
        "events": events,
    }


# ── Editor notes ───────────────────────────────────────────────────────────────

@router.get("/editor-notes")
async def list_editor_notes(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(EditorNote)
        .where(EditorNote.status == "published")
        .order_by(EditorNote.published_at.desc())
        .limit(4)
    )
    result = await db.execute(stmt)
    notes = result.scalars().all()
    return {"total": len(notes), "notes": [EditorNoteOut.model_validate(n) for n in notes]}


@router.post("/editor-notes", response_model=EditorNoteOut)
async def create_editor_note(
    payload: EditorNoteCreate,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    note = EditorNote(
        id=uuid.uuid4(),
        week_label=payload.week_label,
        title=payload.title,
        content=payload.content,
        related_event_ids=payload.related_event_ids,
        author=payload.author,
        status=payload.status,
        published_at=payload.published_at,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


# ── Admin: review queue ────────────────────────────────────────────────────────

@router.get("/pending", response_model=list[IntelligenceItemOut])
async def list_pending(
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    """Return all intelligence items with status='pending', newest first."""
    stmt = (
        select(IntelligenceItem)
        .where(IntelligenceItem.status == "pending")
        .order_by(IntelligenceItem.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/{item_id}/approve", response_model=IntelligenceItemOut)
async def approve_item(
    item_id: uuid.UUID,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(IntelligenceItem).where(IntelligenceItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    item.status = "published"
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{item_id}/reject", response_model=IntelligenceItemOut)
async def reject_item(
    item_id: uuid.UUID,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(IntelligenceItem).where(IntelligenceItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    item.status = "rejected"
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{item_id}", response_model=IntelligenceItemOut)
async def update_item(
    item_id: uuid.UUID,
    payload: IntelligenceItemUpdate,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(IntelligenceItem).where(IntelligenceItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


# ── Single item ────────────────────────────────────────────────────────────────

@router.get("/{item_id}")
async def get_intelligence_item(item_id: str):
    data = _load()
    items = data.get("intelligence_items", [])
    match = next((i for i in items if i.get("id") == item_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Intelligence item not found.")
    return match


# ── Admin: refresh scraper ─────────────────────────────────────────────────────

def _run_scraper() -> None:
    script = os.path.join(os.path.dirname(__file__), "../../../scripts/fetch_intelligence.py")
    if not os.path.exists(script):
        logger.error("fetch_intelligence.py not found at %s", script)
        return
    try:
        result = subprocess.run(
            [sys.executable, script],
            timeout=300,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.error("fetch_intelligence.py failed: %s", result.stderr)
        else:
            logger.info("fetch_intelligence.py completed: %s", result.stdout[-500:])
        _bust_cache()
    except subprocess.TimeoutExpired:
        logger.error("fetch_intelligence.py timed out after 300s")
    except Exception as exc:
        logger.exception("fetch_intelligence.py raised: %s", exc)


@router.post("/refresh")
async def refresh_intelligence(
    background_tasks: BackgroundTasks,
    _admin: AdminUser,
):
    background_tasks.add_task(_run_scraper)
    return {"status": "refresh_started", "message": "Scraper running in background."}
