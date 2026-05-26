import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EnsembleData, EnsemblePhase, InstitutionType } from '../../types/ensemble';
import {
  PHASE_META,
  PHASE_DOT,
  INSTITUTION_TYPE_META,
  THEME_ACCENT,
} from '../../utils/ensemble';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const DISCLAIMER =
  'This registry includes participants whose involvement is verifiable from public HKMA disclosures and reported media. The HKMA\'s full Annex A and Annex B lists may include additional institutions not yet documented in this registry.';

function PhasePip({ phase }: { phase: EnsemblePhase }) {
  const meta = PHASE_META[phase];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: PHASE_DOT[phase] }} />
      {meta.label}
    </span>
  );
}

export default function EnsembleInstitutions() {
  const [data, setData] = useState<EnsembleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<InstitutionType | 'all'>('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<EnsemblePhase | 'all'>('all');

  useEffect(() => {
    fetch('/data/ensemble/ensemble.json')
      .then((r) => r.json())
      .then((d: EnsembleData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Loading institutions…</span>
      </div>
    );
  }
  if (!data) return null;

  const jurisdictions = [...new Set(data.institutions.map((i) => i.jurisdiction))].sort();
  const types = [...new Set(data.institutions.map((i) => i.type))] as InstitutionType[];

  const filtered = data.institutions.filter((inst) => {
    if (typeFilter !== 'all' && inst.type !== typeFilter) return false;
    if (jurisdictionFilter !== 'all' && inst.jurisdiction !== jurisdictionFilter) return false;
    if (phaseFilter !== 'all' && !inst.phases.includes(phaseFilter)) return false;
    return true;
  });

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
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
          active
            ? 'bg-[#2B3437] text-white border-[#2B3437]'
            : 'bg-white text-[#737C7F] border-[#DBE4E7] hover:border-[#5E5C75] hover:text-[#5E5C75]'
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/ensemble" className="hover:text-[#2B3437] transition-colors">Ensemble</Link>
        <span>›</span>
        <span className="text-[#2B3437]">Institutions</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-1">
        Participating Institutions Registry
      </h1>
      <p className="text-sm text-[#737C7F] mb-5">
        {data.institutions.length} institutions verifiable from public HKMA disclosures.
      </p>

      <DisclaimerBanner
        text={`${DISCLAIMER} Submit corrections via research@rwa-index.com.`}
        className="mb-5"
      />

      {/* Filters */}
      <div className="space-y-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#737C7F] w-20 flex-shrink-0">Type</span>
          <FilterPill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</FilterPill>
          {types.map((t) => (
            <FilterPill key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
              {INSTITUTION_TYPE_META[t]?.label ?? t}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#737C7F] w-20 flex-shrink-0">Jurisdiction</span>
          <FilterPill active={jurisdictionFilter === 'all'} onClick={() => setJurisdictionFilter('all')}>All</FilterPill>
          {jurisdictions.map((j) => (
            <FilterPill key={j} active={jurisdictionFilter === j} onClick={() => setJurisdictionFilter(j)}>
              {j}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#737C7F] w-20 flex-shrink-0">Phase</span>
          <FilterPill active={phaseFilter === 'all'} onClick={() => setPhaseFilter('all')}>All</FilterPill>
          {(['pre-launch', 'sandbox', 'pilot'] as EnsemblePhase[]).map((p) => (
            <FilterPill key={p} active={phaseFilter === p} onClick={() => setPhaseFilter(p)}>
              {PHASE_META[p].label}
            </FilterPill>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#737C7F] mb-3">
        Showing {filtered.length} of {data.institutions.length} institutions
      </p>

      {/* Institution grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#737C7F] py-12 text-center">
          No institutions match the selected filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((inst) => {
            const typeMeta = INSTITUTION_TYPE_META[inst.type];
            return (
              <Link
                key={inst.slug}
                to={`/ensemble/institutions/${inst.slug}`}
                className="bg-white border border-[#DBE4E7] rounded-lg p-4 hover:border-[#5E5C75] transition-colors group"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#EAEFF1] flex items-center justify-center text-sm font-bold text-[#5E5C75] flex-shrink-0">
                    {inst.shortName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2B3437] group-hover:text-[#5E5C75] transition-colors truncate">
                      {inst.name}
                    </p>
                    <p className="text-xs text-[#737C7F]">{inst.jurisdiction}</p>
                  </div>
                </div>

                {/* Type chip */}
                {typeMeta && (
                  <span
                    className="inline-block text-xs px-1.5 py-0.5 rounded font-medium mb-2"
                    style={{ background: typeMeta.bg, color: typeMeta.color }}
                  >
                    {typeMeta.label}
                  </span>
                )}

                {/* Phase pips */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {inst.phases.map((p) => (
                    <PhasePip key={p} phase={p} />
                  ))}
                </div>

                {/* Themes */}
                {inst.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {inst.themes.map((tc) => {
                      const theme = data.themes.find((t) => t.code === tc);
                      const accent = THEME_ACCENT[tc] ?? '#5E5C75';
                      return theme ? (
                        <span
                          key={tc}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: '#f3f4f6', color: accent }}
                        >
                          {theme.title}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Coverage note */}
      <div className="mt-8 p-4 bg-[#fef3c7] border border-[#fcd34d] rounded-lg">
        <p className="text-xs text-[#92400e] leading-relaxed">
          <strong>Coverage note:</strong> This registry includes participants whose involvement is
          verifiable from public HKMA disclosures and reported media. The HKMA's full Annex A and
          Annex B lists may include additional institutions not yet documented in this registry.
          Submit corrections via{' '}
          <a href="mailto:research@rwa-index.com" className="underline">
            research@rwa-index.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
