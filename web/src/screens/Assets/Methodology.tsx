import { Link } from 'react-router-dom';
import { RARM_LAYER_KEYS, RARM_LAYER_META, RARM_SIGNAL_META } from '../../utils/rarm';
import type { RARMSignal } from '../../types/assets';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">{title}</h2>
      {children}
    </div>
  );
}

function SignalChip({ signal }: { signal: RARMSignal }) {
  const m = RARM_SIGNAL_META[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

// ── Per-layer rubric: green / yellow / red / gray thresholds ─────────────────

const RUBRIC: Record<keyof typeof RARM_LAYER_META, Record<RARMSignal, string>> = {
  legal_jurisdictional: {
    green:  'Asset issued under a clear, recognised legal framework in a major regulated jurisdiction. Investor rights, token-holder claims, and asset ownership are legally enforceable and clearly documented. No material pending regulatory proceedings or litigation.',
    yellow: 'Some jurisdictional ambiguity; regulatory classification subject to interpretive uncertainty. Minor pending regulatory matters or unanswered legal questions about investor rights. Legal framework established but with known gaps.',
    red:    'Material regulatory risk, active enforcement action, or legal dispute directly threatening asset legality or investor rights. Issuer operating without required licences in a relevant jurisdiction. Adverse judicial finding regarding asset legal status.',
    gray:   'Insufficient public information to independently assess the regulatory framework, investor rights, or jurisdictional treatment. Assessment requires review of non-public documents (subscription agreements, fund articles, operating agreements).',
  },
  valuation_oracles: {
    green:  'Published daily or intraday NAV methodology from independent third parties. On-chain oracle (where applicable) sourced from multiple independent providers with documented manipulation-resistance. No sustained divergence from independently verified fair value.',
    yellow: 'Published valuation methodology with some opacity. Single pricing source or limited oracle provider diversity. Occasional short-lived divergences from NAV. Third-party attestation available but with frequency gaps.',
    red:    'Opaque or unverifiable valuation methodology. Material sustained divergence between on-chain price and independently verifiable fair value. Oracle manipulation, failure, or single-point-of-failure oracle dependency.',
    gray:   'Insufficient public information about the valuation methodology, NAV calculation process, or oracle architecture to independently assess pricing integrity.',
  },
  custody_asset_control: {
    green:  'Assets held in bankruptcy-remote, segregated custody with a regulated, third-party custodian. Regular independent audits of holdings. Clear, unambiguous chain of legal title from token to underlying asset. No material custody incidents.',
    yellow: 'Custody arrangements partially disclosed. Custodian not fully independent or not regulated in a major jurisdiction. Some concentration risk or limited audit history. Bankruptcy-remoteness analysis incomplete.',
    red:    'Material custody failure, theft, loss of assets, or unresolved custody dispute. Absence of bankruptcy-remote structure. Custodian insolvency, restriction of access to assets, or enforcement action against custodian.',
    gray:   'Insufficient public information about the identity of the custodian, custody agreement terms, asset segregation arrangements, or bankruptcy-remoteness of the custody structure.',
  },
  kyc_aml_permissioning: {
    green:  'Robust KYC/AML programme implemented by a licensed entity. Clear investor eligibility criteria consistently enforced. On-chain permissioning restricts transfers to verified addresses. Compliance with applicable AML regulations documented and regularly assessed.',
    yellow: 'KYC/AML programme partially implemented or documented. Investor eligibility criteria partially enforced. Some gaps in on-chain permissioning. Programme undergoing regulatory review or recently updated without full assessment.',
    red:    'Material AML failure, sanctions violation, or enforcement action related to investor screening. On-chain token transfers not permissioned where required by applicable regulation. Known bad actors identified as having held or transferred the token.',
    gray:   'Insufficient public information about the KYC/AML programme, investor onboarding procedures, or on-chain permissioning architecture to independently assess compliance quality.',
  },
  secondary_market_liquidity: {
    green:  'Active, liquid secondary market with narrow bid-ask spreads. Multiple independent trading venues. Redemption available at frequent, defined intervals without material size restrictions. No material restrictions on transfer.',
    yellow: 'Limited secondary market liquidity or concentration in a single venue. Wider spreads or infrequent redemption windows. Minimum redemption sizes that limit small investor exit. Some transfer restrictions affecting liquidity.',
    red:    'Illiquid or suspended secondary market. Redemptions halted, significantly delayed, or suspended. Transfer restrictions that materially impair investor exit at fair value. Gate or fee provisions triggered.',
    gray:   'Insufficient public information about secondary market conditions, redemption terms, minimum sizes, advance notice requirements, or transfer restrictions to independently assess liquidity profile.',
  },
  settlement_finality: {
    green:  'On-chain settlement achieves legal and operational finality within standard network confirmation windows. Delivery-versus-payment (DVP) confirmed. No reversibility risk. Clear, tested dispute resolution mechanism. Legal title transfer effective at on-chain settlement.',
    yellow: 'Settlement finality partially achieved. Some reversibility risk (e.g., reliance on bridging protocols or off-chain settlement components). Dispute resolution mechanism not fully specified or tested. Legal title transfer timing unclear relative to on-chain settlement.',
    red:    'Settlement failure, persistent settlement disputes, or material reversibility risk. On-chain records diverge from legal title records. Bridge or custodial failures have impaired settlement finality.',
    gray:   'Insufficient public information about settlement mechanics, the legal effectiveness of on-chain transfers, DVP architecture, or the dispute resolution process to independently assess settlement finality.',
  },
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AssetsMethodology() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/assets" className="hover:text-[#2B3437] transition-colors">Asset Observatory</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">Methodology</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">Asset Observatory — RARM Methodology</h1>
        <p className="text-sm text-[#737C7F] mt-2 max-w-2xl">
          How tokenized assets are selected, profiled, and assessed in the RWA-Index Tokenized Asset Risk Observatory.
        </p>
      </div>

      {/* 1. Purpose */}
      <Section title="1. Purpose">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            The Tokenized Asset Risk Observatory applies the Relative Asset Risk Matrix (RARM) to
            publicly available information about major tokenized real-world asset products. Its purpose
            is academic: to provide a structured, publicly available reference for understanding the
            risk dimensions of tokenized assets across six standardised analytical layers.
          </p>
          <p>
            Assessments are not investment advice, credit ratings, or legal opinions. All signals
            reflect publicly available information at the time of review. Signal assignments are
            conservative: where information is insufficient, gray is assigned rather than defaulting
            to a positive or negative signal.
          </p>
          <p>
            The observatory complements the RWA-Index Licenses module (HKMA stablecoin licences, Module 1)
            and Incident Database (Module 6) by providing a forward-looking risk framework for tokenized
            assets, as distinct from the backward-looking incident record.
          </p>
        </div>
      </Section>

      {/* 2. RARM layers */}
      <Section title="2. The Six RARM Layers">
        <div className="divide-y divide-[#F1F4F6] rounded-xl border border-[#DBE4E7] overflow-hidden">
          {RARM_LAYER_KEYS.map((k, i) => {
            const m = RARM_LAYER_META[k];
            return (
              <div key={k} className="px-4 py-3 flex items-baseline gap-3">
                <span className="text-xs font-black text-[#5E5C75] w-6 shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-[#2B3437]">{m.label}</p>
                  <p className="text-xs text-[#737C7F] mt-0.5">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Signal rubric 6×4 */}
      <Section title="3. Signal Definitions — 6 × 4 Rubric">
        <p className="text-sm text-[#737C7F]">
          Each layer is assigned one of four signals based on the criteria below.
          Signals are assigned independently per layer; the conservative aggregate is computed separately.
        </p>
        <div className="space-y-6">
          {RARM_LAYER_KEYS.map((k, i) => {
            const m = RARM_LAYER_META[k];
            const rubric = RUBRIC[k];
            return (
              <div key={k} className="rounded-xl border border-[#DBE4E7] overflow-hidden">
                <div className="bg-[#F8FAFB] px-4 py-3 border-b border-[#DBE4E7]">
                  <span className="text-xs font-black text-[#5E5C75] mr-2">{i + 1}</span>
                  <span className="text-sm font-bold text-[#2B3437]">{m.label}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-[#F1F4F6]">
                    {(['green', 'yellow', 'red', 'gray'] as RARMSignal[]).map(sig => (
                      <tr key={sig}>
                        <td className="px-4 py-3 w-36 align-top">
                          <SignalChip signal={sig} />
                        </td>
                        <td className="px-4 py-3 text-[#737C7F] leading-relaxed align-top">
                          {rubric[sig]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 4. Aggregation */}
      <Section title="4. Conservative Aggregate Signal">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            The six layer signals are combined into a single conservative aggregate signal using
            the following priority order:
          </p>
          <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-12">Priority</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-36">Condition</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F6]">
                {[
                  ['1st', 'Any layer is gray', 'gray — assessment incomplete; conservative default'],
                  ['2nd', 'Any layer is red', 'red — elevated risk in at least one dimension'],
                  ['3rd', '4 or more layers are green (no red)', 'green — majority of dimensions assessed positively'],
                  ['4th', 'All other cases (no gray, no red, fewer than 4 green)', 'yellow — moderate or mixed risk profile'],
                ].map(([p, c, r]) => (
                  <tr key={p}>
                    <td className="px-4 py-3 font-black text-[#5E5C75] text-xs">{p}</td>
                    <td className="px-4 py-3 text-xs text-[#2B3437] font-semibold">{c}</td>
                    <td className="px-4 py-3 text-xs text-[#737C7F]">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Gray takes absolute precedence in the aggregate because an incomplete assessment cannot
            support a positive or negative conclusion. An aggregate green or yellow signal requires
            that all six layers have been individually assessed.
          </p>
        </div>
      </Section>

      {/* 5. Inclusion criteria */}
      <Section title="5. Asset Inclusion Criteria">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>An asset is included in the observatory if it meets all of the following:</p>
          <ul className="list-disc list-outside ml-5 space-y-1.5 leading-relaxed">
            <li>Represents a tokenized real-world asset (not a native cryptocurrency or algorithmic synthetic)</li>
            <li>Has a publicly verifiable token supply and a named issuer or operator</li>
            <li>Has cumulative TVL exceeding USD 50 million, OR is issued by a major regulated financial institution, OR has material significance to the Hong Kong RWA regulatory framework</li>
            <li>Sufficient public documentation exists to populate at least the factual fields (category, underlying asset, chains, domicile)</li>
          </ul>
          <p>
            RARM signal assignments require more information than inclusion. An asset may be listed
            with all-gray RARM signals where the factual record is established but layer-specific
            documentation is not publicly available.
          </p>
        </div>
      </Section>

      {/* 6. Review process */}
      <Section title="6. Review and Update Process">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            Profile information is updated when material changes occur to the asset's structure,
            issuer, regulatory status, or publicly available documentation. RARM signals are reviewed
            whenever new public information becomes available that bears on a layer assessment.
          </p>
          <p>
            Signal changes are not made based on secondary-market price movements alone. A de-peg
            or price decline is recorded in the Incident Database (Module 6) but does not itself
            trigger a RARM signal reassignment unless it reflects an underlying change in a RARM
            dimension (e.g., a sustained redemption failure would affect the liquidity and legal layers).
          </p>
          <p>
            Gray signals will be updated to colored signals as public documentation improves —
            for example, following the public release of fund offering documents, independent audit
            reports, or regulatory filings that contain sufficient information for layer assessment.
          </p>
        </div>
      </Section>

      {/* 7. Scope limitations */}
      <Section title="7. Scope Limitations">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-amber-900">This observatory does NOT:</p>
          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-outside ml-4 leading-relaxed">
            <li>Produce numerical scores, letter grades, weighted composites, or rankings by quality</li>
            <li>Constitute a credit rating, investment recommendation, or legal opinion</li>
            <li>Assess the suitability of any asset for any specific investor or use case</li>
            <li>Replace independent legal, technical, or financial due diligence</li>
            <li>Access non-public documentation, subscription agreements, or proprietary fund data</li>
            <li>Cover pure DeFi protocols, algorithmic synthetic assets, or native blockchain tokens (BTC, ETH, etc.)</li>
            <li>Provide real-time data; TVL figures are approximate and may be out of date</li>
          </ul>
        </div>
      </Section>

      {/* 8. Submissions */}
      <Section title="8. Submissions & Corrections">
        <p className="text-sm text-[#737C7F] leading-relaxed">
          To propose a new asset for inclusion, or to flag a factual error or signal assessment that
          should be reviewed, please email{' '}
          <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] underline hover:text-[#2B3437]">
            research@rwa-index.com
          </a>{' '}
          with the subject line "Asset Observatory: [submission/correction]". Please include the
          asset name, ticker, and a link to the public source supporting the change.
        </p>
      </Section>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link to="/assets" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Asset Observatory
        </Link>
        <span className="text-xs text-[#737C7F]">v1.0 · April 2026</span>
      </div>

    </div>
  );
}
