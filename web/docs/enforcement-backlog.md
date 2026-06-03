# Enforcement Backlog

## Batch 5 — Tron/LBRY/KuCoin (added 2026-06-03)

### sec-tron-justin-sun-2023 — CourtListener docket URL (P2)
- slug: sec-tron-justin-sun-2023
- SDNY case No. 1:23-cv-02433-ER; CourtListener.com blocked automated access (CloudFront 403)
- Docket not included in sources; browser-accessible at courtlistener.com — search "Tron Foundation" + "SDNY 2023"
- Settlement terms for Justin Sun, Tron Foundation Ltd., and BitTorrent Foundation Ltd. were NOT publicly disclosed in the 5 March 2026 resolution — if Sun settles publicly in future, update penalty_usd and penalty_note
- Celebrity co-defendants (8 individuals) settled separately under undisclosed terms; no separate entries created

### sec-lbry-2022 — Final judgment amount (P1)
- slug: sec-lbry-2022
- PACER case 1:21-cv-00260-PB (D.N.H.); penalty_usd set to 0 pending docket verification
- SEC initially sought ~$22.2M disgorgement; final court-accepted amount after LBRY insolvency not confirmed from public sources
- Manual verify: PACER docket or EDGAR/SEC EDGAR for LBRY Inc. post-summary-judgment filings
- Dissolution source URL lbry.com/news/goodbye: no Wayback Machine snapshot found as of 2026-06-03; URL included in sources based on known publication — verify liveness before next refresh
- action_date uses the complaint filing date (2021-03-29); slug retains "-2022" suffix referencing the summary judgment year

### doj-kucoin-2024-03 — penalty_usd rounding note
- slug: doj-kucoin-2024-03
- penalty_usd: 297900000 (rounded from $297.4M DOJ + $0.5M CFTC = $297.9M total)
- DOJ breakdown: $112.9M criminal fine + $184.5M forfeiture = $297.4M
- penalty_note documents the exact split; penalty_usd reflects total rounded to nearest $100K
- CFTC PACER filing for commodity classification ruling (BTC/ETH/LTC as commodities): useful secondary precedent; not a standalone entry but relevant to asset_classes context

---

## Enforcement observations

### HKMA Stablecoin Ordinance enforcement gap
- See disclosures-backlog.md §Enforcement observations for full note
- Re-audit quarterly; consider Intelligence Observation if gap persists beyond 2026 Q4

---

## Future extension candidates

### Terraform / Do Kwon — follow-on
- slug: sec-terraform-do-kwon-2023 (already in enforcement.json, action_date 2024-06-12)
- Do Kwon extradition from Montenegro resolved 2025; criminal sentencing outcome not yet updated
- Update status and add conviction entry if criminal proceedings conclude

### Ripple XRP — post-appeals resolution
- slug: sec-ripple-xrp-2020-2024 (already in enforcement.json)
- SEC v. Ripple appeal outcome pending as of 2026-06-03; update status when Second Circuit rules

### Binance — DPA compliance monitoring
- slug: doj-binance-cz-2023-11 (already in enforcement.json)
- 5-year monitorship by independent compliance monitor underway
- Update entry if monitor issues public report or DOJ files DPA violation

### SFC HK enforcement expansion
- Fewer than 10 SFC actions currently; JPEX (sfc-jpex-2023-09) is the largest
- VASP licensing regime effective 2023; 2025–2026 licence refusals and suspension orders may warrant new entries
- Threshold: formal SFC refusal or suspension with press release; informal warnings excluded
