#!/usr/bin/env python3
"""
init_narratives_data.py — Seed narrative threads and policy_impact example data.

Steps
-----
1. Connect to DB; report existing intelligence_items and narrative_threads.
2. Insert 3 sample intelligence_items (status=published) with policy_impact
   (4-layer causality chain expected by PolicyImpactCard.tsx).
3. Upsert 4 narrative threads.  related_event_ids references both:
   - Static JSON item IDs (e.g. "us-genius-act-2025")
   - UUIDs of the newly inserted DB items
4. Print a summary of every action taken.

Idempotent: duplicate slugs and duplicate source_url values are skipped.

Usage (from backend/ directory, venv activated):
    python scripts/init_narratives_data.py

Or with explicit DATABASE_URL:
    DATABASE_URL=postgresql+asyncpg://user:pass@localhost/rwascope_backend \
        python scripts/init_narratives_data.py
"""
from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import date
from pathlib import Path
from typing import Optional

# Allow running from the backend/ root without installing the package.
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.intelligence import IntelligenceItem, NarrativeThread

# ── policy_impact schema (mirrors types/intelligence.ts PolicyImpact) ──────────
#
# {
#   "benefited_sectors": [str, ...],
#   "affected_entities":  [str, ...],   ← note: NOT affected_entity_types
#   "capital_flow": {
#     "from": str,
#     "to":   str,
#     "estimated_scale": str | None,
#     "timeframe":       str | None,
#   }
# }

# ── 3 sample DB intelligence items ────────────────────────────────────────────

SEED_ITEMS: list[dict] = [
    {
        # ① SFC circular on tokenization for licensed intermediaries
        "_seed_key": "sfc-tokenization-circular-2024",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "SFC",
        "data_source": "sfc",
        "event_date": date(2024, 11, 28),
        "title": "SFC Issues Circular on Tokenization of SFC-Authorised Investment Products for Intermediaries",
        "source_url": "https://www.sfc.hk/en/news-and-announcements/policy-statements-and-announcements/",
        "policy_summary": (
            "The Securities and Futures Commission issued a circular to licensed intermediaries "
            "in November 2024 clarifying the regulatory expectations for distributing or facilitating "
            "investments in SFC-authorised tokenized products. The circular covers client suitability "
            "obligations, disclosure requirements, and custody arrangements for tokenized fund units "
            "and structured products. [Source URL requires verification at sfc.hk; specific circular "
            "reference number should be confirmed before citing.] AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Operationalises the SFC's 2023 tokenization framework for day-to-day intermediary conduct, "
            "directly shaping how HK-licensed brokers distribute RWA products."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "SFC-licensed intermediaries with tokenized product distribution capabilities",
                "Tokenized fund platforms operating through licensed SPV structures",
                "RWA custody and prime brokerage services with compliant client-asset segregation",
            ],
            "affected_entities": [
                "Non-licensed intermediaries handling tokenized product distribution without SFC authorisation",
                "Offshore tokenized product distributors serving HK retail clients without equivalency",
                "DeFi front-ends offering SFC-authorised fund tokens without intermediary licensing",
            ],
            "capital_flow": {
                "from": "Informal and unregulated tokenized product distribution channels in HK",
                "to": "SFC-licensed intermediary platforms with formal tokenization compliance frameworks",
                "estimated_scale": "HKD multi-billion retail and institutional tokenized fund market",
                "timeframe": "2025–2026 compliance transition period",
            },
        },
    },
    {
        # ② IOSCO tokenization principles final report
        "_seed_key": "iosco-tokenization-principles-2025",
        "category": "global_policy",
        "region": "global",
        "event_type": "research",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "IOSCO",
        "data_source": "iosco",
        "event_date": date(2025, 10, 15),
        "title": "IOSCO Publishes Final Principles for Tokenization of Real-World Assets",
        "source_url": "https://www.iosco.org/library/pubdocs/",
        "policy_summary": (
            "The International Organization of Securities Commissions published its final policy "
            "principles addressing the tokenization of real-world assets in Q4 2025, following a "
            "consultation paper issued in early 2025. The principles address investor protection, "
            "disclosure, cross-border equivalency, and market integrity standards for tokenized "
            "securities and funds. [Specific publication date and document title require verification "
            "at iosco.org.] AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Sets the global baseline that HKMA, MAS, and EU ESMA will reference when finalising "
            "their own tokenization rulebooks, raising the floor for cross-border RWA equivalency."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Multi-jurisdiction RWA platforms with IOSCO-aligned disclosure standards",
                "Regulated tokenized securities issuers targeting institutional distribution",
                "DvP settlement infrastructure with investor-protection-compliant architecture",
            ],
            "affected_entities": [
                "Cross-border tokenized asset platforms lacking investor-protection frameworks aligned to IOSCO principles",
                "Jurisdictions without national regulations incorporating IOSCO tokenization guidance",
                "Tokenized product issuers with insufficient disclosure and asset-segregation standards",
            ],
            "capital_flow": {
                "from": "Unregulated or lightly regulated cross-border tokenized asset flows",
                "to": "Regulated markets with IOSCO-principle-aligned tokenization frameworks (HK, EU, SG, US)",
                "estimated_scale": "Est. USD 10–30B institutional RWA reallocation over 24 months",
                "timeframe": "2026–2027",
            },
        },
    },
    {
        # ③ MAS Project Guardian Phase 3 — institutional FX and fixed income
        "_seed_key": "mas-guardian-phase3-2025",
        "category": "global_policy",
        "region": "sg",
        "event_type": "institutional",
        "significance": "notable",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "MAS / Project Guardian",
        "data_source": "mas",
        "event_date": date(2025, 9, 1),
        "title": "MAS Project Guardian Phase 3 — Institutional FX and Fixed Income Tokenization Pilots",
        "source_url": "https://www.mas.gov.sg/schemes-and-initiatives/project-guardian",
        "policy_summary": (
            "MAS launched Phase 3 of Project Guardian in September 2025, expanding tokenized deposit "
            "pilots into institutional FX and fixed income settlement. Participating institutions "
            "include major global banks with Singapore operations. The phase focuses on atomic "
            "DvP settlement for tokenized bonds and bilateral FX using tokenized bank deposits. "
            "[Phase 3 details and participant list require verification against MAS press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Advances Singapore's tokenized-deposit infrastructure from proof-of-concept toward "
            "live wholesale settlement, directly competitive with HK's EnsembleTX pilot."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Tokenized FX and fixed income settlement platforms with MAS regulatory backing",
                "Bank-operated tokenized deposit infrastructure in Singapore",
                "Cross-border RWA settlement between SGD and USD settlement rails",
            ],
            "affected_entities": [
                "Traditional FX prime brokers without tokenized settlement capability",
                "Correspondent banks relying on legacy fixed income settlement systems",
                "Non-participating banks in Singapore at risk of losing institutional wholesale flow",
            ],
            "capital_flow": {
                "from": "Legacy bilateral FX confirmation and fixed income settlement infrastructure",
                "to": "Tokenized deposit and smart-contract-based atomic DvP settlement rails",
                "estimated_scale": "SGD/USD wholesale institutional transaction volumes (undisclosed)",
                "timeframe": "H2 2025 – H1 2026",
            },
        },
    },
]

# ── 4 narrative threads ────────────────────────────────────────────────────────
# related_event_ids will be filled programmatically (JSON IDs + new DB UUIDs).

NARRATIVE_SEEDS: list[dict] = [
    {
        "slug": "hk-stablecoin-arc",
        "name": "HK Stablecoin Regulatory Arc",
        "description": (
            "From SFC VATP licensing (2023) to Cap. 656 (2025) and the first HKD stablecoin "
            "licences (2026) — tracing Hong Kong's legislative journey to build a regulated "
            "digital money infrastructure layer for RWA settlement."
        ),
        "status": "active",
        "color": "#0C447C",
        # JSON static item IDs + seed keys resolved to DB UUIDs below
        "_json_event_ids": [
            "hk-sfc-vatp-licensing-2023",
            "hkma-stablecoins-ordinance-2025",
            "hkma-stablecoin-licences-hsbc-anchorpoint-2026",
        ],
        "_db_seed_keys": ["sfc-tokenization-circular-2024"],
        "expected_next_events": [
            {
                "quarter": "Q3 2026",
                "description": (
                    "HKMA stablecoin licence expansion — additional issuers expected to receive "
                    "Cap. 656 licences following the first two grants to HSBC and Anchorpoint."
                ),
                "impact": (
                    "Broadens the licensed HKD digital money ecosystem and intensifies "
                    "competition among stablecoin issuers seeking institutional distribution."
                ),
            },
            {
                "quarter": "Q4 2026",
                "description": (
                    "Licensed HKD stablecoins formally integrated into EnsembleTX settlement "
                    "as the primary cash leg for tokenized asset transactions."
                ),
                "impact": (
                    "Completes the regulatory-infrastructure loop: licensed stablecoin issuers "
                    "provide the cash rail; EnsembleTX provides the asset-settlement layer."
                ),
            },
        ],
    },
    {
        "slug": "global-stablecoin-race",
        "name": "Global Stablecoin Regulatory Race",
        "description": (
            "The parallel development of stablecoin frameworks across MAS (2023), EU MiCA (2024), "
            "and the US GENIUS Act (2025) — mapping converging reserve and attestation standards "
            "and the prospects for cross-border equivalency arrangements."
        ),
        "status": "active",
        "color": "#374151",
        "_json_event_ids": [
            "mas-stablecoin-framework-2023",
            "eu-mica-full-application-2024",
            "us-genius-act-2025",
            "hkma-stablecoins-ordinance-2025",
        ],
        "_db_seed_keys": ["iosco-tokenization-principles-2025", "mas-guardian-phase3-2025"],
        "expected_next_events": [
            {
                "quarter": "Q3 2026",
                "description": (
                    "US–EU–HK regulatory dialogue on stablecoin framework equivalency — "
                    "mutual recognition discussions expected to surface at FSB and BIS forums."
                ),
                "impact": (
                    "Could enable cross-border stablecoin distribution without duplicative "
                    "licensing, reducing compliance costs for global issuers."
                ),
            },
        ],
    },
    {
        "slug": "fatf-travel-rule-implementation",
        "name": "FATF Travel Rule: Global Implementation",
        "description": (
            "The evolution of FATF Recommendation 16 from its 2019 crypto guidance through the "
            "June 2025 revision, and the phased incorporation into national VASP regimes — "
            "with HKMA's updated AML/CTF rules for VATPs pending as of May 2026."
        ),
        "status": "active",
        "color": "#374151",
        "_json_event_ids": ["fatf-r16-revision-2025"],
        "_db_seed_keys": ["iosco-tokenization-principles-2025"],
        "expected_next_events": [
            {
                "quarter": "Q3 2026",
                "description": (
                    "HKMA consultation on R.16 incorporation into VASP AML/CTF rules — "
                    "licensed VATPs expected to receive updated Travel Rule data-field requirements."
                ),
                "impact": (
                    "Licensed VATPs (12 as of Feb 2026) will need to upgrade their Travel Rule "
                    "technical solutions; non-compliant platforms risk licence conditions."
                ),
            },
            {
                "quarter": "Q4 2026",
                "description": (
                    "FSB and FATF joint review of Travel Rule implementation gaps across "
                    "G20 jurisdictions — enforcement posture expected to harden."
                ),
                "impact": (
                    "Correspondent banks will intensify de-risking of non-compliant VASP "
                    "corridors, accelerating consolidation toward compliant venues."
                ),
            },
        ],
    },
    {
        "slug": "hk-rwa-infrastructure",
        "name": "HK RWA Tokenization Infrastructure",
        "description": (
            "Building Hong Kong's institutional RWA infrastructure — from the EnsembleTX launch "
            "(November 2025) to licensed HKD stablecoins that form the regulated cash settlement "
            "layer for on-chain tokenized asset transactions."
        ),
        "status": "active",
        "color": "#085041",
        "_json_event_ids": [
            "hkma-ensembletx-launch-2025",
            "hkma-stablecoin-licences-hsbc-anchorpoint-2026",
        ],
        "_db_seed_keys": ["sfc-tokenization-circular-2024"],
        "expected_next_events": [
            {
                "quarter": "Q2 2026",
                "description": (
                    "EnsembleTX Phase 2: expansion from bilateral tokenized deposit pilots to "
                    "multi-institution atomic DvP settlement for tokenized bonds and funds."
                ),
                "impact": (
                    "Establishes HK's wholesale tokenized settlement infrastructure as "
                    "operationally proven, positioning it for institutional adoption at scale."
                ),
            },
            {
                "quarter": "Q3 2026",
                "description": (
                    "First tokenized bond issuance on EnsembleTX using licensed HKD stablecoin "
                    "as the regulated cash leg — expected from a participating institution."
                ),
                "impact": (
                    "Validates the full stack: SFC-compliant tokenized security + licensed "
                    "HKD stablecoin settlement on HKMA-backed infrastructure."
                ),
            },
        ],
    },
]


# ── main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # ── 1. Report existing state ───────────────────────────────────────────
        existing_items_count = (
            await session.execute(text("SELECT COUNT(*) FROM intelligence_items"))
        ).scalar_one()
        existing_narratives_count = (
            await session.execute(text("SELECT COUNT(*) FROM narrative_threads"))
        ).scalar_one()
        print(f"[state]  intelligence_items: {existing_items_count} rows")
        print(f"[state]  narrative_threads:  {existing_narratives_count} rows")
        print()

        # ── 2. Upsert DB intelligence items with policy_impact ─────────────────
        seed_key_to_uuid: dict[str, str] = {}

        for spec in SEED_ITEMS:
            seed_key = spec["_seed_key"]

            # Check by source_url (UNIQUE constraint)
            existing = (
                await session.execute(
                    select(IntelligenceItem).where(
                        IntelligenceItem.source_url == spec["source_url"]
                    )
                )
            ).scalar_one_or_none()

            if existing:
                seed_key_to_uuid[seed_key] = str(existing.id)
                print(f"[skip]   item already exists (source_url match): {spec['title'][:70]}")
                continue

            item_id = uuid.uuid4()
            item = IntelligenceItem(
                id=item_id,
                category=spec["category"],
                region=spec["region"],
                event_type=spec["event_type"],
                significance=spec["significance"],
                is_data_snapshot=spec["is_data_snapshot"],
                rwa_relevant=spec["rwa_relevant"],
                status=spec["status"],
                source_entity=spec["source_entity"],
                data_source=spec["data_source"],
                event_date=spec["event_date"],
                title=spec["title"],
                source_url=spec["source_url"],
                policy_summary=spec["policy_summary"],
                narrative_impact_note=spec.get("narrative_impact_note"),
                policy_impact=spec["policy_impact"],
            )
            session.add(item)
            await session.flush()  # write row so UUID is stable before narratives

            seed_key_to_uuid[seed_key] = str(item_id)
            print(f"[insert] item: {spec['title'][:70]}")
            print(f"         uuid: {item_id}  region={spec['region']}  sig={spec['significance']}")

        await session.commit()
        print()

        # ── 3. Upsert narrative threads ────────────────────────────────────────
        for spec in NARRATIVE_SEEDS:
            slug = spec["slug"]

            # Resolve related_event_ids: JSON IDs + new DB UUIDs
            related_ids: list[str] = list(spec["_json_event_ids"])
            for key in spec["_db_seed_keys"]:
                db_uuid = seed_key_to_uuid.get(key)
                if db_uuid:
                    related_ids.append(db_uuid)

            existing_narr: Optional[NarrativeThread] = (
                await session.execute(
                    select(NarrativeThread).where(NarrativeThread.slug == slug)
                )
            ).scalar_one_or_none()

            if existing_narr:
                # Merge: add any new IDs not already in related_event_ids
                current_ids = set(existing_narr.related_event_ids or [])
                merged = list(current_ids | set(related_ids))
                existing_narr.related_event_ids = merged
                existing_narr.expected_next_events = spec["expected_next_events"]
                await session.commit()
                print(
                    f"[update] narrative '{slug}' — "
                    f"related_event_ids now {len(merged)} ids"
                )
            else:
                narr = NarrativeThread(
                    id=uuid.uuid4(),
                    slug=slug,
                    name=spec["name"],
                    description=spec["description"],
                    status=spec["status"],
                    color=spec["color"],
                    related_event_ids=related_ids,
                    expected_next_events=spec["expected_next_events"],
                )
                session.add(narr)
                await session.commit()
                print(
                    f"[insert] narrative '{slug}' — "
                    f"{len(related_ids)} related events  "
                    f"({len(spec['_json_event_ids'])} JSON + "
                    f"{len(spec['_db_seed_keys'])} DB)"
                )

        print()

        # ── 4. Final state ─────────────────────────────────────────────────────
        final_items = (
            await session.execute(text("SELECT COUNT(*) FROM intelligence_items"))
        ).scalar_one()
        final_narratives = (
            await session.execute(text("SELECT COUNT(*) FROM narrative_threads"))
        ).scalar_one()
        print(f"[done]   intelligence_items: {final_items} rows")
        print(f"[done]   narrative_threads:  {final_narratives} rows")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
