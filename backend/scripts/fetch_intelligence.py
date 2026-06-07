#!/usr/bin/env python3
"""
RWA-Index – Global Intelligence Fetcher

Scrapes global regulatory press-release pages (HKMA, SFC, SEC, MAS), runs
DeepSeek AI analysis for RWA relevance and market impact, and writes
/var/www/rwascope/data/intelligence/intelligence.json for the frontend.

EDITORIAL NOTE: All scraped content is from official government/regulatory
sources. AI market-impact summaries carry "AI-generated — verify against
source" labels and require human review before publication.

Cron (daily):   0 6 * * * /usr/bin/python3 /opt/rwascope-backend/scripts/fetch_intelligence.py
Cron (weekly):  0 8 * * 1 /usr/bin/python3 /opt/rwascope-backend/scripts/fetch_intelligence.py --weekly
Log: /opt/rwascope/logs/intelligence.log

Usage:
  python fetch_intelligence.py              # scrape + update JSON
  python fetch_intelligence.py --weekly     # regenerate weekly brief only
  python fetch_intelligence.py --dry-run    # scrape, no file write
  python fetch_intelligence.py --hk-only   # restrict to HK sources
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
import urllib.request as urlreq
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
from typing import Optional

from text_utils import first_sentence

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("fetch_intelligence")

# ── Paths ─────────────────────────────────────────────────────────────────────

OUT_DIR = os.environ.get("OUT_DIR", "/var/www/rwascope/data/intelligence")
OUT_FILE = os.path.join(OUT_DIR, "intelligence.json")
SEED_FILE = os.path.join(
    os.path.dirname(__file__), "../../web/public/data/intelligence/intelligence.json"
)
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

# ── Source definitions ─────────────────────────────────────────────────────────

SOURCES = [
    {
        "id": "hkma",
        "label": "HKMA",
        "region": "hk",
        "url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/",
        "category": "hk_observation",
        "event_type": "regulation",
    },
    {
        "id": "sfc",
        "label": "SFC",
        "region": "hk",
        "url": "https://www.sfc.hk/en/News-and-announcements/Policy-statements-and-announcements",
        "category": "hk_observation",
        "event_type": "regulation",
    },
    {
        "id": "sec",
        "label": "SEC",
        "region": "us",
        "url": "https://www.sec.gov/news/pressreleases",
        "category": "global_policy",
        "event_type": "regulation",
    },
    {
        "id": "mas",
        "label": "MAS",
        "region": "sg",
        "url": "https://www.mas.gov.sg/news",
        "category": "global_policy",
        "event_type": "regulation",
    },
    # Research sources (new)
    {
        "id": "bis",
        "label": "BIS",
        "region": "global",
        "url": "https://www.bis.org/topics/fintech/index.htm",
        "category": "global_policy",
        "event_type": "research",
    },
    {
        "id": "imf",
        "label": "IMF",
        "region": "global",
        "url": "https://www.imf.org/en/Publications/fintech-notes",
        "category": "global_policy",
        "event_type": "research",
    },
]

# URL-domain → event_type heuristics (applied when source event_type is ambiguous)
_DOMAIN_EVENT_TYPE: dict[str, str] = {
    "sec.gov": "regulation",
    "hkma.gov.hk": "regulation",
    "sfc.hk": "regulation",
    "mas.gov.sg": "regulation",
    "esma.europa.eu": "regulation",
    "eba.europa.eu": "regulation",
    "vara.ae": "regulation",
    "bis.org": "research",
    "imf.org": "research",
    "worldbank.org": "research",
    "blackrock.com": "institutional",
    "franklintempleton.com": "institutional",
    "jpmorgan.com": "institutional",
    "hsbc.com": "institutional",
    "citigroup.com": "institutional",
    "standardchartered.com": "institutional",
    "bnymellon.com": "institutional",
    "statestreet.com": "institutional",
}


def _classify_event_type(source_url: str, source_event_type: str | None) -> str:
    """Determine event_type from source definition or URL domain heuristic."""
    if source_event_type:
        return source_event_type
    try:
        from urllib.parse import urlparse
        domain = urlparse(source_url).netloc.lower().lstrip("www.")
        for pattern, etype in _DOMAIN_EVENT_TYPE.items():
            if pattern in domain:
                return etype
    except Exception:
        pass
    return "regulation"

# Pre-filter: page must contain at least one of these before we try article extraction
RWA_KEYWORDS = [
    "tokeniz", "rwa", "real world asset", "stablecoin", "digital asset",
    "virtual asset", "vatp", "vasp", "ensemble", "e-hkd", "cbdc",
    "tokenised", "blockchain", "distributed ledger", "dlt", "crypto",
    "digital currency", "defi", "decentralized finance",
]


# ── HTML utilities ─────────────────────────────────────────────────────────────

class LinkExtractor(HTMLParser):
    """Extract all <a href> links and their text from an HTML page."""

    def __init__(self, base_url: str = ""):
        super().__init__()
        self.links: list[dict] = []  # [{"href": ..., "text": ...}]
        self._base_url = base_url.rstrip("/")
        self._current_href: str | None = None
        self._current_text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attrs_dict = dict(attrs)
            href = attrs_dict.get("href", "")
            if href and not href.startswith("#") and not href.startswith("javascript"):
                if href.startswith("/"):
                    href = self._base_url.split("/")[0] + "//" + self._base_url.split("//")[1].split("/")[0] + href
                elif not href.startswith("http"):
                    href = self._base_url + "/" + href
                self._current_href = href
                self._current_text = []

    def handle_endtag(self, tag):
        if tag == "a" and self._current_href:
            text = " ".join(self._current_text).strip()
            if text:
                self.links.append({"href": self._current_href, "text": text})
            self._current_href = None
            self._current_text = []

    def handle_data(self, data):
        if self._current_href is not None:
            self._current_text.append(data.strip())


class TextExtractor(HTMLParser):
    """Extract visible text from an HTML page (strips scripts/styles)."""

    def __init__(self):
        super().__init__()
        self._skip = False
        self._text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "header", "footer"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav", "header", "footer"):
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            stripped = data.strip()
            if stripped:
                self._text.append(stripped)

    @property
    def text(self) -> str:
        return " ".join(self._text)


def fetch_url(url: str, timeout: int = 20) -> str | None:
    try:
        req = urlreq.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; RWAIndex-IntelligenceFetcher/1.0; "
                    "+https://rwa-index.com)"
                ),
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        with urlreq.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as exc:
        log.warning("fetch_url(%s) failed: %s", url, exc)
        return None


def is_rwa_relevant(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in RWA_KEYWORDS)


def extract_date_from_url(url: str) -> str | None:
    """Try to extract YYYY/MM/DD or YYYYMMDD from a URL path."""
    m = re.search(r"/(\d{4})/(\d{2})(?:/(\d{2}))?", url)
    if m:
        y, mo, d = m.group(1), m.group(2), m.group(3) or "01"
        return f"{y}-{mo}-{d}"
    m2 = re.search(r"(\d{4})(\d{2})(\d{2})", url)
    if m2:
        return f"{m2.group(1)}-{m2.group(2)}-{m2.group(3)}"
    return None


def slug_from_title(title: str, region: str, event_date: str | None) -> str:
    s = re.sub(r"[^a-z0-9\s-]", "", title.lower())
    s = re.sub(r"\s+", "-", s.strip())[:60].rstrip("-")
    suffix = event_date[:4] if event_date else date.today().strftime("%Y")
    return f"{region}-{s}-{suffix}"


# ── Data loading / writing ─────────────────────────────────────────────────────

def load_existing() -> dict:
    for path in [OUT_FILE, SEED_FILE]:
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as exc:
                log.warning("Could not load %s: %s", path, exc)
    return {"meta": {}, "weekly_brief": {}, "intelligence_items": []}


def write_atomic(path: str, data: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)
    log.info("Wrote %s (%d items)", path, len(data.get("intelligence_items", [])))


# ── DeepSeek AI analysis ───────────────────────────────────────────────────────

INTELLIGENCE_SYSTEM = (
    "You are an RWA institutional intelligence analyst. "
    "Analyse the regulatory event and output a structured Policy-to-Market impact analysis. "
    "Return JSON only — no prose outside the JSON block. "
    "Only analyse provided content — do not fabricate facts. "
    "Affected entities: describe types only, never invent specific company names. "
    "Objective only; no investment advice. "
    "If unrelated to RWA/tokenization, set rwa_relevant: false."
)

INTELLIGENCE_PROMPT_TEMPLATE = """
Regulatory source: {source_name} ({region})
Title: {title}
Date: {event_date}
URL: {url}

Content excerpt:
{content}

Return a JSON object with this exact structure:
{{
  "rwa_relevant": true_or_false,
  "category": "global_policy or hk_observation",
  "policy_summary": "2-4 sentence factual summary of what was announced",
  "key_changes": ["bullet 1", "bullet 2", "bullet 3"],
  "market_impact": {{
    "benefited_sectors": ["sector type 1", "sector type 2"],
    "affected_entity_types": ["entity type 1", "entity type 2"],
    "capital_flow": "1-2 sentence description of expected capital movement",
    "hk_relevance": "HK-specific implication, or null if not applicable"
  }},
  "tags": ["tag1", "tag2", "tag3"],
  "timeline_significance": "1 sentence on why this event matters long-term",
  "source_note": "Any caveats about data accuracy or items requiring verification"
}}

Rules:
- policy_summary: factual, neutral, no opinions
- key_changes: 3-5 concrete regulatory changes
- market_impact: describe entity/sector TYPES, never specific company names
- tags: 3-6 lowercase kebab-case tags
- If rwa_relevant is false, other fields may be null
"""


def ai_analyse(
    title: str,
    source_name: str,
    region: str,
    event_date: str | None,
    url: str,
    content: str,
) -> dict | None:
    if not DEEPSEEK_API_KEY:
        log.warning("DEEPSEEK_API_KEY not set — skipping AI analysis for: %s", title)
        return None
    try:
        import urllib.parse

        prompt = INTELLIGENCE_PROMPT_TEMPLATE.format(
            source_name=source_name,
            region=region,
            title=title,
            event_date=event_date or "unknown",
            url=url,
            content=content[:3000],
        )
        payload = json.dumps({
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": INTELLIGENCE_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }).encode()

        req = urlreq.Request(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urlreq.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())

        raw = result["choices"][0]["message"]["content"].strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = "\n".join(
                ln for ln in raw.split("\n") if not ln.strip().startswith("```")
            ).strip()
        return json.loads(raw)
    except Exception as exc:
        log.error("AI analysis failed for '%s': %s", title, exc)
        return None


# ── Per-source article extraction ──────────────────────────────────────────────

def extract_hkma_articles(html: str) -> list[dict]:
    """
    Extract press release links from the HKMA press releases listing page.
    HKMA renders articles as <a> links containing dates and titles.
    """
    extractor = LinkExtractor("https://www.hkma.gov.hk")
    extractor.feed(html)

    articles = []
    for link in extractor.links:
        href = link["href"]
        text = link["text"]
        # HKMA press release URLs follow /eng/news-and-media/press-releases/YYYY/MM/...
        if "/press-releases/" in href and re.search(r"/\d{4}/\d{2}/", href):
            event_date = extract_date_from_url(href)
            articles.append({"url": href, "title": text, "event_date": event_date})

    # Deduplicate by URL
    seen: set[str] = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)
    return unique


def extract_sec_articles(html: str) -> list[dict]:
    """Extract recent press release links from SEC press releases page."""
    extractor = LinkExtractor("https://www.sec.gov")
    extractor.feed(html)

    articles = []
    for link in extractor.links:
        href = link["href"]
        text = link["text"]
        if "/news/press-release/" in href and text and len(text) > 20:
            event_date = extract_date_from_url(href)
            articles.append({"url": href, "title": text, "event_date": event_date})

    seen: set[str] = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)
    return unique[:20]  # limit to 20 most recent


def extract_mas_articles(html: str) -> list[dict]:
    """Extract MAS news links. MAS page is partially dynamic — best-effort with urllib."""
    extractor = LinkExtractor("https://www.mas.gov.sg")
    extractor.feed(html)

    articles = []
    for link in extractor.links:
        href = link["href"]
        text = link["text"]
        if "/news/" in href and text and len(text) > 20 and "mas.gov.sg" in href:
            event_date = extract_date_from_url(href)
            articles.append({"url": href, "title": text, "event_date": event_date})

    seen: set[str] = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)
    return unique[:20]


def extract_sfc_articles_playwright(source: dict) -> list[dict]:
    """
    Extract SFC article links via Playwright (JavaScript-rendered page).
    Falls back gracefully if playwright is not installed.
    """
    try:
        from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
    except ImportError:
        log.warning(
            "playwright not installed — skipping SFC. "
            "Install: pip install playwright && playwright install chromium"
        )
        return []

    url = source["url"]
    articles = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent=(
                    "Mozilla/5.0 (compatible; RWAIndex-IntelligenceFetcher/1.0; "
                    "+https://rwa-index.com)"
                )
            )
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
            except PWTimeout:
                # networkidle may time out on heavy pages — fall back to domcontentloaded
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(3000)

            links = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                    href: a.href,
                    text: (a.innerText || a.textContent || '').trim()
                }));
            }""")
            browser.close()

        seen: set[str] = set()
        base_len = len(url)
        for link in links:
            href = link.get("href", "").strip()
            text = link.get("text", "").strip()
            if not href or not text or len(text) < 15:
                continue
            if "sfc.hk" not in href:
                continue
            # Must be a deeper article URL, not navigation
            if len(href) <= base_len + 5:
                continue
            if (
                "/News-and-announcements/" in href
                or "/Rules-and-standards/Circulars/" in href
            ) and href not in seen:
                event_date = extract_date_from_url(href)
                articles.append({"url": href, "title": text, "event_date": event_date})
                seen.add(href)

    except Exception as exc:
        log.error("SFC Playwright extraction failed: %s", exc)
        return []

    return articles[:20]


def extract_articles(source: dict, html: str) -> list[dict]:
    sid = source["id"]
    if sid == "hkma":
        return extract_hkma_articles(html)
    if sid == "sec":
        return extract_sec_articles(html)
    if sid == "mas":
        return extract_mas_articles(html)
    if sid == "sfc":
        return extract_sfc_articles_playwright(source)
    log.info("  → No extractor for source '%s', skipping", sid)
    return []


# ── Weekly brief generation ────────────────────────────────────────────────────

def generate_weekly_brief(items: list[dict]) -> dict:
    today = date.today()
    period_end = today
    period_start = today - timedelta(days=6)

    recent = sorted(
        [i for i in items if i.get("rwa_relevant", True)],
        key=lambda i: i.get("event_date", ""),
        reverse=True,
    )[:3]

    highlights = []
    for item in recent:
        summary = item.get("policy_summary", "")
        if summary:
            highlights.append(first_sentence(summary))

    if not highlights:
        highlights = [
            "No new RWA-relevant regulatory announcements this week. "
            "Check source websites for the latest updates."
        ]

    # If DeepSeek is available, could call it to synthesise a better brief.
    # For now, construct from item summaries.
    return {
        "generated_at": today.isoformat(),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "headline": f"Global RWA Intelligence Brief — Week of {today.strftime('%-d %b %Y')}",
        "highlights": highlights,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main(args: argparse.Namespace) -> int:
    data = load_existing()
    today = date.today().isoformat()

    if args.weekly:
        data["weekly_brief"] = generate_weekly_brief(data.get("intelligence_items", []))
        data.setdefault("meta", {})["last_compiled"] = today
        if not args.dry_run:
            write_atomic(OUT_FILE, data)
        else:
            log.info("[dry-run] Would update weekly brief")
        return 0

    existing_slugs = {i.get("id") for i in data.get("intelligence_items", [])}
    existing_urls = {i.get("source_url") for i in data.get("intelligence_items", [])}
    new_items: list[dict] = []

    active_sources = SOURCES
    if args.hk_only:
        active_sources = [s for s in SOURCES if s["region"] == "hk"]

    for source in active_sources:
        log.info("Checking %s (%s)", source["label"], source["url"])
        html = fetch_url(source["url"])
        if not html:
            log.warning("  → Could not fetch listing page")
            continue

        if not is_rwa_relevant(html):
            log.info("  → No RWA keywords detected on listing page")
            continue

        articles = extract_articles(source, html)
        log.info("  → Found %d candidate articles", len(articles))

        for article in articles:
            url = article["url"]
            if url in existing_urls:
                log.debug("  → Already tracked: %s", url)
                continue

            title = article.get("title", "").strip()
            event_date = article.get("event_date")

            if not title or len(title) < 10:
                continue
            if not is_rwa_relevant(title):
                log.debug("  → Not RWA-relevant: %s", title)
                continue

            log.info("  → Fetching article: %s", title[:80])
            article_html = fetch_url(url)
            article_text = ""
            if article_html:
                te = TextExtractor()
                te.feed(article_html)
                article_text = te.text[:4000]

            time.sleep(1.5)  # polite crawl delay

            analysis = ai_analyse(
                title=title,
                source_name=source["label"],
                region=source["region"],
                event_date=event_date,
                url=url,
                content=article_text or title,
            )

            if analysis is None:
                # AI unavailable — create minimal placeholder entry
                analysis = {
                    "rwa_relevant": True,
                    "policy_summary": f"{title} — full summary requires manual review.",
                    "key_changes": [],
                    "market_impact": {
                        "benefited_sectors": [],
                        "affected_entity_types": [],
                        "capital_flow": "",
                        "hk_relevance": None,
                    },
                    "tags": [source["id"], source["region"]],
                    "timeline_significance": "",
                    "source_note": "AI analysis unavailable — requires manual review before publishing.",
                }

            if not analysis.get("rwa_relevant", True):
                log.info("  → AI marked as not RWA-relevant, skipping")
                continue

            slug = slug_from_title(title, source["region"], event_date)
            if slug in existing_slugs:
                slug = slug + f"-{int(time.time()) % 10000}"

            item: dict = {
                "id": slug,
                "category": analysis.get("category") or source["category"],
                "region": source["region"],
                "event_type": _classify_event_type(url, source.get("event_type")),
                "is_data_snapshot": False,
                "source_entity": source["label"],
                "title": title,
                "event_date": event_date or today,
                "source_url": url,
                "source_name": source["label"],
                "policy_summary": analysis.get("policy_summary", ""),
                "key_changes": analysis.get("key_changes", []),
                "market_impact": analysis.get("market_impact", {}),
                "rwa_relevant": True,
                "tags": analysis.get("tags", []),
                "timeline_significance": analysis.get("timeline_significance", ""),
                "source_note": (
                    (analysis.get("source_note") or "") +
                    " AI-generated — verify against source before publishing."
                ).strip(),
            }
            new_items.append(item)
            existing_slugs.add(slug)
            existing_urls.add(url)
            log.info("  ✓ Queued: %s", title[:80])

    if new_items:
        data.setdefault("intelligence_items", []).extend(new_items)
        log.info("Added %d new intelligence items", len(new_items))
    else:
        log.info("No new items found in this run")

    data["weekly_brief"] = generate_weekly_brief(data.get("intelligence_items", []))
    data.setdefault("meta", {}).update({
        "last_compiled": today,
        "version": data.get("meta", {}).get("version", "1.0.0"),
    })

    if not args.dry_run:
        write_atomic(OUT_FILE, data)
    else:
        log.info(
            "[dry-run] Would write %d total items (%d new)",
            len(data.get("intelligence_items", [])),
            len(new_items),
        )

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RWA-Index Intelligence Fetcher")
    parser.add_argument("--weekly", action="store_true", help="Regenerate weekly brief only")
    parser.add_argument("--dry-run", action="store_true", help="Scrape without writing output")
    parser.add_argument("--hk-only", action="store_true", help="Restrict to HK sources")
    sys.exit(main(parser.parse_args()))
