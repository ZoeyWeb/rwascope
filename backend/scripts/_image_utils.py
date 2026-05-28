"""
Shared image utilities for intelligence ingestion scripts.

All three public functions return None on any failure — never raise.
Callers must never let image failures block item ingestion.
"""
from __future__ import annotations

import os
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

try:
    import lxml  # noqa: F401
    _LXML_AVAILABLE = True
except ImportError:
    _LXML_AVAILABLE = False

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

_ALLOWED_EXTS = {"jpg", "jpeg", "png", "webp"}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def extract_image_from_entry(entry) -> str | None:
    """Extract image URL from a feedparser entry object.

    Priority: media_content → media_thumbnail → image-type enclosure.
    Returns the first valid http(s) URL found, or None.
    """
    try:
        for media in getattr(entry, "media_content", []) or []:
            url = media.get("url", "")
            if url.startswith(("http://", "https://")):
                return url

        for thumb in getattr(entry, "media_thumbnail", []) or []:
            url = thumb.get("url", "")
            if url.startswith(("http://", "https://")):
                return url

        for enc in getattr(entry, "enclosures", []) or []:
            if enc.get("type", "").startswith("image/"):
                url = enc.get("href", "")
                if url.startswith(("http://", "https://")):
                    return url
    except Exception:
        pass
    return None


def fetch_og_image(url: str, timeout: int = 6) -> str | None:
    """Fetch og:image or twitter:image meta tag from a URL.

    Returns the image URL string, or None on any failure (timeout, non-200,
    no meta tag, parse error).
    """
    try:
        resp = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": _UA},
            allow_redirects=True,
        )
        if resp.status_code != 200:
            return None
        if "html" not in resp.headers.get("content-type", ""):
            return None
        parser = "lxml" if _LXML_AVAILABLE else "html.parser"
        soup = BeautifulSoup(resp.text[:60_000], parser)
        for prop in ("og:image", "og:image:url", "twitter:image"):
            tag = soup.find("meta", attrs={"property": prop}) or soup.find(
                "meta", attrs={"name": prop}
            )
            if tag:
                img = tag.get("content", "").strip()
                if img.startswith(("http://", "https://")):
                    return img
    except Exception:
        pass
    return None


def download_image(
    img_url: str,
    item_id: str,
    media_dir: str = "/var/www/rwascope/media",
) -> str | None:
    """Download img_url and save as media_dir/{item_id}.{ext}.

    Only accepts jpg/jpeg/png/webp; rejects files > 5 MB.
    Returns "/media/{item_id}.{ext}" on success, None on any failure.
    Creates media_dir if it does not exist.
    """
    try:
        os.makedirs(media_dir, exist_ok=True)

        resp = requests.get(
            img_url,
            timeout=10,
            headers={"User-Agent": _UA},
            stream=True,
        )
        if resp.status_code != 200:
            return None

        ct = resp.headers.get("content-type", "").split(";")[0].strip().lower()
        if not ct.startswith("image/"):
            return None

        ext = _ext_from_content_type(ct) or _ext_from_url(img_url)
        if not ext or ext not in _ALLOWED_EXTS:
            return None

        dest = os.path.join(media_dir, f"{item_id}.{ext}")
        written = 0
        with open(dest, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=32_768):
                written += len(chunk)
                if written > _MAX_BYTES:
                    fh.close()
                    try:
                        os.unlink(dest)
                    except OSError:
                        pass
                    return None
                fh.write(chunk)

        return f"/media/{item_id}.{ext}"
    except Exception:
        pass
    return None


# ── Internal helpers ──────────────────────────────────────────────────────────

def _ext_from_content_type(ct: str) -> str | None:
    return {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }.get(ct)


def _ext_from_url(url: str) -> str | None:
    path = urlparse(url).path.lower().split("?")[0]
    for ext in _ALLOWED_EXTS:
        if path.endswith(f".{ext}"):
            return ext
    return None
