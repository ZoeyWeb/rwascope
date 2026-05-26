#!/usr/bin/env python3
"""
generate_weekly_editor_note_draft.py — RWA-Index Weekly Editor's Note Generator

Collects published intelligence items from the past 7 days, calls DeepSeek to
generate a draft editor's note, saves it as status='draft' in the DB, and emails
the admin for review.

Cron: 0 6 * * 0 python3 /opt/rwascope-backend/scripts/generate_weekly_editor_note_draft.py
      (Sundays at 06:00 UTC)

Human review required before publishing (set status='published' in admin panel).
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

# Allow running from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("generate_weekly_editor_note_draft")

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "fittio33@gmail.com")
INTELLIGENCE_JSON_PATH = os.environ.get(
    "INTELLIGENCE_JSON_PATH",
    os.path.join(os.path.dirname(__file__), "../../web/public/data/intelligence/intelligence.json"),
)

EDITOR_NOTE_PROMPT = """你是 RWAscope 研究团队编辑。基于以下本周 RWA 相关事件，撰写一条编辑短评。要求：

1. 提炼一个统一的主题或趋势（80-150 字正文）
2. 串联 2-4 条关键事件
3. 给出一个有价值的观察或预判
4. 客观、专业，避免"建议"、"应该"等措辞
5. 不构成投资建议
6. 可以中文撰写

本周事件（按日期排序）：
{events_summary}

输出严格遵循 JSON 格式（不要输出任何 JSON 以外的内容）：
{{
  "title": "短标题（10-15字，可选，可留空字符串）",
  "content": "正文80-150字",
  "related_event_ids": ["事件ID列表，最多4个"]
}}"""


def _load_intelligence() -> dict:
    with open(INTELLIGENCE_JSON_PATH, encoding="utf-8") as f:
        return json.load(f)


def _week_label() -> str:
    today = date.today()
    week_num = today.isocalendar()[1]
    return f"Week {week_num} · {today.year}"


def _collect_this_week_events(intelligence: dict) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    items = intelligence.get("intelligence_items", [])
    recent = [
        i for i in items
        if i.get("rwa_relevant", True)
        and i.get("event_date", "") >= cutoff
        and not i.get("is_forward_view")
    ]
    return sorted(recent, key=lambda i: i.get("event_date", ""), reverse=True)


def _build_events_summary(events: list[dict]) -> str:
    lines = []
    for e in events[:8]:
        lines.append(f"[{e['event_date']}] [{e.get('region','').upper()}] {e['title']}: {e.get('policy_summary','')[:200]}")
    return "\n".join(lines)


def _call_deepseek(prompt: str) -> dict | None:
    import urllib.request
    import urllib.error

    payload = json.dumps({
        "model": DEEPSEEK_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 600,
        "response_format": {"type": "json_object"},
    }).encode()

    req = urllib.request.Request(
        f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode())
        raw = body["choices"][0]["message"]["content"]
        return json.loads(raw)
    except urllib.error.URLError as exc:
        log.error("DeepSeek request failed: %s", exc)
        return None
    except (KeyError, json.JSONDecodeError) as exc:
        log.error("Unexpected DeepSeek response: %s", exc)
        return None


async def _save_to_db(note_data: dict, week_label: str) -> None:
    from app.database import engine
    from app.models.intelligence import EditorNote
    from sqlalchemy.ext.asyncio import AsyncSession

    async with AsyncSession(engine) as session:
        note = EditorNote(
            id=uuid.uuid4(),
            week_label=week_label,
            title=note_data.get("title") or None,
            content=note_data["content"],
            related_event_ids=note_data.get("related_event_ids", []),
            author="RWAscope Research (AI Draft)",
            status="draft",
            published_at=None,
        )
        session.add(note)
        await session.commit()
        log.info("Editor note draft saved to DB (id=%s).", note.id)


def _send_admin_email(week_label: str, content: str) -> None:
    if not RESEND_API_KEY:
        log.warning("RESEND_API_KEY not set — skipping admin email.")
        return

    import urllib.request
    payload = json.dumps({
        "from": "RWA-Index <noreply@rwa-index.com>",
        "to": [ADMIN_EMAIL],
        "subject": f"[RWA-Index] Editor's Note Draft Ready — {week_label}",
        "text": (
            f"Weekly editor's note draft for {week_label} is ready for review.\n\n"
            f"Preview:\n{content[:300]}...\n\n"
            "Log in to the admin panel to review and publish."
        ),
    }).encode()

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {RESEND_API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            log.info("Admin notification email sent: %s", resp.status)
    except Exception as exc:
        log.warning("Failed to send admin email: %s", exc)


async def main_async() -> None:
    intelligence = _load_intelligence()
    events = _collect_this_week_events(intelligence)
    week_label = _week_label()

    if not events:
        log.info("No events this week. Skipping draft generation.")
        return

    log.info("Generating draft for %s with %d events.", week_label, len(events))
    events_summary = _build_events_summary(events)
    prompt = EDITOR_NOTE_PROMPT.format(events_summary=events_summary)

    result = _call_deepseek(prompt)
    if not result or not result.get("content"):
        log.error("DeepSeek returned no usable content. Aborting.")
        return

    await _save_to_db(result, week_label)
    _send_admin_email(week_label, result["content"])
    log.info("Done. Draft saved for %s.", week_label)


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
