import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    organization: Mapped[str | None] = mapped_column(String(200), nullable=True)
    use_case: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Status / lifecycle ────────────────────────────────────────────────────
    # pending_verification → pending_review → active
    # or pending_verification → active (auto-approved after email verify)
    # or pending_review → rejected / suspended
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending_verification", index=True
    )

    # ── Email verification ────────────────────────────────────────────────────
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verification_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Password reset ────────────────────────────────────────────────────────
    password_reset_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Compliance / consent ──────────────────────────────────────────────────
    terms_version: Mapped[str] = mapped_column(
        String(20), nullable=False, default="1.0"
    )

    # ── Activity tracking ─────────────────────────────────────────────────────
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    registration_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ── Admin review ──────────────────────────────────────────────────────────
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    auto_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Newsletter ────────────────────────────────────────────────────────────
    newsletter_subscribed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # ── Roles / soft-delete ───────────────────────────────────────────────────
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Legacy column kept for backward-compat; mirrors status=='active'
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    assessments: Mapped[list["DetailedAssessment"]] = relationship(  # type: ignore[name-defined]
        "DetailedAssessment", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def is_fully_active(self) -> bool:
        return self.status == "active"
