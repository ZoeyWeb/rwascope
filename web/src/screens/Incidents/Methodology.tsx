import { Link } from 'react-router-dom';
import type { IncidentSeverity } from '../../types/incidents';
import { SEVERITY_META, SEVERITY_THRESHOLDS, INCIDENT_TYPE_LABELS, INCIDENT_STATUS_META } from '../../utils/incidents';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">{title}</h2>
      {children}
    </div>
  );
}

function SeverityChip({ severity }: { severity: IncidentSeverity }) {
  const m = SEVERITY_META[severity];
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

export default function IncidentsMethodology() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/incidents" className="hover:text-[#2B3437] transition-colors">Incident Database</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">Methodology</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">Incident Database — Methodology & Inclusion Criteria</h1>
        <p className="text-sm text-[#737C7F] mt-2 max-w-2xl">
          How incidents are selected, classified, and described in the RWA-Index Tokenization Incident Database.
        </p>
      </div>

      {/* 1. Purpose */}
      <Section title="1. Purpose">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            The Tokenization Incident Database is a structured factual record of incidents affecting stablecoins,
            tokenized real-world assets, and tokenization infrastructure. Its purpose is academic: to provide
            researchers, practitioners, and policymakers with a systematically organised reference for understanding
            historical failure modes in tokenized asset markets.
          </p>
          <p>
            The database does not investigate, accuse, or make legal determinations. All entries are based on
            publicly available information including regulatory filings, court records, official statements,
            and reporting from established media outlets. Where facts are disputed, the database records the
            dispute and does not resolve it.
          </p>
          <p>
            The unique analytical contribution of this database is the mapping of each incident to the SARM
            (stablecoin) and RARM (tokenized RWA) analytical frameworks developed by RWA-Index. This mapping
            identifies which risk dimensions were implicated in each event, enabling cross-incident pattern analysis.
          </p>
        </div>
      </Section>

      {/* 2. Inclusion criteria */}
      <Section title="2. Inclusion Criteria">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FCE4EC] border border-[#F48FB1] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black text-[#9e3f4e] bg-white border border-[#F48FB1]">HK</span>
              <span className="font-bold text-[#9e3f4e] text-sm">HK-Related Incidents</span>
            </div>
            <p className="text-xs text-[#9e3f4e] leading-relaxed">
              Included if the incident involves <em>any</em> of:
            </p>
            <ul className="text-xs text-[#9e3f4e] space-y-1 list-disc list-outside ml-4 leading-relaxed">
              <li>An issuer or operator licensed, incorporated, or operating from Hong Kong</li>
              <li>A distributor or service provider targeting Hong Kong residents</li>
              <li>Regulatory action by the SFC, HKMA, or HK Police</li>
              <li>Reported losses by Hong Kong residents or institutions</li>
              <li>A Hong Kong regulatory precedent or policy change resulting from the incident</li>
            </ul>
            <p className="text-xs text-[#9e3f4e]">No severity threshold — all severities included with HK nexus.</p>
          </div>

          <div className="bg-[#ECEFF1] border border-[#CFD8DC] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black text-[#5E5C75] bg-white border border-[#CFD8DC]">GLOBAL</span>
              <span className="font-bold text-[#5E5C75] text-sm">Global Reference Incidents</span>
            </div>
            <p className="text-xs text-[#737C7F] leading-relaxed">
              Included only if the incident meets <em>at least one</em> of:
            </p>
            <ul className="text-xs text-[#737C7F] space-y-1 list-disc list-outside ml-4 leading-relaxed">
              <li>Estimated financial loss ≥ USD 100 million</li>
              <li>Triggered multi-jurisdictional regulatory response</li>
              <li>Demonstrably shifted industry practice or regulatory approach in two or more jurisdictions</li>
            </ul>
            <p className="text-xs text-[#737C7F]">Global incidents without HK nexus are included for comparative context only.</p>
          </div>
        </div>
      </Section>

      {/* 3. Severity rubric */}
      <Section title="3. Severity Rubric">
        <p className="text-sm text-[#737C7F]">
          Severity is assigned based on the highest applicable threshold. Where impact is estimated from a range,
          the upper bound is used unless a single verified figure is available from regulatory or court records.
        </p>
        <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-32">Level</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F6]">
              {SEVERITY_THRESHOLDS.map(row => (
                <tr key={row.level}>
                  <td className="px-4 py-3"><SeverityChip severity={row.level} /></td>
                  <td className="px-4 py-3 text-sm text-[#737C7F]">{row.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4. Incident types */}
      <Section title="4. Incident Type Definitions">
        <div className="divide-y divide-[#F1F4F6] rounded-xl border border-[#DBE4E7] overflow-hidden">
          {([
            ['de-pegging',             'A stablecoin or pegged asset trades materially and persistently below its target peg on secondary markets. Includes both algorithmic and fiat-backed stablecoins.'],
            ['smart-contract-exploit', 'Funds are lost or misappropriated through a vulnerability in a smart contract or on-chain protocol, including bridges, vaults, and liquidity pools.'],
            ['custody-incident',       'Assets held in custody by an exchange, custodian, or bridge are lost, misappropriated, or made inaccessible through operational, security, or governance failure.'],
            ['redemption-failure',     'A token or instrument issuer is unable or unwilling to honour redemption requests at par value within the committed timeframe.'],
            ['regulatory-action',      'A regulatory body takes enforcement, licensing, or supervisory action against an issuer, platform, or individual that materially disrupts operations or imposes financial penalties.'],
            ['governance-failure',     'An incident arising from failures in internal governance, including board dysfunction, management misconduct, inadequate internal controls, or fraud by principals.'],
            ['bank-failure-spillover', 'An incident in a traditional banking institution that causes secondary stress to a tokenized asset or stablecoin, for example through custody concentration or reserve impairment.'],
            ['sanctions',              'A regulatory or governmental sanctions designation that disrupts the operation or use of a tokenized asset, stablecoin, or associated infrastructure.'],
            ['other',                  'Incidents not clearly classifiable under the above types. The specific nature is described in the incident entry.'],
          ] as [import('../../types/incidents').IncidentType, string][]).map(([type, def]) => (
            <div key={type} className="px-4 py-3 flex items-baseline gap-3">
              <span className="text-xs font-bold text-[#5E5C75] w-44 shrink-0">{INCIDENT_TYPE_LABELS[type]}</span>
              <p className="text-sm text-[#737C7F]">{def}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Status definitions */}
      <Section title="5. Status Definitions">
        <div className="divide-y divide-[#F1F4F6] rounded-xl border border-[#DBE4E7] overflow-hidden">
          {Object.entries(INCIDENT_STATUS_META).map(([key, meta]) => (
            <div key={key} className="px-4 py-3 flex items-center gap-4">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap w-36 justify-center"
                style={{ color: meta.color, background: meta.bg }}
              >
                {meta.label}
              </span>
              <p className="text-sm text-[#737C7F]">
                {{
                  resolved:              'The incident has concluded and all regulatory or legal proceedings are finalised.',
                  ongoing:               'The incident is actively developing; operations or recovery efforts are still in progress.',
                  'under-investigation': 'The incident is under active investigation by a regulator or law enforcement body. No charges or findings yet.',
                  litigation:            'Civil or criminal proceedings are actively underway; no final judgment or settlement has been reached.',
                  settled:               'Proceedings have concluded through a settlement, consent judgment, or plea agreement. The case is closed.',
                }[key]}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Source hierarchy */}
      <Section title="6. Source Hierarchy">
        <p className="text-sm text-[#737C7F]">
          Sources are ranked in the following priority order. Lower-tier sources are used only when higher-tier
          sources are unavailable for a specific claim. All claims requiring a source include a direct citation.
        </p>
        <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-8">Tier</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-44">Type</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Examples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F6]">
              {[
                ['1', 'Regulatory Filing', 'SFC enforcement notices, OFAC designations, SEC complaints, court indictments'],
                ['2', 'Court Record',      'Bankruptcy filings, judgments, settlement orders, indictments'],
                ['3', 'Official Statement', 'Issuer press releases, company blog posts, protocol post-mortems'],
                ['4', 'Major Media',        'Reuters, Bloomberg, Financial Times, South China Morning Post'],
                ['5', 'Industry Media',     'CoinDesk, The Block, Decrypt — for facts not covered in higher-tier sources'],
              ].map(([tier, type, examples]) => (
                <tr key={tier}>
                  <td className="px-4 py-3 font-black text-[#5E5C75]">{tier}</td>
                  <td className="px-4 py-3 font-bold text-[#2B3437] text-xs">{type}</td>
                  <td className="px-4 py-3 text-xs text-[#737C7F]">{examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 7. Update policy */}
      <Section title="7. Update Policy">
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>
            Entries are updated when new public information becomes available, including regulatory findings,
            court judgments, revised loss estimates from official proceedings, or corrections to previously
            published figures.
          </p>
          <p>
            All material revisions are recorded in the entry's revision notes field with a date and description.
            Prior text is not deleted; the current entry reflects the most accurate publicly available information.
          </p>
          <p>
            Where loss estimates are revised by courts or regulators, the database uses the most recent
            verified figure and notes the revision. Earlier estimates are preserved in revision notes for traceability.
          </p>
        </div>
      </Section>

      {/* 8. What this database does NOT do */}
      <Section title="8. Scope Limitations">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-amber-900">This database does NOT:</p>
          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-outside ml-4 leading-relaxed">
            <li>Investigate incidents beyond publicly available information</li>
            <li>Allege wrongdoing beyond what is established in cited public sources</li>
            <li>Make predictions about ongoing proceedings ("will likely be found guilty")</li>
            <li>Consolidate multiple distinct events into a single entry — each major event has its own slug</li>
            <li>Include rumoured or unverified loss figures; uncertain figures are described as estimates with source notes</li>
            <li>Provide investment advice or commentary</li>
            <li>Include incidents below the global threshold unless they have an HK nexus</li>
          </ul>
        </div>
      </Section>

      {/* 9. Submit */}
      <Section title="9. Submissions & Corrections">
        <p className="text-sm text-[#737C7F] leading-relaxed">
          To submit a new incident for consideration, or to flag a factual error or update in an existing entry,
          please email{' '}
          <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] underline hover:text-[#2B3437]">
            research@rwa-index.com
          </a>{' '}
          with the subject line "Incident Database: [submission/correction]". Please include the incident name
          or slug, the specific claim in question, and a link to the public source supporting the correction.
        </p>
      </Section>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link to="/incidents" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Incident Database
        </Link>
        <span className="text-xs text-[#737C7F]">v1.0 · April 2026</span>
      </div>
    </div>
  );
}
