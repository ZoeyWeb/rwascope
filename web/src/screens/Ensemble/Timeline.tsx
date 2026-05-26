import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EnsembleData, EnsemblePhase, EnsembleMilestone } from '../../types/ensemble';
import {
  PHASE_META,
  PHASE_DOT,
  MILESTONE_TYPE_LABELS,
} from '../../utils/ensemble';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const DISCLAIMER =
  'This tracker compiles publicly available information from HKMA press releases, official announcements, and reported media coverage. RWA-Index does not have access to non-public Ensemble or EnsembleTX data.';

type PhaseFilter = EnsemblePhase | 'all';
type YearFilter = number | 'all';
type TypeFilter = string;

function PhaseBadge({ phase }: { phase: EnsemblePhase }) {
  const meta = PHASE_META[phase];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PHASE_DOT[phase] }} />
      {meta.label}
    </span>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
        active
          ? 'bg-[#2B3437] text-white border-[#2B3437]'
          : 'bg-white text-[#737C7F] border-[#DBE4E7] hover:border-[#5E5C75] hover:text-[#5E5C75]'
      }`}
    >
      {children}
    </button>
  );
}

export default function EnsembleTimeline() {
  const [data, setData] = useState<EnsembleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    fetch('/data/ensemble/ensemble.json')
      .then((r) => r.json())
      .then((d: EnsembleData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Loading timeline…</span>
      </div>
    );
  }
  if (!data) return null;

  // Unique years
  const years = [...new Set(data.milestones.map((m) => Number(m.date.slice(0, 4))))].sort(
    (a, b) => b - a
  );

  // Unique types
  const types = [...new Set(data.milestones.map((m) => m.type))];

  // Filter + sort (reverse chronological)
  const filtered: EnsembleMilestone[] = [...data.milestones]
    .filter((m) => {
      if (phaseFilter !== 'all' && m.phase !== phaseFilter) return false;
      if (yearFilter !== 'all' && !m.date.startsWith(String(yearFilter))) return false;
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/ensemble" className="hover:text-[#2B3437] transition-colors">Ensemble</Link>
        <span>›</span>
        <span className="text-[#2B3437]">Timeline</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-1">Full Timeline</h1>
      <p className="text-sm text-[#737C7F] mb-5">
        All {data.milestones.length} public milestones in reverse chronological order.
      </p>

      <DisclaimerBanner text={DISCLAIMER} className="mb-5" />

      {/* Filters */}
      <div className="space-y-2 mb-6">
        {/* Phase filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#737C7F] w-12 flex-shrink-0">Phase</span>
          <FilterPill active={phaseFilter === 'all'} onClick={() => setPhaseFilter('all')}>All</FilterPill>
          {(['pre-launch', 'sandbox', 'pilot'] as EnsemblePhase[]).map((p) => (
            <FilterPill key={p} active={phaseFilter === p} onClick={() => setPhaseFilter(p)}>
              {PHASE_META[p].label}
            </FilterPill>
          ))}
        </div>
        {/* Year filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#737C7F] w-12 flex-shrink-0">Year</span>
          <FilterPill active={yearFilter === 'all'} onClick={() => setYearFilter('all')}>All</FilterPill>
          {years.map((y) => (
            <FilterPill key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
              {y}
            </FilterPill>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#737C7F] w-12 flex-shrink-0">Type</span>
          <FilterPill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</FilterPill>
          {types.map((t) => (
            <FilterPill key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
              {MILESTONE_TYPE_LABELS[t] ?? t}
            </FilterPill>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[#737C7F] py-12 text-center">
          No milestones match the selected filters.
        </p>
      )}

      {/* Vertical timeline */}
      {filtered.length > 0 && (
        <div className="relative pl-6">
          {/* Track line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[#DBE4E7]" />

          <div className="space-y-8">
            {filtered.map((m, idx) => (
              <div key={idx} className="relative">
                {/* Dot */}
                <div
                  className="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 border-[#f8f9fa] flex-shrink-0"
                  style={{ background: PHASE_DOT[m.phase] }}
                />

                <div className="bg-white border border-[#DBE4E7] rounded-lg p-4">
                  {/* Date + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-[#2B3437]">{m.date}</span>
                    <PhaseBadge phase={m.phase} />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#EAEFF1] text-[#586064]">
                      {MILESTONE_TYPE_LABELS[m.type] ?? m.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-[#2B3437] mb-1">{m.title}</h3>

                  {/* Description */}
                  <p className="text-xs text-[#586064] leading-relaxed">{m.description}</p>

                  {/* Linked themes */}
                  {m.linked_themes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.linked_themes.map((tc) => {
                        const theme = data.themes.find((t) => t.code === tc);
                        return theme ? (
                          <Link
                            key={tc}
                            to={`/ensemble/use-cases?theme=${tc}`}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAEFF1] text-[#5E5C75] hover:bg-[#DBE4E7]"
                          >
                            {theme.title}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Linked institutions */}
                  {m.linked_institutions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {m.linked_institutions.map((slug) => {
                        const inst = data.institutions.find((i) => i.slug === slug);
                        return inst ? (
                          <Link
                            key={slug}
                            to={`/ensemble/institutions/${slug}`}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#dbeafe] text-[#1e40af] hover:bg-[#bfdbfe]"
                          >
                            {inst.shortName}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Sources */}
                  {m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#DBE4E7] flex flex-wrap gap-3">
                      {m.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#5E5C75] hover:underline"
                        >
                          {src.title.length > 60 ? src.title.slice(0, 57) + '…' : src.title} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
