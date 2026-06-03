# Disclosures Backlog

## Manual data collection needed

### FDUSD (First Digital USD)
- source_url: https://firstdigitallabs.com/transparency
- firstdigitallabs.com blocks automated access (HTTP 403)
- Manual extraction needed:
  - auditor (Prescient Assurance LLC was 2023–2024 signer, verify 2026 current)
  - file_url (latest monthly attestation PDF direct link)
  - date / period_covered
  - key_figures (FDUSD in circulation; reserve composition breakdown)
- HKMA stablecoin license status: First Digital Trust not on HKMA 2025 licensed
  issuer list as of 2026-06; regulator stays null with summary note
- Defer until manual browser session captures PDF + auditor confirmation

### Tether Q1 2026 attestation
- Q4 2025 (point-in-time 31 Dec 2025) is current entry
- Q1 2026 PDF likely released April 2026 (per tetherfacts.com aggregator
  citing 104.5% collateralisation) but direct PDF URL not yet found on
  tether.to/transparency
- Update file_url + figures + slug to tether-usdt-attestation-2026-q1
  when Q1 PDF surfaces

### USYC (Hashnote US Yield Coin)
- slug: hashnote-usyc-product-2025 (live entry; file_url intentionally null)
- source_url: https://www.circle.com/usyc
- file_url: null — no public attestation PDF released
- Transparency model: on-chain daily NAV oracle replaces traditional PDF disclosure;
  fund documents available on request to qualified investors only
- Future trigger: monitor https://www.circle.com/transparency for USYC inclusion
  alongside USDC/EURC; if Circle starts publishing USYC attestation post-acquisition
  integration, update file_url and change doc_type to 'attestation'
- auditor Valaston International Limited sourced from rwa.xyz aggregator only;
  confirm from primary Hashnote/Circle document when available

### USTB date precision
- slug: superstate-ustb-form-d-2024
- date placeholder: 2024-02-01 (exact day TBD)
- Initial Form D 2024 filing exists (CIK 2004367) but exact day could not be
  confirmed due to SEC EDGAR automated-access block at research time
- Manual verify via browser: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0002004367&type=D
- Also note: Invesco management transition announced 2026-03-24 (expected Q2 2026);
  update summary when transfer completes and fund is renamed

### Paxos transparency pages (USDP + USDG)
- source_url: paxos.com/usdp-transparency, paxos.com/usdg-transparency
- file_url: null — JS-rendered transparency pages serve PDFs dynamically,
  static URL not crawlable
- Monthly attestations exist (Jan–Apr 2026 confirmed) but require manual
  browser session to extract PDF direct link per period
- USDP may have transitioned to on-request-only reporting given supply decline
  ($1B+ peak → ~$35M); verify cadence before next refresh

### XAUT Q1 2026 attestation
- slug: tether-xaut-attestation-2025-q4 (Q4 2025 currently latest published)
- BDO ISAE 3000R cadence is quarterly; Q1 2026 expected April-May 2026 but
  not yet published as of 2026-06-01
- URL pattern stable: gold.tether.to/docs/reports/attestations/
  ISAE_3000R_-_Opinion_TGRR_DD.MM.YYYY_RCxxxxx.pdf
- Refresh when Q1 2026 PDF surfaces; also verify PDF cover entity name
  (TG Commodities vs. Tether Holdings S.A. de C.V.)

### UI: Regulator / Status badge rendering on DisclosureRow
- Current DisclosureRow expanded view renders summary + links only
- Data layer carries regulator (SEC/NYDFS/MAS/HKMA/BMA/CIMA/null) and
  status (live/superseded/pending/retired); neither is rendered
- Add badge components:
  - Regulator badge near title (parallel to enforcement page styling)
  - Status badge with color coding (retired = muted gray, pending = amber,
    superseded = strike-through, live = default)
- Defer until data completeness batches done; not blocking deploy

### SocGen SFH OFH 2019 maturity confirmation
- Coupon and maturity date not in any public issuer document
- Likely matured (typical OFH tenor 5–10 yr from April 2019 → 2024–2029)
- key_figures notes TODO; status marked retired conservatively
- Action: direct inquiry to SG Forge or search issuer's 2019 annual report
- Defer until manual outreach

### HKSAR Phase 1 inaugural digital green bond (February 2023, GS DAP)
- Phase 1 (Feb 2023) and Phase 2 (Feb 2024, now covered as hksar-digital-green-bond-phase2-2024)
  are two separate issuances on different platforms (GS DAP vs HSBC Orion)
- Phase 1 currently uncovered; consider adding as a separate entry for historical anchor value
- Source URL: hkma.gov.hk press releases archived 2023-02
  (likely: hkma.gov.hk/eng/news-and-media/press-releases/2023/02/)
- Platform: Goldman Sachs GS DAP; Tranche: HKD 800M, 1-year
- Priority: P2

---

## Enforcement observations

### HKMA Stablecoin Ordinance enforcement gap (as of 2026-06-02)
- HKMA Stablecoin Ordinance effective 2025-08-01; first licences granted 2026-04-10 (HSBC + Anchorpoint)
- As of 2026-06-02, no public cease orders, licence refusals, or formal enforcement actions confirmed
- Notable: 10-month gap between regime activation and any public enforcement signal,
  vs. SEC's pre-Atkins ~150-action annual cadence
- Possible explanations: HKMA soft-launch posture; all applicants are incumbent banks or bank-backed JVs;
  no unlicensed issuers large enough to warrant public action in first year
- Action: re-audit quarterly; consider creating an Intelligence Observation note if gap persists beyond 2026 Q4

---

## Batch F — Real Estate vertical (added 2026-06-03)

### RealT Series 1 PPM exact execution date
- slug: realt-series-1-9943-marlowe-ppm-2019
- date "2019-08-16" sourced from PDF creation metadata (WebFetch confirmed PDF live)
- Actual PPM execution/signing date may differ from creation date — verify from PDF cover page
- file_url confirmed live: https://realt.co/wp-content/uploads/2019/09/REALTOKEN-LLC-SERIES-1-9943-MARLOWE-1.pdf
- Also check: RealT Form D filing(s) on EDGAR (Reg D 506(c) requires Form D within 15 days of first sale)
  to confirm SEC filing date and exact offering launch

### Propy Kyiv 2017 — separate entry candidate (P2)
- The 2017 Kyiv apartment sale (Michael Arrington / Arrington XRP Capital, ~$60,000 ETH) is a
  separate milestone: first government-authorised blockchain property transfer globally
- Ukrainian government registration via Propy predates the Gulfport 2022 US first
- Currently cited only in FB summary; could be an independent entry if Ukrainian gov source URL found
- Source hint: propy.com/browse/propy-nft/ + Ukrainian Ministry of Justice press records (2017)
- Priority: P2

### Aspen Digital EDGAR Form D CIK — P0 blocking TODO
- slug: aspen-digital-aspd-offering-2018
- SEC EDGAR automated access returns HTTP 403 consistently; CIK for "Aspen Digital, Inc." not verified
- Manual browser verification required: https://www.sec.gov/cgi-bin/browse-edgar?company=aspen+digital&CIK=&type=D
- Also verify: ASPD token contract address on Ethereum (not found in research; search Etherscan for
  Harbor-issued ERC-20 tokens from 2018-2019 associated with Aspen or Elevated Returns)
- When CIK found: update source_url to direct Form D filing URL, update date to exact filing date,
  remove MED confidence caveat from summary
- Priority: P0

### RE vertical — future extension candidates
- Roofstock onChain (2022 SFR tokenisation launch / 2023 wind-down) — US SFR, academic post-mortem value
- Inveniam + MANTRA Inveniam Chain (May 2026 announcement) — CRE data/tokenisation L2
- RedSwan CRE (FINRA-registered broker-dealer, Texas CRE pipeline) — requires non-automated SEC access
- HKMA Project Ensemble RE pilot — if public disclosure surfaces from HKMA
- Securitize CRE clients under Reg S (non-US placement) — identify specific issuer with public circular

---

## Batch E — Private Credit vertical (added 2026-06-02)

### BlockTower Credit Series I–IV — verify POP approval date & SPV jurisdiction
- slug: blocktower-credit-centrifuge-pop-2022
- date "2022-12-13" is the POP "Target Launch Date"; actual governance vote timestamp
  may differ — verify from gov.centrifuge.io/t/pop-blocktower-series-i-iv/4863 thread
- jurisdiction "KY" is assumed (standard for Centrifuge SPVs); confirm from POP
  structure section describing the SPV legal domicile
- Check POP thread for IPFS/PDF attachment to populate file_url if available
- Verify pool status post-MakerDAO Sky restructuring (2024–2025): active / migrated
  to Centrifuge v2 / wound down

### M11 Credit — verify Netherlands entity details & recovery amount
- slug: m11-credit-orthogonal-default-2022
- jurisdiction "EU" used as fallback (Maven 11 Group is Dutch); precise value "NL"
  would require extending jurisdiction enum
- Kroll recovery partial amount has not been publicly disclosed; monitor for updates
- If Maple Finance publishes a formal v2 migration post-mortem PDF, add as
  supplementary file_url

### Goldfinch Prime (2025-02 launch) — future entry candidate
- slug: goldfinch-prime-disclosure-2025 (not yet created)
- Apollo/Ares/Golub institutional private credit access product; successor to Senior Pool
- Warbler Labs launched February 2025; targeting 9–12% net, non-US investors
- Create entry when Prime discloses fund-level data (AUM, underlying fund composition,
  fee structure in accessible form)
- Also consider: Heron Finance (separate Warbler Labs product, SEC-registered
  robo-advisor on blockchain) — separate issuer_slug if entered

### doc_type vertical extensions (deferred from Batch E)
- pool_prospectus: for Centrifuge POP format (formal pool onboarding proposals)
- governance_disclosure: for DeFi governance forum posts used as primary issuer disclosures
- onchain_dashboard: for protocols where on-chain dashboard is the only disclosure
- Defer until private_credit vertical continues expanding (Maple syrupUSDC, other
  Centrifuge pools, Goldfinch Prime) — batch-extend doc_type at that point
