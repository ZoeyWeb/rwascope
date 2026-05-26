from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    # max 72 chars: bcrypt silently truncates at 72 bytes, cap here to prevent DoS via hash computation
    password: str = Field(..., min_length=8, max_length=72)
    full_name: str = Field(..., max_length=200)
    organization: str = Field(..., max_length=200)
    use_case: str | None = Field(None, max_length=2000)
    terms_accepted: bool
    methodology_acknowledged: bool
    not_rating_service_acknowledged: bool
    newsletter_subscribed: bool = False
    turnstile_token: str | None = None  # None allowed in dev/test

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name is required")
        return v.strip()

    @field_validator("organization")
    @classmethod
    def org_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Organization is required")
        return v.strip()


class RegisterResponse(BaseModel):
    message: str
    email: str


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User out ──────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    organization: str | None = None
    status: str
    is_admin: bool
    created_at: str

    class Config:
        from_attributes = True


# ── Email verify ──────────────────────────────────────────────────────────────

class VerifyEmailResponse(BaseModel):
    message: str
    status: str          # 'active' or 'pending_review'
    auto_approved: bool


# ── Password reset ────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)


class MessageResponse(BaseModel):
    message: str


# ── Resend verification ───────────────────────────────────────────────────────

class ResendVerificationRequest(BaseModel):
    email: EmailStr
