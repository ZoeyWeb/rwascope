"""
Email parser for intelligence item collection.

Connects to an Outlook IMAP mailbox, reads recent unread emails from
whitelisted senders, classifies via DeepSeek, and inserts pending records.

Run: python3 scripts/parse_emails.py
Cron: 0 */6 * * * python3 /opt/rwascope-backend/scripts/parse_emails.py

Required env vars (backend/.env):
  EMAIL_HOST   — IMAP host, e.g. outlook.office365.com
  EMAIL_USER   — mailbox address
  EMAIL_PASS   — password or app password
"""
from __future__ import annotations

import asyncio
import email
import imaplib
import logging
import os
import re
import sys
import uuid
from datetime import date, datetime, timezone
from email.header import decode_header
from html.parser import HTMLParser

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from app.core.deepseek import classify_intelligence_item

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

EMAIL_HOST = settings.email_host
EMAIL_USER = settings.email_user
EMAIL_PASS = settings.email_pass

logger.debug(
    "Email config — host=%s  user=%s  pass=%s",
    EMAIL_HOST,
    EMAIL_USER,
    ("*" * len(EMAIL_PASS) if EMAIL_PASS else "<not set>"),
)
MAX_EMAILS = 50

WHITELIST_DOMAINS = {
    "hkma.gov.hk",
    "sfc.hk",
    "sec.gov",
    "mas.gov.sg",
    "bis.org",
    "imf.org",
    "ecb.europa.eu",
    "coindesk.com",
    "theblock.co",
    "messari.io",
    "chainalysis.com",
    "pwc.com",
    "deloitte.com",
    "ey.com",
    "kpmg.com",
    "reuters.com",
    "bloomberg.com",
    "substack.com",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._chunks: list[str] = []

    def handle_data(self, data: str) -> None:
        self._chunks.append(data)

    def get_text(self) -> str:
        return " ".join(self._chunks)


def _strip_html(html: str) -> str:
    stripper = _HTMLStripper()
    stripper.feed(html)
    return stripper.get_text()


def _decode_header_value(raw: str | bytes | None) -> str:
    if not raw:
        return ""
    parts = decode_header(raw)
    result = []
    for chunk, charset in parts:
        if isinstance(chunk, bytes):
            result.append(chunk.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(chunk)
    return " ".join(result).strip()


def _sender_domain(from_header: str) -> str:
    match = re.search(r"@([\w.\-]+)", from_header)
    return match.group(1).lower() if match else ""


def _parse_date(msg) -> date | None:
    raw = msg.get("Date", "")
    try:
        parsed = email.utils.parsedate_to_datetime(raw)
        return parsed.astimezone(timezone.utc).date()
    except Exception:
        return None


def _extract_body(msg) -> str:
    """Return plain-text body, max 500 chars."""
    for content_type in ("text/plain", "text/html"):
        for part in msg.walk():
            if part.get_content_type() == content_type:
                payload = part.get_payload(decode=True)
                if not payload:
                    continue
                charset = part.get_content_charset() or "utf-8"
                text_val = payload.decode(charset, errors="replace")
                if content_type == "text/html":
                    text_val = _strip_html(text_val)
                return text_val[:500].strip()
    return ""


# ── Main logic ─────────────────────────────────────────────────────────────────

def fetch_unread_emails() -> list[dict]:
    """Connect via IMAP and return list of parsed email dicts."""
    if not EMAIL_USER or not EMAIL_PASS:
        logger.error("EMAIL_USER or EMAIL_PASS not set — aborting")
        sys.exit(1)

    try:
        imap = imaplib.IMAP4_SSL(EMAIL_HOST)
        imap.login(EMAIL_USER, EMAIL_PASS)
    except Exception as exc:
        logger.error("IMAP connection failed: %s", exc)
        sys.exit(1)

    imap.select("INBOX")
    _, data = imap.search(None, "UNSEEN")
    msg_ids = data[0].split()
    # Limit to last MAX_EMAILS unread
    msg_ids = msg_ids[-MAX_EMAILS:]

    emails_out: list[dict] = []
    for msg_id in msg_ids:
        try:
            _, msg_data = imap.fetch(msg_id, "(RFC822)")
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            from_header = _decode_header_value(msg.get("From", ""))
            domain = _sender_domain(from_header)
            if domain not in WHITELIST_DOMAINS:
                # Mark as read anyway to avoid re-processing
                imap.store(msg_id, "+FLAGS", "\\Seen")
                continue

            subject = _decode_header_value(msg.get("Subject", ""))
            body = _extract_body(msg)
            pub_date = _parse_date(msg)

            emails_out.append({
                "msg_id": msg_id,
                "from": from_header,
                "domain": domain,
                "subject": subject,
                "body": body,
                "pub_date": pub_date,
            })
        except Exception as exc:
            logger.warning("Failed to parse email id=%s: %s", msg_id, exc)

    # Mark all processed emails as read
    for e in emails_out:
        try:
            imap.store(e["msg_id"], "+FLAGS", "\\Seen")
        except Exception:
            pass

    imap.logout()
    return emails_out


async def process_emails(emails: list[dict], session: AsyncSession, stats: dict) -> None:
    for em in emails:
        title = em["subject"].strip()
        if not title:
            stats["skipped"] += 1
            continue

        # Dedup by title (emails don't have stable URLs)
        existing = await session.execute(
            text("SELECT 1 FROM intelligence_items WHERE title = :title"),
            {"title": title[:500]},
        )
        if existing.first():
            stats["skipped"] += 1
            continue

        classification = await classify_intelligence_item(
            title=title,
            content=em["body"],
            source="email",
            default_region="global",
            default_event_type="institutional",
        )
        if classification is None:
            stats["skipped"] += 1
            continue

        await session.execute(
            text("""
                INSERT INTO intelligence_items
                  (id, category, region, title, event_date, source_url,
                   raw_content, policy_summary, rwa_relevant, status,
                   event_type, is_data_snapshot, source_entity, data_source, significance)
                VALUES
                  (:id, :category, :region, :title, :event_date, NULL,
                   :raw_content, :policy_summary, true, 'pending',
                   :event_type, false, :source_entity, 'email', :significance)
            """),
            {
                "id": uuid.uuid4(),
                "category": "global_policy",
                "region": classification.get("region", "global"),
                "title": title[:500],
                "event_date": em["pub_date"],
                "raw_content": em["body"],
                "policy_summary": classification.get("policy_summary", ""),
                "event_type": classification.get("event_type", "institutional"),
                "source_entity": em["domain"],
                "significance": classification.get("significance", "notable"),
            },
        )
        await session.commit()
        stats["inserted"] += 1

    stats["processed"] = len(emails)


async def main() -> None:
    logger.info("Connecting to IMAP %s as %s", EMAIL_HOST, EMAIL_USER)
    emails = fetch_unread_emails()
    logger.info("Fetched %d whitelisted unread emails", len(emails))

    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    stats = {"processed": 0, "inserted": 0, "skipped": 0}

    async with session_factory() as session:
        await process_emails(emails, session, stats)

    await engine.dispose()
    logger.info(
        "Email run complete — processed=%d  inserted=%d  skipped=%d",
        stats["processed"], stats["inserted"], stats["skipped"],
    )


if __name__ == "__main__":
    asyncio.run(main())
