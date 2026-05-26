"""Initial schema: users, detailed_assessments, assessment_sub_scores, ai_reports

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── detailed_assessments ──────────────────────────────────────────────────
    op.create_table(
        "detailed_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("protocol_name", sa.String(255), nullable=False),
        sa.Column("asset_class", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("chains", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("rcs_score", sa.Float(), nullable=True),
        sa.Column("rarm_total", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_detailed_assessments_user_id", "detailed_assessments", ["user_id"]
    )

    # ── assessment_sub_scores ─────────────────────────────────────────────────
    op.create_table(
        "assessment_sub_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "assessment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("detailed_assessments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("layer_number", sa.Integer(), nullable=False),
        sa.Column("indicator_key", sa.String(100), nullable=False),
        sa.Column("indicator_label", sa.String(255), nullable=False),
        sa.Column("user_score", sa.Integer(), nullable=False),
        sa.Column("ai_suggested_score", sa.Integer(), nullable=True),
        sa.Column("final_score", sa.Integer(), nullable=True),
        sa.Column("ai_reason", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_assessment_sub_scores_assessment_id",
        "assessment_sub_scores",
        ["assessment_id"],
    )

    # ── ai_reports ────────────────────────────────────────────────────────────
    op.create_table(
        "ai_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "assessment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("detailed_assessments.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "layer_narratives",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "improvement_roadmap",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "compliance_gaps",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("overall_narrative", sa.Text(), nullable=False),
        sa.Column("ai_rcs", sa.Float(), nullable=False),
        sa.Column("model_used", sa.String(100), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completion_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("ai_reports")
    op.drop_index("ix_assessment_sub_scores_assessment_id", table_name="assessment_sub_scores")
    op.drop_table("assessment_sub_scores")
    op.drop_index("ix_detailed_assessments_user_id", table_name="detailed_assessments")
    op.drop_table("detailed_assessments")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
