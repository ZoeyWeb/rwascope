"""
Ecosystem router — HK RWA Ecosystem Map data.

GET  /api/ecosystem          full ecosystem data (all layers, gaps, stats, chart)
GET  /api/ecosystem/layers   layers list with optional region filter
GET  /api/ecosystem/gaps     gaps list with optional layer_id filter
"""
import json
import logging
import os
import time
from typing import Optional

from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ecosystem", tags=["ecosystem"])

_DATA_PATH = os.environ.get(
    "ECOSYSTEM_JSON_PATH",
    os.path.join(os.path.dirname(__file__), "../../../web/public/data/ecosystem/ecosystem.json"),
)
_CACHE_TTL = 60  # 60 s — bust quickly after deploy
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
        logger.error("ecosystem.json not found at %s", _DATA_PATH)
        return {}
    except json.JSONDecodeError as exc:
        logger.error("ecosystem.json is malformed: %s", exc)
        return {}


@router.get("")
async def get_ecosystem():
    """Full ecosystem data: layers, gaps, stats, chart."""
    return _load()


@router.get("/layers")
async def list_layers(layer_id: Optional[str] = Query(None)):
    data = _load()
    layers = data.get("layers", [])
    if layer_id:
        layers = [l for l in layers if l.get("id") == layer_id]
    return {"total": len(layers), "layers": sorted(layers, key=lambda l: l.get("order", 0))}


@router.get("/gaps")
async def list_gaps(layer_id: Optional[str] = Query(None)):
    data = _load()
    gaps = data.get("gaps", [])
    if layer_id:
        gaps = [g for g in gaps if g.get("layer_id") == layer_id]
    return {"total": len(gaps), "gaps": gaps}
