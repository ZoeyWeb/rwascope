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

## Batch 3 candidates (P1)
- goldfinch-lendeast-default-2024 (2024-04-01, high, tokenized-private-credit 枚举首填)
- usual-usd0pp-depeg-2025 (2025-01-09, high, tokenized-treasury governance redemption change)
- infini-neobank-exploit-2025 (2025-02-24, critical, stablecoin neobank admin key)

## Batch 4 candidates (filler, P2)
- usdx-depeg-cascade-2025 (2025-11-06, RWA MEDIUM)
- drift-protocol-dprk-hack-2026 (2026-04-01, RWA LOW)

## Schema / Infra TODO (累积)
- [ ] Reconcile src/types/incident.ts vs incidents.ts severity enum 冲突
- [ ] 评估 incidents.json 加 metadata 顶层字段 (version, updated_at) 对齐 enforcement.json
- [ ] 评估为 Batch 1+2 六条 incidents 在 projects.json 加 project profile + RWAI ID
      (Batch 2 资格候选: Radiant 重大且闭环 + Resolv 重大 — 高优先级 RWAI 候选)

## Asset Class 枚举进度
- 已填充: stablecoin, infrastructure, tokenized-real-estate, tokenized-treasury
- 剩余空洞: tokenized-private-credit, tokenized-commodity
- 候选: Goldfinch (Batch 3) 将填 tokenized-private-credit
