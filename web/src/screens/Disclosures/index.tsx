import { useState, useMemo } from 'react';
import disclosuresData from '../../../public/data/disclosures/disclosures.json';
import { Eyebrow } from '../../components/Eyebrow';
import { BigStat, BigStatRibbon } from '../../components/BigStat';

type Disclosure = (typeof disclosuresData.disclosures)[number];

const DOC_TYPE_LABELS: Record<string, string> = {
  nav_report:        'NAV Report',
  attestation:       'Attestation',
  sec_filing:        'SEC Filing',
  prospectus_update: 'Prospectus',
  issuance_document: 'Issuance',
  annual_report:     'Annual Report',
  reserve_report:    'Reserve Report',
};

const DOC_TYPE_ICONS: Record<string, string> = {
  nav_report:        'bar_chart',
  attestation:       'verified',
  sec_filing:        'account_balance',
  prospectus_update: 'description',
  issuance_document: 'receipt_long',
  annual_report:     'summarize',
  reserve_report:    'inventory_2',
};

const ISSUERS = ['All', ...Array.from(new Set(disclosuresData.disclosures.map(d => d.issuer))).sort()];
const DOC_TYPES = ['All', 'nav_report', 'attestation', 'sec_filing', 'prospectus_update', 'issuance_document', 'reserve_report'];

const STATS = {
  totalDocs:    disclosuresData.disclosures.length,
  issuersCount: new Set(disclosuresData.disclosures.map(d => d.issuer)).size,
  lastUpdate:   disclosuresData.updated_at.slice(0, 7),
  typesCount:   new Set(disclosuresData.disclosures.map(d => d.doc_type)).size,
};

export default function DisclosuresTracker() {
  const [issuer, setIssuer] = useState('All');
  const [docType, setDocType] = useState('All');

  const filtered = useMemo(() => {
    return [...disclosuresData.disclosures]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(d => {
        if (issuer !== 'All' && d.issuer !== issuer) return false;
        if (docType !== 'All' && d.doc_type !== docType) return false;
        return true;
      });
  }, [issuer, docType]);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-ed-section-md pb-ed-section-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <Eyebrow>Intelligence · Issuer Disclosures</Eyebrow>
          <h1 className="text-4xl md:text-ed-hero-h1 text-ed-ink mt-ed-section-sm">
            Issuer Disclosures
          </h1>
          <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
            NAV reports, attestations, prospectuses, and SEC filings from institutional
            RWA issuers — indexed for traceable due diligence.
          </p>
        </div>
      </section>

      {/* ── Stats ribbon ──────────────────────────────────────────────────── */}
      <BigStatRibbon cols={4}>
        <BigStat value={STATS.totalDocs}    label="Documents indexed" />
        <BigStat value={STATS.issuersCount} label="Issuers tracked" />
        <BigStat value={STATS.lastUpdate}   label="Last updated" />
        <BigStat value={STATS.typesCount}   label="Document types" />
      </BigStatRibbon>

      {/* Filters */}
      <div className="bg-white border-b border-[#DBE4E7] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#737C7F]">Issuer:</span>
            {ISSUERS.map(o => (
              <button
                key={o}
                onClick={() => setIssuer(o)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  issuer === o
                    ? 'bg-[#2B3437] text-white'
                    : 'bg-[#F1F4F6] text-[#737C7F] hover:bg-[#DBE4E7]'
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#737C7F]">Type:</span>
            {DOC_TYPES.map(o => (
              <button
                key={o}
                onClick={() => setDocType(o)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  docType === o
                    ? 'bg-[#2B3437] text-white'
                    : 'bg-[#F1F4F6] text-[#737C7F] hover:bg-[#DBE4E7]'
                }`}
              >
                {o === 'All' ? 'All' : DOC_TYPE_LABELS[o] ?? o}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-[#737C7F]">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-[#737C7F] text-center py-12">No documents match the current filters.</p>
        )}
        {filtered.map(doc => (
          <DisclosureRow key={doc.slug} doc={doc} />
        ))}

        <p className="text-xs text-[#737C7F] text-center pt-4">
          {disclosuresData.disclosures.length} documents on record · updated {disclosuresData.updated_at}
        </p>
      </div>
    </div>
  );
}

function DisclosureRow({ doc }: { doc: Disclosure }) {
  const [open, setOpen] = useState(false);
  const icon = DOC_TYPE_ICONS[doc.doc_type] ?? 'description';
  const label = DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type;

  return (
    <div className="bg-white border border-[#DBE4E7] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#EAEFF1] transition-colors"
      >
        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-[#F1F4F6] flex items-center justify-center text-[#5E5C75]">
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#2B3437] bg-[#F1F4F6] px-2 py-0.5 rounded">
              {doc.issuer}
              {doc.arranger && (
                <span className="font-normal text-[#737C7F]"> · arranged by {doc.arranger}</span>
              )}
            </span>
            <span className="text-xs text-[#5E5C75] font-medium">{label}</span>
            {doc.period_covered && (
              <span className="text-xs text-[#737C7F]">{doc.period_covered}</span>
            )}
            <span className="text-xs text-[#737C7F] ml-auto">{doc.date}</span>
          </div>
          <div className="text-sm font-medium text-[#2B3437] leading-snug">{doc.title}</div>
        </div>

        <span
          className="material-symbols-outlined text-[18px] text-[#737C7F] shrink-0 mt-1 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#F1F4F6]">
          <p className="mt-4 text-sm text-[#2B3437] leading-relaxed">{doc.summary}</p>
          <div className="mt-4 flex items-center gap-4">
            {doc.file_url && (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
                Filing PDF
              </a>
            )}
            <a
              href={doc.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#737C7F] hover:text-[#2B3437] transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              Issuer page
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
