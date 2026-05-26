"""Add newsletter_subscribers table

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-12

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "newsletter_subscribers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column(
            "subscribed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("unsubscribe_token", sa.String(64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.UniqueConstraint("email", name="uq_newsletter_subscribers_email"),
        sa.UniqueConstraint("unsubscribe_token", name="uq_newsletter_subscribers_token"),
    )
    op.create_index("ix_newsletter_subscribers_email", "newsletter_subscribers", ["email"])
    op.create_index("ix_newsletter_subscribers_token", "newsletter_subscribers", ["unsubscribe_token"])


def downgrade() -> None:
    op.drop_table("newsletter_subscribers")
