import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Issuer, SARMSignal, Citation } from '../../types/licenses';
import {
  SIGNAL_META, STATUS_META, TYPE_LABELS,
  SARM_DIMENSION_KEYS, aggregateSARM,
} from '../../utils/sarm';

// ── Citation Component ────────────────────────────────────────────────────────
function CitationLink({ cite, index }: { cite: Citation; index: number }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-xs">
      <sup className="text-[#5E5C75] font-bold">[{index + 1}]</sup>
      <a
        href={cite.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#5E5C75] underline hover:text-[#2B3437] break-all"
      >
        {cite.label}
      </a>
      {cite.date && <span className="text-[#737C7F]">({cite.date})</span>}
    </span>
  );
}

// ── Traffic Light Cell ────────────────────────────────────────────────────────
function TrafficLight({ signal }: { signal: SARMSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: m.color }}
      />
      {m.label}
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#DBE4E7] p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#5E5C75]">{icon}</span>
        <h2 className="text-base font-black text-[#2B3437]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-[#F1F4F6] last:border-0">
      <span className="text-xs uppercase tracking-widest font-bold text-[#737C7F] sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-[#2B3437] flex-1">{value}</span>
    </div>
  );
}

// ── SARM Detail Table ─────────────────────────────────────────────────────────
function SARMTable({ issuer }: { issuer: Issuer }) {
  const summary = aggregateSARM(issuer.sarm);
  return (
    <div className="space-y-4">
      {/* Mini summary */}
      <div className="flex flex-wrap gap-3 text-xs text-[#737C7F]">
        {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(s => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: SIGNAL_META[s].color }} />
            <span style={{ color: SIGNAL_META[s].color }} className="font-bold">{summary[s]}</span>
            {' '}{SIGNAL_META[s].label}
          </span>
        ))}
      </div>

      {/* Dimension rows */}
      <div className="divide-y divide-[#F1F4F6]">
        {SARM_DIMENSION_KEYS.map(key => {
          const dim = issuer.sarm[key];
          return (
            <div key={key} className="py-4 grid grid-cols-1 sm:grid-cols-[180px_120px_1fr] gap-2 sm:gap-4 items-start">
              <div className="font-bold text-sm text-[#2B3437]">{dim.label}</div>
              <div><TrafficLight signal={dim.signal} /></div>
              <div className="space-y-2">
                <p className="text-sm text-[#737C7F]">{dim.rationale}</p>
                {dim.sources.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {dim.sources.map((s, i) => <CitationLink key={i} cite={s} index={i} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function IssuerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch('/data/licenses/issuers.json')
      .then(r => r.json())
      .then((data: Issuer[]) => {
        const found = data.find(i => i.slug === slug);
        if (found) setIssuer(found);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span>
    </div>
  );

  if (notFound || !issuer) return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h1 className="text-xl font-black text-[#2B3437] mb-2">Issuer not found</h1>
      <p className="text-sm text-[#737C7F] mb-6">No issuer with slug "{slug}" exists in the database.</p>
      <Link to="/licenses" className="text-[#5E5C75] underline text-sm">← Back to Licence Tracker</Link>
    </div>
  );

  const statusMeta = STATUS_META[issuer.status] ?? STATUS_META.under_review;
  const summary = aggregateSARM(issuer.sarm);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/licenses" className="hover:text-[#2B3437] transition-colors">Licence Tracker</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">{issuer.name}</span>
      </div>

      {/* ── Header card ── */}
      <div className="bg-white rounded-xl border border-[#DBE4E7] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#2B3437]">{issuer.name}</h1>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold"
                style={{ color: statusMeta.color, background: statusMeta.bg }}
              >
                {statusMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-sm text-[#737C7F]">
              <span className="font-mono font-bold text-[#5E5C75]">{issuer.ticker}</span>
              <span>·</span>
              <span>{issuer.peg} peg</span>
              <span>·</span>
              <span>{TYPE_LABELS[issuer.type] ?? issuer.type}</span>
              <span>·</span>
              <span>{issuer.jurisdiction}</span>
            </div>
          </div>

          {/* SARM summary chips */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(s =>
              summary[s] > 0 && (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                  style={{ color: SIGNAL_META[s].color, background: SIGNAL_META[s].bg }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: SIGNAL_META[s].color }} />
                  {summary[s]}
                </span>
              )
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-[#737C7F] leading-relaxed">{issuer.summary}</p>
      </div>

      {/* ── Section 1: Applicant Overview ── */}
      <Section title="Applicant Overview" icon="business">
        <InfoRow label="Legal Entity" value={issuer.name} />
        <InfoRow label="Parent / Sponsor" value={issuer.parent} />
        <InfoRow label="Jurisdiction" value={issuer.jurisdiction} />
        <InfoRow label="Peg Currency" value={issuer.peg} />
        <InfoRow label="Stablecoin Type" value={TYPE_LABELS[issuer.type] ?? issuer.type} />
        <InfoRow label="Ticker" value={<span className="font-mono font-bold text-[#5E5C75]">{issuer.ticker}</span>} />
        <InfoRow
          label="Application Date"
          value={issuer.application_date === 'Unknown' ? '—' : issuer.application_date}
        />
        <InfoRow
          label="Licence Status"
          value={
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
              style={{ color: statusMeta.color, background: statusMeta.bg }}
            >
              {statusMeta.label}
            </span>
          }
        />
      </Section>

      {/* ── Section 2: SARM Assessment ── */}
      <Section title="SARM Regulatory Assessment" icon="traffic">
        <div className="text-xs text-[#737C7F] bg-[#F8FAFB] rounded-lg px-4 py-3 border border-[#DBE4E7]">
          Signals are qualitative traffic lights based on public information only.
          Green = meets standard · Yellow = partial / conditional · Red = significant gap · Gray = insufficient public data.
          {' '}<Link to="/licenses/methodology" className="text-[#5E5C75] underline">Full methodology →</Link>
        </div>
        <SARMTable issuer={issuer} />
      </Section>

      {/* ── Section 3: Reserve Quality ── */}
      <Section title="Reserve Quality" icon="account_balance">
        <p className="text-sm text-[#737C7F] leading-relaxed">{issuer.reserve_details}</p>
      </Section>

      {/* ── Section 4: Governance & Audits ── */}
      <Section title="Governance & Audits" icon="gavel">
        <p className="text-sm text-[#737C7F] leading-relaxed">{issuer.governance_notes}</p>
      </Section>

      {/* ── Section 5: Technology & Custody ── */}
      <Section title="Technology & Custody" icon="lock">
        <p className="text-sm text-[#737C7F] leading-relaxed">{issuer.technology_notes}</p>
      </Section>

      {/* ── Section 6: Redemption Mechanics ── */}
      <Section title="Redemption Mechanics" icon="swap_horiz">
        <p className="text-sm text-[#737C7F] leading-relaxed">{issuer.redemption_notes}</p>
      </Section>

      {/* ── Section 7: Public Disclosures ── */}
      <Section title="Public Disclosures" icon="description">
        <p className="text-sm text-[#737C7F] leading-relaxed">{issuer.disclosure_notes}</p>
      </Section>

      {/* ── Section 8: Sources & Citations ── */}
      <Section title="Sources & Citations" icon="menu_book">
        {issuer.citations.length === 0 ? (
          <p className="text-sm text-[#737C7F]">No public sources available.</p>
        ) : (
          <ol className="space-y-2 list-none">
            {issuer.citations.map((cite, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="text-[#5E5C75] font-bold shrink-0">[{i + 1}]</span>
                <span>
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5E5C75] underline hover:text-[#2B3437] break-all"
                  >
                    {cite.label}
                  </a>
                  {cite.date && (
                    <span className="text-[#737C7F] ml-2 text-xs">Retrieved/published: {cite.date}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* ── Reviewer note ── */}
      <div className="bg-[#EAEFF1] rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#737C7F] text-base shrink-0 mt-0.5">rate_review</span>
        <div className="text-xs text-[#737C7F] leading-relaxed">
          <span className="font-bold text-[#2B3437]">Reviewer note: </span>
          {issuer.reviewer_note}
          <div className="mt-1">Last reviewed: {issuer.last_reviewed}</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/licenses"
          className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          All issuers
        </Link>
        <Link
          to="/licenses/methodology"
          className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors"
        >
          SARM Methodology
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-[#737C7F] italic border-t border-[#DBE4E7] pt-4">
        ⚠️ Academic research only. Not investment, legal, or compliance advice. SARM signals are
        qualitative judgements based on publicly available information and may not reflect current
        regulatory or operational status.
      </p>
    </div>
  );
}
