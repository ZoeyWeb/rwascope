"""Add stablecoin_relevant to intelligence_items with backfill

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Note: `tags` is not a DB column (it only exists in the static intelligence.json),
# so the backfill matches on title and policy_summary only.
_BACKFILL_SQL = """
UPDATE intelligence_items
SET stablecoin_relevant = true
WHERE
  LOWER(title) ~ 'stablecoin|usdc|usdt|tether|circle|pyusd|busd|fdusd|usdr|terra|ust\\b|depeg|de-peg|cap\\.?\\s*656|stablecoins ordinance|genius act|mica.*stablecoin|hkd.*stable'
  OR LOWER(policy_summary) ~ 'stablecoin'
"""


def upgrade() -> None:
    op.add_column(
        "intelligence_items",
        sa.Column("stablecoin_relevant", sa.Boolean, nullable=False, server_default="false"),
    )

    conn = op.get_bind()

    total_before = conn.execute(
        sa.text("SELECT COUNT(*) FROM intelligence_items")
    ).scalar()

    conn.execute(sa.text(_BACKFILL_SQL))

    stablecoin_count = conn.execute(
        sa.text("SELECT COUNT(*) FROM intelligence_items WHERE stablecoin_relevant = true")
    ).scalar()

    rwa_or_stablecoin = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM intelligence_items "
            "WHERE rwa_relevant = true OR stablecoin_relevant = true"
        )
    ).scalar()

    rwa_false_stablecoin_true = conn.execute(
        sa.text(
            "SELECT id, title FROM intelligence_items "
            "WHERE rwa_relevant = false AND stablecoin_relevant = true "
            "ORDER BY event_date DESC"
        )
    ).fetchall()

    rwa_false_stablecoin_false = conn.execute(
        sa.text(
            "SELECT id, title FROM intelligence_items "
            "WHERE rwa_relevant = false AND stablecoin_relevant = false "
            "ORDER BY event_date DESC"
        )
    ).fetchall()

    print(f"\n[0011] stablecoin_relevant backfill complete")
    print(f"  total rows           : {total_before}")
    print(f"  stablecoin_relevant  : {stablecoin_count}")
    print(f"  rwa OR stablecoin    : {rwa_or_stablecoin}")

    if rwa_false_stablecoin_true:
        print(f"\n  rwa_relevant=false AND stablecoin_relevant=true ({len(rwa_false_stablecoin_true)} items — pure stablecoin events):")
        for row in rwa_false_stablecoin_true:
            print(f"    [{row[0]}] {row[1]}")
    else:
        print(f"\n  rwa_relevant=false AND stablecoin_relevant=true : 0")

    if rwa_false_stablecoin_false:
        print(f"\n  rwa_relevant=false AND stablecoin_relevant=false ({len(rwa_false_stablecoin_false)} items — noise candidates):")
        for row in rwa_false_stablecoin_false:
            print(f"    [{row[0]}] {row[1]}")
    else:
        print(f"\n  rwa_relevant=false AND stablecoin_relevant=false : 0")


def downgrade() -> None:
    op.drop_column("intelligence_items", "stablecoin_relevant")
