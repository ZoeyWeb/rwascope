# RWAscope — Compliance & Regulatory Positioning

This document explains the design decisions made to ensure RWAscope does not
constitute a regulated credit rating service under the Hong Kong SFC Type 10
framework or equivalent regulations in other jurisdictions.

## Background: SFC Type 10 — Providing Credit Rating Services

Under the Hong Kong Securities and Futures Ordinance (SFO), Type 10 regulated
activity covers "providing credit rating services". Key red lines that would
trigger this classification:

- Producing credit ratings accessible to the public
- Publishing scores, grades, or risk opinions on securities or issuers
- Distributing assessments to third parties (subscribers, users, or public)
- Operating a platform where platform-generated ratings are the core output

## What RWAscope Does NOT Do

| Activity | Status |
|----------|--------|
| Generate platform-level credit ratings | ✕ Never |
| Publish protocol scores visible to the public | ✕ Never |
| Distribute ratings to third parties | ✕ Never |
| Produce AI-generated numeric risk scores | ✕ Never |
| Issue investment recommendations | ✕ Never |
| Rank protocols by platform-assigned quality tier | ✕ Never |

## What RWAscope DOES Do (and why it is compliant)

### 1. User-Generated Private Workbooks
Users apply the RARM methodology to their own due diligence. The resulting
scores are:
- Created entirely by the user (not the platform)
- Stored privately — only the creator can access them
- Never shared, aggregated, or shown to other users
- Explicitly labelled as the user's own judgment in the UI

**Analogy**: A word processor is not a publishing company because it lets
users write documents privately.

### 2. Educational Framework Provider
RWAscope provides the RARM methodology as an academic framework — the same
way a university provides research methodology courses. The framework itself
is not a rating service; it is a structured analytical tool.

### 3. AI Checklist (Not AI Scores)
The DeepSeek integration produces:
- Verification questions the user should investigate
- Pointers to publicly available data sources
- Common red flags relevant to the asset class/layer

The AI explicitly DOES NOT produce:
- Numeric scores or ratings
- Risk grades or tier assignments
- Investment opinions or recommendations

The prompt and system message both enforce this constraint. The AI output
schema (`ChecklistLayer`) has no numeric fields.

### 4. Third-Party Market Data Relay
The Protocol Directory and Market Dashboard relay data from DeFiLlama's
public API. RWAscope:
- Does not modify or re-score the data
- Does not add platform-generated ratings alongside the data
- Attributes the source clearly on all pages
- Includes explicit disclaimers that this is not an assessment

### 5. Public Pages Show Zero Scores
Before the compliance refactoring, the public-facing pages showed
platform-computed RCS scores. These were removed in Commit 1:
- Market Dashboard: TVL, 24h Δ, 7d Δ, audits, chains only
- Protocol Directory: same public metrics, sorted by TVL
- Self-Assessment page: educational framework overview only (no tool)

### 6. Authenticated Users Only
The due diligence workbook is behind authentication. Unauthenticated visitors
see only:
- Educational content about the RARM framework
- Public DeFiLlama market data (no scores)
- Disclaimers and Terms of Use

## Regulatory Disclosure

RWAscope does not hold:
- A Type 10 licence from the Hong Kong SFC
- A credit rating agency registration under EU CRA Regulation
- An NRSRO registration from the US SEC
- Equivalent authorisation in any other jurisdiction

RWAscope does not seek or require such licences because its design is
specifically structured to remain outside the regulated perimeter.

## Commit Log (Compliance Refactoring)

| Commit | Change |
|--------|--------|
| 1 | Remove public scores from Market Dashboard and Protocol Directory |
| 2 | Replace public self-assessment tool with framework overview |
| 3 | Refactor AI output to checklist only (no numeric scores) |
| 4 | Add bilingual disclaimers, Terms of Use, registration consent |
| 5 | Rebrand from "Rating Terminal" to "Academic Research Tool" |
| 6 | Sync mobile app — remove RCS, tiers, risk grade labels |
| 7 | Update documentation (this file + README + PROJECT_SUMMARY) |
| 8 | Clean up API — remove legacy "rating" fields from docs/schemas |
| 9 | Update E2E tests for compliance-refactored UI |

## Contact

For regulatory or compliance enquiries: legal@rwascope.io
