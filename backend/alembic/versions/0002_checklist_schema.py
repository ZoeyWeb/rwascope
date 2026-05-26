"""Compliance refactor: replace ai_reports with ai_checklists, add rationale column,
rename rcs_score → rarm_score, drop legacy ai_suggested_score / ai_reason columns.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-21 00:00:00.000000

Changes:
  - detailed_assessments: rename rcs_score → rarm_score
  - assessment_sub_scores: drop ai_suggested_score, drop ai_reason, add rationale
  - Drop table: ai_reports (stores AI numeric scores — non-compliant)
  - Create table: ai_checklists (stores questions/sources/red-flags per layer, no scores)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Rename rcs_score → rarm_score in detailed_assessments ─────────────
    op.alter_column(
        "detailed_assessments",
        "rcs_score",
        new_column_name="rarm_score",
        existing_type=sa.Float(),
        existing_nullable=True,
    )

    # ── 2. Drop legacy AI score columns from assessment_sub_scores ────────────
    op.drop_column("assessment_sub_scores", "ai_suggested_score")
    op.drop_column("assessment_sub_scores", "ai_reason")

    # ── 3. Add rationale column (user's own evidence note) ────────────────────
    op.add_column(
        "assessment_sub_scores",
        sa.Column("rationale", sa.Text(), nullable=True),
    )

    # ── 4. Drop the old ai_reports table (stored numeric scores — non-compliant)
    op.drop_table("ai_reports")

    # ── 5. Create ai_checklists table (questions / sources / red flags only) ──
    op.create_table(
        "ai_checklists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "assessment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("detailed_assessments.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        # checklist: list of {layer_number, layer_name, questions_to_verify,
        #                      public_data_sources, red_flags_to_consider}
        sa.Column(
            "checklist",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("overall_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "suggested_public_sources",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
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
    op.create_index(
        "ix_ai_checklists_assessment_id",
        "ai_checklists",
        ["assessment_id"],
        unique=True,
    )


def downgrade() -> None:
    # ── Reverse order ─────────────────────────────────────────────────────────

    # Drop new checklist table
    op.drop_index("ix_ai_checklists_assessment_id", table_name="ai_checklists")
    op.drop_table("ai_checklists")

    # Recreate ai_reports table
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

    # Remove rationale column
    op.drop_column("assessment_sub_scores", "rationale")

    # Restore legacy AI score columns
    op.add_column(
        "assessment_sub_scores",
        sa.Column("ai_suggested_score", sa.Integer(), nullable=True),
    )
    op.add_column(
        "assessment_sub_scores",
        sa.Column("ai_reason", sa.Text(), nullable=True),
    )

    # Rename rarm_score back to rcs_score
    op.alter_column(
        "detailed_assessments",
        "rarm_score",
        new_column_name="rcs_score",
        existing_type=sa.Float(),
        existing_nullable=True,
    )
