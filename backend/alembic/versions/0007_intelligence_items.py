"""Add intelligence_items table for automated data collection

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "intelligence_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("region", sa.String(20), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("event_date", sa.Date, nullable=True),
        sa.Column("source_url", sa.String(2000), nullable=True, unique=True),
        sa.Column("raw_content", sa.Text, nullable=True),
        sa.Column("policy_summary", sa.Text, nullable=True),
        sa.Column("market_impact", JSONB, nullable=True),
        sa.Column("rwa_relevant", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("event_type", sa.String(20), nullable=False, server_default="regulation"),
        sa.Column("is_data_snapshot", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("source_entity", sa.String(100), nullable=True),
        sa.Column("data_source", sa.String(50), nullable=True),
        sa.Column("significance", sa.String(20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_intelligence_items_status", "intelligence_items", ["status"])
    op.create_index("ix_intelligence_items_region", "intelligence_items", ["region"])
    op.create_index("ix_intelligence_items_event_date", "intelligence_items", ["event_date"])
    op.create_index("ix_intelligence_items_data_source", "intelligence_items", ["data_source"])
    op.create_index("ix_intelligence_items_category", "intelligence_items", ["category"])


def downgrade() -> None:
    op.drop_table("intelligence_items")
