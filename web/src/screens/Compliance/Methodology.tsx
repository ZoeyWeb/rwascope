import { Link } from 'react-router-dom';

export default function ComplianceMethodology() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/compliance" className="hover:text-[#2B3437] transition-colors">
          Compliance Map
        </Link>
        <span>›</span>
        <span className="text-[#2B3437]">Methodology</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">
        Compliance Map Methodology
      </h1>
      <p className="text-[#737C7F] text-sm mb-8">
        How the Cross-Border RWA Compliance Map is researched, structured, and maintained.
      </p>

      <div className="space-y-10 text-sm text-[#2B3437] leading-relaxed">
        {/* 1 */}
        <Section title="1. Purpose">
          <p>
            The Cross-Border RWA Compliance Map provides a concise, jurisdiction-by-issue overview of
            the regulatory landscape for tokenized real-world assets (RWAs) and stablecoins. It is
            designed to give practitioners and researchers a navigable starting point for
            cross-jurisdictional analysis — not a substitute for legal advice.
          </p>
          <p className="mt-2">
            The matrix covers five jurisdictions: Hong Kong SAR (HK), Mainland China (CN),
            Singapore (SG), the United States (US), and the European Union (EU). It tracks five
            issue categories: RWA Issuance, Stablecoin Issuance, VASP / Exchange Licensing,
            Cross-Border Distribution, and Retail Access.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Signal Definitions">
          <p>Each cell in the matrix carries one of four signals:</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DBE4E7]">
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">Signal</th>
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">Meaning</th>
                  <th className="text-left py-2 text-[#737C7F] font-medium">Typical conditions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE4E7]">
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      Open
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    A clear regulatory pathway exists; requirements are defined and achievable.
                  </td>
                  <td className="py-2 text-[#586064]">
                    Licensing regime published; regulator has approved at least one entity.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                      Conditional
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    A pathway exists but is subject to material conditions, pending guidance, or
                    requires case-by-case regulatory engagement.
                  </td>
                  <td className="py-2 text-[#586064]">
                    Transitional provisions in effect; licensing regime enacted but no licences yet
                    issued; sandbox or no-action letter required.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      Restricted
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    The activity is prohibited or practically unavailable to most participants.
                  </td>
                  <td className="py-2 text-[#586064]">
                    Statutory ban; no licensing regime exists; regulator has issued blanket
                    prohibition notices.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#d1d5db]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                      Pending
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    This cell has not yet been researched.
                  </td>
                  <td className="py-2 text-[#586064]">
                    No information displayed; cell navigates to a placeholder page.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#737C7F]">
            Signals reflect the state of the primary regulatory framework at the date of last review.
            They do not account for fact-specific circumstances, contractual structures, or
            ongoing regulatory proceedings.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. Research Process">
          <p>Each cell is researched against the following source hierarchy:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1.5 text-[#586064]">
            <li>
              <strong className="text-[#2B3437]">Primary statutes</strong> — the text of the
              relevant ordinance, act, or regulation as published by the official legislative body.
            </li>
            <li>
              <strong className="text-[#2B3437]">Regulator guidance</strong> — supervisory policy
              manuals, consultation papers, circulars, and FAQs issued by the named regulator.
            </li>
            <li>
              <strong className="text-[#2B3437]">Regulator registers</strong> — public lists of
              licensed, registered, or sanctioned entities maintained by the regulator.
            </li>
            <li>
              <strong className="text-[#2B3437]">Official statements</strong> — speeches, press
              releases, and testimony by senior officials of the named regulator.
            </li>
            <li>
              <strong className="text-[#2B3437]">Court records</strong> — published judicial
              decisions interpreting the relevant statute.
            </li>
            <li>
              <strong className="text-[#2B3437]">Major media / industry media</strong> — used only
              to corroborate or provide context; never as a sole source for a signal determination.
            </li>
          </ol>
        </Section>

        {/* 4 */}
        <Section title="4. Update Policy">
          <p>
            Each cell records a <code className="bg-[#EAEFF1] px-1 rounded">last_reviewed</code> date.
            Cells are prioritised for re-review when:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>A relevant statute or regulation is amended or enacted.</li>
            <li>The named regulator publishes new guidance, a licensing decision, or a
              prohibition notice.</li>
            <li>A court publishes a decision that materially re-characterises the legal position.</li>
            <li>Six months have elapsed since the last review.</li>
          </ul>
          <p className="mt-2">
            The matrix version number (<code className="bg-[#EAEFF1] px-1 rounded">matrix_version</code>)
            is incremented with each substantive change to any cell. Minor corrections (e.g.,
            typographical fixes) do not increment the version.
          </p>
        </Section>

        {/* 5 */}
        <Section title="5. Limitations">
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-[#586064]">
            <li>
              The matrix covers jurisdiction-level frameworks. Sub-national, state-level, or
              sectoral variations (e.g., US state money-transmitter licensing) are noted in
              practitioner notes where material but are not captured as separate rows.
            </li>
            <li>
              Signals reflect the primary regulatory characterisation of the activity. A single
              real-world transaction may attract multiple regulatory overlays (e.g., securities law
              AND AML requirements) — each overlay is addressed in the relevant issue row, but
              the interaction between rows is the practitioner's responsibility to analyse.
            </li>
            <li>
              Cells in "Conditional" status cover a wide range of practical difficulty. A cell
              showing Conditional in one jurisdiction may be trivially achievable; in another it
              may require multi-year regulatory engagement. Read the cell narrative carefully.
            </li>
            <li>
              This matrix does not cover tax treatment, accounting standards, or private-law
              enforceability of smart contracts.
            </li>
          </ul>
        </Section>

        {/* 6 */}
        <Section title="6. Corrections">
          <p>
            To report an error or outdated signal, contact{' '}
            <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] hover:underline">
              research@rwa-index.com
            </a>{' '}
            with the subject line "Compliance Map — [jurisdiction]-[issue]" and a supporting
            primary source. We aim to acknowledge within 5 business days.
          </p>
        </Section>

        {/* Disclaimer */}
        <div className="pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
          This matrix is published for educational and research purposes only. It does not
          constitute legal advice, regulatory opinion, or a legal opinion in any jurisdiction.
          RWA-Index Research is not a law firm and does not provide legal services. Practitioners
          must obtain qualified legal advice before structuring any transaction.
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
