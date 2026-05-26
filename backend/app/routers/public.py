"""
Public read-only endpoints — no auth required.

GET  /api/stats                      — aggregate counts for the About page.
POST /api/newsletter/subscribe       — subscribe an email to the weekly policy brief.
GET  /api/newsletter/unsubscribe     — one-click unsubscribe via token.
"""
import secrets
import time
import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func

from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.models.user import User
from app.models.newsletter import NewsletterSubscriber
from app.core import email as email_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["public"])

_CACHE_TTL = 60  # 60 s — bust quickly after deploy
_stats_cache: dict = {"data": None, "expires_at": 0.0}


@router.get("/stats")
async def get_stats(db: DbSession):
    now = time.time()
    if _stats_cache["data"] is not None and now < _stats_cache["expires_at"]:
        return _stats_cache["data"]

    result = await db.execute(
        select(func.count()).select_from(User).where(User.status != "deleted")
    )
    registered_users = result.scalar_one()

    data = {"registered_users": registered_users}
    _stats_cache["data"] = data
    _stats_cache["expires_at"] = now + _CACHE_TTL
    return data


# ── Newsletter ────────────────────────────────────────────────────────────────

class SubscribeRequest(BaseModel):
    email: EmailStr


@router.post("/newsletter/subscribe")
@limiter.limit("5/hour")
async def newsletter_subscribe(
    request: Request,
    body: SubscribeRequest,
    db: DbSession,
):
    email_addr = body.email.lower().strip()

    result = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == email_addr)
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.is_active:
            return {"message": "already_subscribed"}
        existing.is_active = True
        await db.commit()
        email_service.send_newsletter_confirmation_email(
            to=email_addr,
            unsubscribe_token=existing.unsubscribe_token,
        )
        return {"message": "resubscribed"}

    token = secrets.token_urlsafe(32)
    subscriber = NewsletterSubscriber(email=email_addr, unsubscribe_token=token)
    db.add(subscriber)
    await db.commit()

    email_service.send_newsletter_confirmation_email(
        to=email_addr,
        unsubscribe_token=token,
    )
    return {"message": "subscribed"}


@router.get("/newsletter/unsubscribe")
async def newsletter_unsubscribe(token: str, db: DbSession):
    result = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.unsubscribe_token == token)
    )
    subscriber = result.scalar_one_or_none()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Unsubscribe link not found.")
    subscriber.is_active = False
    await db.commit()
    return {"message": "unsubscribed", "email": subscriber.email}
