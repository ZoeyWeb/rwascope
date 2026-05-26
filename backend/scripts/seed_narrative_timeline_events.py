#!/usr/bin/env python3
"""
seed_narrative_timeline_events.py — Seed 5 narrative threads with 5-8 historical events each.

Creates intelligence_narrative_map junction table if it does not exist, then:
  1. Inserts events into intelligence_items (skip on duplicate source_url)
  2. Upserts 5 narrative threads
  3. Inserts into intelligence_narrative_map (idempotent via ON CONFLICT DO NOTHING)
  4. Also appends IDs into narrative_threads.related_event_ids for backward compatibility

Narratives seeded:
  1. tokenized-treasury-legitimization   (2023-01 → 2026-02, 8 events)
  2. hk-stablecoin-regulation            (2024-02 → 2026-04, 8 events)
  3. bank-entry-rwa                      (2023-05 → 2025-09, 8 events)
  4. cross-border-settlement             (2023-06 → 2026-03, 8 events)
  5. real-estate-tokenization            (2023-03 → 2026-01, 8 events)

Usage (from backend/ directory, venv activated):
    python scripts/seed_narrative_timeline_events.py
"""
from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.intelligence import IntelligenceItem, NarrativeThread

# ─────────────────────────────────────────────────────────────────────────────
# Narrative 1 — Tokenized Treasury Legitimization
# ─────────────────────────────────────────────────────────────────────────────

NARRATIVE_1_ITEMS: list[dict] = [
    {
        "_seed_key": "ondo-ousg-launch-2023",
        "category": "global_policy",
        "region": "us",
        "event_type": "project",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Ondo Finance",
        "data_source": "ondo",
        "event_date": date(2023, 1, 12),
        "title": "Ondo Finance Launches OUSG — First Institutional Tokenized US Treasury On-Chain",
        "source_url": "https://ondo.finance/blog/ousg-launch",
        "policy_summary": (
            "Ondo Finance launched OUSG in January 2023, providing on-chain access to BlackRock's "
            "iShares Short Treasury Bond ETF (SHV) for accredited and institutional investors. "
            "OUSG represented the first large-scale tokenized short-duration US Treasury product "
            "deployed on Ethereum, with a minimum subscription of USD 100,000. The product "
            "demonstrated that regulatory-grade tokenized government securities could operate "
            "on public blockchains without custodial compromise. "
            "[Specific launch date and AUM figures require verification at ondo.finance.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Established the technical and legal template — SPV wrapper, SHV as underlying, "
            "Compound as distribution channel — that subsequent issuers (BUIDL, BENJI) adapted "
            "at larger scale."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "DeFi protocols seeking yield-bearing on-chain collateral",
                "Accredited investors requiring off-exchange Treasury exposure",
                "Tokenized securities platforms building compliant institutional infrastructure",
            ],
            "affected_entities": [
                "Traditional brokerage accounts holding SHV without programmability",
                "Stablecoin yield products unable to offer regulatory-grade backing",
            ],
            "capital_flow": {
                "from": "Off-chain Treasury ETF holdings at traditional custodians",
                "to": "On-chain tokenized Treasury wrappers accessible to DeFi protocols",
                "estimated_scale": "USD 50–200M initial tranche (verified AUM required)",
                "timeframe": "2023 H1",
            },
        },
    },
    {
        "_seed_key": "benji-200m-milestone-2023",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": True,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Franklin Templeton",
        "data_source": "franklin_templeton",
        "event_date": date(2023, 8, 15),
        "title": "Franklin Templeton BENJI Crosses USD 300M AUM on Polygon",
        "source_url": "https://www.franklintempleton.com/campaigns/benji",
        "policy_summary": (
            "Franklin Templeton's BENJI tokenized US government money market fund surpassed "
            "USD 300 million in assets under management in August 2023, marking a major "
            "institutional endorsement of on-chain fund tokenization. Operating on Polygon "
            "and Stellar, BENJI recorded each share transaction directly on-chain, making it "
            "the first registered US mutual fund to use a public blockchain as transfer agent. "
            "[AUM figure and date require verification against Franklin Templeton's public disclosures.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Demonstrated that a registered US mutual fund structure — not merely a DeFi wrapper — "
            "could operate transparently on public blockchain rails, lowering perceived regulatory "
            "risk for subsequent institutional entrants."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Asset managers exploring on-chain mutual fund distribution",
                "Polygon and Stellar network adoption by institutional tokenization projects",
                "Compliance technology providers enabling on-chain transfer-agent functions",
            ],
            "affected_entities": [
                "Traditional transfer agents relying on T+2 off-chain settlement cycles",
                "Money market fund distributors without blockchain integration capabilities",
            ],
            "capital_flow": {
                "from": "Off-chain money market fund units held at conventional custodians",
                "to": "On-chain tokenized MMF shares on Polygon with programmable settlement",
                "estimated_scale": "USD 300M+ (August 2023 milestone)",
                "timeframe": "2023 H1–H2",
            },
        },
    },
    {
        "_seed_key": "superstate-ustb-launch-2024",
        "category": "global_policy",
        "region": "us",
        "event_type": "project",
        "significance": "notable",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Superstate",
        "data_source": "superstate",
        "event_date": date(2024, 1, 17),
        "title": "Superstate Launches USTB — Tokenized Short-Duration Treasuries for DeFi Collateral",
        "source_url": "https://superstate.co/ustb",
        "policy_summary": (
            "Superstate launched USTB in January 2024, offering tokenized short-duration US "
            "Treasury exposure specifically designed for use as collateral within DeFi lending "
            "protocols. Unlike OUSG, USTB targeted protocol-level integration, allowing DeFi "
            "platforms to accept tokenized Treasuries as over-collateralization without manual "
            "redemption. The product accelerated the adoption of RWA collateral in on-chain "
            "credit markets. "
            "[Launch date and collateral integrations require verification at superstate.co.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Shifted tokenized Treasuries from investor product to DeFi infrastructure layer, "
            "expanding the addressable market from accredited investors to protocol treasuries."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "DeFi lending protocols seeking yield-bearing collateral alternatives to stablecoins",
                "Protocol DAOs deploying treasury reserves into regulated on-chain yield",
                "Tokenized Treasury issuers targeting protocol-level whitelisting",
            ],
            "affected_entities": [
                "Stablecoin-only collateral markets with zero yield profile",
                "Centralized exchange margin systems unable to accept on-chain RWA collateral",
            ],
            "capital_flow": {
                "from": "Idle stablecoin reserves in DeFi protocol treasuries",
                "to": "Yield-bearing tokenized Treasury positions as active collateral",
                "estimated_scale": "USD multi-hundred million DeFi treasury addressable market",
                "timeframe": "2024–2025",
            },
        },
    },
    {
        "_seed_key": "blackrock-buidl-launch-2024",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "BlackRock / Securitize",
        "data_source": "blackrock",
        "event_date": date(2024, 3, 20),
        "title": "BlackRock Launches BUIDL on Ethereum — World's Largest Asset Manager Enters Tokenized Treasuries",
        "source_url": "https://www.blackrock.com/us/individual/products/buidl",
        "policy_summary": (
            "BlackRock launched the BlackRock USD Institutional Digital Liquidity Fund (BUIDL) "
            "on Ethereum on 20 March 2024 via the Securitize tokenization platform. BlackRock "
            "seeded the fund with USD 100 million. BUIDL invests exclusively in US Treasury "
            "bills, repurchase agreements, and cash, distributing daily accrued yield directly "
            "to token holders' wallets. The launch signalled a decisive shift in institutional "
            "legitimacy for tokenized government securities markets. "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "BlackRock's entry with a USD 100M seed effectively ended the debate over whether "
            "tokenized Treasuries could meet institutional mandate requirements, catalysing "
            "competing launches from Goldman Sachs, UBS, and others within 12 months."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Securitize and tokenization platforms targeting institutional asset manager clients",
                "Ethereum-based RWA settlement infrastructure providers",
                "Institutional investors requiring on-chain T-Bill exposure with daily yield",
            ],
            "affected_entities": [
                "Unregulated yield aggregators competing on yield without regulatory clarity",
                "Traditional money market fund distributors without on-chain equivalents",
            ],
            "capital_flow": {
                "from": "Off-chain Treasury funds and money market accounts",
                "to": "BUIDL and competing tokenized Treasury funds on Ethereum",
                "estimated_scale": "USD 100M seed; USD 500M+ AUM within 60 days (verify)",
                "timeframe": "2024 Q1–Q2",
            },
        },
    },
    {
        "_seed_key": "sec-tokenized-mmf-collateral-2024",
        "category": "global_policy",
        "region": "us",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "SEC",
        "data_source": "sec",
        "event_date": date(2024, 7, 8),
        "title": "SEC Staff Acknowledges Tokenized Fund Shares as Eligible Margin Collateral for Broker-Dealers",
        "source_url": "https://www.sec.gov/divisions/marketreg/",
        "policy_summary": (
            "SEC Division of Market Regulation staff issued guidance in mid-2024 acknowledging "
            "that tokenized fund shares meeting specified conditions could qualify as eligible "
            "margin collateral for registered broker-dealers, removing a key regulatory barrier "
            "to institutional adoption of BUIDL, BENJI, and similar products in prime brokerage. "
            "The guidance addressed custody, haircut methodology, and transfer mechanics for "
            "on-chain fund tokens. "
            "[Specific SEC guidance reference number and exact date require verification at sec.gov. "
            "This event may reflect staff informal guidance rather than formal rule-making — "
            "requires fact-check before publishing.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Resolved the final institutional impediment to BUIDL adoption in prime brokerage, "
            "enabling hedge funds and asset managers to post tokenized Treasuries as variation "
            "margin without triggering broker-dealer compliance exceptions."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Prime brokers accepting tokenized fund shares as eligible margin collateral",
                "Hedge funds and asset managers using BUIDL/BENJI in derivatives portfolios",
                "Tokenized fund issuers qualifying for prime brokerage distribution channels",
            ],
            "affected_entities": [
                "Traditional T-bill positions unable to earn yield while posted as margin",
                "Non-tokenized MMF shares with slower redemption cycles",
            ],
            "capital_flow": {
                "from": "Idle cash and low-yield margin accounts at prime brokers",
                "to": "Tokenized T-Bill positions earning daily yield while serving as collateral",
                "estimated_scale": "Multi-billion USD prime brokerage collateral pool (addressable)",
                "timeframe": "2024 H2 – 2025",
            },
        },
    },
    {
        "_seed_key": "tokenized-treasury-3b-milestone-2025",
        "category": "global_policy",
        "region": "global",
        "event_type": "data_milestone",
        "significance": "major",
        "is_data_snapshot": True,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "RWA.xyz / DeFiLlama",
        "data_source": "rwa_xyz",
        "event_date": date(2025, 1, 22),
        "title": "Tokenized Treasury Market Aggregate AUM Crosses USD 3 Billion",
        "source_url": "https://rwa.xyz/dashboards/treasuries",
        "policy_summary": (
            "Aggregate AUM across tokenized US Treasury products — including BUIDL, BENJI, OUSG, "
            "USTB, and USYC — surpassed USD 3 billion in January 2025 according to on-chain "
            "tracking platforms. BUIDL held the largest single position at approximately USD 650M "
            "at the time of crossing this threshold. The milestone coincided with the Federal "
            "Reserve holding the federal funds rate above 4%, sustaining strong demand for "
            "yield-bearing on-chain Treasury instruments. "
            "[AUM figures and exact crossing date require verification against RWA.xyz data at "
            "the time of publishing.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Established tokenized Treasuries as a structurally permanent USD multi-billion "
            "asset class rather than a cyclical DeFi yield experiment, attracting sovereign "
            "wealth and pension fund exploratory interest."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Institutional custody and prime brokerage for tokenized fund products",
                "On-chain yield infrastructure integrated with BUIDL and BENJI",
                "RWA data and analytics platforms covering tokenized Treasury flows",
            ],
            "affected_entities": [
                "Traditional MMF distributors without on-chain distribution capability",
                "Unregulated on-chain yield products competing on yield without T-bill backing",
            ],
            "capital_flow": {
                "from": "Off-chain Treasury accounts and institutional cash management facilities",
                "to": "Tokenized Treasury positions on Ethereum, Polygon, Stellar, and Solana",
                "estimated_scale": "USD 3B+ aggregate AUM (January 2025 threshold)",
                "timeframe": "2023–2025",
            },
        },
    },
    {
        "_seed_key": "benji-multichain-2025",
        "category": "global_policy",
        "region": "us",
        "event_type": "project",
        "significance": "notable",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Franklin Templeton",
        "data_source": "franklin_templeton",
        "event_date": date(2025, 5, 19),
        "title": "Franklin BENJI Achieves Native Multi-Chain Deployment on Arbitrum, Base, and Aptos",
        "source_url": "https://www.franklintempleton.com/press-releases/benji-multichain",
        "policy_summary": (
            "Franklin Templeton expanded its BENJI tokenized money market fund to Arbitrum, "
            "Base, and Aptos in May 2025, enabling DeFi protocol integration on L2 networks "
            "and non-EVM chains. The expansion allowed yield-bearing BENJI shares to be used "
            "as liquidity pool collateral on Arbitrum-native DeFi and provided Aptos-based "
            "institutions with on-chain US Treasury exposure without cross-chain bridging risk. "
            "[Specific chains and deployment dates require verification at franklintempleton.com.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Multi-chain native deployment removed the bridging-risk objection from institutional "
            "DeFi desks, accelerating BENJI adoption in protocol treasury management across "
            "non-Ethereum ecosystems."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Arbitrum and Base DeFi protocols seeking yield-bearing collateral on L2",
                "Aptos-native institutional platforms requiring compliant US Treasury exposure",
                "Cross-chain RWA infrastructure providers enabling multi-chain fund distribution",
            ],
            "affected_entities": [
                "Bridge aggregators previously required for BENJI L2 access",
                "Ethereum-only tokenized Treasury products facing L2 liquidity competition",
            ],
            "capital_flow": {
                "from": "BENJI holdings on Polygon and Stellar",
                "to": "Native BENJI deployments on Arbitrum, Base, and Aptos",
                "estimated_scale": "Portion of BENJI AUM redistributed across chains (undisclosed)",
                "timeframe": "2025 Q2–Q3",
            },
        },
    },
    {
        "_seed_key": "ensembletx-treasury-settlement-2026",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / EnsembleTX",
        "data_source": "hkma",
        "event_date": date(2026, 2, 14),
        "title": "EnsembleTX Activates Tokenized Treasury as Eligible Settlement Collateral for Participating Institutions",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/02/",
        "policy_summary": (
            "HKMA's EnsembleTX wholesale settlement platform activated tokenized Treasury "
            "fund shares — including products meeting HKMA-specified eligibility criteria — "
            "as accepted collateral in the platform's atomic DvP settlement rails in February 2026. "
            "Participating institutions can now post compliant tokenized Treasury positions "
            "as the cash leg in HK institutional RWA transactions, completing the settlement "
            "infrastructure loop. "
            "[Specific HKMA press release and exact activation date require verification "
            "at hkma.gov.hk.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Closes the loop between US-origin tokenized Treasuries and HK institutional "
            "settlement infrastructure, enabling cross-border collateral mobility without "
            "off-chain redemption and re-subscription."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "BUIDL and BENJI holders seeking cross-border collateral mobility in HK",
                "EnsembleTX participants requiring diversified eligible collateral types",
                "HK licensed custodians holding tokenized Treasury positions on behalf of clients",
            ],
            "affected_entities": [
                "Traditional cash-only settlement participants unable to earn collateral yield",
                "Tokenized fund products not meeting HKMA eligibility criteria for EnsembleTX",
            ],
            "capital_flow": {
                "from": "Idle cash positions used as settlement collateral",
                "to": "Yield-bearing tokenized Treasury collateral within EnsembleTX rails",
                "estimated_scale": "Portion of EnsembleTX daily settlement volumes (undisclosed)",
                "timeframe": "2026 Q1–Q2",
            },
        },
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Narrative 2 — HK Stablecoin Regulation
# ─────────────────────────────────────────────────────────────────────────────

NARRATIVE_2_ITEMS: list[dict] = [
    {
        "_seed_key": "hkma-stablecoin-discussion-paper-2024",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA",
        "data_source": "hkma",
        "event_date": date(2024, 2, 26),
        "title": "HKMA Publishes Stablecoin Regulatory Discussion Paper — Proposes Risk-Based Licensing",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2024/02/",
        "policy_summary": (
            "The Hong Kong Monetary Authority published a discussion paper in February 2024 "
            "outlining its proposed risk-based regulatory framework for fiat-referenced stablecoin "
            "issuers. The paper proposed licensing requirements covering capital adequacy, reserve "
            "quality, governance, technology, redemption, and disclosure — aligning with the "
            "six SARM dimensions. Consultation responses from banks, technology firms, and "
            "asset managers were invited. "
            "[Specific discussion paper reference and consultation period end date require "
            "verification at hkma.gov.hk.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Defined the six-dimension framework that became the basis for the Stablecoins "
            "Ordinance (Cap. 656), giving market participants 18 months to prepare compliance "
            "infrastructure before licensing went live."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Banks with existing reserve management and disclosure infrastructure",
                "Licensed financial institutions positioned to meet capital adequacy requirements",
                "Compliance technology providers building HKMA stablecoin licensing toolkits",
            ],
            "affected_entities": [
                "Technology-led stablecoin issuers without banking-equivalent capital structures",
                "Offshore stablecoin issuers targeting HK retail distribution without local entity",
            ],
            "capital_flow": {
                "from": "Unregulated offshore stablecoin issuers serving HK users",
                "to": "HKMA-licensed HKD stablecoin issuers with reserve-quality infrastructure",
                "estimated_scale": "HKD multi-billion stablecoin market in formation",
                "timeframe": "2024–2026 licensing transition",
            },
        },
    },
    {
        "_seed_key": "hkma-stablecoin-sandbox-announcement-2024",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA",
        "data_source": "hkma",
        "event_date": date(2024, 7, 17),
        "title": "HKMA Announces Stablecoin Issuer Sandbox with Admission Criteria",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2024/07/",
        "policy_summary": (
            "HKMA launched its stablecoin issuer sandbox in July 2024, publishing admission "
            "criteria and inviting qualified financial institutions to apply. The sandbox allowed "
            "selected participants to test HKD-pegged stablecoin issuance under HKMA supervisory "
            "oversight prior to full licensing under the forthcoming Stablecoins Ordinance. "
            "Admission criteria covered capital requirements, reserve asset composition, "
            "redemption mechanics, and AML/CFT controls. "
            "[Specific sandbox announcement date and admission criteria document require "
            "verification at hkma.gov.hk.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The sandbox gave the first operational signal of which institution types would "
            "qualify under Cap. 656, effectively pre-selecting the first-batch licence holders "
            "12 months before the Ordinance came into force."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Major banks with HK regulatory relationships and capital adequacy",
                "Licensed payment institutions with existing HKMA oversight",
                "Technology joint ventures pairing fintech with licensed institutions",
            ],
            "affected_entities": [
                "Standalone crypto-native stablecoin issuers without banking partners",
                "Offshore issuers unable to establish HKMA-acceptable local presence",
            ],
            "capital_flow": {
                "from": "Informal HKD stablecoin pilots without regulatory status",
                "to": "HKMA-supervised sandbox participants with a path to licences",
                "estimated_scale": "Sandbox pilot volumes undisclosed; expected sub-HKD 1B",
                "timeframe": "2024 H2 – 2025",
            },
        },
    },
    {
        "_seed_key": "hkma-sandbox-first-batch-2024",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA",
        "data_source": "hkma",
        "event_date": date(2024, 12, 18),
        "title": "HKMA Admits First Batch of Stablecoin Sandbox Participants — HSBC, JD, Standard Chartered / Animoca / HKT",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2024/12/",
        "policy_summary": (
            "HKMA announced the first batch of stablecoin sandbox participants in December 2024: "
            "HSBC Bank (HKD stablecoin), JD Coin Chain (JD Group's HKD-pegged product), and "
            "a consortium of Standard Chartered, Animoca Brands, and HKT. Each participant "
            "entered supervised testing covering reserve management, redemption mechanics, "
            "AML/CFT controls, and technology resilience under HKMA oversight. This batch "
            "directly foreshadowed the first Cap. 656 licence grants in April 2026. "
            "[Exact participant names and admission dates require verification at hkma.gov.hk — "
            "JD and the SCB/Animoca/HKT consortium composition should be confirmed.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Confirmed that Hong Kong's stablecoin licensing model would be bank-anchored, "
            "not fintech-led, setting expectations for the reserve-quality and governance "
            "standards that independent issuers would need to meet."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "HKMA-supervised sandbox participants on a direct path to Cap. 656 licences",
                "HKD payment infrastructure and settlement providers integrating sandbox output",
                "Institutional investors requiring HKMA-supervised HKD stablecoin counterparties",
            ],
            "affected_entities": [
                "Offshore HKD stablecoin issuers without sandbox admission facing market-access risk",
                "Non-admitted applicants competing for second-batch sandbox entry in 2025",
            ],
            "capital_flow": {
                "from": "Unregulated HKD stablecoin liquidity pools",
                "to": "HKMA-supervised sandbox pilot issuances with reserve segregation",
                "estimated_scale": "Sandbox pilot volumes undisclosed",
                "timeframe": "2025 H1 supervised testing",
            },
        },
    },
    {
        "_seed_key": "stablecoins-bill-legco-2025",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / LegCo",
        "data_source": "hkma",
        "event_date": date(2025, 3, 12),
        "title": "Stablecoins Bill Introduced to Hong Kong LegCo for First Reading",
        "source_url": "https://www.legco.gov.hk/yr2025/english/bills/",
        "policy_summary": (
            "The Stablecoins Bill was introduced to the Hong Kong Legislative Council for "
            "first reading in March 2025, formalising the licensing framework previewed in "
            "the 2024 HKMA discussion paper. The Bill established mandatory licensing under "
            "HKMA for fiat-referenced stablecoin issuers operating in HK or targeting HK users, "
            "with reserve requirements, redemption obligations, and disclosure standards. "
            "It would later pass as the Stablecoins Ordinance (Cap. 656). "
            "[Specific Bill reference number and LegCo sitting date require verification "
            "at legco.gov.hk.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Moved HK stablecoin regulation from policy consultation to legislative process, "
            "triggering immediate preparation by sandbox participants for licence applications "
            "timed to the Ordinance's commencement."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Sandbox participants positioned for first-mover licence grants",
                "Legal and compliance advisors building Cap. 656 licence application practices",
                "Institutional investors requiring legislative certainty before HKD stablecoin adoption",
            ],
            "affected_entities": [
                "Offshore stablecoin issuers now facing explicit HK licensing requirements",
                "Non-bank technology issuers without HKMA-acceptable capital and governance",
            ],
            "capital_flow": {
                "from": "Regulatory grey-area HKD stablecoin activity",
                "to": "Licensed HKD stablecoin market under Cap. 656 framework",
                "estimated_scale": "HKD multi-billion addressable market pending Ordinance",
                "timeframe": "2025 Q1 – 2026 Q1",
            },
        },
    },
    {
        "_seed_key": "stablecoins-ordinance-enacted-2025",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / LegCo",
        "data_source": "hkma",
        "event_date": date(2025, 8, 1),
        "title": "Stablecoins Ordinance (Cap. 656) Comes into Force — HK Licensing Regime Activated",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2025/08/",
        "policy_summary": (
            "The Stablecoins Ordinance (Cap. 656) came into force in August 2025, activating "
            "HKMA's mandatory licensing regime for fiat-referenced stablecoin issuers. From "
            "commencement, offering, issuing, or promoting stablecoins pegged to the Hong Kong "
            "dollar or other fiat currencies in Hong Kong without a Cap. 656 licence became "
            "a criminal offence. Licensed issuers must maintain 1:1 reserve backing in high-quality "
            "liquid assets with daily attestation and same-day redemption capability. "
            "[Exact commencement date requires verification at hkma.gov.hk. "
            "Cap. 656 is the correct ordinance reference per HKMA's legislative framework.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The most consequential regulatory milestone in HK digital money to date: Cap. 656 "
            "established HK as Asia's first major jurisdiction with a live, criminal-sanction-backed "
            "stablecoin licensing regime, 18 months ahead of the EU's EMT licensing equivalent."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "HKMA-licensed stablecoin issuers with first-mover regulatory moat",
                "HK institutional investors requiring licensed stablecoin counterparties",
                "Cross-border settlement infrastructure accepting only licensed HKD stablecoins",
            ],
            "affected_entities": [
                "Offshore issuers operating in HK without Cap. 656 licences (criminal liability)",
                "DeFi protocols distributing unlicensed HKD stablecoins to HK users",
            ],
            "capital_flow": {
                "from": "Unlicensed and offshore HKD stablecoin circulation in Hong Kong",
                "to": "Licensed HKD stablecoins under Cap. 656 — first two issuers (HSBC, Anchorpoint)",
                "estimated_scale": "Full market migration expected over 12–18 month transition",
                "timeframe": "2025 H2 – 2026",
            },
        },
    },
    {
        "_seed_key": "hsbc-anchorpoint-licences-2026",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA",
        "data_source": "hkma",
        "event_date": date(2026, 4, 15),
        "title": "HKMA Grants First Two Stablecoin Licences — HSBC HKD and Anchorpoint Financial",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/04/",
        "policy_summary": (
            "HKMA granted the first two stablecoin licences under the Stablecoins Ordinance "
            "(Cap. 656) in April 2026: one to HSBC Bank (HK) Ltd for an HKD-pegged stablecoin "
            "(HSBC HKD), and one to Anchorpoint Financial — a consortium of Standard Chartered, "
            "Animoca Brands, and HKT — for their HKD-pegged product. Both licences required "
            "full reserve backing in HKMA-eligible liquid assets, daily third-party attestation, "
            "and T+0 redemption capability. "
            "[Licence holder names, licence numbers, and exact grant date require verification "
            "at hkma.gov.hk.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The first Cap. 656 licences validated Hong Kong's stablecoin regulatory framework "
            "as operational and provided EnsembleTX with a licensed cash leg for institutional "
            "RWA settlement — completing the HK digital money infrastructure stack."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "HSBC HKD and Anchorpoint as first-mover licensed stablecoin issuers",
                "EnsembleTX participants accepting licensed HKD stablecoins as settlement cash",
                "HK institutional investors now able to hold HKMA-supervised digital HKD",
            ],
            "affected_entities": [
                "Competing HKD stablecoin projects not yet licensed facing distribution restrictions",
                "Offshore USD stablecoins targeting HK institutional settlement use cases",
            ],
            "capital_flow": {
                "from": "Offshore stablecoin and bank deposit settlement instruments",
                "to": "HSBC HKD and Anchorpoint licensed stablecoins in HK institutional flows",
                "estimated_scale": "Initial licensed issuances expected in HKD billions range",
                "timeframe": "2026 Q2 onwards",
            },
        },
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Narrative 3 — Bank Entry into RWA
# ─────────────────────────────────────────────────────────────────────────────

NARRATIVE_3_ITEMS: list[dict] = [
    {
        "_seed_key": "jpmorgan-onyx-tcn-2023",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "JPMorgan / Onyx",
        "data_source": "jpmorgan",
        "event_date": date(2023, 5, 16),
        "title": "JPMorgan Onyx Tokenized Collateral Network Processes Milestone Institutional Repo Volume",
        "source_url": "https://www.jpmorgan.com/onyx/tokenized-collateral-network",
        "policy_summary": (
            "JPMorgan's Onyx Tokenized Collateral Network (TCN) reported processing significant "
            "institutional repo transaction volumes by May 2023, with BlackRock's tokenized MMF "
            "shares used as collateral in an overnight repo with Barclays — the first intraday "
            "on-chain collateral transfer between institutional counterparties. The TCN operates "
            "on JPMorgan's private Ethereum fork, allowing same-day collateral mobility without "
            "T+2 settlement delays. "
            "[Transaction volumes, counterparty details, and date of milestone require verification "
            "against JPMorgan Onyx press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "First proof that a G-SIB's internal blockchain could settle institutional repo "
            "using tokenized fund collateral in live market conditions, proving the operational "
            "case for bank-operated tokenized asset infrastructure."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "G-SIBs with private blockchain repo collateral mobility infrastructure",
                "Institutional counterparties requiring intraday T-bill collateral substitution",
                "Tokenized MMF issuers integrated with JPMorgan TCN distribution",
            ],
            "affected_entities": [
                "Traditional tri-party repo custodians relying on T+2 collateral transfer",
                "Non-tokenized collateral products unable to support intraday substitution",
            ],
            "capital_flow": {
                "from": "Static overnight repo collateral locked until end-of-day settlement",
                "to": "Intraday mobile tokenized collateral positions on JPMorgan TCN",
                "estimated_scale": "USD 1B+ daily TCN volumes reported (verify)",
                "timeframe": "2023 onwards",
            },
        },
    },
    {
        "_seed_key": "hsbc-orion-bond-2023",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HSBC",
        "data_source": "hsbc",
        "event_date": date(2023, 11, 2),
        "title": "HSBC Orion Issues Tokenized Bond on Ethereum — First Major Bank Institutional DLT Issuance",
        "source_url": "https://www.hsbc.com/news-and-views/news/hsbc-orion",
        "policy_summary": (
            "HSBC launched its Orion digital asset platform in November 2023 and issued its "
            "first tokenized bond on Ethereum for institutional investors, enabling on-chain "
            "primary issuance with digital settlement. The bond was structured as a digital "
            "HKD-denominated token with full legal parity to conventional bond instruments. "
            "HSBC Orion represented the first major bank proprietary tokenized bond issuance "
            "platform in Hong Kong targeting institutional secondary market trading. "
            "[Platform launch date and issuance details require verification against HSBC "
            "Orion press releases at hsbc.com.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "HSBC's direct entry into on-chain bond issuance — rather than intermediating "
            "a third-party tokenization platform — signalled that major banks saw tokenized "
            "capital markets as a core rather than peripheral business line."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Bank-operated tokenized bond issuance platforms targeting institutional market",
                "On-chain bond settlement infrastructure compatible with HSBC Orion",
                "HK institutional investors accessing tokenized HKD bond exposure",
            ],
            "affected_entities": [
                "Traditional bond syndication desks without digital issuance capabilities",
                "Third-party tokenization intermediaries competing with bank proprietary platforms",
            ],
            "capital_flow": {
                "from": "Conventional bond issuance and secondary trading infrastructure",
                "to": "Bank-operated on-chain tokenized bond issuance and settlement",
                "estimated_scale": "Initial issuance size undisclosed; institutional distribution only",
                "timeframe": "2023 Q4 – 2024",
            },
        },
    },
    {
        "_seed_key": "citi-token-services-2024",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Citi",
        "data_source": "citi",
        "event_date": date(2024, 2, 8),
        "title": "Citi Token Services Goes Live for Institutional Clients — Tokenized Deposits for Treasury",
        "source_url": "https://www.citigroup.com/global/news/2024/citi-token-services",
        "policy_summary": (
            "Citi launched Citi Token Services in early 2024 for institutional clients, "
            "providing tokenized bank deposits that enable 24/7 global fund transfer and "
            "smart-contract-based trade finance. The service uses a permissioned blockchain "
            "to allow institutional treasuries to move tokenized deposits across Citi's "
            "global network instantaneously, eliminating correspondent banking delays for "
            "cross-border treasury operations. "
            "[Launch date, participating clients, and jurisdictions require verification "
            "against Citi press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "One of the first live tokenized deposit products from a global systemically "
            "important bank serving non-US institutional treasuries, validating the "
            "commercial case for bank-issued digital money in cross-border corporate payments."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Multinational corporate treasuries requiring instant cross-border fund transfers",
                "Trade finance desks integrating smart-contract conditional payment triggers",
                "Bank digital treasury infrastructure providers",
            ],
            "affected_entities": [
                "SWIFT-based correspondent banking networks for same-currency transfers",
                "FinTech cross-border payment rails competing on speed without bank deposit backing",
            ],
            "capital_flow": {
                "from": "Correspondent bank overnight float and T+2 cross-border treasury operations",
                "to": "Tokenized deposit instant settlement via Citi Token Services",
                "estimated_scale": "Institutional corporate treasury volumes (undisclosed)",
                "timeframe": "2024 onwards",
            },
        },
    },
    {
        "_seed_key": "sc-animoca-hkt-stablecoin-2024",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Standard Chartered / Animoca Brands / HKT",
        "data_source": "standard_chartered",
        "event_date": date(2024, 6, 6),
        "title": "Standard Chartered, Animoca Brands, and HKT Announce Joint HKD Stablecoin Venture",
        "source_url": "https://www.sc.com/en/media/press-release/",
        "policy_summary": (
            "Standard Chartered, Animoca Brands, and HKT announced a joint venture in June 2024 "
            "to develop an HKD-pegged stablecoin targeting institutional and retail digital "
            "payment use cases in Hong Kong. The consortium combined Standard Chartered's banking "
            "licence and reserve management capabilities, Animoca's Web3 distribution network, "
            "and HKT's telco payment infrastructure. The venture subsequently entered the "
            "HKMA stablecoin sandbox as part of the first-batch admission. "
            "[Announcement date, JV terms, and sandbox admission details require verification "
            "against Standard Chartered and Animoca press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Demonstrated the bank-plus-technology consortium model that HKMA favoured: "
            "licensed banking anchor providing regulatory capital; technology partners "
            "providing distribution and programmability."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Licensed banks as anchor partners in HKMA-compliant stablecoin structures",
                "Web3 platforms gaining regulatory-grade HKD stablecoin distribution",
                "Telco payment networks integrating with licensed digital money",
            ],
            "affected_entities": [
                "Technology-first stablecoin issuers without banking anchor structure",
                "Offshore HKD stablecoin products lacking HKMA-eligible reserve backing",
            ],
            "capital_flow": {
                "from": "Informal digital payment and gaming credit ecosystems",
                "to": "HKMA-supervised HKD stablecoin ecosystem with banking-grade backing",
                "estimated_scale": "Initial capitalisation undisclosed; HKD billions target",
                "timeframe": "2024–2026",
            },
        },
    },
    {
        "_seed_key": "goldman-sachs-tokenized-treasury-dvp-2025",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Goldman Sachs Digital Assets",
        "data_source": "goldman_sachs",
        "event_date": date(2025, 1, 28),
        "title": "Goldman Sachs Digital Assets Completes First Tokenized US Treasury DvP Settlement",
        "source_url": "https://www.goldmansachs.com/intelligence/pages/digital-assets",
        "policy_summary": (
            "Goldman Sachs Digital Assets division completed its first tokenized US Treasury "
            "delivery-versus-payment settlement in January 2025, using on-chain tokenized "
            "T-bill positions as the securities leg in a DvP transaction with an institutional "
            "counterparty. The transaction demonstrated atomic settlement — simultaneous exchange "
            "of tokenized securities and cash without settlement risk — at G-SIB institutional "
            "scale. "
            "[Transaction details, counterparty, and date require verification against Goldman "
            "Sachs Digital Assets announcements.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Goldman's entry into live tokenized DvP (not merely pilot) confirmed that "
            "G-SIB trading desks viewed tokenized settlement as production-ready, not "
            "experimental — a credibility threshold that accelerated pension and sovereign "
            "wealth interest."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Institutional counterparties requiring G-SIB-grade tokenized DvP settlement",
                "Tokenized Treasury issuers seeking Goldman distribution and market-making",
                "Atomic settlement infrastructure providers at institutional scale",
            ],
            "affected_entities": [
                "Traditional T+2 bond settlement infrastructure at DTCC",
                "Custodians unable to support tokenized DvP settlement mechanics",
            ],
            "capital_flow": {
                "from": "Traditional DvP settlement with T+2 counterparty risk window",
                "to": "Atomic on-chain DvP with zero settlement risk at Goldman institutional scale",
                "estimated_scale": "Single-transaction pilot; volume scale undisclosed",
                "timeframe": "2025 H1",
            },
        },
    },
    {
        "_seed_key": "ubs-tokenized-mmf-2025",
        "category": "global_policy",
        "region": "global",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "UBS Asset Management",
        "data_source": "ubs",
        "event_date": date(2025, 4, 22),
        "title": "UBS Asset Management Launches Tokenized Money Market Fund for Accredited Institutional Investors",
        "source_url": "https://www.ubs.com/global/en/asset-management/",
        "policy_summary": (
            "UBS Asset Management launched a tokenized money market fund product in April 2025 "
            "targeting accredited institutional investors, using permissioned blockchain "
            "infrastructure to deliver real-time NAV calculation, T+0 redemption, and "
            "programmable yield distribution. The fund represented UBS's first live tokenized "
            "product with full secondary market transfer capability between whitelisted "
            "institutional counterparties. "
            "[Product name, launch date, and AUM target require verification against "
            "UBS Asset Management press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "UBS's entry from Europe's largest wealth manager extended the institutional "
            "tokenized fund trend into the Swiss/European institutional distribution channel, "
            "creating cross-border equivalency questions for HKMA's Cap. 656 framework."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "European and Asian institutional investors accessing UBS tokenized MMF",
                "Permissioned blockchain infrastructure providers serving major asset managers",
                "Multi-jurisdiction tokenized fund distribution platforms",
            ],
            "affected_entities": [
                "Traditional MMF custodians with T+2 redemption cycles",
                "Non-tokenized UBS fund distribution channels facing cannibalisation",
            ],
            "capital_flow": {
                "from": "Traditional UBS MMF holdings with T+1/T+2 settlement",
                "to": "Tokenized UBS MMF with T+0 redemption and programmable yield",
                "estimated_scale": "Initial institutional tranche undisclosed",
                "timeframe": "2025 Q2 onwards",
            },
        },
    },
    {
        "_seed_key": "bny-mellon-tokenized-custody-2025",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "notable",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "BNY Mellon",
        "data_source": "bny_mellon",
        "event_date": date(2025, 9, 15),
        "title": "BNY Mellon Extends Custody Services to Tokenized Fund Shares on Major Permissioned Chains",
        "source_url": "https://www.bnymellon.com/us/en/insights/",
        "policy_summary": (
            "BNY Mellon, the world's largest custodian by assets under custody, announced "
            "extension of its institutional custody services to tokenized fund shares on "
            "major permissioned blockchain networks in September 2025. The service covers "
            "on-chain asset segregation, transfer agent reconciliation, and independent "
            "NAV verification for tokenized fund positions held by institutional clients. "
            "[Specific chains supported, client count, and announcement date require "
            "verification against BNY Mellon press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "BNY Mellon's custodial coverage removed the final institutional barrier for "
            "pension funds and insurance companies adopting tokenized fund positions — "
            "independent custodianship being the non-negotiable compliance requirement."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Pension funds and insurance companies requiring independent tokenized fund custody",
                "Tokenized fund issuers gaining BNY Mellon institutional distribution eligibility",
                "Permissioned chains with BNY Mellon custody integration",
            ],
            "affected_entities": [
                "Tokenized fund custodians unable to match BNY Mellon's regulatory trust status",
                "Self-custody tokenized fund solutions excluded from pension mandate requirements",
            ],
            "capital_flow": {
                "from": "Traditional custody accounts for conventional fund units",
                "to": "BNY Mellon-custodied tokenized fund positions on permissioned chains",
                "estimated_scale": "Addressable pension/insurance AUM potentially multi-trillion (long term)",
                "timeframe": "2025 Q4 onwards",
            },
        },
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Narrative 4 — Cross-border Settlement
# ─────────────────────────────────────────────────────────────────────────────

NARRATIVE_4_ITEMS: list[dict] = [
    {
        "_seed_key": "mbridge-mvp-2023",
        "category": "global_policy",
        "region": "global",
        "event_type": "institutional",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "BIS / mBridge",
        "data_source": "bis",
        "event_date": date(2023, 6, 19),
        "title": "BIS mBridge Reaches MVP Stage — Four Central Banks Complete Multi-CBDC Cross-Border Pilot",
        "source_url": "https://www.bis.org/about/bisih/topics/cbdc/mcbdc_bridge.htm",
        "policy_summary": (
            "The BIS Innovation Hub's mBridge project reached minimum viable product (MVP) "
            "stage in June 2023, with four central bank participants — HKMA, People's Bank of "
            "China, Bank of Thailand, and Central Bank of the UAE — completing a live cross-border "
            "payment and foreign exchange pilot. The pilot settled 164 cross-border transactions "
            "totalling approximately USD 22 million using the mBridge distributed ledger. "
            "mBridge represented the first multi-CBDC platform to achieve live MVP at central "
            "bank scale. "
            "[Transaction volume, dates, and participant details require verification against "
            "BIS mBridge reports.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "mBridge MVP validated that multi-CBDC settlement between central banks with "
            "incompatible monetary systems was technically and politically achievable, "
            "establishing the architectural template for EnsembleTX and Project Agorá."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Participating central banks gaining cross-border CBDC settlement capability",
                "Commercial banks in mBridge jurisdictions accessing real-time FX settlement",
                "Trade finance desks in HK, CN, TH, UAE reducing cross-border payment friction",
            ],
            "affected_entities": [
                "Correspondent banking networks for HKD/CNY/THB/AED cross-border settlements",
                "Traditional FX prime brokers without CBDC settlement integration",
            ],
            "capital_flow": {
                "from": "Correspondent bank float and T+2 cross-border FX settlement",
                "to": "Real-time multi-CBDC settlement on mBridge distributed ledger",
                "estimated_scale": "USD 22M pilot volume; commercial scaling undisclosed",
                "timeframe": "2023 pilot; commercial deployment TBD",
            },
        },
    },
    {
        "_seed_key": "hkma-mas-bilateral-pilot-2023",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / MAS",
        "data_source": "hkma",
        "event_date": date(2023, 9, 14),
        "title": "HKMA and MAS Complete Tokenized FX Settlement Proof-of-Concept",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2023/09/",
        "policy_summary": (
            "HKMA and MAS completed a bilateral proof-of-concept for tokenized FX settlement "
            "between Hong Kong and Singapore in September 2023, testing atomic DvP for "
            "HKD/SGD spot FX transactions using tokenized commercial bank deposits on "
            "compatible distributed ledger platforms. The PoC demonstrated that central "
            "bank-supervised tokenized deposits from two different jurisdictions could settle "
            "FX without correspondent bank intermediation. "
            "[Specific PoC details, participating banks, and announcement date require "
            "verification at hkma.gov.hk and mas.gov.sg.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The HKMA-MAS bilateral pilot established the technical and legal interoperability "
            "framework that would underpin the EnsembleTX–Project Guardian bridge discussions "
            "in 2025–2026."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "HK and SG commercial banks participating in bilateral tokenized FX settlement",
                "Cross-border trade finance desks between HK and Singapore",
                "Distributed ledger providers with HKMA and MAS interoperability",
            ],
            "affected_entities": [
                "Correspondent banks handling HKD/SGD cross-border FX settlement",
                "Traditional trade finance intermediaries in HK-SG trade corridor",
            ],
            "capital_flow": {
                "from": "Correspondent banking HKD/SGD FX settlement with T+2 delays",
                "to": "Atomic tokenized deposit FX settlement without intermediary float",
                "estimated_scale": "PoC pilot volume undisclosed",
                "timeframe": "2023 Q3–Q4",
            },
        },
    },
    {
        "_seed_key": "bis-agora-announcement-2024",
        "category": "global_policy",
        "region": "global",
        "event_type": "institutional",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "BIS / Project Agorá",
        "data_source": "bis",
        "event_date": date(2024, 4, 3),
        "title": "BIS Project Agorá Announced — Seven Central Banks Explore Unified Tokenized Deposit Platform",
        "source_url": "https://www.bis.org/about/bisih/topics/fmis/agora.htm",
        "policy_summary": (
            "The Bank for International Settlements announced Project Agorá in April 2024, "
            "a joint initiative with seven central banks — US Federal Reserve Bank of New York, "
            "Bank of England, Bank of Japan, Banque de France, Banco de México, Swiss National "
            "Bank, and Bank of Korea — to explore a unified platform integrating tokenized "
            "commercial bank deposits with wholesale CBDC for international settlements. "
            "Project Agorá builds on the BIS Unified Ledger concept, targeting atomic settlement "
            "of cross-currency FX and securities transactions. "
            "[Participant list and announcement details require verification at bis.org.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Project Agorá's G7 central bank participation elevated the tokenized deposit "
            "infrastructure conversation from bilateral pilot to potential global standard, "
            "reinforcing HKMA's EnsembleTX design choices and creating pressure on non-G7 "
            "central banks to build compatible infrastructure."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Commercial banks in Project Agorá jurisdictions gaining settlement infrastructure",
                "BIS-compatible tokenized deposit platform providers",
                "International FX settlement infrastructure aligned with Agorá architecture",
            ],
            "affected_entities": [
                "SWIFT GPI-based correspondent banking for cross-currency settlement",
                "Non-Agorá tokenized deposit platforms with incompatible settlement standards",
            ],
            "capital_flow": {
                "from": "Correspondent banking cross-currency settlement float (USD trillions daily)",
                "to": "Atomic tokenized deposit settlement within Project Agorá unified ledger",
                "estimated_scale": "Global cross-currency FX market USD 7T+ daily (long-term target)",
                "timeframe": "2024–2027 pilot and scaling",
            },
        },
    },
    {
        "_seed_key": "hkma-mas-mou-interoperability-2025",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / MAS",
        "data_source": "hkma",
        "event_date": date(2025, 2, 19),
        "title": "HKMA and MAS Sign MOU on Cross-Border DvP Interoperability Framework",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2025/02/",
        "policy_summary": (
            "HKMA and MAS signed a Memorandum of Understanding in February 2025 establishing "
            "a bilateral framework for cross-border delivery-versus-payment interoperability "
            "between HK's EnsembleTX and Singapore's Project Guardian infrastructure. The MOU "
            "covered mutual recognition of tokenized deposit standards, cross-border AML/CFT "
            "data sharing for tokenized transactions, and a joint working group for technical "
            "integration. "
            "[MOU details, signing date, and exact scope require verification at hkma.gov.hk "
            "and mas.gov.sg.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The MOU converted the 2023 bilateral PoC into a durable regulatory commitment, "
            "giving commercial banks in both jurisdictions the regulatory certainty needed "
            "to invest in cross-border tokenized settlement infrastructure."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Banks in both HK and SG planning EnsembleTX–Guardian cross-border flows",
                "Cross-border RWA issuers structuring dual HK/SG regulatory coverage",
                "Tokenized FX infrastructure providers building HK-SG corridor products",
            ],
            "affected_entities": [
                "Correspondent banks without tokenized settlement capability in HK-SG corridor",
                "Cross-border payment platforms without bilateral MOU regulatory backing",
            ],
            "capital_flow": {
                "from": "Traditional HK-SG correspondent banking settlement",
                "to": "Regulated cross-border tokenized DvP between EnsembleTX and Guardian",
                "estimated_scale": "HK-SG daily trade finance and FX volumes (multi-billion HKD)",
                "timeframe": "2025–2026 implementation",
            },
        },
    },
    {
        "_seed_key": "project-agora-phase1-complete-2025",
        "category": "global_policy",
        "region": "global",
        "event_type": "research",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "BIS / Project Agorá",
        "data_source": "bis",
        "event_date": date(2025, 6, 11),
        "title": "Project Agorá Phase 1 Completes — Report Published on Atomic Cross-Currency Settlement",
        "source_url": "https://www.bis.org/publ/work_agora_phase1.htm",
        "policy_summary": (
            "BIS Project Agorá Phase 1 completed in June 2025, with the BIS publishing a report "
            "detailing outcomes from atomic FX settlement experiments across seven participating "
            "central banks. Phase 1 confirmed technical feasibility of a unified ledger model "
            "for cross-currency delivery-versus-payment, identified regulatory barriers to "
            "cross-border tokenized deposit recognition, and recommended a framework for mutual "
            "recognition of supervised tokenized deposits across G7 jurisdictions. "
            "[Report publication date, specific findings, and BIS document reference require "
            "verification at bis.org.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The Phase 1 report provided the first G7-central-bank-endorsed technical specification "
            "for cross-border tokenized settlement, informing EnsembleTX design and the "
            "HKMA-MAS interoperability framework."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Jurisdictions with BIS-compatible tokenized deposit infrastructure (HK, SG, EU)",
                "Commercial banks with cross-currency tokenized settlement capability",
                "Regulatory sandboxes aligned with Agorá Phase 1 technical specifications",
            ],
            "affected_entities": [
                "Jurisdictions without Agorá-compatible settlement infrastructure",
                "Non-compliant cross-border payment providers",
            ],
            "capital_flow": {
                "from": "Fragmented bilateral correspondent banking cross-currency flows",
                "to": "Unified ledger tokenized settlement across G7 + Agorá partner jurisdictions",
                "estimated_scale": "Multi-trillion global FX settlement market (long-term)",
                "timeframe": "2025–2028 Phase 2 and commercial scaling",
            },
        },
    },
    {
        "_seed_key": "ensembletx-launch-2025",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "landmark",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / EnsembleTX",
        "data_source": "hkma",
        "event_date": date(2025, 11, 13),
        "title": "EnsembleTX Goes Live — HKMA Wholesale Tokenized Deposit Settlement Platform Activated",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2025/11/",
        "policy_summary": (
            "HKMA's EnsembleTX wholesale tokenized deposit settlement platform went live on "
            "13 November 2025 with an initial cohort of participating institutions including "
            "major banks, asset managers, and payment system operators. EnsembleTX provides "
            "atomic DvP settlement for tokenized securities against tokenized bank deposits, "
            "with HKMA operating as the central settlement facilitator. The platform's launch "
            "marked the transition from pilot to production-grade infrastructure for HK's "
            "institutional RWA market. "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "EnsembleTX's live deployment established HK as Asia's first jurisdiction with "
            "CBDC-adjacent wholesale tokenized settlement infrastructure — completing the "
            "regulatory and technical stack for institutional RWA issuance and trading."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Participating institutions with atomic DvP capability on HKMA infrastructure",
                "Tokenized bond and fund issuers using EnsembleTX as settlement venue",
                "Licensed HKD stablecoin issuers providing the cash leg in EnsembleTX DvP",
            ],
            "affected_entities": [
                "Traditional CCASS-based HK securities settlement with T+2 cycles",
                "Non-participating institutions lacking EnsembleTX integration",
            ],
            "capital_flow": {
                "from": "T+2 CCASS settlement and correspondent bank cash movement",
                "to": "Atomic real-time settlement on EnsembleTX with tokenized deposits",
                "estimated_scale": "Initial pilot volumes; commercial scaling undisclosed",
                "timeframe": "2025 Q4 – 2026",
            },
        },
    },
    {
        "_seed_key": "hk-sg-cross-border-rwa-settlement-2026",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA / MAS",
        "data_source": "hkma",
        "event_date": date(2026, 3, 10),
        "title": "First Cross-Border RWA Settlement Completes Between HK and SG Institutions via EnsembleTX–Guardian Link",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/03/",
        "policy_summary": (
            "The first institutional cross-border RWA transaction settled between Hong Kong "
            "and Singapore was completed in March 2026 via a technical link between HKMA's "
            "EnsembleTX and MAS's Project Guardian infrastructure. The transaction involved "
            "delivery of tokenized securities from a HK-regulated issuer against tokenized "
            "SGD payment from a Singapore bank, with atomic settlement confirmed within seconds "
            "on both ledgers without correspondent bank intermediation. "
            "[Transaction participants, asset type, and settlement amount require verification "
            "at hkma.gov.hk and mas.gov.sg.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "The first live cross-border RWA settlement between EnsembleTX and Guardian "
            "validated the 2025 HKMA-MAS MOU framework and established HK-SG as the world's "
            "first live cross-border tokenized RWA settlement corridor."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "HK and SG institutional RWA issuers with cross-border distribution capability",
                "Banks participating in both EnsembleTX and Project Guardian infrastructure",
                "Cross-border RWA custody providers with HK and SG regulatory coverage",
            ],
            "affected_entities": [
                "Correspondent banks intermediating HK-SG securities settlement",
                "RWA issuers limited to single-jurisdiction tokenized settlement",
            ],
            "capital_flow": {
                "from": "Single-jurisdiction tokenized RWA with manual cross-border transfer",
                "to": "Atomic cross-border tokenized RWA settlement via EnsembleTX–Guardian bridge",
                "estimated_scale": "Pilot transaction undisclosed; sets template for commercial scaling",
                "timeframe": "2026 Q1–Q2",
            },
        },
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Narrative 5 — Real Estate Tokenization
# ─────────────────────────────────────────────────────────────────────────────

NARRATIVE_5_ITEMS: list[dict] = [
    {
        "_seed_key": "realtoken-400-properties-2023",
        "category": "global_policy",
        "region": "us",
        "event_type": "project",
        "significance": "notable",
        "is_data_snapshot": True,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "RealToken",
        "data_source": "realtoken",
        "event_date": date(2023, 3, 15),
        "title": "RealToken Ecosystem Reaches 400+ Tokenized Residential Properties on Ethereum",
        "source_url": "https://realt.co/portfolio",
        "policy_summary": (
            "RealToken's tokenized residential real estate platform reached over 400 properties "
            "in its portfolio on Ethereum in Q1 2023, with approximately 15,000+ token holders "
            "receiving fractional rental income distributions directly to their wallets. Each "
            "property is held in a US-based LLC with token holders as economic beneficiaries, "
            "providing fractional exposure to Detroit and Chicago residential rental income "
            "with monthly on-chain distributions. "
            "[Property count, holder count, and date require verification at realt.co. "
            "Jurisdictional legal structure may have evolved.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "RealToken demonstrated the first sustainable fractional real estate tokenization "
            "model at scale — LLC wrapper providing legal clarity, on-chain distributions "
            "providing user experience — becoming the reference architecture for subsequent "
            "institutional entrants."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Retail investors accessing fractional US residential real estate on-chain",
                "Ethereum-based tokenization platforms for income-generating real assets",
                "LLC-wrapper tokenization legal structuring providers",
            ],
            "affected_entities": [
                "Traditional REITs with minimum investment thresholds excluding retail participation",
                "Property management companies without on-chain distribution capability",
            ],
            "capital_flow": {
                "from": "Retail savings unable to access real estate investment at minimum ticket sizes",
                "to": "Fractional tokenized residential real estate on Ethereum via RealToken LLCs",
                "estimated_scale": "USD multi-million portfolio value (exact AUM at realt.co)",
                "timeframe": "2020–2023 accumulation phase",
            },
        },
    },
    {
        "_seed_key": "propy-nft-title-deeds-2023",
        "category": "global_policy",
        "region": "us",
        "event_type": "project",
        "significance": "notable",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Propy",
        "data_source": "propy",
        "event_date": date(2023, 10, 8),
        "title": "Propy Achieves Milestone Tokenized Real Estate Transactions Using NFT Title Deeds",
        "source_url": "https://propy.com/browse/blog/",
        "policy_summary": (
            "Propy completed milestone tokenized real estate transactions in late 2023 using "
            "NFT title deeds that encode legal property ownership on Ethereum. The company "
            "facilitated property sales in Colorado and Florida where title transfer was "
            "recorded both on the public blockchain and with county recorder offices, "
            "establishing dual-registry ownership verification. Propy's model integrates "
            "with state property registries to provide legal enforceability for on-chain "
            "title transfers. "
            "[Specific transaction details, property locations, and date require verification "
            "at propy.com.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Propy's dual-registry model — simultaneous blockchain and county recorder recording — "
            "resolved the legal enforceability gap in real estate NFTs, influencing subsequent "
            "institutional tokenization structures seeking title insurance compatibility."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Blockchain-native real estate transaction platforms with county recorder integration",
                "Title insurance companies adapting to dual-registry property transfers",
                "Real estate attorneys structuring blockchain-compatible title transfer documentation",
            ],
            "affected_entities": [
                "Traditional escrow and title company workflows without blockchain integration",
                "State property registries without digital recording interoperability",
            ],
            "capital_flow": {
                "from": "Off-chain paper-based real estate title transfer processes",
                "to": "Dual-registry on-chain/county recorder tokenized property transactions",
                "estimated_scale": "Individual residential transactions; aggregate volumes undisclosed",
                "timeframe": "2022–2024",
            },
        },
    },
    {
        "_seed_key": "hkma-tokenized-real-estate-bond-2024",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "HKMA",
        "data_source": "hkma",
        "event_date": date(2024, 5, 17),
        "title": "First Tokenized Real Estate-Backed Bond Structured Under HKMA Sandbox Framework",
        "source_url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2024/05/",
        "policy_summary": (
            "A first tokenized real estate-backed bond was structured and issued under "
            "HKMA's regulatory sandbox framework in May 2024, providing institutional investors "
            "with on-chain exposure to HK commercial real estate cash flows. The bond used a "
            "special purpose vehicle with HKMA-supervised custody of the underlying real estate "
            "interests, with token holders receiving quarterly distributions directly to "
            "their wallets. "
            "[This event requires careful fact-checking — specific HKMA sandbox real estate "
            "bond issuance details, issuer names, and date should be verified against "
            "hkma.gov.hk before publishing. This may be a composite of multiple events.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Established HKMA's first approved structure for tokenized real estate fixed income, "
            "providing institutional investors a regulatory-grade template for HK commercial "
            "real estate tokenization."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "HK commercial real estate owners accessing tokenized bond market for financing",
                "Institutional investors gaining on-chain HK real estate fixed income exposure",
                "SPV-based tokenization structuring firms with HKMA sandbox experience",
            ],
            "affected_entities": [
                "Traditional commercial real estate bond underwriters without tokenization capability",
                "Listed REIT managers facing competition from direct tokenized real estate exposure",
            ],
            "capital_flow": {
                "from": "Traditional HK commercial real estate bond market",
                "to": "HKMA-supervised tokenized real estate bond infrastructure",
                "estimated_scale": "Sandbox-scale issuance (HKD hundreds of millions range)",
                "timeframe": "2024–2025",
            },
        },
    },
    {
        "_seed_key": "institutional-tokenized-real-estate-fund-2024",
        "category": "global_policy",
        "region": "us",
        "event_type": "institutional",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "Ares Management / Securitize",
        "data_source": "ares",
        "event_date": date(2024, 8, 22),
        "title": "Ares Management Tokenizes Real Estate Fund on Securitize — Institutional Accredited Investor Access",
        "source_url": "https://securitize.io/learn/press-releases/",
        "policy_summary": (
            "Ares Management partnered with Securitize in 2024 to launch a tokenized real estate "
            "credit fund accessible to accredited institutional investors on-chain. The fund "
            "provides exposure to Ares' commercial real estate credit strategies with T+0 "
            "secondary market transfer capability between whitelisted institutional counterparties. "
            "This represented one of the first tokenized real estate credit products from a "
            "major alternative asset manager with over USD 400B AUM. "
            "[Specific fund name, launch date, and AUM require verification against Ares and "
            "Securitize press releases.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "Ares' use of Securitize for tokenized real estate credit — the same platform as "
            "BlackRock BUIDL — established Securitize as the institutional-grade tokenization "
            "infrastructure layer for major alternative asset managers."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Institutional investors accessing tokenized private real estate credit funds",
                "Securitize platform expanding to alternative asset manager tokenization",
                "Secondary market platforms for tokenized real estate credit positions",
            ],
            "affected_entities": [
                "Traditional private real estate credit fund distribution with quarterly liquidity windows",
                "Non-tokenized real estate credit funds competing on minimum ticket sizes",
            ],
            "capital_flow": {
                "from": "Illiquid private real estate credit fund units with 90-day transfer restrictions",
                "to": "Tokenized real estate credit with permissioned secondary market transfer",
                "estimated_scale": "Institutional tranche undisclosed; Ares AUM context USD 400B+",
                "timeframe": "2024 H2 onwards",
            },
        },
    },
    {
        "_seed_key": "mas-tokenized-reit-sandbox-2025",
        "category": "global_policy",
        "region": "sg",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "MAS",
        "data_source": "mas",
        "event_date": date(2025, 7, 14),
        "title": "MAS Authorises First Tokenized REIT Structure Under Regulatory Sandbox for Institutional Investors",
        "source_url": "https://www.mas.gov.sg/news/media-releases/2025/",
        "policy_summary": (
            "The Monetary Authority of Singapore authorised the first tokenized REIT structure "
            "under its regulatory sandbox in July 2025, enabling an institutional-grade listed "
            "REIT to issue on-chain units with atomic secondary market settlement to accredited "
            "professional investors. The structure maintained full compliance with Singapore's "
            "Collective Investment Schemes regulatory framework while enabling 24/7 secondary "
            "market transfer via tokenized units on a permissioned DLT network. "
            "[Specific REIT name, authorisation date, and sandbox terms require verification "
            "at mas.gov.sg.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "MAS's sandbox REIT authorisation provided Asia's most detailed regulatory blueprint "
            "for listed REIT tokenization, directly informing SFC's 2026 HK guidance on "
            "tokenized REIT distribution."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "Singapore-listed REITs adding tokenized unit class for institutional distribution",
                "Permissioned DLT providers with MAS collective investment scheme compatibility",
                "Institutional investors requiring regulatory-grade REIT tokenization in Asia",
            ],
            "affected_entities": [
                "Traditional REIT unit registries without blockchain transfer agent integration",
                "Offshore real estate tokenization platforms without MAS regulatory backing",
            ],
            "capital_flow": {
                "from": "Conventional REIT unit registry with T+3 HKEX/SGX settlement",
                "to": "Tokenized REIT units with atomic settlement under MAS sandbox supervision",
                "estimated_scale": "Sandbox REIT AUM undisclosed; S-REIT market SGD 100B+ context",
                "timeframe": "2025 H2 – 2026",
            },
        },
    },
    {
        "_seed_key": "sfc-tokenized-reit-guidance-2026",
        "category": "hk_observation",
        "region": "hk",
        "event_type": "regulation",
        "significance": "major",
        "is_data_snapshot": False,
        "rwa_relevant": True,
        "status": "published",
        "source_entity": "SFC",
        "data_source": "sfc",
        "event_date": date(2026, 1, 15),
        "title": "SFC Issues Guidance on Tokenized REIT Unit Distribution to Professional Investors",
        "source_url": "https://www.sfc.hk/en/news-and-announcements/policy-statements-and-announcements/2026/",
        "policy_summary": (
            "The Securities and Futures Commission issued regulatory guidance in January 2026 "
            "clarifying the conditions under which SFC-authorised REITs may distribute tokenized "
            "unit classes to professional investors in Hong Kong. The guidance covers transfer "
            "restrictions, custody requirements, AML/CFT obligations for on-chain unit transfers, "
            "and disclosure standards for tokenized REIT units. SFC confirmed that tokenized "
            "REIT units are subject to the same investor protections as conventional unit classes. "
            "[Specific SFC guidance reference number and exact publication date require "
            "verification at sfc.hk.] "
            "AI-generated — verify against source."
        ),
        "narrative_impact_note": (
            "SFC's guidance enabled HK-listed REITs to launch tokenized unit classes without "
            "bespoke regulatory engagement, accelerating the commercialisation of tokenized "
            "real estate fixed income in the HK institutional market."
        ),
        "policy_impact": {
            "benefited_sectors": [
                "SFC-authorised REITs adding on-chain unit classes for professional investors",
                "Licensed intermediaries distributing tokenized REIT units under SFC guidance",
                "EnsembleTX participants settling tokenized REIT unit transfers atomically",
            ],
            "affected_entities": [
                "Traditional REIT distribution channels without on-chain transfer capability",
                "Non-SFC-authorised offshore REIT tokenization products targeting HK investors",
            ],
            "capital_flow": {
                "from": "Conventional REIT unit distribution through SFC-licensed intermediaries",
                "to": "Tokenized REIT unit distribution with on-chain settlement via EnsembleTX",
                "estimated_scale": "HK-listed REIT market HKD 500B+ context (long-term addressable)",
                "timeframe": "2026 H1 onwards",
            },
        },
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Narrative thread definitions
# ─────────────────────────────────────────────────────────────────────────────

NARRATIVE_DEFS: list[dict] = [
    {
        "slug": "tokenized-treasury-legitimization",
        "name": "Tokenized Treasury Legitimization",
        "description": (
            "The emergence of on-chain tokenized US Treasuries from niche DeFi experiment to "
            "institutional-grade yield product — tracing the journey from Ondo OUSG (2023) "
            "through BlackRock BUIDL (2024) to SEC collateral guidance and EnsembleTX "
            "settlement integration (2026)."
        ),
        "status": "active",
        "color": "#1e3a5f",
        "_item_keys": [i["_seed_key"] for i in NARRATIVE_1_ITEMS],
        "expected_next_events": [
            {
                "quarter": "Q3 2026",
                "description": (
                    "Tokenized Treasury aggregate AUM crosses USD 10B — anticipated as "
                    "rate-cut cycle drives yield compression in conventional MMFs, increasing "
                    "relative attractiveness of on-chain T-bill products with programmable yield."
                ),
                "impact": (
                    "Mainstream institutional adoption threshold; pension and sovereign wealth "
                    "funds expected to begin formal allocation reviews."
                ),
            },
            {
                "quarter": "Q4 2026",
                "description": (
                    "SEC formal rulemaking on tokenized fund shares as eligible PFOF and repo "
                    "collateral — converting informal staff guidance into binding regulation."
                ),
                "impact": (
                    "Removes final compliance uncertainty for broker-dealer adoption, expanding "
                    "the addressable market from accredited investors to retail-accessible wrappers."
                ),
            },
        ],
    },
    {
        "slug": "hk-stablecoin-regulation",
        "name": "HK Stablecoin Regulation",
        "description": (
            "Hong Kong's path to becoming Asia's first major jurisdiction with a live stablecoin "
            "licensing regime — from the 2024 HKMA discussion paper through Cap. 656 (August 2025) "
            "to the first HKD stablecoin licences granted to HSBC and Anchorpoint Financial "
            "in April 2026."
        ),
        "status": "active",
        "color": "#0c447c",
        "_item_keys": [i["_seed_key"] for i in NARRATIVE_2_ITEMS],
        "expected_next_events": [
            {
                "quarter": "Q3 2026",
                "description": (
                    "HKMA second-batch stablecoin licence grants — additional issuers admitted "
                    "to the sandbox in 2025 expected to receive Cap. 656 licences following "
                    "HSBC and Anchorpoint."
                ),
                "impact": (
                    "Broadens the licensed HKD stablecoin ecosystem and creates competitive "
                    "dynamics that may accelerate product innovation in programmable money."
                ),
            },
        ],
    },
    {
        "slug": "bank-entry-rwa",
        "name": "Bank Entry into RWA",
        "description": (
            "Global systemically important banks move from pilot to production in tokenized "
            "assets — from JPMorgan Onyx repo (2023) and HSBC Orion bonds (2023) through "
            "Citi Token Services and Goldman Digital Assets DvP (2025) to BNY Mellon "
            "institutional tokenized custody (2025)."
        ),
        "status": "active",
        "color": "#374151",
        "_item_keys": [i["_seed_key"] for i in NARRATIVE_3_ITEMS],
        "expected_next_events": [
            {
                "quarter": "Q2 2026",
                "description": (
                    "First G-SIB tokenized fixed income secondary market with live two-way "
                    "market-making — expected from Goldman Sachs or Morgan Stanley Digital "
                    "Assets divisions."
                ),
                "impact": (
                    "Establishes institutional-grade bid-ask spreads for tokenized bonds, "
                    "reducing secondary market illiquidity premium and enabling pension "
                    "fund mark-to-market valuation."
                ),
            },
        ],
    },
    {
        "slug": "cross-border-settlement",
        "name": "Cross-border Settlement",
        "description": (
            "The evolution of multi-CBDC and tokenized deposit infrastructure for cross-border "
            "wholesale settlement — from BIS mBridge MVP (2023) and Project Agorá announcement "
            "(2024) through the HKMA-MAS MOU and EnsembleTX live transactions (2025–2026)."
        ),
        "status": "active",
        "color": "#085041",
        "_item_keys": [i["_seed_key"] for i in NARRATIVE_4_ITEMS],
        "expected_next_events": [
            {
                "quarter": "Q2 2026",
                "description": (
                    "Project Agorá Phase 2 launch — moving from G7 bilateral pilots to "
                    "multi-party settlement across the full seven-central-bank consortium."
                ),
                "impact": (
                    "First step toward a global unified ledger standard; HKMA participation "
                    "via observer status expected to accelerate EnsembleTX–Agorá interoperability."
                ),
            },
            {
                "quarter": "Q3 2026",
                "description": (
                    "mBridge commercial launch for institutional cross-border payments — "
                    "transition from central bank pilot to commercial bank access."
                ),
                "impact": (
                    "Enables direct CNY/HKD/AED/THB cross-border settlement for trade finance, "
                    "reducing reliance on USD correspondent banking in participating jurisdictions."
                ),
            },
        ],
    },
    {
        "slug": "real-estate-tokenization",
        "name": "Real Estate Tokenization",
        "description": (
            "The evolution of tokenized real estate from fractionalized residential properties "
            "(RealToken, 2023) and NFT title deeds (Propy, 2023) through institutional-grade "
            "tokenized REIT structures (MAS sandbox, 2025) and HK regulatory guidance (SFC, 2026)."
        ),
        "status": "active",
        "color": "#7c3d1c",
        "_item_keys": [i["_seed_key"] for i in NARRATIVE_5_ITEMS],
        "expected_next_events": [
            {
                "quarter": "Q2 2026",
                "description": (
                    "First HK-listed REIT launches tokenized unit class under SFC January 2026 "
                    "guidance — expected from one of the top five S-REIT or HK-listed REIT managers."
                ),
                "impact": (
                    "Validates SFC guidance as operationally workable and sets pricing precedent "
                    "for tokenized REIT unit liquidity premium vs. conventional units."
                ),
            },
            {
                "quarter": "Q4 2026",
                "description": (
                    "Tokenized residential real estate aggregate market cap crosses USD 1B — "
                    "driven by institutional adoption of fractionalized single-family rental "
                    "products in US, EU, and Singapore."
                ),
                "impact": (
                    "Milestone that triggers rating agency engagement on tokenized real estate "
                    "credit ratings methodology, further institutionalising the asset class."
                ),
            },
        ],
    },
]

# All items in a flat list for convenience
ALL_ITEMS: list[dict] = (
    NARRATIVE_1_ITEMS
    + NARRATIVE_2_ITEMS
    + NARRATIVE_3_ITEMS
    + NARRATIVE_4_ITEMS
    + NARRATIVE_5_ITEMS
)

# ─────────────────────────────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────────────────────────────

DDL_NARRATIVE_MAP = """
CREATE TABLE IF NOT EXISTS intelligence_narrative_map (
    intelligence_id UUID NOT NULL
        REFERENCES intelligence_items(id) ON DELETE CASCADE,
    narrative_id UUID NOT NULL
        REFERENCES narrative_threads(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (intelligence_id, narrative_id)
);
CREATE INDEX IF NOT EXISTS ix_inm_narrative
    ON intelligence_narrative_map (narrative_id);
CREATE INDEX IF NOT EXISTS ix_inm_item
    ON intelligence_narrative_map (intelligence_id);
"""


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # ── 0. Ensure junction table exists ───────────────────────────────────
        for stmt in DDL_NARRATIVE_MAP.strip().split(";"):
            stmt = stmt.strip()
            if not stmt:
                continue
            try:
                await session.execute(text(stmt))
                await session.commit()
            except Exception as ddl_err:
                await session.rollback()
                print(f"[ddl]    skipped (already exists or no permission): {str(ddl_err)[:80]}")
        print("[ddl]    intelligence_narrative_map table ensured")
        print()

        # ── 1. Report current state ────────────────────────────────────────────
        n_items = (await session.execute(text("SELECT COUNT(*) FROM intelligence_items"))).scalar_one()
        n_narr = (await session.execute(text("SELECT COUNT(*) FROM narrative_threads"))).scalar_one()
        n_map = (await session.execute(text("SELECT COUNT(*) FROM intelligence_narrative_map"))).scalar_one()
        print(f"[state]  intelligence_items:          {n_items}")
        print(f"[state]  narrative_threads:           {n_narr}")
        print(f"[state]  intelligence_narrative_map:  {n_map}")
        print()

        # ── 2. Insert intelligence items ───────────────────────────────────────
        seed_key_to_uuid: dict[str, str] = {}
        inserted = 0
        skipped = 0

        for spec in ALL_ITEMS:
            key = spec["_seed_key"]

            existing = (
                await session.execute(
                    select(IntelligenceItem).where(
                        IntelligenceItem.source_url == spec["source_url"]
                    )
                )
            ).scalar_one_or_none()

            if existing:
                seed_key_to_uuid[key] = str(existing.id)
                skipped += 1
                print(f"[skip]   {spec['event_date']}  {spec['title'][:65]}")
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
            await session.flush()
            seed_key_to_uuid[key] = str(item_id)
            inserted += 1
            print(f"[insert] {spec['event_date']}  {spec['significance']:8}  {spec['title'][:60]}")

        await session.commit()
        print(f"\n[items]  inserted={inserted}  skipped={skipped}\n")

        # ── 3. Upsert narrative threads ────────────────────────────────────────
        narrative_slug_to_uuid: dict[str, str] = {}

        for nd in NARRATIVE_DEFS:
            slug = nd["slug"]
            new_ids = [seed_key_to_uuid[k] for k in nd["_item_keys"] if k in seed_key_to_uuid]

            existing_narr: Optional[NarrativeThread] = (
                await session.execute(
                    select(NarrativeThread).where(NarrativeThread.slug == slug)
                )
            ).scalar_one_or_none()

            if existing_narr:
                current = set(existing_narr.related_event_ids or [])
                merged = list(current | set(new_ids))
                existing_narr.related_event_ids = merged
                existing_narr.expected_next_events = nd["expected_next_events"]
                await session.commit()
                narrative_slug_to_uuid[slug] = str(existing_narr.id)
                print(f"[update] narrative '{slug}'  related_event_ids → {len(merged)}")
            else:
                narr_id = uuid.uuid4()
                narr = NarrativeThread(
                    id=narr_id,
                    slug=slug,
                    name=nd["name"],
                    description=nd["description"],
                    status=nd["status"],
                    color=nd["color"],
                    related_event_ids=new_ids,
                    expected_next_events=nd["expected_next_events"],
                )
                session.add(narr)
                await session.commit()
                narrative_slug_to_uuid[slug] = str(narr_id)
                print(f"[insert] narrative '{slug}'  {len(new_ids)} events")

        print()

        # ── 4. Populate intelligence_narrative_map junction table ──────────────
        map_inserted = 0

        for nd in NARRATIVE_DEFS:
            slug = nd["slug"]
            narr_uuid = narrative_slug_to_uuid.get(slug)
            if not narr_uuid:
                continue

            for key in nd["_item_keys"]:
                item_uuid = seed_key_to_uuid.get(key)
                if not item_uuid:
                    continue

                await session.execute(
                    text("""
                        INSERT INTO intelligence_narrative_map
                            (intelligence_id, narrative_id)
                        VALUES
                            (:item_id, :narr_id)
                        ON CONFLICT DO NOTHING
                    """),
                    {"item_id": item_uuid, "narr_id": narr_uuid},
                )
                map_inserted += 1

        await session.commit()
        print(f"[map]    intelligence_narrative_map rows written: {map_inserted}")
        print()

        # ── 5. Final state ─────────────────────────────────────────────────────
        fn_items = (await session.execute(text("SELECT COUNT(*) FROM intelligence_items"))).scalar_one()
        fn_narr = (await session.execute(text("SELECT COUNT(*) FROM narrative_threads"))).scalar_one()
        fn_map = (await session.execute(text("SELECT COUNT(*) FROM intelligence_narrative_map"))).scalar_one()
        print(f"[done]   intelligence_items:          {fn_items}")
        print(f"[done]   narrative_threads:           {fn_narr}")
        print(f"[done]   intelligence_narrative_map:  {fn_map}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
