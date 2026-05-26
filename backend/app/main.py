import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.core.rate_limit import limiter
from app.routers import auth, assessments, admin, public, intelligence, projects, ecosystem, ticker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _check_config() -> None:
    warnings = []
    if not settings.resend_api_key:
        warnings.append("RESEND_API_KEY not set — transactional emails will not be sent")
    if not settings.turnstile_secret_key:
        warnings.append("TURNSTILE_SECRET_KEY not set — bot protection is disabled")
    if not settings.deepseek_api_key:
        warnings.append("DEEPSEEK_API_KEY not set — AI checklist generation will fail")
    for w in warnings:
        logger.warning("CONFIG: %s", w)


_check_config()

app = FastAPI(
    title="RWA-Index API",
    version="2.0.0",
    description=(
        "RWA-Index backend — private due diligence workbooks using the RARM framework. "
        "All scores are user-generated. The AI produces research checklists only — no ratings. "
        "This API does not provide credit ratings or any regulated financial service."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Request logging ───────────────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %d %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["authorization", "content-type", "accept", "origin", "x-requested-with"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(intelligence.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(ecosystem.router, prefix="/api")
app.include_router(ticker.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "service": "RWA-Index due diligence API"}
