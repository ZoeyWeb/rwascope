"""
RSS crawler for intelligence item collection.

Fetches 20+ regulatory and media RSS feeds, keyword-filters for RWA relevance,
calls DeepSeek to classify each item, and inserts pending records into
the intelligence_items table.

Run: python3 scripts/fetch_rss.py
Cron: 0 */6 * * * python3 /opt/rwascope-backend/scripts/fetch_rss.py
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import sys
import uuid
from datetime import date, datetime, timezone, timedelta
from html.parser import HTMLParser

import feedparser
import httpx

# Allow running from the backend/ directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts._image_utils import download_image, extract_image_from_entry, fetch_og_image

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from app.core.deepseek import classify_intelligence_item

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── RSS source list ────────────────────────────────────────────────────────────

_GNEWS = "https://news.google.com/rss/search?hl=en&gl=US&ceid=US:en&q="

RSS_SOURCES = [
    # ── Official regulators ──────────────────────────────────────────────────
    {
        "name": "SEC Press Releases",
        "url": "https://www.sec.gov/news/pressreleases.rss",
        "default_region": "us",
        "default_event_type": "regulation",
    },
    # HKMA official JSON API (RSS feed is defunct as of 2026)
    {
        "name": "HKMA Press Releases",
        "source_type": "hkma_api",
        "url": "https://api.hkma.gov.hk/public/press-releases?lang=en&sort=createdAt&sortDir=desc&pagesize=30",
        "default_region": "hk",
        "default_event_type": "regulation",
    },
    # SFC and MAS official RSS feeds are defunct; Google News provides
    # equivalent coverage filtered to digital-asset/tokenization topics.
    {
        "name": "SFC (via Google News)",
        "url": _GNEWS + "SFC+Hong+Kong+digital+asset+stablecoin+tokenization",
        "default_region": "hk",
        "default_event_type": "regulation",
    },
    {
        "name": "MAS (via Google News)",
        "url": _GNEWS + "MAS+Singapore+digital+asset+tokenization+regulation",
        "default_region": "sg",
        "default_event_type": "regulation",
    },
    {
        "name": "ECB Press",
        "url": "https://www.ecb.europa.eu/rss/press.html",
        "default_region": "eu",
        "default_event_type": "regulation",
    },
    # BIS: corrected URL (old /pressreleases.rss is 404)
    {
        "name": "BIS Press Releases",
        "url": "https://www.bis.org/doclist/all_pressrels.rss",
        "default_region": "global",
        "default_event_type": "research",
    },
    # IMF and FCA block direct scrapers; use Google News
    {
        "name": "IMF (via Google News)",
        "url": _GNEWS + "IMF+digital+asset+tokenization+CBDC+stablecoin",
        "default_region": "global",
        "default_event_type": "research",
    },
    {
        "name": "FCA (via Google News)",
        "url": _GNEWS + "FCA+UK+digital+asset+stablecoin+tokenization",
        "default_region": "eu",
        "default_event_type": "regulation",
    },
    # ── Finance media ────────────────────────────────────────────────────────
    {
        "name": "CoinDesk",
        "url": "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "default_region": "global",
        "default_event_type": "institutional",
    },
    {
        "name": "The Block",
        "url": "https://www.theblock.co/rss.xml",
        "default_region": "global",
        "default_event_type": "institutional",
    },
    {
        "name": "Reuters Business",
        "url": "https://www.reutersagency.com/feed/",
        "default_region": "global",
        "default_event_type": "institutional",
    },
    # ── Research ─────────────────────────────────────────────────────────────
    {
        "name": "Chainalysis Blog",
        "url": "https://blog.chainalysis.com/rss/",
        "default_region": "global",
        "default_event_type": "research",
    },
    {
        "name": "Messari",
        "url": "https://messari.io/rss",
        "default_region": "global",
        "default_event_type": "research",
    },
]

RWA_KEYWORDS = [
    "rwa",
    "real world asset",
    "tokenization",
    "tokenized",
    "tokenise",
    "tokenised",
    "asset-backed",
    "security token",
    "digital securities",
    "on-chain bond",
    "tokenized treasury",
    "tokenised treasury",
    "tokenized real estate",
    "tokenised real estate",
# 具体资产类别
    'treasury', 'bond', 'debt', 'credit', 'loan',
    'real estate', 'property', 'commodity', 'gold',
    
    # 监管/合规
    'stablecoin', 'regulation', 'regulatory', 'compliance',
    'license', 'licensed', 'licensing', 'approval', 'framework',
    'vasp', 'mica', 'genius act', 'sfc', 'hkma', 'sec', 'mas',
    'sandbox', 'consultation', 'guidance', 'circular',

    # 机构/项目
    'blackrock', 'franklin templeton', 'ondo', 'centrifuge',
    'maple', 'goldfinch', 'securitize', 'paxos',
    'institutional', 'bank', 'asset manager', 'fund', 'pension',
    'sovereign wealth', 'jpmorgan', 'hsbc', 'standard chartered',

    # 技术 / 基础设施
    'blockchain', 'smart contract', 'defi', 'ethereum',
    'custody', 'settlement', 'on-chain', 'tokenize',
    'cbdc', 'digital asset', 'digital currency', 'tokenized deposit',
    'wholesale', 'yield', 'collateral', 'payment', 'money market'
]

LOOKBACK_DAYS = 7


# ── Helpers ───────────────────────────────────────────────────────────────────

def _has_rwa_keywords(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in RWA_KEYWORDS)


def _parse_published(entry) -> date | None:
    """Try to extract a publication date from a feedparser entry."""
    for attr in ("published_parsed", "updated_parsed", "created_parsed"):
        t = getattr(entry, attr, None)
        if t:
            try:
                return datetime(*t[:6], tzinfo=timezone.utc).date()
            except Exception:
                pass
    return None


def _cutoff_date() -> date:
    return (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).date()


def _summary(entry) -> str:
    for attr in ("summary", "description", "content"):
        val = getattr(entry, attr, None)
        if isinstance(val, list) and val:
            val = val[0].get("value", "")
        if val:
            return str(val)[:500]
    return ""


class _TextExtractor(HTMLParser):
    """Minimal HTML → plain text converter using only stdlib."""
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "header", "footer"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav", "header", "footer"):
            self._skip = False
        if tag in ("p", "div", "br", "li", "h1", "h2", "h3", "h4"):
            self._parts.append(" ")

    def handle_data(self, data):
        if not self._skip:
            self._parts.append(data)

    def get_text(self) -> str:
        raw = " ".join(self._parts)
        return re.sub(r"\s+", " ", raw).strip()


_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


async def _fetch_article_text(url: str, max_chars: int = 500) -> str:
    """Fetch a URL and return plain-text body up to max_chars characters.

    Returns empty string on any failure (including 429) so callers can
    fall back to title+summary gracefully.
    """
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=8.0,
            headers=_BROWSER_HEADERS,
        ) as client:
            resp = await client.get(url)
            if resp.status_code == 429:
                logger.debug("_fetch_article_text 429 rate-limited for %s", url)
                return ""
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")
            if "html" not in content_type:
                return ""
            extractor = _TextExtractor()
            extractor.feed(resp.text)
            return extractor.get_text()[:max_chars]
    except Exception as exc:
        logger.debug("_fetch_article_text failed for %s: %s", url, exc)
        return ""


# ── HKMA JSON API handler ────────────────────────────────────────────────────

async def _fetch_hkma_entries(api_url: str, cutoff: date) -> list[dict]:
    """
    Fetch HKMA press-release records from the official JSON API.
    Returns normalized entry dicts: {title, link, summary, pub_date}.
    """
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=10.0,
            headers=_BROWSER_HEADERS,
        ) as client:
            resp = await client.get(api_url)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("_fetch_hkma_entries failed: %s", exc)
        return []

    records = data.get("result", {}).get("records", [])
    entries: list[dict] = []
    for rec in records:
        date_str = rec.get("date", "")
        pub_date = _parse_date_str(date_str) if date_str else None
        if pub_date and pub_date < cutoff:
            continue
        title = rec.get("title", "").strip()
        link = rec.get("link", "").strip()
        if title or link:
            entries.append({"title": title, "link": link, "summary": "", "pub_date": pub_date})
    return entries


# ── Generic bozo fallback ─────────────────────────────────────────────────────

def _extract_xml_tag(block: str, tag: str) -> str:
    """
    Extract first occurrence of <tag>…</tag> or CDATA content from an XML snippet.
    Returns empty string if not found.
    """
    m = re.search(
        rf"<{re.escape(tag)}[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*</{re.escape(tag)}>",
        block,
        re.DOTALL | re.IGNORECASE,
    )
    return m.group(1).strip() if m else ""


def _parse_date_str(date_str: str) -> date | None:
    """Parse RFC 822 / ISO 8601 / bare date strings into a date object."""
    if not date_str:
        return None
    # email.utils handles RFC 822 (most RSS pubDate values)
    from email.utils import parsedate_to_datetime
    try:
        return parsedate_to_datetime(date_str.strip()).date()
    except Exception:
        pass
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str.strip()[:19], fmt[:len(date_str.strip())]).date()
        except Exception:
            continue
    return None


async def _fetch_raw_and_parse_feed(url: str) -> list[dict]:
    """
    Fallback for bozo feeds: fetch raw bytes with httpx and extract entries
    using regex so minor XML format errors don't block us entirely.

    Handles both RSS <item> and Atom <entry> containers.
    Returns normalized entry dicts: {title, link, summary, pub_date}.
    """
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=12.0,
            headers={**_BROWSER_HEADERS, "Accept": "application/rss+xml,application/xml,text/xml,*/*;q=0.8"},
        ) as client:
            resp = await client.get(url)
            if resp.status_code in (403, 404, 429):
                logger.debug("_fetch_raw_and_parse_feed %s → %d", url, resp.status_code)
                return []
            resp.raise_for_status()
            raw = resp.text
    except Exception as exc:
        logger.debug("_fetch_raw_and_parse_feed failed for %s: %s", url, exc)
        return []

    entries: list[dict] = []
    for tag in ("item", "entry"):
        for m in re.finditer(rf"<{tag}[^>]*>(.*?)</{tag}>", raw, re.DOTALL | re.IGNORECASE):
            block = m.group(1)
            title = _extract_xml_tag(block, "title")
            # RSS: <link>url</link>; Atom: <link href="url"/>
            link = _extract_xml_tag(block, "link")
            if not link:
                lm = re.search(r'<link[^>]+href=["\']([^"\']+)["\']', block, re.IGNORECASE)
                link = lm.group(1) if lm else ""
            if not link:
                link = _extract_xml_tag(block, "guid")
            summary = (
                _extract_xml_tag(block, "description")
                or _extract_xml_tag(block, "summary")
                or _extract_xml_tag(block, "content")
            )
            date_str = (
                _extract_xml_tag(block, "pubDate")
                or _extract_xml_tag(block, "published")
                or _extract_xml_tag(block, "updated")
                or _extract_xml_tag(block, "dc:date")
            )
            if title or link:
                entries.append({
                    "title": title.strip(),
                    "link": link.strip(),
                    "summary": summary.strip()[:500],
                    "pub_date": _parse_date_str(date_str),
                })
    return entries


# ── Main logic ─────────────────────────────────────────────────────────────────

async def _load_entries(source: dict, cutoff: date) -> list[dict]:
    """
    Return a list of normalized entry dicts from any source type:
      {title: str, link: str, summary: str, pub_date: date | None}

    Tries feedparser first; falls back to raw-HTTP regex parse on bozo.
    HKMA uses the official JSON API instead of RSS.
    """
    url = source["url"]
    source_type = source.get("source_type", "rss")

    if source_type == "hkma_api":
        return await _fetch_hkma_entries(url, cutoff)

    # Standard RSS path via feedparser
    try:
        feed = feedparser.parse(url)
    except Exception as exc:
        logger.error("[%s] feedparser raised: %s", source["name"], exc)
        return []

    if feed.bozo and not feed.entries:
        logger.warning(
            "[%s] Feed bozo with 0 entries (%s) — trying raw-HTTP fallback",
            source["name"],
            getattr(feed, "bozo_exception", "unknown"),
        )
        return await _fetch_raw_and_parse_feed(url)

    if feed.bozo:
        logger.debug("[%s] Feed bozo but has %d entries, continuing", source["name"], len(feed.entries))

    return [
        {
            "title": getattr(e, "title", "").strip(),
            "link": getattr(e, "link", "").strip(),
            "summary": _summary(e),
            "pub_date": _parse_published(e),
            "rss_image": extract_image_from_entry(e),
        }
        for e in feed.entries
    ]


async def process_source(
    source: dict,
    session: AsyncSession,
    cutoff: date,
    stats: dict,
) -> None:
    name = source["name"]
    entries = await _load_entries(source, cutoff)
    fetched = len(entries)
    inserted = 0
    skipped = 0

    for entry in entries:
        pub_date = entry["pub_date"]
        title = entry["title"]
        link = entry["link"]
        summary = entry["summary"]

        if pub_date and pub_date < cutoff:
            skipped += 1
            continue

        if not title or not link:
            skipped += 1
            continue

        # Quick keyword pre-filter before calling DeepSeek
        if not _has_rwa_keywords(title + " " + summary):
            skipped += 1
            continue

        # Dedup check
        existing = await session.execute(
            text("SELECT 1 FROM intelligence_items WHERE source_url = :url"),
            {"url": link},
        )
        if existing.first():
            skipped += 1
            continue

        # Enrich content: if RSS summary is too short, try fetching the article.
        # On 429 or any failure, fall back to title + whatever summary we have —
        # never skip the item just because the article body is inaccessible.
        content_for_deepseek = summary if summary else title
        if len(summary) < 100 and link:
            fetched_text = await _fetch_article_text(link)
            if fetched_text:
                content_for_deepseek = fetched_text
                logger.debug("[%s] enriched via web fetch: %s", name, link)
            else:
                # Rate-limited or blocked — use title + RSS summary (may be short)
                content_for_deepseek = f"{title}. {summary}".strip(". ")

        # DeepSeek classification
        classification = await classify_intelligence_item(
            title=title,
            content=content_for_deepseek,
            source="rss",
            default_region=source["default_region"],
            default_event_type=source["default_event_type"],
        )
        if classification is None:
            skipped += 1
            continue

        # Image: RSS media fields first, then og:image fallback
        item_id = uuid.uuid4()
        img_url = entry.get("rss_image") or fetch_og_image(link)
        local_image = download_image(img_url, str(item_id)) if img_url else None

        await session.execute(
            text("""
                INSERT INTO intelligence_items
                  (id, category, region, title, event_date, source_url,
                   raw_content, policy_summary, rwa_relevant, status,
                   event_type, is_data_snapshot, source_entity, data_source,
                   significance, image_url)
                VALUES
                  (:id, :category, :region, :title, :event_date, :source_url,
                   :raw_content, :policy_summary, :rwa_relevant, 'pending',
                   :event_type, false, :source_entity, 'rss',
                   :significance, :image_url)
            """),
            {
                "id": item_id,
                "category": "global_policy",
                "region": classification.get("region", source["default_region"]),
                "title": title[:500],
                "event_date": pub_date,
                "source_url": link,
                "raw_content": content_for_deepseek,
                "policy_summary": classification.get("policy_summary", ""),
                "rwa_relevant": True,
                "event_type": classification.get("event_type", source["default_event_type"]),
                "source_entity": name,
                "significance": classification.get("significance", "notable"),
                "image_url": local_image,
            },
        )
        await session.commit()
        inserted += 1

    stats["fetched"] += fetched
    stats["inserted"] += inserted
    stats["skipped"] += skipped
    logger.info("[%s] fetched=%d  inserted=%d  skipped=%d", name, fetched, inserted, skipped)


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    cutoff = _cutoff_date()
    stats = {"fetched": 0, "inserted": 0, "skipped": 0, "errors": 0}

    async with session_factory() as session:
        for source in RSS_SOURCES:
            await process_source(source, session, cutoff, stats)

    await engine.dispose()
    logger.info(
        "RSS run complete — fetched=%d  inserted=%d  skipped=%d  errors=%d",
        stats["fetched"], stats["inserted"], stats["skipped"], stats["errors"],
    )


if __name__ == "__main__":
    asyncio.run(main())
