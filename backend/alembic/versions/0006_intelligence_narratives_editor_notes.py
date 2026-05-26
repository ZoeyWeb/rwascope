"""Add narrative_threads and editor_notes tables for Intelligence module v2

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-15

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "narrative_threads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column(
            "related_event_ids",
            ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
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
        sa.UniqueConstraint("slug", name="uq_narrative_threads_slug"),
    )
    op.create_index("ix_narrative_threads_status", "narrative_threads", ["status"])

    op.create_table(
        "editor_notes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("week_label", sa.String(50), nullable=False),
        sa.Column(
            "published_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column(
            "related_event_ids",
            ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("author", sa.String(100), nullable=False, server_default="RWAscope Research"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_editor_notes_status", "editor_notes", ["status"])
    op.create_index("ix_editor_notes_published_at", "editor_notes", ["published_at"])


def downgrade() -> None:
    op.drop_table("editor_notes")
    op.drop_table("narrative_threads")
