import { Link } from 'react-router-dom';
import type { SARMSignal } from '../../types/licenses';
import { SIGNAL_META } from '../../utils/sarm';

// ── Traffic light pill ────────────────────────────────────────────────────────
function TL({ signal }: { signal: SARMSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">{title}</h2>
      {children}
    </div>
  );
}

// ── Rubric Table ──────────────────────────────────────────────────────────────
interface RubricRow {
  dimension: string;
  green: string;
  yellow: string;
  red: string;
  gray: string;
}

const RUBRIC: RubricRow[] = [
  {
    dimension: 'Capital Adequacy',
    green:  'Published paid-up capital ≥ HKMA minimum; ring-fenced issuer entity clearly capitalised.',
    yellow: 'Capital disclosed but below published minimum, or parent guarantee without ring-fencing.',
    red:    'No evidence of adequate capital; issuer entity balance sheet not available.',
    gray:   'No public disclosure of capital position for the HK issuer entity.',
  },
  {
    dimension: 'Reserve Quality',
    green:  'Independent attestation (≥ monthly); 100% high-quality HKD assets; named custodian.',
    yellow: 'Attestation published but infrequent (≥ quarterly) or includes lower-quality assets.',
    red:    'No independent attestation; or reserve assets do not cover circulating supply.',
    gray:   'Reserve composition and custodian not publicly disclosed.',
  },
  {
    dimension: 'Governance',
    green:  'Independent board; named MLRO/CO; audit committee; publicly disclosed governance charter.',
    yellow: 'Key officers identified but board independence or audit committee not confirmed.',
    red:    'No governance disclosures; sole-director structure; potential conflicts of interest.',
    gray:   'Board composition and compliance structure not publicly documented.',
  },
  {
    dimension: 'Technology & Custody',
    green:  'Smart contracts audited by named, reputable firm; custody with regulated institution; results published.',
    yellow: 'Audit in progress or older audit; custody partially self-managed.',
    red:    'No published smart contract audit; self-custody without independent verification.',
    gray:   'Blockchain platform, contract code, and custody arrangements not publicly specified.',
  },
  {
    dimension: 'Redemption Mechanics',
    green:  '1:1 par redemption guaranteed in writing; T+1 or faster; retail access; no unreasonable minimums.',
    yellow: 'Par redemption committed but restricted to institutional counterparties or delayed (T+3+).',
    red:    'No published redemption guarantee; or suspension clauses with broad discretion.',
    gray:   'Redemption terms, eligible redeemers, and processing timelines not published.',
  },
  {
    dimension: 'Public Disclosure',
    green:  'Monthly reserve attestation + annual audit + incident disclosure policy — all public.',
    yellow: 'Quarterly or less frequent attestation; or partial disclosure (reserves but not governance).',
    red:    'No regular public disclosure; ad hoc announcements only.',
    gray:   'No transparency reports or regular disclosure schedule published.',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LicensesMethodology() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/licenses" className="hover:text-[#2B3437] transition-colors">Licence Tracker</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">SARM Methodology</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">SARM — Stablecoin Assessment &amp; Risk Matrix</h1>
        <p className="text-sm text-[#737C7F] mt-2 max-w-2xl">
          A qualitative traffic-light framework for assessing stablecoin issuers applying under the
          Hong Kong Stablecoins Ordinance (Cap. 649). Produced for academic research purposes only.
        </p>
      </div>

      {/* 1. Design principles */}
      <Section title="1. Design Principles">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            SARM is intentionally non-numerical. It does not produce a composite score, letter grade,
            or ranking. This design reflects the following principles:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-2">
            <li>
              <strong className="text-[#2B3437]">Regulatory neutrality.</strong> Assigning a numerical score
              to a licensed or licence-seeking entity creates a pseudo-rating that could influence
              market participants. SARM avoids this by using qualitative signals only.
            </li>
            <li>
              <strong className="text-[#2B3437]">Transparency of uncertainty.</strong> Gray explicitly
              signals "insufficient public information" rather than inferring a positive or negative
              outcome. All five current applicants are gray across all dimensions because the HKMA
              licensing process is still ongoing and issuer-specific disclosures are limited.
            </li>
            <li>
              <strong className="text-[#2B3437]">Source traceability.</strong> Every signal is accompanied
              by a rationale and, where available, a citation to a public source. Assessments cannot
              be better than the public record.
            </li>
            <li>
              <strong className="text-[#2B3437]">Separation of dimensions.</strong> Dimensions are reported
              individually. A strong reserve quality does not mask weak governance. Users can identify
              specific areas of concern without a blended metric obscuring them.
            </li>
          </ul>
        </div>
      </Section>

      {/* 2. Signal definitions */}
      <Section title="2. Signal Definitions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(s => {
            const m = SIGNAL_META[s];
            return (
              <div
                key={s}
                className="rounded-lg border p-4 space-y-1"
                style={{ borderColor: m.border, background: m.bg }}
              >
                <TL signal={s} />
                <p className="text-sm" style={{ color: m.color }}>
                  {{
                    green:  'Meets or exceeds the standard for this dimension based on publicly available information.',
                    yellow: 'Partially meets the standard; conditional, limited, or qualified compliance.',
                    red:    'Significant gap identified; materially non-compliant or missing on this dimension.',
                    gray:   'Insufficient public information to make an assessment. Not a positive or negative signal — it is a data availability signal.',
                  }[s]}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Six dimensions */}
      <Section title="3. The Six SARM Dimensions">
        <p className="text-sm text-[#737C7F]">
          SARM evaluates each issuer across six dimensions derived from the HKMA's regulatory
          requirements for stablecoin issuers and international best practice (FSB, BIS, MiCA).
        </p>

        <div className="space-y-3">
          {[
            {
              key: 'capital_adequacy',
              title: 'Capital Adequacy',
              desc: 'Whether the issuer entity is adequately capitalised relative to its outstanding stablecoin obligations. Assessed from public filings, regulatory disclosures, or HKMA announcements.',
              ref: 'HKMA Stablecoins Consultation Conclusions §4.2; BCBS Basel III Tier 1 Capital principles.',
            },
            {
              key: 'reserve_quality',
              title: 'Reserve Quality',
              desc: 'Composition, liquidity, and credit quality of assets backing the stablecoin. Evaluated through independent attestation reports and custodian disclosures.',
              ref: 'FSB High-Level Recommendations for Global Stablecoin Arrangements (2023), Rec. 7; HKMA Cap. 649 §18.',
            },
            {
              key: 'governance',
              title: 'Governance',
              desc: 'Board independence, AML/CFT compliance officer, audit committee, and publicly disclosed governance charter. Assesses structural safeguards against conflicts of interest.',
              ref: 'FATF Guidance on Virtual Assets (2023); HKMA Guidelines on Authorization of Virtual Asset Trading Platforms.',
            },
            {
              key: 'technology',
              title: 'Technology & Custody',
              desc: 'Smart contract code quality and audit coverage. Custody arrangements for reserve assets — whether self-custodied, third-party, or at a regulated financial institution.',
              ref: 'IOSCO Policy Recommendations for Crypto and Digital Asset Markets (2023), Rec. 16.',
            },
            {
              key: 'redemption',
              title: 'Redemption Mechanics',
              desc: 'The issuer\'s commitment to 1:1 par-value redemption, eligible counterparties, processing timeline, and any suspension rights. Retail vs. institutional-only access is noted.',
              ref: 'BIS Working Paper No. 1014 (2022) §3; HKMA Cap. 649 §22.',
            },
            {
              key: 'disclosure',
              title: 'Public Disclosure',
              desc: 'Frequency and quality of public reserve attestations, annual audits, and incident disclosures. Evaluated against a "monthly attestation + annual audit" benchmark.',
              ref: 'G7 Finance Ministers & Central Bank Governors Stablecoin Principles (2019); MiCA Art. 23 (2024).',
            },
          ].map((d, i) => (
            <div key={d.key} className="bg-white rounded-lg border border-[#DBE4E7] p-4 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-[#737C7F] w-5 shrink-0">{i + 1}.</span>
                <h3 className="font-bold text-[#2B3437]">{d.title}</h3>
              </div>
              <p className="text-sm text-[#737C7F] ml-7 leading-relaxed">{d.desc}</p>
              <p className="text-xs text-[#737C7F]/70 ml-7 italic">Ref: {d.ref}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. Rubric table */}
      <Section title="4. Assessment Rubric">
        <p className="text-sm text-[#737C7F]">
          The rubric below defines the criteria for each signal per dimension. Assessors apply the
          highest signal for which all listed criteria are met based on public sources.
        </p>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-[#DBE4E7]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                <th className="text-left px-4 py-3 font-bold text-[#737C7F] uppercase tracking-wider w-36">Dimension</th>
                {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(s => (
                  <th key={s} className="text-left px-4 py-3">
                    <TL signal={s} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F6]">
              {RUBRIC.map(row => (
                <tr key={row.dimension} className="align-top">
                  <td className="px-4 py-3 font-bold text-[#2B3437]">{row.dimension}</td>
                  <td className="px-4 py-3 text-[#2B3437]">{row.green}</td>
                  <td className="px-4 py-3 text-[#737C7F]">{row.yellow}</td>
                  <td className="px-4 py-3 text-[#9e3f4e]">{row.red}</td>
                  <td className="px-4 py-3 text-[#737C7F] italic">{row.gray}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {RUBRIC.map(row => (
            <div key={row.dimension} className="bg-white rounded-lg border border-[#DBE4E7] p-4 space-y-3">
              <h3 className="font-bold text-[#2B3437] text-sm">{row.dimension}</h3>
              {([['green', row.green], ['yellow', row.yellow], ['red', row.red], ['gray', row.gray]] as [SARMSignal, string][]).map(([sig, text]) => (
                <div key={sig} className="space-y-1">
                  <TL signal={sig} />
                  <p className="text-xs text-[#737C7F] ml-1">{text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Aggregation */}
      <Section title="5. Aggregation — What Is Not Computed">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            SARM deliberately does not aggregate the six dimensions into a composite score or
            letter grade. The reasons are methodological:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-2">
            <li>
              Weighting six incommensurable dimensions (e.g. capital vs. technology) into a single
              number requires arbitrary choices that introduce false precision.
            </li>
            <li>
              A composite score obscures the specific dimension driving a negative outcome — a
              high score could mask a red in reserve quality.
            </li>
            <li>
              SFC Type 10 compliance considerations for licensed platforms in Hong Kong counsel
              against generating public ratings that could constitute investment advice.
            </li>
          </ul>
          <p>
            The platform displays a "dominant signal" on overview cards purely as a navigation
            convenience (the most frequent non-gray signal, or gray if all dimensions are gray).
            It carries no analytical weight.
          </p>
        </div>
      </Section>

      {/* 6. Coverage & Scope */}
      <Section title="6. Coverage &amp; Scope">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            This tracker covers stablecoin issuers that have publicly applied for, or been
            included in, the HKMA Stablecoin Issuer Sandbox or the formal licensing regime under
            the Stablecoins Ordinance (Cap. 649, effective 2025).
          </p>
          <p>
            Issuers are included based on official HKMA press releases and announcements only.
            Rumoured or unconfirmed applicants are not included until the HKMA publicly confirms
            their participation.
          </p>
          <p>
            Profiles are updated when new public information becomes available (HKMA decisions,
            issuer press releases, published attestations). Each profile records the "last reviewed"
            date and a reviewer note describing the basis for the current signals.
          </p>
        </div>
      </Section>

      {/* 7. Limitations */}
      <Section title="7. Limitations &amp; Disclaimer">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm text-amber-800">
          <p className="font-bold">Important limitations:</p>
          <ul className="list-disc list-outside ml-5 space-y-1 text-xs leading-relaxed">
            <li>Assessments are based solely on publicly available information. Non-public regulatory submissions, confidential sandbox reports, and internal governance documents are not accessible.</li>
            <li>Gray is the default signal when public information is absent. Gray does not imply that the issuer fails the standard — only that this cannot be verified from public sources.</li>
            <li>SARM is not a credit rating, risk score, or regulatory opinion. It does not constitute investment advice, legal advice, or compliance certification.</li>
            <li>The framework may be updated as the HKMA's regulatory requirements evolve. Historical assessments are archived but not retroactively revised.</li>
            <li>RWA-Index is not affiliated with the HKMA, the SFC, or any issuer covered in this tracker.</li>
          </ul>
        </div>
      </Section>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link
          to="/licenses"
          className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Licence Tracker
        </Link>
        <span className="text-xs text-[#737C7F]">v1.0 · April 2026</span>
      </div>
    </div>
  );
}
