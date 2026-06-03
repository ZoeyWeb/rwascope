# Incident Registry — Backlog

## Batch 1 (2026-06-03) — resolved
- stream-finance-xusd-collapse-2025 ✓
- realt-detroit-tokenized-re-fraud-2025 ✓
- kelpdao-aave-bank-run-2026 ✓

## Verification TODO
- [ ] RealT estimatedLossUsd $2.72M: manual fetch Michigan Public Radio article
      (https://www.michiganpublic.org/economy/2025-07-25/crypto-real-estate-company-realt-collected-millions-from-investors-for-detroit-properties-it-doesnt-own)
      to confirm USD figure source. Current entry already caveat-flagged in estimatedLossNote.

## Batch 2 candidates (P0 first)
- radiant-capital-hack-2024 (2024-10-16, critical, DPRK $50M, 2026-06 wind-down)
- zoth-rwa-restaking-hack-2025 (2025-03-21, high, RWA-native protocol, tokenized-treasury enum first fill)
- resolv-labs-usr-depeg-2026 (2026-03-22, critical, AWS KMS exploit, 2026 Q1 coverage)

## Batch 3 candidates (P1)
- goldfinch-lendeast-default-2024 (2024-04-01, high, tokenized-private-credit enum first fill)
- usual-usd0pp-depeg-2025 (2025-01-09, high, tokenized-treasury derivative)
- infini-neobank-exploit-2025 (2025-02-24, critical, stablecoin neobank admin key)

## Skip / On Hold
- usdx-depeg-cascade-2025 — RWA relevance MEDIUM, defer
- drift-protocol-dprk-hack-2026 — RWA relevance LOW, defer
- Ethena USDe Oct 2025 — disputed depeg, no consensus event

## Schema / Infra TODO
- [ ] Reconcile src/types/incident.ts vs src/types/incidents.ts severity enum conflict
      (incident.ts: catastrophic|critical|major; incidents.ts: critical|high|medium|low — JSON uses latter)
- [ ] Evaluate adding metadata top-level fields (version, updated_at) to incidents.json to align with enforcement.json structure
- [ ] Evaluate creating project profiles in projects.json for Batch 1 entries to assign RWAI IDs
      (currently no 2025/2026 RWAI IDs exist; Batch 1 entries are slug-routed only)
      Hypothetical IDs if project profiles added: stream → RWAI-2025-001, realt → RWAI-2025-002, kelpdao → RWAI-2026-001
