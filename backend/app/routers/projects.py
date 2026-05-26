"""
Projects router — RWA anatomy project profiles.

GET  /api/projects          list, supports ?asset_class=&region=&status= filters
GET  /api/projects/{slug}   full project profile
POST /api/projects          admin only — create project
PUT  /api/projects/{slug}   admin only — update project
"""
import json
import logging
import os
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import AdminUser
from app.schemas.projects import ProjectWrite

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["projects"])

_DATA_PATH = os.environ.get(
    "PROJECTS_JSON_PATH",
    os.path.join(os.path.dirname(__file__), "../../../web/public/data/projects/projects.json"),
)
_CACHE_TTL = 60  # 60 s — short enough that deploys reflect within a minute
_cache: dict = {"data": None, "expires_at": 0.0}


def _load() -> list:
    now = time.time()
    if _cache["data"] is not None and now < _cache["expires_at"]:
        return _cache["data"]
    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            data = json.load(f)
        projects = data if isinstance(data, list) else data.get("projects", data)
        _cache["data"] = projects
        _cache["expires_at"] = now + _CACHE_TTL
        return projects
    except FileNotFoundError:
        logger.error("projects.json not found at %s", _DATA_PATH)
        return []
    except json.JSONDecodeError as exc:
        logger.error("projects.json is malformed: %s", exc)
        return []


def _save(projects: list) -> None:
    tmp = _DATA_PATH + ".tmp"
    os.makedirs(os.path.dirname(_DATA_PATH), exist_ok=True)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
    os.replace(tmp, _DATA_PATH)
    _cache["data"] = projects
    _cache["expires_at"] = time.time() + _CACHE_TTL


@router.get("")
async def list_projects(
    asset_class: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    chain: Optional[str] = Query(None),
):
    projects = _load()

    if asset_class:
        projects = [p for p in projects if p.get("asset_class") == asset_class]
    if region:
        projects = [p for p in projects if p.get("jurisdiction") == region]
    if status:
        projects = [p for p in projects if p.get("status") == status]
    if chain:
        projects = [p for p in projects if p.get("chain") == chain]

    return {"total": len(projects), "projects": projects}


@router.get("/{slug}")
async def get_project(slug: str):
    projects = _load()
    match = next((p for p in projects if p.get("slug") == slug), None)
    if not match:
        raise HTTPException(status_code=404, detail="Project not found.")
    return match


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_project(body: ProjectWrite, _admin: AdminUser):
    projects = _load()
    if any(p.get("slug") == body.slug for p in projects):
        raise HTTPException(status_code=409, detail=f"Project slug '{body.slug}' already exists.")
    projects.append(body.to_dict())
    _save(projects)
    return body.to_dict()


@router.put("/{slug}")
async def update_project(slug: str, body: ProjectWrite, _admin: AdminUser):
    projects = _load()
    idx = next((i for i, p in enumerate(projects) if p.get("slug") == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if body.slug != slug:
        raise HTTPException(status_code=400, detail="Slug in body must match URL slug.")
    projects[idx] = body.to_dict()
    _save(projects)
    return projects[idx]
