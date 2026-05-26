"""Add indexes on detailed_assessments for common filter columns

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-24

Adds:
  detailed_assessments.protocol_name  — partial-match search in admin list
  detailed_assessments.status         — filter by draft/checklist_generated/finalized
  detailed_assessments.created_at     — ORDER BY / date-range queries
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_detailed_assessments_protocol_name",
        "detailed_assessments",
        ["protocol_name"],
    )
    op.create_index(
        "ix_detailed_assessments_status",
        "detailed_assessments",
        ["status"],
    )
    op.create_index(
        "ix_detailed_assessments_created_at",
        "detailed_assessments",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_detailed_assessments_created_at", table_name="detailed_assessments")
    op.drop_index("ix_detailed_assessments_status", table_name="detailed_assessments")
    op.drop_index("ix_detailed_assessments_protocol_name", table_name="detailed_assessments")
