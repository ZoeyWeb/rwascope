const fs = require('fs');

const path = '/Users/zoeywen/app/rwascope/web/public/data/licenses/issuers.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Change 1: Update Anchorpoint
const anchorIndex = data.findIndex(i => i.slug === 'standard-chartered-animoca-hkt');
if (anchorIndex !== -1) {
  let anchor = data[anchorIndex];
  anchor.name = "Anchorpoint Financial";
  anchor.ticker = "HKDAP";
  anchor.parent = "Standard Chartered Bank (HK) / Animoca Brands / HKT";
  anchor.status = "licensed";
  anchor.summary = "Anchorpoint Financial is a joint venture between Standard Chartered Bank (Hong Kong), Animoca Brands, and Hong Kong Telecommunications (HKT). It received one of the first two stablecoin issuer licences issued by the HKMA under the Stablecoins Ordinance (Cap. 656). Its product, HKDAP (HKD At Par), is a HKD-pegged stablecoin intended to be distributed via a B2B2C model through authorised distribution partners, with use cases including settlement of tokenised real-world assets.";
  
  anchor.sarm.reserve_quality.rationale = "Anchorpoint Financial received an HKMA stablecoin issuer licence; full reserve composition documentation under the licence is pending public disclosure as the entity prepares for product launch. SARM assessment will be updated when issuer disclosures are published.";
  anchor.sarm.redemption.rationale = "Anchorpoint Financial received an HKMA stablecoin issuer licence; full redemption mechanics documentation under the licence is pending public disclosure as the entity prepares for product launch. SARM assessment will be updated when issuer disclosures are published.";
  anchor.sarm.governance.rationale = "Anchorpoint Financial received an HKMA stablecoin issuer licence; full governance documentation under the licence is pending public disclosure as the entity prepares for product launch. SARM assessment will be updated when issuer disclosures are published.";
  
  const hasHkmaCitation = anchor.citations.some(c => c.url.includes('register-of-licensed-stablecoin-issuers'));
  if (!hasHkmaCitation) {
    anchor.citations.push({
      "label": "HKMA Register of Licensed Stablecoin Issuers",
      "url": "https://www.hkma.gov.hk/eng/regulatory-resources/registers/register-of-licensed-stablecoin-issuers/",
      "date": "2026-04-29"
    });
  }

  anchor.reviewer_note = "Anchorpoint Financial received one of the first two HKMA stablecoin issuer licences in April 2026 under the Stablecoins Ordinance (Cap. 656). Detailed reserve composition, redemption procedures, and governance arrangements under the licence are pending public disclosure. The full SARM assessment will be completed when the licensee's regulatory filings and operational disclosures become publicly available.\n\nRevision Notes: 2026-04-29 Updated to reflect issuance of HKMA stablecoin licence and reorganisation of consortium as Anchorpoint Financial joint venture. Source: HKMA Register of Licensed Stablecoin Issuers.";
  anchor.last_reviewed = "2026-04-29";
}

// Change 2: Add HSBC
const hsbcEntry = {
  "slug": "hsbc-hkd",
  "name": "HSBC",
  "ticker": "Pending",
  "parent": "HSBC Holdings plc",
  "jurisdiction": "Hong Kong SAR",
  "application_date": "2025-01-01",
  "status": "licensed",
  "peg": "HKD",
  "type": "fiat_backed",
  "summary": "HSBC is one of Hong Kong's three note-issuing banks. It received one of the first two stablecoin issuer licences issued by the HKMA under the Stablecoins Ordinance (Cap. 656). According to public statements, HSBC intends to launch a HKD-denominated stablecoin in the second half of 2026, integrated with PayMe and the HSBC HK Mobile Banking App, initially focused on peer-to-peer and peer-to-merchant payment use cases for retail customers and merchants.",
  "sarm": {
    "capital_adequacy": {
      "key": "capital_adequacy",
      "label": "Capital Adequacy",
      "signal": "gray",
      "rationale": "HSBC received an HKMA stablecoin issuer licence in April 2026. Standalone capital details for the specific issuing entity are pending disclosure, though HSBC is an HKMA-authorised institution.",
      "sources": []
    },
    "reserve_quality": {
      "key": "reserve_quality",
      "label": "Reserve Quality",
      "signal": "gray",
      "rationale": "HSBC received an HKMA stablecoin issuer licence in April 2026; full reserve composition, custody arrangements, and attestation procedures are pending public disclosure ahead of the product's expected launch in H2 2026. SARM assessment will be updated when reserve documentation is published.",
      "sources": []
    },
    "governance": {
      "key": "governance",
      "label": "Governance",
      "signal": "gray",
      "rationale": "HSBC operates as an HKMA-authorised institution and a Hong Kong note-issuing bank. Specific governance arrangements for the stablecoin entity, key personnel responsible for stablecoin operations, and Travel Rule implementation details are pending public disclosure.",
      "sources": []
    },
    "technology": {
      "key": "technology",
      "label": "Technology & Custody",
      "signal": "gray",
      "rationale": "Technology and blockchain infrastructure for the HSBC stablecoin are pending public disclosure.",
      "sources": []
    },
    "redemption": {
      "key": "redemption",
      "label": "Redemption Mechanics",
      "signal": "gray",
      "rationale": "Redemption mechanics for HSBC's HKD stablecoin are pending public disclosure ahead of the product's expected launch in H2 2026. The Stablecoins Ordinance requires redemption at par value within one business day; specific operational terms will be assessed when published.",
      "sources": []
    },
    "disclosure": {
      "key": "disclosure",
      "label": "Public Disclosure",
      "signal": "gray",
      "rationale": "Public disclosure obligations will commence upon launch. Details pending.",
      "sources": []
    }
  },
  "reserve_details": "Pending public disclosure ahead of the product's expected launch in H2 2026.",
  "governance_notes": "Subject to HSBC Group AML/CFT framework and HKMA Guideline on AML/CFT for Licensed Stablecoin Issuers.",
  "technology_notes": "Pending public disclosure.",
  "redemption_notes": "Pending public disclosure ahead of expected H2 2026 launch.",
  "disclosure_notes": "Pending public disclosure.",
  "citations": [
    { "label": "HKMA Register of Licensed Stablecoin Issuers", "url": "https://www.hkma.gov.hk/eng/regulatory-resources/registers/register-of-licensed-stablecoin-issuers/", "date": "2026-04-29" },
    { "label": "HSBC Official Website", "url": "https://www.hsbc.com.hk/", "date": "2026-04-29" }
  ],
  "last_reviewed": "2026-04-29",
  "reviewer_note": "HSBC received one of the first two HKMA stablecoin issuer licences in April 2026 under the Stablecoins Ordinance (Cap. 656). The bank's existing status as an HKMA authorised institution and Hong Kong note-issuing bank establishes a strong baseline for governance and counterparty assessment. However, detailed disclosures specific to its HKD-denominated stablecoin product — including reserve composition, custody arrangements, redemption procedures, and stablecoin-specific governance — are pending public release ahead of the product's expected launch in the second half of 2026. The full SARM assessment will be completed when these disclosures become publicly available.\n\nRevision Notes: 2026-04-29 Initial entry created following HSBC's award of an HKMA stablecoin issuer licence. Source: HKMA Register of Licensed Stablecoin Issuers; HSBC press release."
};
data.push(hsbcEntry);

// Change 3 & 4: Update existing under_review entries
data.forEach(issuer => {
  if (['jd-coinlink', 'round-dollar', 'circle-hkd', 'first-digital-hkd'].includes(issuer.slug)) {
    issuer.status = "under_review";
    issuer.last_reviewed = "2026-04-29";
    
    let revisionNote = "\n\nRevision Notes: 2026-04-29 Status confirmed as remaining under review following announcement of first two licensees (HSBC and Anchorpoint Financial).";
    
    if (issuer.slug === 'round-dollar') {
      issuer.ticker = "HKDR";
      issuer.peg = "HKD";
      revisionNote += " Corrected: RD InnoTech's publicly disclosed sandbox product is HKDR, a HKD-pegged stablecoin. Earlier references to CNH/CNY-peg, if any, are removed as not supported by public disclosures.";
    }
    
    if (!issuer.reviewer_note.includes("As of April 2026")) {
      issuer.reviewer_note += " As of April 2026, this applicant was not among the first two licensees announced by the HKMA (HSBC and Anchorpoint Financial); the HKMA has indicated the first batch of licences will be deliberately limited and that further licensing decisions will follow on a rolling basis." + revisionNote;
    }
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Update successful');
