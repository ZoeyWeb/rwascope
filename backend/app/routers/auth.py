"""
Auth router — registration, email verification, login, token refresh,
password reset.

Registration flow:
  POST /auth/register         → pending_verification, send verify email
  GET  /auth/verify-email     → active (auto) or pending_review
  POST /auth/login            → JWT tokens (only for status=active)
  POST /auth/refresh          → new token pair
  GET  /auth/me               → current user
  POST /auth/resend-verification → resend verify email
  POST /auth/forgot-password  → send reset link
  POST /auth/reset-password   → update password
"""
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from jose import JWTError
from sqlalchemy import select

from app.config import settings
from app.core.approval import should_auto_approve
from app.core.deps import CurrentUser, DbSession
from app.core.email import (
    send_auto_approved_email,
    send_password_reset_email,
    send_pending_review_email,
    send_verification_email,
)
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
    VerifyEmailResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

_VERIFY_TOKEN_TTL_HOURS = 24
_RESET_TOKEN_TTL_HOURS = 1

# Status messages returned to clients (intentionally vague where needed)
_STATUS_MESSAGES = {
    "pending_verification": "Please verify your email before signing in. / 請先驗證您的電子郵件後再登入。",
    "pending_review": "Your application is under review. We aim to respond within 1–2 business days. / 您的申請正在審核中，我們將在 1–2 個工作日內回覆。",
    "rejected": "Your application was not approved. Please contact research@rwa-index.com if you believe this is an error. / 您的申請未獲批准。如有疑問請聯繫 research@rwa-index.com。",
    "suspended": "Your account has been suspended. Please contact research@rwa-index.com for assistance. / 您的帳號已暫停，請聯繫 research@rwa-index.com 尋求協助。",
    "deleted": "Incorrect email or password.",  # same as wrong-password to prevent enumeration
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_token() -> str:
    """32-byte URL-safe random token."""
    return secrets.token_urlsafe(32)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def _verify_turnstile(token: str, ip: str) -> bool:
    """Verify Cloudflare Turnstile token. Returns True if valid."""
    if not settings.turnstile_secret_key:
        logger.warning("TURNSTILE_SECRET_KEY not configured — skipping Turnstile verification")
        return True  # dev mode: skip
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.turnstile_secret_key,
                    "response": token,
                    "remoteip": ip,
                },
            )
        data = resp.json()
        return bool(data.get("success"))
    except Exception as exc:
        logger.error("Turnstile verification error: %s", exc)
        return False


def _get_client_ip(request: Request) -> str:
    """Extract real client IP respecting X-Forwarded-For (set by Nginx)."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("3/hour")
async def register(request: Request, body: RegisterRequest, db: DbSession):
    # 1. Compliance consent gate
    if not (
        body.terms_accepted
        and body.methodology_acknowledged
        and body.not_rating_service_acknowledged
    ):
        raise HTTPException(
            status_code=422,
            detail="All three consent acknowledgements are required.",
        )

    # 2. Turnstile bot protection
    client_ip = _get_client_ip(request)
    if body.turnstile_token:
        ok = await _verify_turnstile(body.turnstile_token, client_ip)
        if not ok:
            raise HTTPException(
                status_code=422,
                detail="Human verification failed. Please try again.",
            )

    # 3. Duplicate email check
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered.")

    # 4. Create user in pending_verification state
    verify_token = _make_token()
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        organization=body.organization,
        use_case=body.use_case,
        newsletter_subscribed=body.newsletter_subscribed,
        status="pending_verification",
        verification_token=verify_token,
        verification_token_expires_at=_now_utc() + timedelta(hours=_VERIFY_TOKEN_TTL_HOURS),
        terms_version="1.0",
        registration_ip=client_ip,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 5. Send verification email
    verify_url = f"{settings.frontend_url}/verify-email?token={verify_token}"
    send_verification_email(body.email, body.full_name, verify_url)

    return RegisterResponse(
        message=(
            "Registration successful. Please check your email to verify your address. "
            "/ 註冊成功，請查收驗證郵件。"
        ),
        email=body.email,
    )


# ── Verify Email ──────────────────────────────────────────────────────────────

@router.get("/verify-email", response_model=VerifyEmailResponse)
@limiter.limit("10/hour")
async def verify_email(request: Request, token: str, db: DbSession):
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token.")

    now = _now_utc()
    if user.verification_token_expires_at and user.verification_token_expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="Verification link has expired. Please request a new one.",
        )

    if user.email_verified_at:
        # Already verified — just report current status
        return VerifyEmailResponse(
            message="Email already verified.",
            status=user.status,
            auto_approved=user.auto_approved,
        )

    # Mark email verified
    user.email_verified_at = now
    user.verification_token = None
    user.verification_token_expires_at = None

    # Check auto-approval
    if should_auto_approve(user.email):
        user.status = "active"
        user.auto_approved = True
        user.is_active = True
        await db.commit()
        login_url = f"{settings.frontend_url}/login"
        send_auto_approved_email(user.email, user.full_name, login_url)
        return VerifyEmailResponse(
            message=(
                "Email verified and account activated. You can now sign in. "
                "/ 電子郵件已驗證，帳號已啟用，您現在可以登入。"
            ),
            status="active",
            auto_approved=True,
        )
    else:
        user.status = "pending_review"
        await db.commit()
        send_pending_review_email(user.email, user.full_name)
        return VerifyEmailResponse(
            message=(
                "Email verified. Your application has been submitted for review. "
                "We will notify you within 1–2 business days. "
                "/ 電子郵件已驗證，申請已提交審核，我們將在 1–2 個工作日內通知您。"
            ),
            status="pending_review",
            auto_approved=False,
        )


# ── Resend Verification ───────────────────────────────────────────────────────

@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("3/hour")
async def resend_verification(
    request: Request, body: ResendVerificationRequest, db: DbSession
):
    # Always return success to prevent email enumeration
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user and user.status == "pending_verification":
        verify_token = _make_token()
        user.verification_token = verify_token
        user.verification_token_expires_at = _now_utc() + timedelta(
            hours=_VERIFY_TOKEN_TTL_HOURS
        )
        await db.commit()
        verify_url = f"{settings.frontend_url}/verify-email?token={verify_token}"
        send_verification_email(user.email, user.full_name, verify_url)

    return MessageResponse(
        message=(
            "If that email is registered and awaiting verification, "
            "a new verification link has been sent. "
            "/ 如果該電子郵件已註冊且等待驗證，新的驗證連結已發送。"
        )
    )


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, db: DbSession):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Always check password even if user not found (constant-time behaviour)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    # Soft-deleted accounts look like "not found"
    if user.status == "deleted":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_STATUS_MESSAGES["deleted"],
        )

    if user.status != "active":
        msg = _STATUS_MESSAGES.get(user.status, "Account is not active.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    # Update last login
    user.last_login_at = _now_utc()
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: DbSession):
    try:
        user_id_str = decode_refresh_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id_str))
    )
    user = result.scalar_one_or_none()
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="User not found or inactive.")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser):
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        organization=current_user.organization,
        status=current_user.status,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at.isoformat(),
    )


# ── Forgot Password ───────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request, body: ForgotPasswordRequest, db: DbSession
):
    _GENERIC_RESPONSE = MessageResponse(
        message=(
            "If an account with that email exists, a password reset link has been sent. "
            "/ 如果該電子郵件地址已有帳號，密碼重置連結已發送。"
        )
    )

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user and user.status not in ("deleted",):
        reset_token = _make_token()
        user.password_reset_token = reset_token
        user.password_reset_expires_at = _now_utc() + timedelta(
            hours=_RESET_TOKEN_TTL_HOURS
        )
        await db.commit()
        reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
        send_password_reset_email(user.email, user.full_name, reset_url)

    return _GENERIC_RESPONSE


# ── Reset Password ────────────────────────────────────────────────────────────

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: DbSession):
    result = await db.execute(
        select(User).where(User.password_reset_token == body.token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    now = _now_utc()
    if user.password_reset_expires_at and user.password_reset_expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="Password reset link has expired. Please request a new one.",
        )

    user.hashed_password = hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    await db.commit()

    return MessageResponse(
        message=(
            "Password updated successfully. You can now sign in with your new password. "
            "/ 密碼已更新，您現在可以使用新密碼登入。"
        )
    )
