"""
Admin router — full management API.

All endpoints require JWT + is_admin=true (via AdminUser dependency).
Destructive actions are recorded to audit_logs.
"""
import csv
import io
import math
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text
from sqlalchemy.orm import aliased

from app.config import settings
from app.core.deps import AdminUser, DbSession
from app.core.email import send_approved_email, send_password_reset_email, send_rejected_email
from app.core.security import hash_password
from app.models.assessment import DetailedAssessment
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.admin import (
    AdminActionResponse,
    AdminUserDetail,
    AdminUserOut,
    AssessmentMeta,
    AssessmentStats,
    AuditLogOut,
    AuditLogResponse,
    DailyCount,
    MakeAdminRequest,
    OverviewStats,
    PendingUserOut,
    RejectRequest,
    SuspendRequest,
    UserListResponse,
    UserStatusCounts,
)

from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _fmt(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


async def _log(
    db,
    action_type: str,
    actor_id: uuid.UUID | None = None,
    target_id: uuid.UUID | None = None,
    ip: str | None = None,
    details: dict | None = None,
) -> None:
    entry = AuditLog(
        id=uuid.uuid4(),
        action_type=action_type,
        actor_user_id=actor_id,
        target_user_id=target_id,
        ip_address=ip,
        details=details,
    )
    db.add(entry)


async def _get_user_or_404(db, user_id: str) -> User:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID.")
    result = await db.execute(select(User).where(User.id == uid, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def _get_ip(request: Request | None) -> str | None:
    if not request:
        return None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return getattr(request.client, "host", None)


# ── Overview stats ────────────────────────────────────────────────────────────

@router.get("/stats", response_model=OverviewStats)
async def get_stats(admin: AdminUser, db: DbSession):
    today_start = _now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = _now() - timedelta(days=7)
    month_ago = _now() - timedelta(days=30)

    # User counts by status
    status_rows = await db.execute(
        select(User.status, func.count(User.id))
        .where(User.deleted_at.is_(None))
        .group_by(User.status)
    )
    status_map: dict[str, int] = {r[0]: r[1] for r in status_rows}

    total_users = sum(status_map.values())

    new_today = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= today_start)
    ) or 0

    active_7d = await db.scalar(
        select(func.count(User.id)).where(
            User.last_login_at >= week_ago, User.status == "active"
        )
    ) or 0

    total_assessments = await db.scalar(select(func.count(DetailedAssessment.id))) or 0

    # Daily registrations (past 30 days) — PostgreSQL date_trunc
    reg_rows = await db.execute(
        text("""
            SELECT date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
                   COUNT(*) AS cnt
            FROM users
            WHERE created_at >= :since
            GROUP BY day
            ORDER BY day
        """),
        {"since": month_ago},
    )
    daily_regs = [DailyCount(date=str(r[0]), count=r[1]) for r in reg_rows]

    # Daily assessments (past 30 days)
    assess_rows = await db.execute(
        text("""
            SELECT date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
                   COUNT(*) AS cnt
            FROM detailed_assessments
            WHERE created_at >= :since
            GROUP BY day
            ORDER BY day
        """),
        {"since": month_ago},
    )
    daily_assess = [DailyCount(date=str(r[0]), count=r[1]) for r in assess_rows]

    return OverviewStats(
        users=UserStatusCounts(
            total=total_users,
            active=status_map.get("active", 0),
            pending_verification=status_map.get("pending_verification", 0),
            pending_review=status_map.get("pending_review", 0),
            suspended=status_map.get("suspended", 0),
            rejected=status_map.get("rejected", 0),
            deleted=status_map.get("deleted", 0),
            new_today=new_today,
            active_last_7d=active_7d,
        ),
        total_assessments=total_assessments,
        daily_registrations=daily_regs,
        daily_assessments=daily_assess,
    )


# ── User list ─────────────────────────────────────────────────────────────────

@router.get("/users", response_model=UserListResponse)
async def list_users(
    admin: AdminUser,
    db: DbSession,
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(User).where(User.deleted_at.is_(None))

    if search:
        query = query.where(User.email.ilike(f"%{search}%"))
    if status_filter:
        query = query.where(User.status == status_filter)

    total = await db.scalar(
        select(func.count()).select_from(query.subquery())
    ) or 0

    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    users = result.scalars().all()

    # Assessment counts (one query)
    ids = [u.id for u in users]
    count_rows = await db.execute(
        select(DetailedAssessment.user_id, func.count(DetailedAssessment.id))
        .where(DetailedAssessment.user_id.in_(ids))
        .group_by(DetailedAssessment.user_id)
    )
    count_map = {r[0]: r[1] for r in count_rows}

    return UserListResponse(
        users=[
            AdminUserOut(
                id=str(u.id),
                email=u.email,
                full_name=u.full_name,
                organization=u.organization,
                status=u.status,
                is_admin=u.is_admin,
                auto_approved=u.auto_approved,
                registration_ip=u.registration_ip,
                created_at=_fmt(u.created_at),
                email_verified_at=_fmt(u.email_verified_at),
                last_login_at=_fmt(u.last_login_at),
                reviewed_at=_fmt(u.reviewed_at),
                assessment_count=count_map.get(u.id, 0),
            )
            for u in users
        ],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, math.ceil(total / per_page)),
    )


# ── Pending users ─────────────────────────────────────────────────────────────

@router.get("/users/pending", response_model=list[PendingUserOut])
async def list_pending_users(admin: AdminUser, db: DbSession):
    result = await db.execute(
        select(User)
        .where(User.status == "pending_review")
        .order_by(User.created_at.asc())
    )
    users = result.scalars().all()
    return [
        PendingUserOut(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            organization=u.organization,
            use_case=u.use_case,
            registration_ip=u.registration_ip,
            created_at=_fmt(u.created_at),
            email_verified_at=_fmt(u.email_verified_at),
        )
        for u in users
    ]


# ── User detail ───────────────────────────────────────────────────────────────

@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user_detail(user_id: str, admin: AdminUser, db: DbSession):
    user = await _get_user_or_404(db, user_id)
    uid = user.id

    # Assessment metadata only — no content
    assess_result = await db.execute(
        select(
            DetailedAssessment.id,
            DetailedAssessment.protocol_name,
            DetailedAssessment.asset_class,
            DetailedAssessment.status,
            DetailedAssessment.created_at,
        )
        .where(DetailedAssessment.user_id == uid)
        .order_by(DetailedAssessment.created_at.desc())
    )
    assessments = [
        AssessmentMeta(
            id=str(r[0]),
            protocol_name=r[1],
            asset_class=r[2],
            status=r[3],
            created_at=_fmt(r[4]),
        )
        for r in assess_result
    ]

    # Recent logins from audit_logs
    login_result = await db.execute(
        select(AuditLog)
        .where(
            AuditLog.target_user_id == uid,
            AuditLog.action_type == "user.login",
        )
        .order_by(AuditLog.timestamp.desc())
        .limit(10)
    )
    login_logs = login_result.scalars().all()

    assess_count_row = await db.scalar(
        select(func.count(DetailedAssessment.id)).where(
            DetailedAssessment.user_id == uid
        )
    )

    return AdminUserDetail(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        organization=user.organization,
        use_case=user.use_case,
        status=user.status,
        is_admin=user.is_admin,
        auto_approved=user.auto_approved,
        registration_ip=user.registration_ip,
        terms_version=user.terms_version,
        rejection_reason=user.rejection_reason,
        created_at=_fmt(user.created_at),
        email_verified_at=_fmt(user.email_verified_at),
        last_login_at=_fmt(user.last_login_at),
        reviewed_at=_fmt(user.reviewed_at),
        deleted_at=_fmt(user.deleted_at),
        assessment_count=assess_count_row or 0,
        assessments=assessments,
        recent_logins=[
            AuditLogOut(
                id=str(lg.id),
                timestamp=_fmt(lg.timestamp),
                actor_user_id=None,
                actor_email=None,
                action_type=lg.action_type,
                target_user_id=str(lg.target_user_id) if lg.target_user_id else None,
                target_email=user.email,
                ip_address=lg.ip_address,
                details=lg.details,
            )
            for lg in login_logs
        ],
    )


# ── Approve ───────────────────────────────────────────────────────────────────

@router.post("/users/{user_id}/approve", response_model=AdminActionResponse)
async def approve_user(user_id: str, admin: AdminUser, db: DbSession, request: Request):
    user = await _get_user_or_404(db, user_id)
    if user.status not in ("pending_review", "pending_verification"):
        raise HTTPException(
            status_code=400,
            detail=f"User is not in a reviewable state (current: {user.status}).",
        )
    user.status = "active"
    user.is_active = True
    user.reviewed_at = _now()
    user.reviewed_by_user_id = admin.id
    user.auto_approved = False

    await _log(
        db, "admin.approve_user",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email},
    )
    await db.commit()

    send_approved_email(user.email, user.full_name, f"{settings.frontend_url}/login")
    return AdminActionResponse(message=f"User {user.email} approved.", user_id=user_id)


# ── Reject ────────────────────────────────────────────────────────────────────

@router.post("/users/{user_id}/reject", response_model=AdminActionResponse)
async def reject_user(
    user_id: str, body: RejectRequest, admin: AdminUser, db: DbSession, request: Request
):
    user = await _get_user_or_404(db, user_id)
    if user.status not in ("pending_review", "pending_verification"):
        raise HTTPException(
            status_code=400,
            detail=f"User is not in a reviewable state (current: {user.status}).",
        )
    user.status = "rejected"
    user.reviewed_at = _now()
    user.reviewed_by_user_id = admin.id
    user.rejection_reason = body.rejection_reason

    await _log(
        db, "admin.reject_user",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email, "reason": body.rejection_reason},
    )
    await db.commit()

    send_rejected_email(user.email, user.full_name, body.rejection_reason)
    return AdminActionResponse(message=f"User {user.email} rejected.", user_id=user_id)


# ── Suspend / Unsuspend ───────────────────────────────────────────────────────

@router.post("/users/{user_id}/suspend", response_model=AdminActionResponse)
async def suspend_user(
    user_id: str, body: SuspendRequest, admin: AdminUser, db: DbSession, request: Request
):
    user = await _get_user_or_404(db, user_id)
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot suspend your own account.")
    if user.status == "suspended":
        raise HTTPException(status_code=400, detail="User is already suspended.")

    prev_status = user.status
    user.status = "suspended"
    user.is_active = False

    await _log(
        db, "admin.suspend_user",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email, "previous_status": prev_status, "reason": body.reason},
    )
    await db.commit()
    return AdminActionResponse(message=f"User {user.email} suspended.", user_id=user_id)


@router.post("/users/{user_id}/unsuspend", response_model=AdminActionResponse)
async def unsuspend_user(
    user_id: str, admin: AdminUser, db: DbSession, request: Request
):
    user = await _get_user_or_404(db, user_id)
    if user.status != "suspended":
        raise HTTPException(status_code=400, detail="User is not suspended.")

    user.status = "active"
    user.is_active = True

    await _log(
        db, "admin.unsuspend_user",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email},
    )
    await db.commit()
    return AdminActionResponse(message=f"User {user.email} unsuspended.", user_id=user_id)


# ── Soft delete ───────────────────────────────────────────────────────────────

@router.delete("/users/{user_id}", response_model=AdminActionResponse)
async def delete_user(user_id: str, admin: AdminUser, db: DbSession, request: Request):
    user = await _get_user_or_404(db, user_id)
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")

    user.status = "deleted"
    user.deleted_at = _now()
    user.is_active = False

    await _log(
        db, "admin.delete_user",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email},
    )
    await db.commit()
    return AdminActionResponse(message=f"User {user.email} deleted.", user_id=user_id)


# ── Reset password (send email) ───────────────────────────────────────────────

@router.post("/users/{user_id}/reset-password", response_model=AdminActionResponse)
async def admin_reset_password(
    user_id: str, admin: AdminUser, db: DbSession, request: Request
):
    user = await _get_user_or_404(db, user_id)

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires_at = _now() + timedelta(hours=1)

    await _log(
        db, "admin.reset_password",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email},
    )
    await db.commit()

    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    send_password_reset_email(user.email, user.full_name, reset_url)
    return AdminActionResponse(
        message=f"Password reset email sent to {user.email}.", user_id=user_id
    )


# ── Make admin ────────────────────────────────────────────────────────────────

@router.post("/users/{user_id}/make-admin", response_model=AdminActionResponse)
async def make_admin(
    user_id: str, body: MakeAdminRequest, admin: AdminUser, db: DbSession, request: Request
):
    if not body.confirm:
        raise HTTPException(status_code=400, detail="Must confirm this action.")
    user = await _get_user_or_404(db, user_id)
    if user.is_admin:
        raise HTTPException(status_code=400, detail="User is already an admin.")
    if user.status != "active":
        raise HTTPException(status_code=400, detail="User must be active to become admin.")

    user.is_admin = True

    await _log(
        db, "admin.make_admin",
        actor_id=admin.id, target_id=user.id,
        ip=_get_ip(request),
        details={"email": user.email, "granted_by": admin.email},
    )
    await db.commit()
    return AdminActionResponse(message=f"{user.email} is now an admin.", user_id=user_id)


# ── Assessment stats ──────────────────────────────────────────────────────────

@router.get("/assessments/stats", response_model=AssessmentStats)
async def assessment_stats(admin: AdminUser, db: DbSession):
    month_ago = _now() - timedelta(days=30)

    total = await db.scalar(select(func.count(DetailedAssessment.id))) or 0

    ac_rows = await db.execute(
        select(DetailedAssessment.asset_class, func.count(DetailedAssessment.id))
        .group_by(DetailedAssessment.asset_class)
        .order_by(func.count(DetailedAssessment.id).desc())
    )

    status_rows = await db.execute(
        select(DetailedAssessment.status, func.count(DetailedAssessment.id))
        .group_by(DetailedAssessment.status)
    )

    trend_rows = await db.execute(
        text("""
            SELECT date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
                   COUNT(*) AS cnt
            FROM detailed_assessments
            WHERE created_at >= :since
            GROUP BY day ORDER BY day
        """),
        {"since": month_ago},
    )

    from app.schemas.admin import AssetClassStat, AssessmentStatusStat
    return AssessmentStats(
        total=total,
        by_asset_class=[
            AssetClassStat(asset_class=r[0] or "Unknown", count=r[1]) for r in ac_rows
        ],
        by_status=[
            AssessmentStatusStat(status=r[0], count=r[1]) for r in status_rows
        ],
        daily_trend=[DailyCount(date=str(r[0]), count=r[1]) for r in trend_rows],
    )


# ── Audit log ─────────────────────────────────────────────────────────────────

@router.get("/audit-log", response_model=AuditLogResponse)
async def get_audit_log(
    admin: AdminUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    action_filter: str | None = Query(None),
):
    # Alias user tables for actor and target
    Actor = aliased(User, name="actor")
    Target = aliased(User, name="target")

    base = (
        select(
            AuditLog,
            Actor.email.label("actor_email"),
            Target.email.label("target_email"),
        )
        .outerjoin(Actor, AuditLog.actor_user_id == Actor.id)
        .outerjoin(Target, AuditLog.target_user_id == Target.id)
    )
    if action_filter:
        base = base.where(AuditLog.action_type.ilike(f"%{action_filter}%"))

    total = await db.scalar(
        select(func.count()).select_from(
            base.subquery()
        )
    ) or 0

    rows = await db.execute(
        base.order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )

    logs = []
    for row in rows:
        lg, actor_email, target_email = row[0], row[1], row[2]
        logs.append(
            AuditLogOut(
                id=str(lg.id),
                timestamp=_fmt(lg.timestamp),
                actor_user_id=str(lg.actor_user_id) if lg.actor_user_id else None,
                actor_email=actor_email,
                action_type=lg.action_type,
                target_user_id=str(lg.target_user_id) if lg.target_user_id else None,
                target_email=target_email,
                ip_address=lg.ip_address,
                details=lg.details,
            )
        )

    return AuditLogResponse(
        logs=logs,
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, math.ceil(total / per_page)),
    )


# ── CSV Exports ───────────────────────────────────────────────────────────────

@router.get("/export/users")
async def export_users(admin: AdminUser, db: DbSession, request: Request):
    result = await db.execute(
        select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=[
        "id", "email", "full_name", "organization", "status", "is_admin",
        "auto_approved", "registration_ip", "terms_version",
        "created_at", "email_verified_at", "last_login_at", "reviewed_at",
    ])
    writer.writeheader()
    for u in users:
        writer.writerow({
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "organization": u.organization or "",
            "status": u.status,
            "is_admin": u.is_admin,
            "auto_approved": u.auto_approved,
            "registration_ip": u.registration_ip or "",
            "terms_version": u.terms_version,
            "created_at": _fmt(u.created_at),
            "email_verified_at": _fmt(u.email_verified_at) or "",
            "last_login_at": _fmt(u.last_login_at) or "",
            "reviewed_at": _fmt(u.reviewed_at) or "",
        })

    await _log(db, "admin.export_users", actor_id=admin.id,
               ip=_get_ip(request), details={"count": len(users)})
    await db.commit()

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rwa-index-users.csv"},
    )


@router.get("/export/assessments")
async def export_assessments(admin: AdminUser, db: DbSession, request: Request):
    result = await db.execute(
        select(
            DetailedAssessment.id,
            DetailedAssessment.user_id,
            DetailedAssessment.protocol_name,
            DetailedAssessment.asset_class,
            DetailedAssessment.status,
            DetailedAssessment.created_at,
        ).order_by(DetailedAssessment.created_at.desc())
    )
    rows = result.all()

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=[
        "id", "user_id", "protocol_name", "asset_class", "status", "created_at"
    ])
    writer.writeheader()
    for r in rows:
        writer.writerow({
            "id": str(r[0]),
            "user_id": str(r[1]),
            "protocol_name": r[2],
            "asset_class": r[3],
            "status": r[4],
            "created_at": _fmt(r[5]),
        })

    await _log(db, "admin.export_assessments", actor_id=admin.id,
               ip=_get_ip(request), details={"count": len(rows)})
    await db.commit()

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rwa-index-assessments.csv"},
    )


@router.get("/export/audit-log")
async def export_audit_log(admin: AdminUser, db: DbSession, request: Request):
    Actor = aliased(User, name="actor")
    Target = aliased(User, name="target")

    rows = await db.execute(
        select(AuditLog, Actor.email.label("ae"), Target.email.label("te"))
        .outerjoin(Actor, AuditLog.actor_user_id == Actor.id)
        .outerjoin(Target, AuditLog.target_user_id == Target.id)
        .order_by(AuditLog.timestamp.desc())
    )

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=[
        "id", "timestamp", "action_type", "actor_email", "target_email",
        "ip_address", "details",
    ])
    writer.writeheader()
    for row in rows:
        lg, ae, te = row[0], row[1], row[2]
        writer.writerow({
            "id": str(lg.id),
            "timestamp": _fmt(lg.timestamp),
            "action_type": lg.action_type,
            "actor_email": ae or "",
            "target_email": te or "",
            "ip_address": lg.ip_address or "",
            "details": str(lg.details) if lg.details else "",
        })

    await _log(db, "admin.export_audit_log", actor_id=admin.id, ip=_get_ip(request))
    await db.commit()

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rwa-index-audit-log.csv"},
    )
