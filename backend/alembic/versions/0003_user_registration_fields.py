"""Add registration/approval fields to users; create audit_logs table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users: add registration / approval fields ─────────────────────────────
    op.add_column("users", sa.Column("full_name_new", sa.String(200), nullable=True))
    # Copy existing full_name → full_name_new then rename (full_name was nullable before)
    op.execute("UPDATE users SET full_name_new = full_name")
    op.drop_column("users", "full_name")
    op.alter_column("users", "full_name_new", new_column_name="full_name")
    # Make full_name NOT NULL with default empty string for any existing nulls
    op.execute("UPDATE users SET full_name = '' WHERE full_name IS NULL")
    op.alter_column("users", "full_name", nullable=False)

    op.add_column("users", sa.Column("organization", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("use_case", sa.Text(), nullable=True))

    # status replaces is_active; existing active users get 'active'
    op.add_column(
        "users",
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
    )
    op.execute(
        "UPDATE users SET status = CASE WHEN is_active THEN 'active' ELSE 'suspended' END"
    )

    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Existing users are considered verified
    op.execute("UPDATE users SET email_verified_at = created_at WHERE is_active = true")

    op.add_column(
        "users",
        sa.Column("verification_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "verification_token_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column("password_reset_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "password_reset_expires_at", sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "terms_version",
            sa.String(20),
            nullable=False,
            server_default="1.0",
        ),
    )
    op.add_column(
        "users",
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users", sa.Column("registration_ip", sa.String(45), nullable=True)
    )
    op.add_column(
        "users", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "reviewed_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "users", sa.Column("rejection_reason", sa.Text(), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "auto_approved",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_admin", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column(
        "users",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_users_status", "users", ["status"])
    op.create_index("ix_users_verification_token", "users", ["verification_token"])
    op.create_index("ix_users_password_reset_token", "users", ["password_reset_token"])

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "actor_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column(
            "target_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column(
            "details",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_target_user_id", "audit_logs", ["target_user_id"])
    op.create_index("ix_audit_logs_action_type", "audit_logs", ["action_type"])
    op.create_index("ix_audit_logs_timestamp", "audit_logs", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_timestamp", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_target_user_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    for idx in [
        "ix_users_password_reset_token",
        "ix_users_verification_token",
        "ix_users_status",
    ]:
        op.drop_index(idx, table_name="users")

    for col in [
        "deleted_at", "is_admin", "auto_approved", "rejection_reason",
        "reviewed_by_user_id", "reviewed_at", "registration_ip",
        "last_login_at", "terms_version", "password_reset_expires_at",
        "password_reset_token", "verification_token_expires_at",
        "verification_token", "email_verified_at", "status",
        "use_case", "organization",
    ]:
        op.drop_column("users", col)

    # Restore full_name as nullable String(255)
    op.alter_column("users", "full_name", nullable=True)
    op.alter_column("users", "full_name", type_=sa.String(255))
