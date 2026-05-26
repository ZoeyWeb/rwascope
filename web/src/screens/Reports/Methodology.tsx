import { Link } from 'react-router-dom';

export default function ReportsMethodology() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/reports" className="hover:text-[#2B3437] transition-colors">Reports</Link>
        <span>›</span>
        <span className="text-[#2B3437]">Methodology</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">Report Methodology</h1>
      <p className="text-[#737C7F] text-sm mb-8">
        How RWA-Index Quarterly Reports are produced, what data sources are used, and how to interpret each section.
      </p>

      <div className="space-y-10 text-sm text-[#2B3437] leading-relaxed">

        {/* 1 */}
        <Section title="1. Publication Cadence">
          <p>
            RWA-Index Quarterly Reports are published approximately four weeks after each calendar quarter ends
            (Q1: April, Q2: July, Q3: October, Q4: January). A <em>Preview</em> edition is released first, containing
            live auto-aggregated data but placeholder text in manual narrative sections. The <em>Published</em> edition
            follows after editorial review, typically within two weeks of the preview.
          </p>
          <p className="mt-2">
            Reports are revised when factual errors are identified. Each revision is noted in the report changelog with
            a date and description. The <em>Revised</em> badge is applied to any report with at least one post-publication
            correction.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Data Sources">
          <p>All data used in auto-aggregated sections is drawn from the RWA-Index platform modules:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>
              <strong className="text-[#2B3437]">Market Overview</strong> — DeFiLlama protocol TVL data, refreshed daily
              by a server-side cron process. See the{' '}
              <Link to="/market" className="text-[#5E5C75] hover:underline">Market Dashboard</Link>.
            </li>
            <li>
              <strong className="text-[#2B3437]">Stablecoin Licensing (Section 3)</strong> — HKMA stablecoin applicant
              profiles in the RWA-Index{' '}
              <Link to="/licenses" className="text-[#5E5C75] hover:underline">Licenses module</Link>.
              SARM signal assessments are based solely on publicly available issuer disclosures, HKMA press releases,
              and filings.
            </li>
            <li>
              <strong className="text-[#2B3437]">Tokenized Asset Observatory (Section 4)</strong> — asset profiles in the{' '}
              <Link to="/assets" className="text-[#5E5C75] hover:underline">Assets module</Link>.
              RARM signal assessments are provisional and based on publicly available offering documents, press releases,
              and third-party attestation reports where available.
            </li>
            <li>
              <strong className="text-[#2B3437]">Incident Review (Section 5)</strong> — the RWA-Index{' '}
              <Link to="/incidents" className="text-[#5E5C75] hover:underline">Incident Database</Link>.
              All incidents are sourced from public news, regulatory announcements, and court filings.
            </li>
          </ul>
          <p className="mt-3 text-slate-500 text-xs">
            Auto-aggregated sections are computed at read time from the same JSON data files served to the live modules.
            No report-specific snapshot is stored; the figures will update as the underlying module data is refreshed.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. Section Structure">
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-2 border-collapse">
              <thead>
                <tr className="border-b border-[#DBE4E7]">
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">Section</th>
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">Type</th>
                  <th className="text-left py-2 text-[#737C7F] font-medium">Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE4E7]">
                {[
                  ['Executive Summary', 'Manual', 'Analyst-authored overview of key findings for the quarter.'],
                  ['Market Overview', 'Auto (market)', 'DeFiLlama TVL data for RWA protocols + analyst commentary.'],
                  ['Stablecoin Licensing Pipeline', 'Auto (licenses)', 'SARM signal distribution charts + applicant counts.'],
                  ['Tokenized Asset Observatory', 'Auto (assets)', 'RARM layer distribution charts + TVL by category.'],
                  ['Incident Review', 'Auto (incidents)', 'Incident counts, severity distribution, estimated losses.'],
                  ['Policy Watch', 'Mixed', 'Analyst-authored regulatory analysis + primary source citations.'],
                  ['Outlook', 'Manual', 'Forward-looking observations. No predictions or price targets.'],
                ].map(([sec, type, desc]) => (
                  <tr key={sec} className="text-[#586064]">
                    <td className="py-2 pr-4 text-[#2B3437] font-medium">{sec}</td>
                    <td className="py-2 pr-4">
                      <span className="px-1.5 py-0.5 rounded bg-[#EAEFF1] text-[#586064]">{type}</span>
                    </td>
                    <td className="py-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 4 */}
        <Section title="4. Editorial Standards">
          <p>
            Manual and mixed sections are written by RWA-Index Research analysts. The following standards apply:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>All factual claims must be attributable to a public primary or secondary source cited in the References section.</li>
            <li>Regulatory descriptions reflect the text of the relevant ordinance, guidance, or press release at the time of writing.</li>
            <li>Forward-looking statements (Outlook section) describe observable trends only; the report does not make price targets, return forecasts, or regulatory outcome predictions.</li>
            <li>No platform-generated composite score, letter grade, or ranking is included in any section of any report. See the <Link to="/methodology?tab=framework" className="text-[#5E5C75] hover:underline">Six-Layer Framework</Link> for the reasoning behind this constraint.</li>
            <li>Disputed facts are recorded with attribution to both sides of the dispute; the report does not adjudicate.</li>
          </ul>
        </Section>

        {/* 5 */}
        <Section title="5. Revision Policy">
          <p>
            Reports may be revised after publication in the following circumstances:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>A factual error is identified (e.g., wrong figure, misattributed quote, incorrect regulatory reference).</li>
            <li>An issuer or regulator issues a formal correction to a public document cited in the report.</li>
            <li>A court, regulator, or primary party publicly disputes a characterisation in the narrative sections.</li>
          </ul>
          <p className="mt-2">
            Revisions are never used to alter assessments based on subsequent market events or to remove observations
            that proved incorrect in hindsight. Each revision is logged in the report changelog.
          </p>
        </Section>

        {/* 6 */}
        <Section title="6. Corrections">
          <p>
            To report a factual error, contact{' '}
            <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] hover:underline">
              research@rwa-index.com
            </a>{' '}
            with the subject line "Report Correction — [slug]" and a description of the error with a supporting
            primary source. We aim to acknowledge corrections within 5 business days and to publish corrections
            within 10 business days of verification.
          </p>
        </Section>

        {/* Disclaimer */}
        <div className="pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
          Reports are published for academic and research purposes only. They do not constitute investment advice,
          financial product disclosure, credit rating, or regulatory opinion. RWA-Index Research is not a licensed
          credit rating agency under any jurisdiction. SARM and RARM signal assessments are the subjective opinion
          of the author based on publicly available information and are not suitable as a basis for investment or
          regulatory compliance decisions.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-[#2B3437] mb-3">{title}</h2>
      {children}
    </section>
  );
}
