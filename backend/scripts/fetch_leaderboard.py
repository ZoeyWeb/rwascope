#!/usr/bin/env python3
"""
RWA-Index – DeFiLlama RWA Leaderboard Fetcher

Fetches public RWA protocol data from DeFiLlama and writes
/var/www/rwascope/data/leaderboard.json for the frontend.

Only public DeFiLlama fields are stored — no platform-generated
scores, tiers, or ratings of any kind.

Cron: 0 2 * * * /usr/bin/python3 /opt/rwascope/fetch_leaderboard.py
Log:  /opt/rwascope/logs/leaderboard.log
"""
import json
import logging
import os
import urllib.request as urlreq
from collections import Counter
from datetime import datetime, timezone
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("leaderboard")

OUT_DIR  = os.environ.get("OUT_DIR", "/var/www/rwascope/data")
OUT_FILE = os.path.join(OUT_DIR, "leaderboard.json")
API_URL  = "https://api.llama.fi/protocols"

# ── Asset slug → DeFiLlama name patterns ─────────────────────────────────────
# Matched case-insensitively against protocol name; first match wins.
ASSET_SLUG_PATTERNS: dict[str, list[str]] = {
    "buidl-blackrock":          ["buidl"],
    # Franklin BENJI is no longer tracked separately by DeFiLlama (as of May 2026)
    # "benji-franklin-templeton": removed
    # OUSG and USDY are now aggregated under "Ondo Yield Assets" in DeFiLlama
    "ousg-ondo":                ["ondo yield assets", "ondo yield"],
    # usdy-ondo maps to same pool; skip to avoid double-counting
    # "usdy-ondo": removed
    "ustb-superstate":          ["superstate ustb", "superstate"],
    "wtgxx-wisdomtree":         ["wisdomtree", "wtgxx"],
    "xaut-tether-gold":         ["tether gold", "xaut"],
    "centrifuge-prime":         ["centrifuge"],
}

# ── Asset class keyword map ───────────────────────────────────────────────────
ASSET_CLASS_KEYWORDS: dict[str, list[str]] = {
    "Gov. Treasuries": [
        "buidl", "usyc", "ondo", "anemoy", "spiko", "benji", "franklin",
        "wisdomtree", "openeden", "backed", "treasury", "t-bill", "tbill",
        "yield", "usdy", "ousg", "stbt", "fobxx", "superstate",
    ],
    "Commodities": [
        "gold", "paxos", "tether gold", "xaut", "paxg", "silver",
        "commodity", "oil",
    ],
    "Real Estate": [
        "real estate", "realty", "property", "reit", "landx",
        "tangible", "housetokenization", "lofty",
    ],
    "Private Credit": [
        "maple", "goldfinch", "credix", "clearpool", "truefi",
        "untangled", "huma", "private credit", "private equity",
    ],
    "Trade Finance": [
        "centrifuge", "trade finance", "invoice", "receivable",
        "supply chain", "karmen",
    ],
}


def detect_asset_class(p: dict) -> str:
    text = ((p.get("name") or "") + " " + (p.get("description") or "")).lower()
    for cls, keywords in ASSET_CLASS_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return cls
    return "Gov. Treasuries"


def fmt_tvl(tvl: float) -> str:
    if tvl >= 1e9:
        return f"${tvl / 1e9:.2f}B"
    if tvl >= 1e6:
        return f"${tvl / 1e6:.1f}M"
    if tvl >= 1e3:
        return f"${tvl / 1e3:.0f}K"
    return f"${tvl:.0f}"


def fetch_protocols() -> list[dict]:
    log.info("Fetching DeFiLlama protocols …")
    req = urlreq.Request(API_URL, headers={"User-Agent": "rwa-index-fetcher/2.0"})
    with urlreq.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    rwa = [p for p in data if (p.get("category") or "").lower() == "rwa"]
    log.info(f"Found {len(rwa)} RWA protocols (total: {len(data)})")
    return rwa


def process_protocol(p: dict) -> Optional[dict]:
    """Return a dict of public DeFiLlama fields only — no scores or ratings."""
    tvl = float(p.get("tvl") or 0)
    if tvl < 100_000:   # skip dust / dead protocols
        return None

    chains = p.get("chains") or []
    slug   = p.get("slug") or ""
    logo   = p.get("logo") or f"https://icons.llama.fi/{slug}.png"

    return {
        "name":        p["name"],
        "slug":        slug,
        "logo":        logo,
        "url":         p.get("url") or "",
        "tvl":         tvl,
        "tvl_fmt":     fmt_tvl(tvl),
        "change_1d":   round(float(p.get("change_1d") or 0), 2),
        "change_7d":   round(float(p.get("change_7d") or 0), 2),
        "chains":      chains[:6],
        "chain_count": len(chains),
        "audits":      int(p.get("audits") or 0),
        "asset_class": detect_asset_class(p),
    }


def build_asset_live_data(raw_protocols: list[dict]) -> dict[str, dict]:
    """Match raw DeFiLlama protocols to our 8 assets; return enrichment keyed by slug.

    Writes only public DeFiLlama fields — no platform-generated scores or ratings.
    assets.json (RARM data) is never touched by this function.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result: dict[str, dict] = {}

    for slug, patterns in ASSET_SLUG_PATTERNS.items():
        match: Optional[dict] = None
        for p in raw_protocols:
            name_lower = (p.get("name") or "").lower()
            if any(pat in name_lower for pat in patterns):
                match = p
                break

        if not match:
            log.warning("No DeFiLlama match for asset slug: %s", slug)
            continue

        tvl = float(match.get("tvl") or 0)
        entry: dict = {
            "tvlUsd":       int(tvl),
            "tvlUpdatedAt": today,
            "tvlSource":    "DeFiLlama",
            "change1d":     round(float(match.get("change_1d") or 0), 2),
        }

        # Include audit links if DeFiLlama provides them
        audit_links = match.get("audit_links") or []
        if isinstance(audit_links, list) and audit_links:
            entry["auditReports"] = [
                {"url": url, "status": "unknown"}
                for url in audit_links
                if isinstance(url, str)
            ]

        result[slug] = entry
        log.info("Enriched %s — TVL %s  1d %+.2f%%", slug, fmt_tvl(tvl), entry["change1d"])

    return result


def run() -> None:
    raw = fetch_protocols()

    protocols: list[dict] = []
    for p in raw:
        result = process_protocol(p)
        if result:
            protocols.append(result)

    # Sort by TVL descending — no platform scoring
    protocols.sort(key=lambda x: -x["tvl"])

    # Assign rank (1-based, TVL order)
    for i, item in enumerate(protocols, 1):
        item["rank"] = i

    ac_counts = Counter(p["asset_class"] for p in protocols)
    total_tvl = sum(p["tvl"] for p in protocols)

    output = {
        "updated_at":         datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source":             "DeFiLlama / api.llama.fi",
        "total_count":        len(protocols),
        "total_tvl":          total_tvl,
        "total_tvl_fmt":      fmt_tvl(total_tvl),
        "asset_class_counts": dict(ac_counts),
        "protocols":          protocols,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    tmp = OUT_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(output, f, separators=(",", ":"))
    os.replace(tmp, OUT_FILE)   # atomic swap — no half-written reads

    log.info(f"Written {len(protocols)} protocols → {OUT_FILE}")
    log.info(f"Total RWA TVL: {fmt_tvl(total_tvl)}")
    log.info(f"Asset classes: {dict(ac_counts)}")

    # ── Asset live enrichment (separate file — never overwrites assets.json) ──
    asset_live_dir  = os.path.join(OUT_DIR, "assets")
    asset_live_file = os.path.join(asset_live_dir, "assets-live.json")
    asset_live_out  = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source":     "DeFiLlama / api.llama.fi",
        "assets":     build_asset_live_data(raw),   # raw = unfiltered protocol list
    }
    os.makedirs(asset_live_dir, exist_ok=True)
    tmp2 = asset_live_file + ".tmp"
    with open(tmp2, "w") as f:
        json.dump(asset_live_out, f, separators=(",", ":"))
    os.replace(tmp2, asset_live_file)
    log.info("Written asset live data → %s", asset_live_file)


if __name__ == "__main__":
    run()
