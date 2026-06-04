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

## Schema / Infra TODO (累积)
- [ ] Reconcile src/types/incident.ts vs incidents.ts severity enum 冲突
- [ ] 评估 incidents.json 加 metadata 顶层字段 (version, updated_at) 对齐 enforcement.json
- [ ] 评估为 Batch 1+2 六条 incidents 在 projects.json 加 project profile + RWAI ID
      (Batch 2 资格候选: Radiant 重大且闭环 + Resolv 重大 — 高优先级 RWAI 候选)

## Asset Class 枚举进度
- 已填充: stablecoin, infrastructure, tokenized-real-estate, tokenized-treasury, tokenized-private-credit
- 剩余空洞: tokenized-commodity
- 5/7 filled (Batch 3 新增 tokenized-private-credit, 2026-06-04)
