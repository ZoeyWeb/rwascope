"""
DeepSeek API integration for RARM due diligence checklist generation.

COMPLIANCE NOTE: This module intentionally does NOT produce numeric scores,
ratings, or rankings. It generates a structured due diligence checklist —
a set of questions and public-source pointers that help the user conduct
their own research. All scoring remains the exclusive judgment of the user.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

# ── Layer definitions ─────────────────────────────────────────────────────────
LAYER_DEFS: dict[int, dict[str, Any]] = {
    1: {
        "name": "Legal & Regulatory Compliance",
        "indicators": {
            "L1_reg_clarity":      "Regulatory clarity and jurisdiction recognition",
            "L1_legal_structure":  "Legal structure soundness (SPV, trust, entity type)",
            "L1_licensing":        "Licensing and registration status",
            "L1_sanctions":        "Sanctions screening and AML compliance",
            "L1_enforcement_risk": "Enforcement and legal challenge risk",
        },
    },
    2: {
        "name": "Asset Valuation & Transparency",
        "indicators": {
            "L2_oracle_quality":   "Oracle / price feed quality and decentralization",
            "L2_audit_frequency":  "Independent valuation audit frequency",
            "L2_nav_accuracy":     "NAV calculation accuracy and methodology",
            "L2_disclosure":       "On-chain data disclosure completeness",
            "L2_mark_to_market":   "Mark-to-market vs mark-to-model ratio",
            "L2_collateral_ratio": "Collateral ratio and over-collateralization",
        },
    },
    3: {
        "name": "Custody & Asset Security",
        "indicators": {
            "L3_custodian_tier":    "Custodian institutional tier (prime, qualified)",
            "L3_segregation":       "Asset segregation from operational funds",
            "L3_insurance":         "Insurance coverage adequacy",
            "L3_multisig":          "Multi-signature / key management controls",
            "L3_disaster_recovery": "Business continuity and disaster recovery",
        },
    },
    4: {
        "name": "Counterparty & KYC/AML",
        "indicators": {
            "L4_kyc_rigor":       "KYC due diligence rigor and depth",
            "L4_kyc_ongoing":     "Ongoing KYC / periodic re-verification",
            "L4_transaction_mon": "Transaction monitoring capabilities",
            "L4_pep_screening":   "PEP and adverse media screening",
            "L4_counterparty_cr": "Counterparty credit risk assessment",
            "L4_concentration":   "Counterparty concentration limits",
        },
    },
    5: {
        "name": "Liquidity & Market Risk",
        "indicators": {
            "L5_redemption":     "Redemption window and notice period",
            "L5_secondary_mkt":  "Secondary market depth and spread",
            "L5_tvl_stability":  "TVL stability and growth trend",
            "L5_stress_test":    "Liquidity stress testing results",
            "L5_lock_up":        "Lock-up period and exit restrictions",
            "L5_market_impact":  "Market impact at scale (whale risk)",
            "L5_circuit_breaker":"Circuit breaker and pause mechanisms",
        },
    },
    6: {
        "name": "Settlement & Operational Risk",
        "indicators": {
            "L6_settlement_speed": "Settlement finality speed (T+0 to T+5+)",
            "L6_smart_contract":   "Smart contract audit quality and recency",
            "L6_upgrade_gov":      "Upgrade governance and timelock controls",
            "L6_ops_resilience":   "Operational resilience and incident history",
            "L6_chain_diversity":  "Multi-chain deployment and bridge risk",
            "L6_automation":       "Automation level and manual intervention risk",
        },
    },
}

WEIGHT_BY_ASSET_CLASS: dict[str, list[float]] = {
    "government_bond": [0.25, 0.20, 0.20, 0.15, 0.10, 0.10],
    "real_estate":     [0.20, 0.20, 0.20, 0.10, 0.15, 0.15],
    "precious_metal":  [0.15, 0.25, 0.25, 0.10, 0.15, 0.10],
    "private_credit":  [0.20, 0.20, 0.15, 0.15, 0.15, 0.15],
    "commodity":       [0.15, 0.20, 0.20, 0.10, 0.20, 0.15],
    "equity":          [0.20, 0.20, 0.15, 0.15, 0.15, 0.15],
    "other":           [0.167, 0.167, 0.167, 0.167, 0.167, 0.167],
}


def _build_checklist_prompt(
    protocol_name: str,
    asset_class: str,
    description: str | None,
    chains: str | None,
    scores_by_layer: dict[int, dict[str, int]],
    rationale_by_indicator: dict[str, str],
) -> str:
    lines = [
        f"You are an expert RWA due diligence analyst helping a practitioner review their "
        f"self-assessment of **{protocol_name}** ({asset_class}).",
        "",
        "The practitioner has completed a six-layer RARM (RWA Asset Risk Matrix) evaluation "
        "and recorded their preliminary scores and rationale below. Your role is to help them "
        "improve the rigour of their own analysis by suggesting:",
        "  1. Specific questions they should verify before finalising each sub-indicator",
        "  2. Publicly available data sources where they can find evidence",
        "  3. Common red flags in this asset class / layer that they should consider",
        "",
        "IMPORTANT CONSTRAINTS:",
        "- Do NOT suggest or output any numeric scores, ratings, rankings, or grades.",
        "- Do NOT say a protocol is 'good', 'bad', 'safe', or 'risky' — only ask questions.",
        "- Your output must help the user form their OWN judgment, not provide a platform judgment.",
        "- Focus on verifiable, publicly available information sources.",
        "",
    ]

    if description:
        lines.append(f"Protocol description: {description}")
    if chains:
        lines.append(f"Deployed chains: {chains}")
    lines.append("")

    lines.append("## User's preliminary assessment")
    lines.append("")

    for layer_num, layer_info in LAYER_DEFS.items():
        lines.append(f"### Layer {layer_num}: {layer_info['name']}")
        layer_scores = scores_by_layer.get(layer_num, {})
        for key, label in layer_info["indicators"].items():
            score = layer_scores.get(key, None)
            rationale = rationale_by_indicator.get(key, "")
            score_str = str(score) if score is not None else "not scored"
            rat_str = f" — User note: '{rationale}'" if rationale else ""
            lines.append(f"  - {label}: {score_str}/5{rat_str}")
        lines.append("")

    lines.append("""## Your output format
Return a JSON object with this exact structure (no markdown fences, no extra text):

{
  "checklist": [
    {
      "layer_number": <1-6>,
      "layer_name": "<layer name>",
      "questions_to_verify": [
        "<specific question the user should answer before finalising their score>",
        ...
      ],
      "public_data_sources": [
        "<type of document or URL pattern where they can find evidence>",
        ...
      ],
      "red_flags_to_consider": [
        "<common warning sign in this asset class / layer that is worth checking>",
        ...
      ]
    },
    ... (one entry per layer, 6 total)
  ],
  "overall_notes": "<2-4 sentences of general due diligence guidance for this specific protocol and asset class>",
  "suggested_public_sources": [
    "<specific publicly verifiable data source relevant to this protocol>",
    ...
  ]
}

Rules:
- questions_to_verify: 2–4 specific, concrete questions per layer. Must be answerable via public evidence.
- public_data_sources: 1–3 source types per layer (e.g. 'Official prospectus / offering memorandum', 'Etherscan contract verification', 'SEC EDGAR filings').
- red_flags_to_consider: 1–3 items per layer. Frame as things to CHECK, not conclusions.
- overall_notes: concise practical guidance. Do not mention scores, ratings, or assessments.
- suggested_public_sources: 3–6 specific sources relevant to THIS protocol (e.g. official website, regulator filings).
- Never output numbers as assessments. Never say 'this protocol scores X'.
""")
    return "\n".join(lines)


def _parse_response(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [ln for ln in lines if not ln.startswith("```")]
        text = "\n".join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("DeepSeek response is not valid JSON: %s | raw: %.500s", exc, content)
        return {}


async def generate_checklist(
    protocol_name: str,
    asset_class: str,
    description: str | None,
    chains: str | None,
    scores_by_layer: dict[int, dict[str, int]],
    rationale_by_indicator: dict[str, str] | None = None,
) -> dict[str, Any]:
    """
    Call DeepSeek to generate a due diligence checklist.

    Returns dict with keys:
      checklist, overall_notes, suggested_public_sources,
      model_used, prompt_tokens, completion_tokens
    """
    client = AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )
    prompt = _build_checklist_prompt(
        protocol_name, asset_class, description, chains,
        scores_by_layer, rationale_by_indicator or {},
    )

    response = await client.chat.completions.create(
        model=settings.deepseek_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a strict JSON-only responder for a due diligence tool. "
                    "Output only valid JSON. Never output numeric ratings or scores. "
                    "Never endorse or condemn any protocol."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=4096,
    )

    content = response.choices[0].message.content or "{}"
    parsed = _parse_response(content)
    if not parsed:
        raise ValueError("DeepSeek returned unparseable JSON — checklist generation failed")

    return {
        "checklist": parsed.get("checklist", []),
        "overall_notes": parsed.get("overall_notes", ""),
        "suggested_public_sources": parsed.get("suggested_public_sources", []),
        "model_used": settings.deepseek_model,
        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
    }


_CLASSIFY_SYSTEM = """
You are the RWAscope event classification system. Your task is to judge whether a news item
is related to Real World Asset (RWA) tokenization or the broader institutional digital-asset
ecosystem, and if so, classify it.

RWA definition (BROAD): tokenization of traditional assets on a blockchain, OR regulatory
frameworks that govern such tokenization, OR institutional adoption of blockchain for
traditional financial instruments.

Set rwa_relevant: TRUE for any of the following:
- Tokenization of any traditional asset (bonds, real estate, commodities, private credit,
  art, money-market funds, treasuries, gold, equities, trade finance)
- Digital asset / stablecoin regulation by any major regulator (SEC, CFTC, HKMA, SFC, MAS,
  ECB, FCA, FSB, FATF, BIS, IMF, VARA, etc.)
- Institutional adoption: banks, asset managers, pension funds, sovereign wealth funds
  launching blockchain-based products or custody services
- DeFi protocols integrating real-world assets or institutional-grade collateral
- Blockchain infrastructure used for traditional finance settlement (CBDC, tokenized deposits,
  wholesale settlement networks)
- Major research reports from BIS, IMF, World Bank, Big 4 on digital assets or tokenization
- Market data milestones for tokenized asset categories (TVL records, AUM growth, new highs)

ALWAYS set rwa_relevant: TRUE if the item touches ANY of these topics, even tangentially:
- Regulatory frameworks: stablecoin rules, tokenization policy, VASP / exchange licensing,
  digital-asset legislation, regulator guidance or consultations
- Institutional adoption: a bank issuing a stablecoin, an asset manager launching a
  tokenized fund, custodians, payment firms, or any TradFi institution moving on-chain
- Infrastructure: CBDC pilots, settlement layers, tokenized deposits, custody solutions,
  wholesale / interbank blockchain networks
- DeFi + traditional finance integration: yield protocols, lending with RWA collateral,
  on-chain treasuries, institutional-grade DeFi
- Mainstream L1/L2 technical progress where it relates to institutional or RWA adoption

Set rwa_relevant: FALSE ONLY when the item is OBVIOUSLY irrelevant — it must clearly be
one of these and nothing else:
- Pure meme coin / shitcoin news with no financial-instrument or regulatory angle
- Centralized exchange operational news (listings, UI changes, marketing, outages, hacks)
  unrelated to tokenized assets or regulation
- Pure BTC/ETH price predictions or price movement with no policy or institutional angle

Default to TRUE unless the item is OBVIOUSLY irrelevant per the narrow list above.
A borderline or ambiguous item is always TRUE. Do not reject an item merely because the
RWA / institutional angle is implicit, indirect, or not the headline focus.

Return ONLY a JSON object with these exact keys:

{
  "event_type": "regulation" | "institutional" | "project" | "research" | "data_milestone",
  "region": "us" | "hk" | "eu" | "sg" | "uae" | "global",
  "significance": "landmark" | "major" | "notable",
  "rwa_relevant": true | false,
  "policy_summary": "<1-2 sentences, objective, no investment advice>"
}

event_type meanings:
  regulation    — regulatory announcements, policy releases (HKMA, SEC, MAS, ECB, etc.)
  institutional — institutional moves (bank/asset-manager launches RWA product, partnerships)
  project       — RWA protocol/project major updates, launches, fundraises
  research      — research reports, whitepapers (BIS, IMF, Big 4 accounting firms)
  data_milestone — market data milestones (TVL record, asset class new high)

significance:
  landmark — industry-shifting (e.g. BlackRock BUIDL launch, first tokenized MMF approval)
  major    — important progress but not paradigm-shifting
  notable  — worth recording, limited impact

Output JSON only. No markdown, no prose outside JSON.
"""

_CLASSIFY_USER_TMPL = "Title: {title}\nContent: {content}\nSource: {source}"


async def classify_intelligence_item(
    title: str,
    content: str,
    source: str,
    default_region: str = "global",
    default_event_type: str = "institutional",
) -> dict | None:
    """
    Call DeepSeek to classify a candidate intelligence item.

    Returns a classification dict, or None if rwa_relevant is False.
    On any error, returns a safe default so callers are never blocked.
    """
    client = AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )
    try:
        response = await client.chat.completions.create(
            model=settings.deepseek_model,
            messages=[
                {"role": "system", "content": _CLASSIFY_SYSTEM},
                {"role": "user", "content": _CLASSIFY_USER_TMPL.format(
                    title=title,
                    content=content[:800],
                    source=source,
                )},
            ],
            temperature=0.3,
            max_tokens=512,
            timeout=30,
        )
        raw = (response.choices[0].message.content or "").strip()
        parsed = _parse_response(raw)
        if not parsed.get("rwa_relevant", True):
            return None
        return parsed
    except Exception as exc:
        logger.warning("classify_intelligence_item failed (%s), using defaults", exc)
        return {
            "event_type": default_event_type,
            "region": default_region,
            "significance": "notable",
            "rwa_relevant": True,
            "policy_summary": title[:200],
        }


def compute_user_rarm_score(
    scores_by_layer: dict[int, dict[str, int]],
    asset_class: str,
) -> tuple[float, float]:
    """
    Compute user's own RARM framework score from their submitted sub-indicator scores.
    Returns (rarm_score 0–10, rarm_total 0–5 weighted avg).

    This is the user's own calculation — the platform does not generate or publish
    this score; it is stored privately per user for their own records only.
    """
    weights = WEIGHT_BY_ASSET_CLASS.get(asset_class, WEIGHT_BY_ASSET_CLASS["other"])
    layer_avgs: list[float] = []
    for layer_num, layer_info in LAYER_DEFS.items():
        keys = list(layer_info["indicators"].keys())
        layer_scores = scores_by_layer.get(layer_num, {})
        vals = [float(layer_scores.get(k, 0)) for k in keys if k in layer_scores]
        avg = sum(vals) / len(vals) if vals else 0.0
        layer_avgs.append(avg)

    # User scores: 5 = excellent, 0 = N/A
    # Friction = 5 - quality (lower friction = better)
    friction_avgs = [5.0 - a for a in layer_avgs]
    rarm_total = sum(f * w for f, w in zip(friction_avgs, weights))
    # RARM Score (user's own): 0–10, higher = lower friction = better by user's assessment
    rarm_score = round((1 - rarm_total / 5.0) * 10.0, 2)
    return rarm_score, round(rarm_total, 4)
