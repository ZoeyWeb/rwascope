# RWAscope

![build](https://img.shields.io/badge/build-passing-brightgreen)

Academic research tool providing the RARM (RWA Asset Risk Matrix) methodology
for structured due diligence on tokenized real-world asset protocols.

> **Not a credit rating service.** RWAscope does not provide credit ratings,
> investment advice, or any regulated financial service.
> See [COMPLIANCE.md](./COMPLIANCE.md) for full regulatory positioning.

## Projects

| Directory | Description | Tech |
|-----------|-------------|------|
| `web/` | Web app (main interface) | React 18 + Vite + TypeScript + Tailwind |
| `native/` | Mobile companion app | React Native + Expo 51 |
| `backend/` | Due diligence API (private user workbooks) | FastAPI + PostgreSQL + DeepSeek |
| `api/` | Data pipeline (DeFiLlama market data) | Python scripts |

## Quick Start

### Web
```bash
cd web
npm install
npm run dev          # http://localhost:5173
```

### Native (Mobile)
```bash
cd native
npm install
npx expo start       # scan QR code with Expo Go app
```

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DB URL + DeepSeek key
alembic upgrade head   # runs 0001 + 0002 migrations
uvicorn app.main:app --reload --port 8001
```

### API Scripts (Market Data)
```bash
cd api
python scripts/fetch_leaderboard.py
```

## Production

- **Web (canonical)**: `https://rwa-index.com`
- **Backend API**: `https://rwa-index.com/api`
- **Legacy domain**: `onlyidea.net` → 301 redirects to `rwa-index.com` (kept for backward compatibility, do not link to it)
- **Server**: AWS Lightsail (Ubuntu 24.04, Nginx + systemd)

## RARM Framework

Six-layer structured due diligence methodology for tokenized real-world assets:

| Layer | Name | Focus |
|-------|------|-------|
| L1 | Legal & Regulatory Compliance | Jurisdiction, licensing, AML/sanctions |
| L2 | Asset Valuation & Transparency | Oracle quality, audits, NAV methodology |
| L3 | Custody & Asset Security | Custodian tier, insurance, key management |
| L4 | Counterparty & KYC/AML | KYC rigor, ongoing monitoring, credit risk |
| L5 | Liquidity & Market Risk | Redemption windows, TVL stability, stress tests |
| L6 | Settlement & Operational Risk | Finality speed, smart contract audits, governance |

The **RARM Score** (0–10) is computed from a user's own sub-indicator scores
using asset-class-specific layer weightings. It is a private analytical tool
stored per user — it is not a platform rating or published assessment.

## AI Research Assistant

The backend integrates with DeepSeek to generate per-layer **due diligence
checklists** (verification questions, public data sources, red flags) to help
users conduct thorough research. The AI does not produce numeric scores.

## Compliance Architecture

Key design decisions to avoid regulated credit rating service classification:

1. All numeric scores are user-generated (not platform-generated)
2. Scores are stored privately per user — never published or aggregated
3. The AI produces checklists only — no score suggestions
4. Public pages show only third-party DeFiLlama data (TVL, chains, audits)
5. Session-persistent disclaimer on every page
6. Registration requires explicit consent to non-rating-service terms

See [COMPLIANCE.md](./COMPLIANCE.md) for detailed regulatory analysis.
# test
# test2
