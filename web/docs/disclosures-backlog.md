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
