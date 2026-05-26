import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Issuer, IssuerStatus } from '../../types/licenses';
import { SIGNAL_META, STATUS_META, TYPE_LABELS, getOverallSignal, aggregateSARM } from '../../utils/sarm';

// ── Traffic Light Dot ─────────────────────────────────────────────────────────
function SignalDot({ signal, size = 10 }: { signal: string; size?: number }) {
  const meta = SIGNAL_META[signal as keyof typeof SIGNAL_META] ?? SIGNAL_META.gray;
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, background: meta.color }}
      title={meta.label}
    />
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.under_review;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

// ── SARM mini-bar for overview row ────────────────────────────────────────────
function SARMBar({ issuer }: { issuer: Issuer }) {
  const summary = aggregateSARM(issuer.sarm);
  const segs = [
    { sig: 'green',  count: summary.green },
    { sig: 'yellow', count: summary.yellow },
    { sig: 'red',    count: summary.red },
    { sig: 'gray',   count: summary.gray },
  ].filter(s => s.count > 0);

  return (
    <div className="flex items-center gap-1" title="SARM dimension signals">
      {segs.map(s =>
        Array.from({ length: s.count }).map((_, i) => (
          <SignalDot key={`${s.sig}-${i}`} signal={s.sig} size={8} />
        ))
      )}
    </div>
  );
}

// ── Status filter options ─────────────────────────────────────────────────────
const STATUS_FILTERS: { value: IssuerStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'licensed', label: 'Licensed' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'rejected', label: 'Rejected' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function LicensesOverview() {
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IssuerStatus | 'all'>('all');
  const [pegFilter, setPegFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/data/licenses/issuers.json')
      .then(r => r.json())
      .then((data: Issuer[]) => { setIssuers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Derived filters
  const pegs = Array.from(new Set(issuers.map(i => i.peg))).sort();

  const filtered = issuers.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (pegFilter !== 'all' && i.peg !== pegFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.ticker.toLowerCase().includes(q) ||
        i.parent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const counts = {
    total:        issuers.length,
    sandbox:      issuers.filter(i => i.status === 'sandbox').length,
    under_review: issuers.filter(i => i.status === 'under_review').length,
    licensed:     issuers.filter(i => i.status === 'licensed').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B3437]">HK Stablecoin Licence Tracker</h1>
          <p className="text-sm text-[#737C7F] mt-1 max-w-2xl">
            SARM-framework assessment of stablecoin issuers applying under the{' '}
            <a
              href="https://www.elegislation.gov.hk/hk/cap649"
              target="_blank" rel="noopener noreferrer"
              className="text-[#5E5C75] underline hover:text-[#2B3437]"
            >
              Hong Kong Stablecoins Ordinance (Cap. 649)
            </a>
            . Traffic lights only — no numerical scores.
          </p>
        </div>
        <Link
          to="/licenses/methodology"
          className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-base">info</span>
          SARM Methodology
        </Link>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Applicants', value: counts.total,        color: '#5E5C75' },
          { label: 'Under Review',     value: counts.under_review, color: '#e09d2b' },
          { label: 'Sandbox',          value: counts.sandbox,      color: '#2E7D32' },
          { label: 'Licensed',         value: counts.licensed,     color: '#1565C0' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-[#DBE4E7] p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-[#737C7F] mb-1">{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737C7F] text-base">search</span>
          <input
            type="text"
            placeholder="Search issuer or ticker…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#DBE4E7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5E5C75]/30"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full font-bold transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#5E5C75] text-white'
                  : 'bg-white border border-[#DBE4E7] text-[#737C7F] hover:border-[#5E5C75]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Peg filter */}
        {pegs.length > 1 && (
          <select
            value={pegFilter}
            onChange={e => setPegFilter(e.target.value)}
            className="text-sm border border-[#DBE4E7] rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#5E5C75]/30"
          >
            <option value="all">All pegs</option>
            {pegs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#737C7F] text-sm">No issuers match your filters.</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DBE4E7] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DBE4E7] bg-[#F8FAFB]">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Issuer</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Ticker</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Peg</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Type</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Status</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">SARM</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Applied</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F6]">
                {filtered.map(issuer => {
                  const overall = getOverallSignal(issuer);
                  const meta = SIGNAL_META[overall];
                  return (
                    <tr key={issuer.slug} className="hover:bg-[#F8FAFB] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <SignalDot signal={overall} size={10} />
                          <div>
                            <div className="font-bold text-[#2B3437]">{issuer.name}</div>
                            <div className="text-xs text-[#737C7F] mt-0.5 max-w-[200px] truncate">{issuer.parent}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-[#5E5C75]">{issuer.ticker}</span>
                      </td>
                      <td className="px-5 py-4 text-[#2B3437] font-medium">{issuer.peg}</td>
                      <td className="px-5 py-4 text-[#737C7F]">{TYPE_LABELS[issuer.type] ?? issuer.type}</td>
                      <td className="px-5 py-4"><StatusBadge status={issuer.status} /></td>
                      <td className="px-5 py-4"><SARMBar issuer={issuer} /></td>
                      <td className="px-5 py-4 text-[#737C7F] text-xs">
                        {issuer.application_date === 'Unknown' ? '—' : issuer.application_date}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/licenses/${issuer.slug}`}
                          className="flex items-center gap-1 text-xs font-bold text-[#5E5C75] hover:text-[#2B3437] transition-colors"
                        >
                          View
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#F1F4F6]">
            {filtered.map(issuer => {
              const overall = getOverallSignal(issuer);
              return (
                <div key={issuer.slug} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SignalDot signal={overall} size={10} />
                      <span className="font-bold text-[#2B3437] text-sm">{issuer.name}</span>
                    </div>
                    <StatusBadge status={issuer.status} />
                  </div>
                  <div className="text-xs text-[#737C7F]">{issuer.parent}</div>
                  <div className="flex items-center gap-4 text-xs text-[#737C7F]">
                    <span className="font-mono font-bold text-[#5E5C75]">{issuer.ticker}</span>
                    <span>{issuer.peg}</span>
                    <span>{TYPE_LABELS[issuer.type]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <SARMBar issuer={issuer} />
                    <Link
                      to={`/licenses/${issuer.slug}`}
                      className="flex items-center gap-1 text-xs font-bold text-[#5E5C75]"
                    >
                      View profile
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#737C7F]">
        <span className="font-bold text-[#2B3437]">SARM legend:</span>
        {(['green', 'yellow', 'red', 'gray'] as const).map(s => (
          <span key={s} className="flex items-center gap-1.5">
            <SignalDot signal={s} size={8} />
            {SIGNAL_META[s].label}
          </span>
        ))}
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-[#737C7F] italic border-t border-[#DBE4E7] pt-4">
        ⚠️ This tracker is produced for academic research purposes. Assessments are based solely on
        publicly available information. No investment, legal, or compliance advice is intended or
        implied. SARM signals are qualitative judgements, not scores or ratings.
      </p>
    </div>
  );
}
