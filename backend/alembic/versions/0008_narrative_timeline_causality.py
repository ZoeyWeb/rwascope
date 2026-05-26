"""Add narrative timeline, causality fields, and user narrative subscriptions

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-17

Adds:
  intelligence_items.narrative_impact_note  TEXT
  intelligence_items.policy_impact          JSONB
  narrative_threads.expected_next_events    JSONB
  table user_narrative_subscriptions
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # intelligence_items — two new optional columns
    op.add_column("intelligence_items", sa.Column("narrative_impact_note", sa.Text, nullable=True))
    op.add_column("intelligence_items", sa.Column("policy_impact", JSONB, nullable=True))

    # narrative_threads — expected next events
    op.add_column("narrative_threads", sa.Column("expected_next_events", JSONB, nullable=True))

    # user narrative subscriptions
    op.create_table(
        "user_narrative_subscriptions",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("narrative_id", UUID(as_uuid=True), sa.ForeignKey("narrative_threads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("notification_preference", sa.String(10), nullable=False, server_default="web"),
        sa.Column(
            "subscribed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("user_id", "narrative_id"),
    )
    op.create_index("ix_user_narrative_subs_user", "user_narrative_subscriptions", ["user_id"])
    op.create_index("ix_user_narrative_subs_narrative", "user_narrative_subscriptions", ["narrative_id"])


def downgrade() -> None:
    op.drop_table("user_narrative_subscriptions")
    op.drop_column("narrative_threads", "expected_next_events")
    op.drop_column("intelligence_items", "policy_impact")
    op.drop_column("intelligence_items", "narrative_impact_note")
