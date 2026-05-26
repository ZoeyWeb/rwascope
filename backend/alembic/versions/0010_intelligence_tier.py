"""Add tier column to intelligence_items with backfill

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-26

"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ── inferTier logic mirrored from web/src/utils/inferTier.ts ─────────────────

_RE_SOVEREIGN_BODIES = re.compile(
    r'FATF|BIS|IOSCO|FSB|IMF|BCBS|SEC|CFTC|HKMA|SFC|MAS|VARA|FSA|FCA|ESMA|BaFin|ECB|FED|OCC|Treasury'
)
_RE_LEGISLATION_IN_TITLE = re.compile(
    r'cap\.?\s*\d+|ordinance|act\b|directive|enacted', re.IGNORECASE
)
_RE_REGULATION_KEYWORDS = re.compile(
    r'act\b|ordinance|regulation|directive|effective|enacted', re.IGNORECASE
)
_RE_CAP = re.compile(r'cap\.\s*\d+', re.IGNORECASE)
_RE_FIRST_LICENCE = re.compile(
    r'first|inaugural|grants?\s+licen[cs]e|issues?\s+licen[cs]e', re.IGNORECASE
)
_RE_SOVEREIGN_INFRA = re.compile(
    r'Ensemble|Agor[áa]|mBridge|Guardian|Helvetia|Pine|Mariana', re.IGNORECASE
)
_RE_SYSTEMIC = re.compile(
    r'collapse|depeg|insolvency|bankruptcy|liquidation|halted|froze', re.IGNORECASE
)
_RE_REGULATORY_SIGNAL = re.compile(
    r'regulation|framework|licens|finalise|finaliz|publish|establish|operationa', re.IGNORECASE
)


def _infer_tier(
    title: str,
    event_type: str,
    significance: str | None,
    source_entity: str | None,
    is_data_snapshot: bool,
) -> str:
    if significance == 'landmark':
        return 'milestone'

    # Legislation with explicit event_type
    if event_type == 'regulation' and _RE_REGULATION_KEYWORDS.search(title):
        return 'milestone'

    # Title-based legislation detection (independent of event_type)
    if _RE_LEGISLATION_IN_TITLE.search(title):
        return 'milestone'

    # First licence / inaugural
    if _RE_FIRST_LICENCE.search(title) and event_type != 'project':
        return 'milestone'

    # Sovereign bodies in source_entity or title
    entity = source_entity or ''
    if _RE_SOVEREIGN_BODIES.search(entity) or _RE_SOVEREIGN_BODIES.search(title):
        return 'milestone'

    # Sovereign infrastructure
    if _RE_SOVEREIGN_INFRA.search(title):
        return 'milestone'

    # Systemic failures
    if significance == 'major' and _RE_SYSTEMIC.search(title):
        return 'milestone'

    if is_data_snapshot:
        return 'news'

    return 'news'


def upgrade() -> None:
    # 1. Add column — server default 'news' so existing rows are immediately valid
    op.add_column(
        'intelligence_items',
        sa.Column('tier', sa.String(20), nullable=False, server_default='news'),
    )

    # 2. Backfill: compute and apply inferred tier for every existing row
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT id, title, event_type, significance, source_entity, is_data_snapshot "
            "FROM intelligence_items"
        )
    ).fetchall()

    milestone_ids: list[str] = []
    news_ids: list[str] = []

    for row in rows:
        tier = _infer_tier(
            title=row[1] or '',
            event_type=row[2] or 'regulation',
            significance=row[3],
            source_entity=row[4],
            is_data_snapshot=bool(row[5]),
        )
        if tier == 'milestone':
            milestone_ids.append(str(row[0]))
        else:
            news_ids.append(str(row[0]))

    if milestone_ids:
        conn.execute(
            sa.text(
                "UPDATE intelligence_items SET tier = 'milestone' WHERE id::text = ANY(:ids)"
            ),
            {'ids': milestone_ids},
        )

    # 'news' is already the server default — no UPDATE needed for those rows

    print(
        f"\n[0010] tier backfill — milestone: {len(milestone_ids)}, "
        f"news: {len(news_ids)}, total: {len(rows)}"
    )


def downgrade() -> None:
    op.drop_column('intelligence_items', 'tier')
