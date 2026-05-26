from datetime import datetime
from typing import Any
from pydantic import BaseModel


# ── User schemas ──────────────────────────────────────────────────────────────

class PendingUserOut(BaseModel):
    id: str
    email: str
    full_name: str
    organization: str | None
    use_case: str | None
    registration_ip: str | None
    created_at: str
    email_verified_at: str | None


class AdminUserOut(BaseModel):
    id: str
    email: str
    full_name: str
    organization: str | None
    status: str
    is_admin: bool
    auto_approved: bool
    registration_ip: str | None
    created_at: str
    email_verified_at: str | None
    last_login_at: str | None
    reviewed_at: str | None
    assessment_count: int


class AdminUserDetail(AdminUserOut):
    use_case: str | None
    terms_version: str
    rejection_reason: str | None
    deleted_at: str | None
    assessments: list["AssessmentMeta"]
    recent_logins: list["AuditLogOut"]


class AssessmentMeta(BaseModel):
    id: str
    protocol_name: str
    asset_class: str
    status: str
    created_at: str


class UserListResponse(BaseModel):
    users: list[AdminUserOut]
    total: int
    page: int
    per_page: int
    pages: int


# ── Action schemas ────────────────────────────────────────────────────────────

class ApproveRequest(BaseModel):
    pass


class RejectRequest(BaseModel):
    rejection_reason: str | None = None


class SuspendRequest(BaseModel):
    reason: str | None = None


class MakeAdminRequest(BaseModel):
    confirm: bool = False


class AdminActionResponse(BaseModel):
    message: str
    user_id: str


# ── Stats schemas ─────────────────────────────────────────────────────────────

class DailyCount(BaseModel):
    date: str
    count: int


class UserStatusCounts(BaseModel):
    total: int
    active: int
    pending_verification: int
    pending_review: int
    suspended: int
    rejected: int
    deleted: int
    new_today: int
    active_last_7d: int


class OverviewStats(BaseModel):
    users: UserStatusCounts
    total_assessments: int
    daily_registrations: list[DailyCount]
    daily_assessments: list[DailyCount]


class AssetClassStat(BaseModel):
    asset_class: str
    count: int


class AssessmentStatusStat(BaseModel):
    status: str
    count: int


class AssessmentStats(BaseModel):
    total: int
    by_asset_class: list[AssetClassStat]
    by_status: list[AssessmentStatusStat]
    daily_trend: list[DailyCount]


# ── Audit log ─────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: str
    timestamp: str
    actor_user_id: str | None
    actor_email: str | None
    action_type: str
    target_user_id: str | None
    target_email: str | None
    ip_address: str | None
    details: dict[str, Any] | None


class AuditLogResponse(BaseModel):
    logs: list[AuditLogOut]
    total: int
    page: int
    per_page: int
    pages: int
