# CLAUDE.md — RWA-Index

## Project at a glance

**RWA-Index** (`rwa-index.com`) is Asia's institutional intelligence platform for tokenized finance — covering global RWA policy, project anatomy, market data, and private due-diligence workbooks. Academic foundation: RARM/SARM frameworks from HKUST AIS doctoral research.

**Five-block navigation architecture (canonical route overview):**

| Block | Top-level route | Sub-modules |
|---|---|---|
| **Intelligence** | `/intelligence` | Global Policy Timeline · HK Observation (`/intelligence/hk`) · Incidents (`/incidents`) · Reports (`/reports`) |
| **Projects** | `/projects` | RWA anatomy profiles (`/projects/:slug`) |
| **Market** | `/market` | Protocol dashboard (TVL) · Tokenized Assets (`/assets`, `/assets/:slug`) |
| **Framework** | `/licenses` | Licences (SARM) · Compliance Map (`/compliance`) · EnsembleTX (`/ensemble`) · Methodology (`/methodology`) |
| **Ecosystem** | `/ecosystem` | HK Ecosystem Map |

All existing modules live inside one of these five blocks. `/score` (Due Diligence workbook) is auth-gated and sits outside the public nav blocks.

**Development priorities:**

| Priority | Feature | Status |
|---|---|---|
| P1 | Intelligence module (`/intelligence`) | In development |
| P1 | Projects anatomy library (`/projects`) | In development |
| P2 | Assessment PDF/JSON export | Planned |
| P3 | Email subscription push | Planned |

**Repo layout:**

```
rwascope/
├── backend/      ← FastAPI + SQLAlchemy (active backend — always edit here)
├── api/          ← legacy scripts, do NOT edit
├── web/          ← React + Vite + Tailwind (frontend)
├── native/       ← Expo React Native (dormant, do not touch)
└── docs/         ← Whitepaper and reference documents
```

---

## 🌐 CANONICAL DOMAIN — READ FIRST

**`rwa-index.com` is the single canonical URL.** All new docs, citations, API references must use it. `onlyidea.net` is a legacy 301 redirect only — do not link to it from new content.

---

## ⚠️ COMPLIANCE RED LINES — READ FIRST

Violating these rules may expose the platform to SFC Type 10 (credit rating service) liability.

### NEVER do any of the following:

1. **No platform-generated numeric scores or letter grades** visible to anyone other than the creator. Users enter their own numbers; we store them privately.
2. **No AI-generated ratings.** AI only produces a due-diligence checklist (questions + pointers). Never a score, grade, tier, or risk opinion.
3. **No public ranking by platform-assigned quality.** Protocol Directory ranks by TVL (DeFiLlama public field) only.
4. **No aggregate or anonymised score leaderboards.** Even "average RARM score across users" is prohibited.
5. **Admin views show metadata only** — `protocol_name`, `asset_class`, `status`, `created_at`. Never expose scores, rationale, or checklist content.
6. **SARM (Licenses) uses traffic lights only** — green / yellow / red / gray. No composite number or letter grade.

### Public scoring prohibition (applies to every public page and JSON file):

| Prohibited | Allowed |
|---|---|
| `8.5/10`, `avg: 7.2`, letter grades | Traffic-light signals (green/yellow/red/gray) with no number |
| Progress bars / bar charts keyed to scores | TVL, dates, links (factual DeFiLlama fields) |
| Weighted averages of any platform metric | User's own private scores (backend only, never surfaced publicly) |

`public/data/` JSON files are publicly accessible — no platform-generated numeric scores in these files. `projects.json` had its `rarm_scores` field removed 2026-05-13.

See `COMPLIANCE.md` for full reasoning. When in doubt, ask before adding any numeric output.

---

## ⚠️ EDITORIAL FACT-CHECKING POLICY — READ FIRST

RWA-Index is cited by HKMA, SFC, media, and academic researchers. A single fabricated chapter number or program name damages platform credibility.

**Flag, don't invent** any of the following — mark as "requires fact-check before publishing":
- Regulatory ordinance / statute / chapter numbers (e.g., "Cap. 656")
- Dates of regulatory actions, licence issuances, legislative votes
- Official terminology for government programs (e.g., "EnsembleTX" not "Phase II")
- Names of officials and their current titles
- Statistics with specific figures

**Prefer omission over fabrication.** Use `[chapter number to be verified]` or `"in late 2025"` rather than a confident specific.

| ❌ Fabricated | ✓ Correct |
|---|---|
| "Stablecoins Ordinance (Cap. 649)" | Cap. 656 |
| "Project Ensemble Phase II" | EnsembleTX (launched 13 Nov 2025) |
| "GENIUS/STABLE Acts advancing in Q1 2026" | GENIUS Act signed 18 Jul 2025; STABLE Act did not pass independently |
| "FATF Travel Rule update finalised Q1 2026" | FATF R.16 revision June 2025; pending HKMA incorporation |

---

## Local development

### Frontend
```bash
cd web
npm install
npm run dev          # http://localhost:5173
npm run build        # TypeScript check + Vite production build
npx vitest run       # unit tests
```

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real values
uvicorn app.main:app --reload --port 8001
# Swagger: http://localhost:8001/api/docs
```

Required env vars:

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@localhost:5432/rwascope_backend` |
| `SECRET_KEY` | 64-char random hex for JWT signing |
| `DEEPSEEK_API_KEY` | DeepSeek chat API key |
| `RESEND_API_KEY` | Resend transactional email |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side key |
| `FRONTEND_URL` | `https://rwa-index.com` |
| `CORS_ORIGINS` | JSON array of allowed origins |

### Database migrations
```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "description"   # always review before committing
```

---

## Production infrastructure

| Component | Details |
|---|---|
| Server | AWS Lightsail, Ubuntu 24.04, `ubuntu@54.255.213.46` |
| SSH key | `~/.ssh/lightsail.pem` |
| CDN | Cloudflare (Full SSL) |
| Nginx root | `/var/www/rwascope/` |
| Backend service | `rwascope-backend.service` (systemd, port 8001) |
| Backend code | `/opt/rwascope-backend/` |
| DB | PostgreSQL 16, `rwascope_backend` |
| Leaderboard cron | `0 2 * * *` → `/opt/rwascope/fetch_leaderboard.py` |

### Deploy — always use the script, never raw rsync

```bash
./scripts/deploy.sh            # frontend build + leaderboard refresh (default)
./scripts/deploy.sh all        # frontend + backend + leaderboard
./scripts/deploy.sh backend    # backend only
./scripts/deploy.sh leaderboard  # DeFiLlama refresh only
```

The script uses `--filter='protect ...'` rules so the cron-maintained `leaderboard.json` and `assets-live.json` are never deleted. **Never use `rsync --delete` directly** — it overwrites live data files.

### Backend deploy
```bash
rsync -avz backend/ ubuntu@54.255.213.46:/opt/rwascope-backend/ -e "ssh -i ~/.ssh/lightsail.pem" \
  --exclude='.venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env'

ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 \
  "cd /opt/rwascope-backend && source venv/bin/activate && alembic upgrade head && sudo systemctl restart rwascope-backend"
```

### Useful server commands
```bash
curl https://rwa-index.com/api/health
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 "journalctl -u rwascope-backend -f --no-pager"
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 "sudo systemctl restart rwascope-backend"
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 "sudo nginx -t && sudo systemctl reload nginx"
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 "python3 /opt/rwascope/fetch_leaderboard.py"
```

---

## Architecture

```
Browser → Cloudflare CDN → Nginx :443
  ├── /api/*  → uvicorn :8001 (FastAPI)
  └── /*      → /var/www/rwascope/ (React SPA, try_files → index.html)
```

### Frontend (`web/src/`)

| Path | Purpose |
|---|---|
| `App.tsx` | Route definitions (React Router v6) |
| `components/TopNav.tsx` | Top navigation — add nav items here |
| `components/Layout.tsx` | Shell: SideNav + TopNav + `<Outlet>` |
| `api/client.ts` | All API calls + TypeScript types |
| `context/AuthContext.tsx` | JWT auth state, `useAuth()` hook |
| `components/RequireAuth.tsx` | Route guard: must be logged in |
| `components/RequireAdmin.tsx` | Route guard: must be `is_admin=true` |
| `components/DisclaimerBanner.tsx` | Amber disclaimer (required on scoring pages) |
| `components/ReportPDF/index.tsx` | `@react-pdf/renderer` PDF (dynamically imported) |
| `screens/Admin/` | Admin dashboard |
| `screens/Intelligence/` | Global policy intelligence (v2 — DB-backed) |
| `screens/Projects/` | RWA project anatomy library |
| `screens/Licenses/` | HK stablecoin licences (Module 1) |
| `screens/Assets/` | Tokenized Asset Observatory (Module 3) |
| `screens/Compliance/` | Cross-Border Compliance Map (Module 4) |
| `screens/Ensemble/` | EnsembleTX Tracker (Module 2) |
| `screens/Ecosystem/` | HK Ecosystem Map (Module 8) |
| `screens/Incidents/` | Incident Database (Module 6) |
| `screens/Reports/` | Quarterly Reports (Module 7) |
| `screens/Enforcement/` | Enforcement Tracker — SEC/CFTC/SFC/MAS actions |
| `screens/Disclosures/` | Issuer Disclosures — NAV reports, attestations, filings |
| `screens/Reserves/` | Reserve Monitor — stablecoin reserve composition |
| `screens/Glossary/` | Glossary — RARM/SARM/tokenization terms |
| `screens/RWAScore/` | Due diligence workbook |

**Data files (`public/data/`):**

| File | Contents |
|---|---|
| `leaderboard.json` | Protocol data (cron-written, never commit stale version) |
| `licenses/issuers.json` | 8 HKMA stablecoin applicants |
| `assets/assets.json` | 25 RARM-assessed assets |
| `incidents/incidents.json` | 27 incidents (2022–2025) |
| `reports/reports.json` | Q1 2026 (published), Q2 2026 (preview) |
| `compliance/matrix.json` | 5 jurisdictions × 5 issues, all populated |
| `ensemble/ensemble.json` | EnsembleTX: 5 milestones, 7 use cases, 10 institutions |
| `ecosystem/ecosystem.json` | HK Ecosystem Map v1.0.0 |
| `projects/projects.json` | RWA project anatomy entries |
| `enforcement/enforcement.json` | Enforcement actions — SEC/CFTC/SFC/MAS cases |
| `disclosures/disclosures.json` | Issuer disclosure filings — NAV reports, attestations |
| `reserves/reserves.json` | Reserve composition data — stablecoin attestation history |

**Nav order (TopNav) — 5 blocks:**
Intelligence · Projects · Market · Framework · Ecosystem

Each block is a top-level nav item. Sub-module pages are accessed from within the block (no deep links in TopNav itself). `/score` (Due Diligence) and `/about` appear separately at the right of the nav.

**Block → route mapping:**
- Intelligence → `/intelligence` (entry point; dropdown: HK Observation, Incidents, Enforcement, Disclosures, Reports)
- Projects → `/projects`
- Market → `/market` (entry point; dropdown: Overview, Tokenized Assets `/assets`, Reserve Monitor `/reserves`)
- Framework → `/licenses` (entry point; dropdown: SARM, RARM, Compliance Map, Glossary)
- Ecosystem → `/ecosystem`

### Backend (`backend/app/`)

| Path | Purpose |
|---|---|
| `main.py` | FastAPI app, CORS, router registration |
| `config.py` | pydantic-settings, reads `.env` |
| `database.py` | Async SQLAlchemy engine + session factory |
| `models/user.py` | `User` model |
| `models/assessment.py` | `DetailedAssessment`, `SubScore`, `AIChecklist` |
| `models/audit_log.py` | `AuditLog` model |
| `routers/auth.py` | `/api/register`, `/api/login`, `/api/verify-email`, etc. |
| `routers/assessments.py` | `/api/assessments/*` |
| `routers/admin.py` | `/api/admin/*` (requires `is_admin=True`) |
| `routers/intelligence.py` | `/api/intelligence/*` — v2, DB-backed |
| `routers/projects.py` | `/api/projects/*` |
| `schemas/` | Pydantic request/response schemas |
| `core/email.py` | Resend email helpers |
| `core/deepseek.py` | DeepSeek prompt + response parsing |
| `core/rate_limit.py` | SlowAPI rate limiter |
| `scripts/fetch_leaderboard.py` | DeFiLlama cron fetcher |
| `scripts/fetch_intelligence.py` | Legacy HKMA/SEC/MAS/SFC scraper (v1) |
| `scripts/fetch_rss.py` | RSS feed ingestion (HKMA, SEC, CoinDesk, etc.) |
| `scripts/monitor_github_repos.py` | Tracked GitHub repo monitoring |
| `scripts/parse_emails.py` | Newsletter/alert email parsing |
| `scripts/create_admin.py` | Promote user to admin |

---

## Key data models

### User status flow
```
pending_verification → (email clicked)
  pending_review  ← non-auto-approved domain → admin approves/rejects
  active          ← .edu/.gov/etc. or whitelist (hkma.gov.hk, bis.org, imf.org)

active → suspended (admin action)
```

### Assessment status flow
```
draft → checklist_generated → finalized
```
`rarm_score` / `rarm_total` are user-entered, stored privately, never surfaced publicly.

---

## Module catalogue (by navigation block)

---

### Block 1 — Intelligence (`/intelligence`)

**Purpose:** Policy-to-Market intelligence engine. Aggregates global regulatory events and runs AI market-impact analysis.

#### 1a. Global Policy Timeline (v2) — Done 2026-05-22

Routes: `/intelligence`, `/intelligence/hk`, `/intelligence/admin` (admin-only review queue)

Sub-sections:
- **Global Policy Timeline** — US (SEC/CFTC), EU (MiCA), SG (MAS), UAE (VARA), HK (HKMA/SFC), others
- **HK Observation** — HKMA/SFC focused, follows regulator pace (no artificial padding)
- **Admin Review Queue** — scraped/AI-analysed items land as `pending`; an admin approves (→ `published`) or rejects (→ `rejected`) before anything is publicly visible

**Architecture note (v2):** unlike other public modules, Intelligence is **DB-backed, not JSON-file-only**. A static `intelligence.json` provides curated base content; published DB items are merged on top (deduped by `source_url`) at request time. The DB is the source of truth for the review workflow.

Ingestion (all in `backend/scripts/`, standalone, no FastAPI imports):
- `fetch_rss.py` — RSS feeds (HKMA, SEC, CoinDesk, The Block, Google News proxies, etc.)
- `monitor_github_repos.py` — tracked GitHub repos
- `parse_emails.py` — inbound newsletter/alert parsing
- `fetch_intelligence.py` — legacy scraper (HKMA/SEC/MAS via urllib; SFC via Playwright)

DeepSeek market-impact analysis runs on ingest; output is `pending` until an admin reviews it.

DB tables (migration `0007_intelligence_items`):
- `intelligence_items` — `status` (`pending`|`published`|`rejected`), `event_type`, `significance` (`landmark`|`major`|`notable`), `is_data_snapshot`, `source_entity`, `data_source`, `market_impact` JSONB, `source_url` UNIQUE
- `narrative_threads` — slug, name, `related_event_ids[]`, `status`
- `editor_notes` — `week_label`, `content`, `related_event_ids[]`, `status` (`draft`|`published`)

Backend router `backend/app/routers/intelligence.py`:
```
GET  /api/intelligence                  # list (category/region/event_type/is_data_snapshot filters)
GET  /api/intelligence/dashboard        # aggregated: highlights, forward_view, region_activity, narratives, editor_note, recent_timeline
GET  /api/intelligence/hk               # HK Observation entries
GET  /api/intelligence/weekly           # weekly brief card (cached 6h)
GET  /api/intelligence/narratives       # active narrative threads
GET  /api/intelligence/narratives/:slug # events for one narrative
GET  /api/intelligence/editor-notes     # recent published notes
POST /api/intelligence/editor-notes     # admin — create note
GET  /api/intelligence/pending          # admin — review queue
PUT  /api/intelligence/:id/approve      # admin — pending → published
PUT  /api/intelligence/:id/reject       # admin — pending → rejected
PUT  /api/intelligence/:id              # admin — edit fields
POST /api/intelligence/refresh          # admin — trigger scraper (background)
GET  /api/intelligence/:id              # single item
```

Frontend `web/src/screens/Intelligence/`:
```
index.tsx        — dashboard (highlights/narratives/region activity) + weekly brief + admin "Review queue" link (is_admin only)
HKObservation.tsx — /intelligence/hk, HKMA/SFC entries with RARM layer impact notes
AdminReview.tsx   — /intelligence/admin, pending-queue triage (approve/reject/edit). Route MUST be guarded by <RequireAdmin />, not <RequireAuth />
```

Cron:
```bash
0 6 * * * python3 /opt/rwascope-backend/scripts/fetch_intelligence.py
0 8 * * 1 python3 /opt/rwascope-backend/scripts/generate_weekly_report.py
```

Dev note: never commit DB dumps. `*.sql`/`*.dump` are gitignored — seed local data via the ingestion scripts, not a committed `pg_dump`.

Editorial rules:
- Only cite verifiable official sources; broken links block publishing
- AI summaries must display "AI-generated — verify against source" label
- Neutral tone: record what was announced, not predictions about outcomes
- Never fabricate specific protocol names — describe affected *types* only

#### 1b. Incidents — Done 2026-04-28, updated 2026-05-06

Routes: `/incidents`, `/incidents/:slug`, `/incidents/methodology`

27 incidents in `public/data/incidents/incidents.json` (2022–2025): 19 global, 8 HK-related.

Incident rules: all claims need a source in `sources[]`; use `estimatedLossNote` for uncertain figures; neutral tone; no predictions on ongoing cases; HK incidents: all severities if HK nexus exists; global: only loss ≥ USD 100M or multi-jurisdictional regulatory response.

#### 1c. Reports — Done 2026-04-29

Routes: `/reports`, `/reports/:slug`, `/reports/methodology`

2 reports: Q1 2026 (published 2026-05-05), Q2 2026 (preview). PDF via `@react-pdf/renderer` (dynamically imported only). Citation modal: APA, Chicago, BibTeX.

Section types: `manual`, `auto-licenses`, `auto-assets`, `auto-incidents`, `auto-market`, `mixed`. No composite scores in any section.

Run `npx vitest run src/utils/reports.test.ts` before modifying `reports.ts`.

#### 1d. Enforcement Tracker — Done 2026-05-20

Route: `/enforcement`

Data: `public/data/enforcement/enforcement.json`

Covers SEC, CFTC, SFC, and MAS regulatory and legal actions relevant to RWA/tokenized assets. Static JSON-only (no backend router). Accessible from the Intelligence nav dropdown.

Rules: only include publicly verifiable enforcement actions with official source references. Never fabricate case outcomes for ongoing proceedings.

#### 1e. Issuer Disclosures — Done 2026-05-20

Route: `/disclosures`

Data: `public/data/disclosures/disclosures.json`

NAV reports, reserve attestations, and regulatory filings from institutional stablecoin/RWA issuers. Static JSON-only. Accessible from the Intelligence nav dropdown.

Rules: only include publicly released disclosure documents. Link directly to issuer or regulator source. No inference about reserve quality — traffic-light signals only where applicable.

---

### Block 2 — Projects (`/projects`) — Done 2026-05-14

**Purpose:** Deep anatomy profiles of RWA projects — entity structure, regulatory framework, narrative context. NOT a scored list.

Routes: `/projects`, `/projects/:slug`

Each project profile contains:
- Basic info: name, website, asset class, jurisdiction, chain, status
- Entity Map: issuer, custodian, chain/L2, oracle, law firm, auditor, regulator, token standard
- Regulatory links → Intelligence module entries
- Sources list

**No RARM numeric scores on public pages.** The `rarm_scores` field was removed from `projects.json` on 2026-05-13. If a project has a corresponding asset in Block 3 (`/assets/:slug`), cross-link to it.

First batch: BUIDL, BENJI, OUSG, PAXG, RealToken, EnsembleTX participants (HSBC/SCB/BOC, public info only), HashKey tokenization projects.

Backend router `backend/app/routers/projects.py`:
```
GET  /api/projects           # list, supports asset_class/region filters
GET  /api/projects/:slug     # full profile
POST /api/projects           # admin only — create
PUT  /api/projects/:slug     # admin only — update
```

Frontend `web/src/screens/Projects/`:
- `index.tsx` — filter by asset class/region/chain/status, card grid
- `ProjectDetail.tsx` — entity map (CSS Flexbox/Grid + SVG lines, no heavy graph lib), policy links, sources, CTA → `/score/new`

Data file: `public/data/projects/projects.json`

TypeScript types: `src/types/projects.ts`

---

### Block 3 — Market (`/market`)

#### 3a. Market Dashboard — Done


Route: `/market`

Protocol/TVL data from DeFiLlama (`leaderboard.json`, cron-written). Ranks by TVL only — no platform-assigned quality metric.

#### 3b. Tokenized Assets (RARM) — Done 2026-04-29, updated 2026-05-10

Routes: `/assets`, `/assets/:slug`, `/assets/methodology`

25 assets in `public/data/assets/assets.json`:
- **Green (14):** BUIDL, BENJI, OUSG, USDY, USTB, XAUT, Centrifuge Prime, PAXG, WTGXX, HKSAR Digital Green Bond, ChinaAMC HKD Digital MMF, USYC, AUSD, OMMF
- **Yellow (6):** ACRED, RealToken, bCSPX, XGT, TBILL, USCC
- **Red (3):** TUSD, Maple Finance (Syrup), Goldfinch (FIDU)
- **Gray (2):** Hamilton Lane SCOPE, Matrixdock STBT

RARM aggregation logic: any gray → gray; any red → red; count(green) ≥ 4 → green; else yellow.

To add an asset: append to `assets.json`, all 6 RARM layers required, use `gray` with rationale if data unavailable. Never fabricate signals.

#### 3c. Reserve Monitor — Done 2026-05-20

Route: `/reserves`

Data: `public/data/reserves/reserves.json`

Stablecoin reserve composition and attestation history. Covers major institutional issuers. Static JSON-only. Accessible from the Market nav dropdown.

Rules: only use figures from published attestation reports or issuer disclosures. Traffic-light signals only — no composite scoring. Use `gray` when attestation data is absent or unverified.

---

### Block 4 — Framework (`/licenses` entry point)

#### 4a. Licenses (SARM) — Done (Q2 2026 updated)

Routes: `/licenses`, `/licenses/:slug`, `/licenses/methodology`

Q2 2026: HKMA issued first two stablecoin licences (HSBC `hsbc-hkd`, Anchorpoint Financial `standard-chartered-animoca-hkt`). 8 issuers total.

Data: `web/public/data/licenses/issuers.json`. 6 SARM dimensions: `capital_adequacy`, `reserve_quality`, `governance`, `technology`, `redemption`, `disclosure`. Each has `signal`: `"green" | "yellow" | "red" | "gray"`.

Rules:
- `aggregateSARM()` returns signal counts only — no composite score, no letter grade.
- Gray = insufficient public data (not a negative signal).
- Run `npx vitest run src/utils/sarm.test.ts` before any change to `sarm.ts`.

#### 4b. Compliance Map — Done 2026-04-30

Routes: `/compliance`, `/compliance/:jurisdiction/:issue`, `/compliance/methodology`

Data: `public/data/compliance/matrix.json` — v1.0.2, 5 jurisdictions × 5 issues, all populated.

Signals: `open` / `conditional` / `restricted` / `placeholder`. Never assign `open` or `conditional` without at least one primary-statute or regulator-guidance reference.

#### 4c. EnsembleTX Tracker — Done 2026-04-30

Routes: `/ensemble`, `/ensemble/timeline`, `/ensemble/use-cases`, `/ensemble/institutions`, `/ensemble/institutions/:slug`, `/ensemble/methodology`

Data: `public/data/ensemble/ensemble.json` — 5 milestones, 7 use cases, 10 institutions.

Phase colours: `pre-launch` → `#9ca3af`, `sandbox` → `#f59e0b`, `pilot` → `#10b981`.

**Critical rules:** Never add institutions not verifiable from HKMA public disclosures. Never fabricate transaction volumes or outcomes. Never predict participation. This module covers central bank infrastructure — accuracy standards are highest here.

#### 4d. Methodology — Done

Route: `/methodology`

RARM/SARM academic framework documentation. No module-specific data file.

#### 4e. Glossary — Done 2026-05-20

Route: `/glossary`

Key terms across RARM, SARM, and tokenized finance. Static content. Accessible from the Framework nav dropdown.

---

### Block 5 — Ecosystem (`/ecosystem`) — Done 2026-05-12

Route: `/ecosystem`

Data: `public/data/ecosystem/ecosystem.json` — 3 regulators, 2 licensed issuers, 7 named EnsembleTX participants, 5 HK-linked RWA protocols, 2 confirmed VATPs.

Tab 1: 5-layer architecture diagram. Tab 2: Recharts BarChart participant distribution.

Rules: Only include participants verifiable from HKMA/SFC/HKEx public sources. Use `participants_note` for incomplete lists — never fabricate entries.

---

### Protected utility — Due Diligence (`/score`)

Auth-gated workbook (not in the 5-block public nav). Routes: `/score`, `/score/review/:id`, `/score/report/:id`, `/score/history`.

---

## DeepSeek AI integration

Called only from `POST /api/assessments/:id/analyze` and `POST /api/intelligence/refresh`.

### Assessment checklist prompt (`backend/app/core/deepseek.py`)

```python
SYSTEM_PROMPT = """
You are an RWA compliance analysis assistant. Given the user's RARM scores,
generate a structured due-diligence checklist for each layer.
Return JSON only — no prose outside the JSON.

Rules:
1. Generate "questions to verify" and "red flags" only — never suggest scores
2. Per layer: 3 Verify items, 3 Source pointers, 2 Red Flags
3. Sources point to publicly verifiable data (HKMA, DeFiLlama, Etherscan, audit reports)
4. Professional but concise — institutional investor audience
5. All content must reference HKMA/SFC regulatory framework where applicable
"""
```

### Intelligence Policy-to-Market prompt

```python
INTELLIGENCE_PROMPT = """
You are an RWA institutional intelligence analyst. Analyse the regulatory event and output
a structured Policy-to-Market impact analysis. Return JSON only.

Rules:
- Only analyse provided content — do not fabricate facts
- Affected entities: describe types only, never invent specific company names
- Objective only; no investment advice
- If unrelated to RWA/tokenization, set rwa_relevant: false

Return:
{
  "rwa_relevant": true/false,
  "policy_summary": "...",
  "market_impact": {
    "benefited_sectors": [...],
    "affected_entity_types": [...],
    "capital_flow": "...",
    "hk_relevance": "..." or null
  },
  "timeline_significance": "..."
}
"""
```

### Error handling

| Scenario | Response |
|---|---|
| Timeout > 30s | HTTP 503 — "AI analysis timed out, please retry" |
| Response not valid JSON | HTTP 500 — log raw response; do not surface to user |
| API key invalid / quota exceeded | HTTP 503 — admin must update `.env` |

---

## Auth flow

1. Register at `/login` (Cloudflare Turnstile CAPTCHA).
2. Backend sends verification email via Resend.
3. Click link → `GET /api/verify-email?token=...` → auto-approve (.edu/.gov/whitelist) or `pending_review`.
4. Active users can log in and use workbooks.
5. JWT access token (60 min) + refresh token (7 days) stored in `AuthContext`.

---

## Style conventions

### Frontend
- **Tailwind only** — no CSS modules, no styled-components.
- **Colour palette:**
  - `#2B3437` — primary text / dark backgrounds
  - `#5E5C75` — accent / active states
  - `#737C7F` — secondary text
  - `#DBE4E7` — borders
  - `#EAEFF1` / `#F1F4F6` — subtle backgrounds
  - `#2E7D32` — green, `#e09d2b` — yellow/amber, `#9e3f4e` — red
- **Icons:** Google Material Symbols (`material-symbols-outlined`, loaded via CDN in `index.html`).
- **No index barrel files** — import directly from file path.

### Backend
- Async everywhere: `async def`, `await session.execute(...)`.
- Dependencies via FastAPI `Depends()`.
- Admin endpoints: `AdminUser = Annotated[User, Depends(get_admin_user)]`.
- All destructive admin actions call `_log(db, admin, action, detail)`.
- Pydantic v2: `model_config = ConfigDict(from_attributes=True)`.

---

## Common tasks

### Add a new frontend page
1. Create `web/src/screens/MyPage.tsx`
2. Add `<Route>` in `web/src/App.tsx`
3. Add to `navItems` in `TopNav.tsx` if needed
4. `npm run build` + `./scripts/deploy.sh`

### Add a new backend endpoint
1. Add route in appropriate router
2. Add/update Pydantic schema in `app/schemas/`
3. If new model: `alembic revision --autogenerate -m "description"`
4. Add to `src/api/client.ts`
5. Deploy: rsync backend + `alembic upgrade head` + `systemctl restart rwascope-backend`

### Add a new issuer (Licenses)
1. Append to `web/public/data/licenses/issuers.json`
2. All 6 SARM dimensions required; default `signal` to `"gray"`
3. `npm run build` + `./scripts/deploy.sh`

### Promote a user to admin
```bash
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46
cd /opt/rwascope-backend && source venv/bin/activate
python scripts/create_admin.py user@example.com
```

---

## Pre-commit checklist

- [ ] Scoring-related pages include `<DisclaimerBanner />` at top
- [ ] AI content uses "questions to verify" framing — never "recommended score" or "suggested rating"
- [ ] Reports and workbooks attributed to user ("Prepared by [name]"), not the platform
- [ ] Intelligence items link to a live, official URL — no fabricated or broken links
- [ ] New API endpoints verify resource ownership (`assessment.user_id != current_user.id` → 403)
- [ ] New DB columns/tables have an Alembic migration file
- [ ] New public utility functions (`sarm.ts`, `rarm.ts`, `reports.ts`) have unit tests
- [ ] No numeric scores in any `public/data/` JSON file

---

## What NOT to do

- Do not edit anything in `api/` — it is a legacy duplicate.
- Do not touch `native/` — dormant.
- Do not add `--no-verify` to git commits.
- Do not push secrets (`.env`, API keys) to GitHub.
- Do not `git push --force` to `main`.
- Do not expose assessment scores, rationale, or checklist answers in admin views.
- Do not create any endpoint that returns aggregate scores across users.
- Do not deploy frontend with raw `rsync --delete` — always use `./scripts/deploy.sh`.
