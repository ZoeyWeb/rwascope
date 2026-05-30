export const RWASCOPE_CONTACT = {
  press_email: 'press@rwa-index.com',
  general_email: 'hello@rwa-index.com',
  hkust_email: 'ywenap@connect.ust.hk',
  affiliation: {
    institution: 'The Hong Kong University of Science and Technology',
    lab: 'Crypto-Fintech Lab',
    department: 'Academy of Interdisciplinary Studies',
    city: 'Hong Kong SAR',
  },
  social: {
    // add social handles here when available
  },
} as const;

export const RWASCOPE_BOILERPLATE = {
  short: `RWAscope is an independent research platform analyzing structural risks in tokenized real-world assets, built at HKUST Crypto-Fintech Lab.`,
  medium: `RWAscope is an independent research platform built at the HKUST Crypto-Fintech Lab. The platform indexes 50+ tokenized real-world asset projects across 7 jurisdictions, maintains a structured registry of historical RWA incidents, and applies academic frameworks (SARM for stablecoins, RARM for tokenized assets) developed at HKUST to decompose project-level risk. RWAscope does not rate, recommend, or endorse — it decomposes.`,
  long: `RWAscope is an independent research platform built at the Hong Kong University of Science and Technology (HKUST) Crypto-Fintech Lab. Founded in 2026, the platform addresses a structural gap in tokenized real-world asset markets: risk that is visible in retrospect but rarely visible in advance. RWAscope indexes 50+ active RWA projects across 7 jurisdictions (Hong Kong, Singapore, UAE, Switzerland, US, Japan, EU), maintains a registry of historical incidents with permanent identifiers for academic citation, and applies two HKUST-developed academic frameworks — the Stablecoin Architecture & Resilience Matrix (SARM) and the Real-World Asset Architecture & Resilience Matrix (RARM) — to decompose project structure across six risk dimensions. The platform's editorial position: "We don't rate. We don't recommend. We decompose."`,
} as const;
