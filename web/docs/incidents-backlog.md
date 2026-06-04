# Incident Registry — Backlog

## Batch 1 (2026-06-03) — resolved
- stream-finance-xusd-collapse-2025 ✓
- realt-detroit-tokenized-re-fraud-2025 ✓
- kelpdao-aave-bank-run-2026 ✓

## Batch 2 (2026-06-03) — resolved
- radiant-capital-hack-2024 ✓
- zoth-rwa-restaking-hack-2025 ✓  ← first tokenized-treasury entry
- resolv-labs-usr-depeg-2026 ✓

## Verification TODO (累积)
- [ ] RealT estimatedLossUsd $2.72M (Batch 1, Michigan Public Radio 403)
- [ ] Radiant wind-down endDate 2026-06-02 (Batch 2, DAO governance Snapshot URL not located)
- [ ] Radiant DPRK attribution: only Mandiant TI source confirmed; second independent TI source (Chainalysis/TRM/Elliptic) standalone report not located
- [ ] Zoth official blog post-mortem (currently only X/Twitter official statement confirmed)
- [ ] Resolv estimatedLossUsd USD 57M: independent source verification outstanding
- [ ] Resolv AWS initial access vector: not confirmed in published post-mortem at review date
- [ ] Goldfinch (Batch 3): Senior Pool / backer loss split (~$3.75M / ~$2M) single-sourced from GIP-67 forum; second source outstanding
- [ ] Goldfinch (Batch 3): Oriente sub-borrower company identity not further specified pending primary source confirmation
- [ ] Goldfinch (Batch 3): Warbler Labs civil litigation status unconfirmed
- [ ] Usual (Batch 3): USD0++ supply $1.53B single-sourced (Leviathan News); second source outstanding
- [ ] Usual (Batch 3): Rekt News founder/MEV Capital conflict-of-interest allegation unverified; maintain "unverified" framing
- [ ] Infini (Batch 3): $32.7M Tornado Cash routing single-sourced (LiveBitcoinNews); second source outstanding
- [ ] Infini (Batch 3): August 2025 ultimatum outcome unknown — update if recovery or settlement confirmed
- [ ] Infini (Batch 3): Infini official X post URL (primary statement) pending human verification; add to sources when confirmed
- [ ] Infini (Batch 3): CoinTelegraph sources[3]/sources[4] return 404 to curl HEAD (bot-block); resolve normally in browsers — verify periodically

## Batch 3 (2026-06-04) — resolved ✅ shipped
- goldfinch-lendeast-default-2024 ✓  ← first tokenized-private-credit entry
- usual-usd0pp-depeg-2025 ✓
- infini-neobank-exploit-2025 ✓

## Batch 4 candidates (filler, P2)
- usdx-depeg-cascade-2025 (2025-11-06, RWA MEDIUM)
- drift-protocol-dprk-hack-2026 (2026-04-01, RWA LOW)

## RWAI Registry — projects.json (独立于 incidents.json)

### Batch A (2026-06-04) — ✅ shipped
- RWAI-2024-002 radiant-capital-hack-2024 ✓  (infrastructure, critical, wind-down)
- RWAI-2025-001 stream-finance-xusd-collapse-2025 ✓  (fintech_wrapper → tokenized_credit, critical)
- RWAI-2026-001 kelpdao-aave-bank-run-2026 ✓  (infrastructure, critical, active)
- Registry total: 10 → 13 entries

### Batch B candidates (P1)
- goldfinch-lendeast-default-2024  ← already in incidents.json Batch 3
- realt-detroit-tokenized-re-fraud-2025  ← already in incidents.json Batch 1
- usual-usd0pp-depeg-2025  ← already in incidents.json Batch 3

### Batch C candidates (P2)
- infini-neobank-exploit-2025  ← already in incidents.json Batch 3
- zoth-rwa-restaking-hack-2025  ← already in incidents.json Batch 2
- resolv-labs-usr-depeg-2026  ← already in incidents.json Batch 2

### RWAI Verification TODO (累积)
- [ ] Radiant DPRK second independent TI source (Mandiant only confirmed; Chainalysis/TRM/Elliptic standalone not located) — current framing "reportedly attributed" pending closure
- [ ] Radiant peak_tvl_usd: 386777927 sourced from DeFiLlama API (api.llama.fi/protocol/radiant) 2026-06-04
- [ ] Stream peak_tvl_usd: 204000000 sourced from DeFiLlama API (api.llama.fi/protocol/stream-finance) 2026-06-04
- [ ] Stream website URL: not located — field left as "" pending discovery
- [ ] Stream launched_at: not located — field left as null pending discovery
- [ ] Stream entity_map issuer / auditor / jurisdiction: [requires fact-check] — all null pending discovery
- [ ] KelpDAO jurisdiction: "Cayman Islands (Stader Labs)" — MEDIUM confidence, pending primary incorporation confirmation
- [ ] KelpDAO launched_at: "2023-12-01" — MEDIUM confidence, from Kelp DAO Twitter announcement

## Schema / Infra TODO (累积)
- [ ] Reconcile src/types/incident.ts vs incidents.ts severity enum 冲突
- [x] IncidentAssetClass: added 'infrastructure' (2026-06-04, Batch A)
- [ ] 评估 incidents.json 加 metadata 顶层字段 (version, updated_at) 对齐 enforcement.json
- [x] 为 Batch 1+2 incidents 加 projects.json RWAI ID — Radiant ✓ (Batch A)

## Asset Class 枚举进度
- 已填充: stablecoin, infrastructure, tokenized-real-estate, tokenized-treasury, tokenized-private-credit
- 剩余空洞: tokenized-commodity
- 5/7 filled (Batch 3 新增 tokenized-private-credit, 2026-06-04)
