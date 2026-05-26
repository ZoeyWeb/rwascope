import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Incident, IncidentScope, IncidentSeverity, IncidentStatus, IncidentType, IncidentAssetClass } from '../../types/incidents';
import {
  SEVERITY_META, INCIDENT_STATUS_META, SCOPE_META,
  INCIDENT_TYPE_LABELS, INCIDENT_ASSET_LABELS, formatLossUsd,
} from '../../utils/incidents';
import DisclaimerBanner from '../../components/DisclaimerBanner';

// ── Primitive badges ──────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: IncidentSeverity }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ background: m.dot }}
      title={m.label}
    />
  );
}

function ScopeBadge({ scope }: { scope: IncidentScope }) {
  const m = SCOPE_META[scope];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-black tracking-wide"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const m = INCIDENT_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

// ── Filter pill button ────────────────────────────────────────────────────────

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#5E5C75] text-white'
          : 'bg-white border border-[#DBE4E7] text-[#737C7F] hover:border-[#5E5C75]'
      }`}
    >
      {children}
    </button>
  );
}

// ── Timeline view (grouped by year) ──────────────────────────────────────────

function TimelineView({ incidents }: { incidents: Incident[] }) {
  const byYear = useMemo(() => {
    const map = new Map<string, Incident[]>();
    const sorted = [...incidents].sort((a, b) => b.date.localeCompare(a.date));
    for (const inc of sorted) {
      const yr = inc.date.slice(0, 4);
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(inc);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [incidents]);

  return (
    <div className="space-y-8">
      {byYear.map(([year, items]) => (
        <div key={year}>
          <div className="text-sm font-black text-[#737C7F] uppercase tracking-widest mb-4">{year}</div>
          <div className="relative pl-6 border-l-2 border-[#DBE4E7] space-y-4">
            {items.map(inc => (
              <div key={inc.slug} className="relative">
                {/* Timeline marker */}
                <div
                  className="absolute -left-[23px] top-2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: SEVERITY_META[inc.severity].dot }}
                />
                <Link
                  to={`/incidents/${inc.slug}`}
                  className="block bg-white rounded-xl border border-[#DBE4E7] p-4 hover:border-[#5E5C75] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ScopeBadge scope={inc.scope} />
                        <StatusBadge status={inc.status} />
                        <span className="text-xs text-[#737C7F]">{inc.date}</span>
                      </div>
                      <div className="font-bold text-[#2B3437] text-sm mb-1 truncate">{inc.title}</div>
                      <div className="text-xs text-[#737C7F]">
                        {INCIDENT_TYPE_LABELS[inc.type]} · {inc.primaryEntity}
                        {inc.estimatedLossUsd ? ` · ${formatLossUsd(inc.estimatedLossUsd)}` : ''}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#737C7F] text-lg shrink-0">arrow_forward</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'timeline';

const SCOPE_FILTERS: { value: IncidentScope | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hk-related', label: 'HK-Related' },
  { value: 'global-reference', label: 'Global Reference' },
];

export default function IncidentsOverview() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('table');

  // Filters
  const [scopeFilter, setScopeFilter] = useState<IncidentScope | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Sort
  const [sortKey, setSortKey] = useState<'date' | 'loss' | 'severity'>('date');

  useEffect(() => {
    fetch('/data/incidents/incidents.json')
      .then(r => r.json())
      .then((data: Incident[]) => { setIncidents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Derived
  const years = useMemo(() =>
    Array.from(new Set(incidents.map(i => i.date.slice(0, 4)))).sort().reverse(),
    [incidents]
  );

  const severityOrder: Record<IncidentSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = useMemo(() => {
    let list = incidents.filter(i => {
      if (scopeFilter !== 'all' && i.scope !== scopeFilter) return false;
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (yearFilter !== 'all' && !i.date.startsWith(yearFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.primaryEntity.toLowerCase().includes(q) ||
          (i.issuerOrOperator ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortKey === 'date') list = list.sort((a, b) => b.date.localeCompare(a.date));
    else if (sortKey === 'loss') list = list.sort((a, b) => (b.estimatedLossUsd ?? 0) - (a.estimatedLossUsd ?? 0));
    else if (sortKey === 'severity') list = list.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return list;
  }, [incidents, scopeFilter, severityFilter, statusFilter, typeFilter, yearFilter, search, sortKey]);

  // Stats
  const stats = useMemo(() => ({
    total:        incidents.length,
    hkRelated:    incidents.filter(i => i.scope === 'hk-related').length,
    totalLoss:    incidents.reduce((s, i) => s + (i.estimatedLossUsd ?? 0), 0),
    activeInvest: incidents.filter(i => ['under-investigation', 'litigation', 'ongoing'].includes(i.status)).length,
  }), [incidents]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B3437]">Tokenization Incident Database</h1>
          <p className="text-sm text-[#737C7F] mt-1 max-w-2xl">
            Public record of incidents involving stablecoins, tokenized assets, and tokenization infrastructure —
            focused on Hong Kong, with global high-impact reference cases.
          </p>
        </div>
        <Link
          to="/incidents/methodology"
          className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-base">info</span>
          Methodology
        </Link>
      </div>

      {/* ── Disclaimer ── */}
      <DisclaimerBanner text="Information sourced from public records, regulatory filings, and reported media coverage. RWA-Index does not allege wrongdoing beyond what is documented in cited public sources. Status reflects publicly known information at last update date." />

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Incidents',            value: stats.total,        color: '#5E5C75' },
          { label: 'HK-Related',                 value: stats.hkRelated,    color: '#9e3f4e' },
          { label: 'Est. Total Loss',            value: stats.totalLoss > 0 ? formatLossUsd(stats.totalLoss) : '—', color: '#ea580c' },
          { label: 'Active Investigations',      value: stats.activeInvest, color: '#1565C0' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-[#DBE4E7] p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-[#737C7F] mb-1">{s.label}</div>
            <div className="text-xl sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-[#DBE4E7] p-4 space-y-3">
        {/* Search + view toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737C7F] text-base">search</span>
            <input
              type="text"
              placeholder="Search incidents…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#DBE4E7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5E5C75]/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737C7F]">View:</span>
            {(['table', 'timeline'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  view === v ? 'bg-[#5E5C75] text-white' : 'bg-[#EAEFF1] text-[#737C7F] hover:bg-[#DBE4E7]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{v === 'table' ? 'table_rows' : 'format_list_bulleted'}</span>
                {v === 'table' ? 'Table' : 'Timeline'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter rows */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#737C7F] w-14 shrink-0">Scope</span>
          {SCOPE_FILTERS.map(f => (
            <Pill key={f.value} active={scopeFilter === f.value} onClick={() => setScopeFilter(f.value as any)}>{f.label}</Pill>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#737C7F] w-14 shrink-0">Severity</span>
          {[{ v: 'all', l: 'All' }, { v: 'critical', l: '● Critical' }, { v: 'high', l: '● High' }, { v: 'medium', l: '● Medium' }, { v: 'low', l: '● Low' }].map(f => (
            <Pill key={f.v} active={severityFilter === f.v as any} onClick={() => setSeverityFilter(f.v as any)}>{f.l}</Pill>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#737C7F] w-14 shrink-0">Status</span>
          {[
            { v: 'all', l: 'All' },
            { v: 'resolved', l: 'Resolved' },
            { v: 'ongoing', l: 'Ongoing' },
            { v: 'under-investigation', l: 'Under Investigation' },
            { v: 'litigation', l: 'Litigation' },
            { v: 'settled', l: 'Settled' },
          ].map(f => (
            <Pill key={f.v} active={statusFilter === f.v as any} onClick={() => setStatusFilter(f.v as any)}>{f.l}</Pill>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#737C7F] w-14 shrink-0">Year</span>
          <Pill active={yearFilter === 'all'} onClick={() => setYearFilter('all')}>All</Pill>
          {years.map(y => (
            <Pill key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>{y}</Pill>
          ))}
        </div>

        {/* Sort + result count */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F1F4F6]">
          <span className="text-xs text-[#737C7F]">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737C7F]">Sort:</span>
            {[{ k: 'date', l: 'Date' }, { k: 'loss', l: 'Est. Loss' }, { k: 'severity', l: 'Severity' }].map(s => (
              <button
                key={s.k}
                onClick={() => setSortKey(s.k as any)}
                className={`text-xs px-2 py-1 rounded font-bold transition-colors ${
                  sortKey === s.k ? 'text-[#5E5C75]' : 'text-[#737C7F] hover:text-[#2B3437]'
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#737C7F] text-sm">No incidents match your filters.</div>
      ) : view === 'timeline' ? (
        <TimelineView incidents={filtered} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-[#DBE4E7] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBE4E7] bg-[#F8FAFB]">
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-28">Date</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Incident</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Type</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Scope</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Est. Loss</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F4F6]">
                  {filtered.map(inc => (
                    <tr
                      key={inc.slug}
                      className="hover:bg-[#F8FAFB] transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/incidents/${inc.slug}`}
                      title={inc.summary}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <SeverityDot severity={inc.severity} />
                          <span className="text-xs text-[#737C7F] font-mono">{inc.date.slice(0, 7)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="font-bold text-[#2B3437] truncate">{inc.title}</div>
                        <div className="text-xs text-[#737C7F] mt-0.5 truncate">{inc.primaryEntity}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-[#737C7F]">{INCIDENT_TYPE_LABELS[inc.type]}</span>
                      </td>
                      <td className="px-4 py-4">
                        <ScopeBadge scope={inc.scope} />
                      </td>
                      <td className="px-4 py-4">
                        {inc.estimatedLossUsd ? (
                          <span className="text-sm font-bold text-[#2B3437]">{formatLossUsd(inc.estimatedLossUsd)}</span>
                        ) : (
                          <span className="text-xs text-[#737C7F]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/incidents/${inc.slug}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs font-bold text-[#5E5C75] hover:text-[#2B3437] transition-colors"
                        >
                          View
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(inc => (
              <Link
                key={inc.slug}
                to={`/incidents/${inc.slug}`}
                className="block bg-white rounded-xl border border-[#DBE4E7] p-4 hover:border-[#5E5C75] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <SeverityDot severity={inc.severity} />
                    <span className="font-bold text-[#2B3437] text-sm leading-tight">{inc.title}</span>
                  </div>
                  <ScopeBadge scope={inc.scope} />
                </div>
                <div className="text-xs text-[#737C7F] mb-2">{inc.primaryEntity} · {inc.date.slice(0, 7)}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inc.status} />
                    {inc.estimatedLossUsd && (
                      <span className="text-xs font-bold text-[#ea580c]">{formatLossUsd(inc.estimatedLossUsd)}</span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-[#737C7F] text-lg">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── Severity legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#737C7F]">
        <span className="font-bold text-[#2B3437]">Severity:</span>
        {(['critical', 'high', 'medium', 'low'] as IncidentSeverity[]).map(s => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_META[s].dot }} />
            {SEVERITY_META[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
