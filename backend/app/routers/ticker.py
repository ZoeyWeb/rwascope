"""
Ticker router — TVL data for the homepage horizontal scroll ticker.

GET /api/ticker/top   — top 20 protocols, issuer-deduplicated, ticker-ready fields only.
                        No auth required. 60s in-memory cache.
"""
import json
import logging
import os
import re
import time

from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ticker", tags=["ticker"])

_DATA_PATH = os.environ.get(
    "LEADERBOARD_JSON_PATH",
    "/var/www/rwascope/data/leaderboard.json",
)
_CACHE_TTL = 60
_cache: dict = {"data": None, "expires_at": 0.0}

# Issuer keyword → stable key (longest match first to avoid "circle" matching "circulating")
_ISSUER_KEYWORDS: list[tuple[str, str]] = [
    ("hamilton lane", "hamilton-lane"),
    ("blackrock",     "blackrock"),
    ("franklin",      "franklin"),
    ("wisdomtree",    "wisdomtree"),
    ("superstate",    "superstate"),
    ("hashnote",      "hashnote"),
    ("matrixdock",    "matrixdock"),
    ("securitize",    "securitize"),
    ("centrifuge",    "centrifuge"),
    ("apollo",        "apollo"),
    ("maple",         "maple"),
    ("tether",        "tether"),
    ("circle",        "circle"),
    ("ondo",          "ondo"),
]

_UPPERCASE_TOKEN = re.compile(r"^[A-Z][A-Z0-9]{1,}$")  # ≥2 chars, starts uppercase, rest upper/digits

# Slug-keyed overrides for protocols whose names contain no ticker-like uppercase token.
# Add entries here when the auto-extracted short_name is ambiguous or wrong.
_SHORT_NAME_OVERRIDES: dict[str, str] = {
    "tether-gold":                                     "XAUT",
    "paxos-gold":                                      "PAXG",
    "ondo-yield-assets":                               "OUSG",
    "ondo-global-markets":                             "USDY",
    "wisdomtree":                                      "WTGXX",
    "franklin-onchain-us-government-money-fund":       "FOBXX",
    "hashnote-usyc":                                   "USYC",
    "matrixdock-stbt":                                 "STBT",
    "matrixdock-xaum":                                 "XAUM",
    "centrifuge":                                      "CFG",
    "securitize-tokenized-aaa-clo-fund":               "sACRED",
    "apollo-diversified-credit-securitize-fund":       "ACRED",
    "maple-finance":                                   "MPL",
    "centrifuge-protocol":                             "Centrifuge",
    "anemoy-capital":                                  "Anemoy",
    "blockchain-capital":                              "BCAP",
}


def _issuer_key(name: str, slug: str) -> str:
    name_lower = name.lower()
    for keyword, key in _ISSUER_KEYWORDS:
        if keyword in name_lower:
            return key
    return slug


def _short_name(slug: str, name: str) -> str:
    if slug in _SHORT_NAME_OVERRIDES:
        return _SHORT_NAME_OVERRIDES[slug]
    tokens = [t.rstrip(".,;:()") for t in name.split()]
    # Prefer an all-uppercase token (ticker symbol pattern)
    for token in tokens:
        if _UPPERCASE_TOKEN.match(token):
            return token
    # Fall back to last word
    if tokens:
        return tokens[-1]
    return name[:12]


def _build_items(protocols: list[dict]) -> list[dict]:
    # (a) filter
    valid = [
        p for p in protocols
        if p.get("slug") and p.get("name") and float(p.get("tvl") or 0) >= 10_000_000
    ]

    # (b) issuer dedup — keep top-2 TVL per issuer
    issuer_counts: dict[str, int] = {}
    deduped: list[dict] = []
    for p in sorted(valid, key=lambda x: -float(x.get("tvl") or 0)):
        key = _issuer_key(p["name"], p["slug"])
        if issuer_counts.get(key, 0) >= 2:
            continue
        issuer_counts[key] = issuer_counts.get(key, 0) + 1
        deduped.append(p)

    # (c) top 20 by TVL (already sorted above)
    top = deduped[:20]

    # (d,e) field projection — no rank
    items = []
    for p in top:
        items.append({
            "slug":        p["slug"],
            "name":        p["name"],
            "short_name":  _short_name(p["slug"], p["name"]),
            "logo":        p.get("logo") or f"https://icons.llama.fi/{p['slug']}.png",
            "tvl":         float(p.get("tvl") or 0),
            "tvl_fmt":     p.get("tvl_fmt") or "",
            "change_1d":   float(p.get("change_1d") or 0),
            "asset_class": p.get("asset_class") or "",
            "url":         f"/projects/{p['slug']}",
        })
    return items


def _load() -> dict:
    now = time.time()
    if _cache["data"] is not None and now < _cache["expires_at"]:
        return _cache["data"]

    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            raw = json.load(f)
    except FileNotFoundError:
        logger.error("leaderboard.json not found at %s", _DATA_PATH)
        return {"updated_at": "", "count": 0, "items": []}
    except json.JSONDecodeError as exc:
        logger.error("leaderboard.json malformed: %s", exc)
        return {"updated_at": "", "count": 0, "items": []}

    items = _build_items(raw.get("protocols", []))
    result = {
        "updated_at": raw.get("updated_at", ""),
        "count":      len(items),
        "items":      items,
    }
    _cache["data"] = result
    _cache["expires_at"] = now + _CACHE_TTL
    return result


@router.get("/top")
async def get_ticker_top():
    return _load()
