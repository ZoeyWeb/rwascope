import { Link } from 'react-router-dom';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const DISCLAIMER =
  'This tracker is an independent research tool. It is not affiliated with, endorsed by, or connected to the Hong Kong Monetary Authority. RWA-Index does not have access to non-public Ensemble or EnsembleTX data.';

export default function EnsembleMethodology() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/ensemble" className="hover:text-[#2B3437] transition-colors">Ensemble</Link>
        <span>›</span>
        <span className="text-[#2B3437]">Methodology</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">
        Tracker Methodology
      </h1>
      <p className="text-[#737C7F] text-sm mb-6">
        How the Project Ensemble Public Tracker is researched, structured, and maintained.
      </p>

      <DisclaimerBanner text={DISCLAIMER} className="mb-8" />

      <div className="space-y-10 text-sm text-[#2B3437] leading-relaxed">

        <Section title="1. What This Tracker Is">
          <p>
            The Project Ensemble Public Tracker is an independent, third-party structured archive of
            HKMA public communications about Project Ensemble and its successor pilot phase,
            EnsembleTX. Its purpose is to make publicly available information more navigable and
            cross-referenceable for researchers, practitioners, and policymakers.
          </p>
          <p className="mt-2">
            The tracker maintains a structured record of milestones, use cases, and participating
            institutions as publicly disclosed by the HKMA. Every entry in the tracker is linked to
            at least one public primary or secondary source.
          </p>
        </Section>

        <Section title="2. What This Tracker Is NOT">
          <ul className="list-disc pl-5 mt-2 space-y-2 text-[#586064]">
            <li>
              <strong className="text-[#2B3437]">Not a real-time data feed.</strong> The tracker
              does not pull live data from HKMA systems. It is updated manually when new public
              disclosures are issued.
            </li>
            <li>
              <strong className="text-[#2B3437]">Not affiliated with HKMA.</strong> This tracker is
              produced by RWA-Index Research and is not connected to, endorsed by, or approved by
              the Hong Kong Monetary Authority.
            </li>
            <li>
              <strong className="text-[#2B3437]">No access to settlement data.</strong> The tracker
              does not contain transaction volumes, settlement values, interbank liquidity figures,
              or any other non-public operational data from EnsembleTX.
            </li>
            <li>
              <strong className="text-[#2B3437]">No access to non-public participant lists.</strong>{' '}
              The institutions registry reflects only participants verifiable from HKMA press
              releases, Annex disclosures, and reported major media. It does not reflect the full
              Annex A and Annex B lists if those lists are not in the public domain.
            </li>
            <li>
              <strong className="text-[#2B3437]">Not investment commentary.</strong> The tracker
              makes no assessment of the HKMA's approach, the commercial prospects of tokenisation,
              or the performance of any participating institution.
            </li>
          </ul>
        </Section>

        <Section title="3. Source Hierarchy">
          <p>All tracker content is researched against the following source hierarchy:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1.5 text-[#586064]">
            <li>
              <strong className="text-[#2B3437]">HKMA press releases</strong> — the primary source
              for all milestone and institution records. Linked directly in each entry.
            </li>
            <li>
              <strong className="text-[#2B3437]">HKMA speeches and public statements</strong> —
              used to corroborate timing, scope, and terminology.
            </li>
            <li>
              <strong className="text-[#2B3437]">Regulatory consultation papers</strong> — used
              for framework and policy context.
            </li>
            <li>
              <strong className="text-[#2B3437]">Major financial media</strong> — used only to
              corroborate HKMA primary sources, never as a sole source for a material fact.
            </li>
            <li>
              <strong className="text-[#2B3437]">Industry media</strong> — used for supplementary
              context only; clearly marked when cited.
            </li>
          </ol>
          <p className="mt-3 text-xs text-[#737C7F]">
            Where a piece of information is not verifiable from any of the above sources, it is
            omitted. "Not publicly disclosed" is recorded explicitly where the HKMA has confirmed
            the activity but has not disclosed details.
          </p>
        </Section>

        <Section title="4. Scope">
          <p>
            This tracker covers Project Ensemble from its public launch on 7 March 2024 and its
            successor pilot phase EnsembleTX from its launch on 13 November 2025. It tracks
            milestones, use cases, and publicly disclosed participants.
          </p>
          <p className="mt-2">
            The tracker does not cover other HKMA fintech initiatives such as e-HKD+, Project
            mBridge, or Cyberport-based fintech programmes, <em>except</em> where they are
            explicitly referenced in HKMA communications about Project Ensemble (e.g., the Banque
            de France cross-border settlement work referenced in the MOU).
          </p>
        </Section>

        <Section title="5. Update Policy">
          <p>
            The tracker is updated when new HKMA public disclosures are issued. Updates include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>New HKMA press releases referencing Project Ensemble or EnsembleTX.</li>
            <li>New institution disclosures (e.g., additional Annex A/B entries becoming public).</li>
            <li>Phase transitions (e.g., if a new phase beyond EnsembleTX is announced).</li>
          </ul>
          <p className="mt-2">
            The <code className="bg-[#EAEFF1] px-1 rounded">last_compiled</code> date in the data
            file records the most recent substantive update. Minor editorial corrections do not
            update this date.
          </p>
        </Section>

        <Section title="6. Corrections">
          <p>
            To report a factual error or to notify us of a new HKMA public disclosure that should
            be included, contact{' '}
            <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] hover:underline">
              research@rwa-index.com
            </a>{' '}
            with the subject line "Ensemble Tracker — [item]" and a link to the primary source.
            We aim to acknowledge within 5 business days.
          </p>
        </Section>

        <div className="pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
          This tracker is published for educational and research purposes only. It does not
          constitute investment advice, financial product disclosure, or regulatory opinion.
          RWA-Index Research is not affiliated with the Hong Kong Monetary Authority.
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
