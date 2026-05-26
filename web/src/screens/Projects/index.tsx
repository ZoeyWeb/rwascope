import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Project, ProjectAssetClass, ProjectStatus } from '../../types/projects';
import { ASSET_CLASS_META, STATUS_META } from '../../types/projects';
import { projectsApi } from '../../api/client';

const RISK_FLAG_LABELS: Record<string, string> = {
  de_peg:                      'De-peg',
  regulatory_action:           'Regulatory Action',
  audit_issue:                 'Audit Issue',
  paused:                      'Paused',
  failed:                      'Failed',
  historical_pool_defaults:    'Historical Pool Defaults',
  early_underwriting_issues:   'Early Underwriting Issues',
  silicon_valley_bank_exposure: 'SVB Exposure',
  regulatory_uncertainty:      'Regulatory Uncertainty',
  real_estate_liquidity_crisis: 'RE Liquidity Crisis',
  illiquid_backing:            'Illiquid Backing',
  defi_integration_risk:       'DeFi Integration Risk',
  mim_liquidation_cascade:     'MIM Liquidation Cascade',
  governance_conflict:         'Governance Conflict',
  low_volume:                  'Low Volume',
  nft_liquidity_risk:          'NFT Liquidity',
  legal_uncertainty:           'Legal Uncertainty',
  algorithmic_peg_failure:     'Algorithmic Peg Failure',
  reflexive_collateral:        'Reflexive Collateral',
  bank_run_dynamics:           'Bank Run Dynamics',
  yield_sustainability:        'Yield Sustainability',
  ponzi_dynamics:              'Ponzi Dynamics',
  custody_risk:                'Custody Risk',
  undercollateralisation:      'Undercollateralisation',
  pool_default:                'Pool Default',
  inadequate_disclosure:       'Inadequate Disclosure',
};

type RegionFilter = 'all' | 'HongKong' | 'Singapore' | 'UnitedStates' | 'EuropeanUnion' | 'UAE' | 'Switzerland' | 'Japan' | 'Australia' | 'Brazil' | 'India' | 'OtherEmerging';
const ALL_REGIONS: RegionFilter[] = ['all', 'HongKong', 'Singapore', 'UnitedStates', 'EuropeanUnion', 'UAE', 'Switzerland', 'Japan', 'Australia', 'Brazil', 'India', 'OtherEmerging'];
const REGION_LABELS: Record<RegionFilter, string> = {
  all: 'All', HongKong: 'Hong Kong', Singapore: 'Singapore', UnitedStates: 'United States',
  EuropeanUnion: 'European Union', UAE: 'UAE', Switzerland: 'Switzerland', Japan: 'Japan',
  Australia: 'Australia', Brazil: 'Brazil', India: 'India', OtherEmerging: 'Other Emerging',
};

type RiskFilter = 'all' | 'clean' | 'flagged';

function getProjectRegion(jurisdiction: string): Exclude<RegionFilter, 'all'> {
  const j = jurisdiction.toLowerCase();
  if (j.includes('hong kong')) return 'HongKong';
  if (j.includes('singapore')) return 'Singapore';
  if (j.includes('united states')) return 'UnitedStates';
  if (j.includes('uae') || j.includes('united arab')) return 'UAE';
  if (j.includes('switzerland')) return 'Switzerland';
  if (j.includes('japan')) return 'Japan';
  if (j.includes('australia')) return 'Australia';
  if (j.includes('brazil')) return 'Brazil';
  if (j.includes('india')) return 'India';
  if (j.includes('eu)') || j.includes('germany') || j.includes('luxembourg') || j.includes('sweden') || j.includes('netherlands')) return 'EuropeanUnion';
  return 'OtherEmerging';
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = STATUS_META[status] ?? { label: status, color: '#737C7F', bg: 'bg-slate-800/40' };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${m.bg}`}
      style={{ color: m.color, borderColor: m.color + '50' }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ── Asset class badge ─────────────────────────────────────────────────────────

function AssetClassBadge({ cls }: { cls: ProjectAssetClass }) {
  const m = ASSET_CLASS_META[cls] ?? { label: cls, color: '#94a3b8' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border"
      style={{ color: m.color, borderColor: m.color + '40', background: m.color + '15' }}
    >
      {m.label}
    </span>
  );
}

// ── Active project card ───────────────────────────────────────────────────────

function ActiveCard({ project }: { project: Project }) {
  const entityCount = Object.keys(project.entity_map).filter(k => k !== 'token_standard').length;
  const isBoth = project.lessons_visibility === 'both';
  const tooltipText = isBoth && project.postmortem
    ? project.postmortem.outcome.slice(0, 100) + (project.postmortem.outcome.length > 100 ? '…' : '')
    : '';

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="block rounded-xl border border-[#2B3437] bg-[#13141f] hover:border-[#5E5C75]/60 hover:bg-[#1A1A2E] transition-all group relative"
      data-testid="project-card"
    >
      {isBoth && (
        <span
          className="absolute top-0 right-0 px-2 py-1 rounded-tr-xl rounded-bl-lg text-[10px] font-bold bg-slate-700/80 text-slate-300 border-b border-l border-[#2B3437] z-10 cursor-default"
          title={tooltipText}
        >
          ⚠ Historical incident
        </span>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <StatusBadge status={project.status} />
              <AssetClassBadge cls={project.asset_class} />
            </div>
            <h3 className="font-bold text-white text-sm leading-snug group-hover:text-[#5E5C75] transition-colors">
              {project.short_name}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{project.name}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
          {project.summary}
        </p>

        <div className="flex items-center justify-between text-[10px] text-slate-600 pt-3 border-t border-[#2B3437]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">language</span>
              {project.jurisdiction}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">hub</span>
              {project.chain.split(',')[0].trim()}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">account_tree</span>
              {entityCount} entities
            </span>
          </div>
          <span className="material-symbols-outlined text-[14px] text-slate-600 group-hover:text-[#5E5C75] transition-colors">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Lessons Learned card ──────────────────────────────────────────────────────

function LessonsCard({ project }: { project: Project }) {
  const entityCount = Object.keys(project.entity_map).filter(k => k !== 'token_standard').length;
  const flags = project.risk_flags ?? [];
  const visibleFlags = flags.slice(0, 3);
  const extraCount = flags.length - 3;

  const peakTvl = project.peak_tvl_usd
    ? project.peak_tvl_usd >= 1e9
      ? `$${(project.peak_tvl_usd / 1e9).toFixed(1)}B`
      : project.peak_tvl_usd >= 1e6
      ? `$${(project.peak_tvl_usd / 1e6).toFixed(0)}M`
      : `$${(project.peak_tvl_usd / 1e3).toFixed(0)}K`
    : null;

  const peakDate = project.postmortem?.incident_date ?? project.updated_at;

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="block rounded-xl border border-red-900/40 bg-slate-50 hover:border-red-700/60 hover:bg-white transition-all group relative overflow-hidden"
      data-testid="project-card-lessons"
    >
      {/* Red label strip */}
      <div className="px-4 py-1.5 bg-red-900/80 flex items-center gap-2">
        <span className="material-symbols-outlined text-red-300 text-[13px]">warning</span>
        <span className="text-[10px] font-bold text-red-200 uppercase tracking-widest">
          Lessons Learned
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <StatusBadge status={project.status} />
              <AssetClassBadge cls={project.asset_class} />
            </div>
            <h3 className="font-bold text-[#2B3437] text-sm leading-snug group-hover:text-red-800 transition-colors">
              {project.short_name}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{project.name}</p>
          </div>
        </div>

        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {visibleFlags.map(flag => (
              <span
                key={flag}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ background: '#FEE2E2', color: '#9e3f4e' }}
              >
                {RISK_FLAG_LABELS[flag] ?? flag}
              </span>
            ))}
            {extraCount > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ background: '#FEE2E2', color: '#9e3f4e' }}
              >
                +{extraCount}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
          {project.summary}
        </p>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-red-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">language</span>
              {project.jurisdiction}
            </span>
            {peakTvl && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">show_chart</span>
                Peak TVL: {peakTvl}
                {peakDate && <span className="ml-1 text-slate-400">({peakDate.slice(0, 7)})</span>}
              </span>
            )}
            {!peakTvl && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">account_tree</span>
                {entityCount} entities
              </span>
            )}
          </div>
          <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-red-700 transition-colors">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const ALL_ASSET_CLASSES: Array<ProjectAssetClass | 'all'> = ['all', 'gov_bond', 'real_estate', 'commodity', 'private_credit', 'ip_revenue', 'infrastructure', 'insurance'];
const ALL_STATUSES: Array<ProjectStatus | 'all'> = ['all', 'active', 'pilot', 'announced', 'inactive'];

export default function ProjectsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') ?? 'active') as 'active' | 'lessons';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterClass = (searchParams.get('class') ?? 'all') as ProjectAssetClass | 'all';
  const filterStatus = (searchParams.get('status') ?? 'all') as ProjectStatus | 'all';
  const filterRegion = (searchParams.get('region') ?? 'all') as RegionFilter;
  const filterRisk = (searchParams.get('risk') ?? 'all') as RiskFilter;
  const [search, setSearch] = useState('');

  function setFilter(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'all') next.delete(key); else next.set(key, value);
      return next;
    }, { replace: true });
  }

  const hasActiveFilters = filterClass !== 'all' || filterStatus !== 'all' || filterRegion !== 'all' || filterRisk !== 'all' || search.trim() !== '';

  function clearFilters() {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      ['class', 'status', 'region', 'risk'].forEach(k => next.delete(k));
      return next;
    }, { replace: true });
    setSearch('');
  }

  useEffect(() => {
    projectsApi.list()
      .then(res => setProjects(res.projects))
      .catch(() => setError('Failed to load projects data.'))
      .finally(() => setLoading(false));
  }, []);

  const activeProjects = useMemo(() =>
    projects.filter(p => {
      const v = p.lessons_visibility ?? 'active_only';
      return v === 'active_only' || v === 'both';
    }),
    [projects],
  );

  const lessonsProjects = useMemo(() =>
    projects
      .filter(p => {
        const v = p.lessons_visibility ?? 'active_only';
        return v === 'lessons_only' || v === 'both';
      })
      .sort((a, b) => (b.peak_tvl_usd ?? 0) - (a.peak_tvl_usd ?? 0)),
    [projects],
  );

  const baseList = view === 'lessons' ? lessonsProjects : activeProjects;

  const filtered = useMemo(() => {
    return baseList
      .filter(p => filterClass === 'all' || p.asset_class === filterClass)
      .filter(p => filterStatus === 'all' || p.status === filterStatus)
      .filter(p => filterRegion === 'all' || getProjectRegion(p.jurisdiction) === filterRegion)
      .filter(p => {
        if (filterRisk === 'all') return true;
        const hasFlags = (p.risk_flags ?? []).length > 0;
        return filterRisk === 'flagged' ? hasFlags : !hasFlags;
      })
      .filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.short_name.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.jurisdiction.toLowerCase().includes(q)
        );
      });
  }, [baseList, filterClass, filterStatus, filterRegion, filterRisk, search]);

  function switchView(v: 'active' | 'lessons') {
    setSearchParams(v === 'active' ? {} : { view: 'lessons' }, { replace: true });
    setSearch('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
          progress_activity
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-red-500 text-sm">{error}</div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-5">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
          Projects
        </div>
        <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">RWA Project Library</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Structured anatomy of leading RWA tokenization projects — entity maps, RARM reference
          assessments, and regulatory context. Curated from public disclosures. Not a platform
          rating or investment recommendation.
        </p>
        <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-900/40">
          <span className="material-symbols-outlined text-amber-500 text-sm shrink-0">info</span>
          <p className="text-[11px] text-amber-400/80 leading-relaxed">
            Profiles are curated from public disclosures only. No platform ratings or scores are
            assigned. Use the{' '}
            <Link to="/score" className="underline hover:text-amber-300">
              Due Diligence Workbook
            </Link>{' '}
            to build your own private RARM assessment.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-[#DBE4E7]">
        <button
          onClick={() => switchView('active')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            view === 'active'
              ? 'border-[#5E5C75] text-[#5E5C75]'
              : 'border-transparent text-slate-400 hover:text-[#2B3437]'
          }`}
        >
          Active Projects
          <span className="ml-1.5 text-[11px] font-normal text-slate-500">({activeProjects.length})</span>
        </button>
        <button
          onClick={() => switchView('lessons')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            view === 'lessons'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-400 hover:text-[#2B3437]'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">warning</span>
          Lessons Learned
          <span className="ml-0.5 text-[11px] font-normal text-slate-500">({lessonsProjects.length})</span>
        </button>
      </div>

      {/* Lessons tab description */}
      {view === 'lessons' && (
        <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-sm shrink-0 mt-0.5">error_outline</span>
            <div>
              <p className="text-sm font-semibold text-red-800 mb-1">Postmortem Case Studies</p>
              <p className="text-xs text-red-700 leading-relaxed">
                Historical RWA and stablecoin failures analysed through the RARM framework. Each
                profile identifies which RARM layers failed and what structural safeguards could have
                prevented or mitigated the incident. For educational and due-diligence purposes only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 space-y-2.5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1A1A2E] border border-[#2B3437] rounded-lg pl-8 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#5E5C75]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium w-20 shrink-0">Asset class</span>
          {ALL_ASSET_CLASSES.map(c => {
            const label = c === 'all' ? 'All' : ASSET_CLASS_META[c].label;
            const color = c !== 'all' ? ASSET_CLASS_META[c].color : '#5E5C75';
            const active = filterClass === c;
            return (
              <button
                key={c}
                onClick={() => setFilter('class', c)}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap border ${
                  active ? 'text-white' : 'bg-transparent text-slate-400 hover:text-white'
                }`}
                style={active
                  ? { background: color, borderColor: color }
                  : { borderColor: '#2B3437' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium w-20 shrink-0">Status</span>
          {ALL_STATUSES.map(s => {
            const label = s === 'all' ? 'All' : STATUS_META[s].label;
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilter('status', s)}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap border ${
                  active
                    ? 'bg-[#5E5C75] text-white border-[#5E5C75]'
                    : 'bg-transparent border-[#2B3437] text-slate-400 hover:border-[#5E5C75] hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium w-20 shrink-0">Region</span>
          {ALL_REGIONS.map(r => {
            const active = filterRegion === r;
            return (
              <button
                key={r}
                onClick={() => setFilter('region', r)}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap border ${
                  active
                    ? 'bg-[#5E5C75] text-white border-[#5E5C75]'
                    : 'bg-transparent border-[#2B3437] text-slate-400 hover:border-[#5E5C75] hover:text-white'
                }`}
              >
                {REGION_LABELS[r]}
              </button>
            );
          })}
        </div>

        {view !== 'lessons' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium w-20 shrink-0">Risk flags</span>
            {(['all', 'clean', 'flagged'] as RiskFilter[]).map(r => {
              const labels: Record<RiskFilter, string> = { all: 'All', clean: 'Clean (no flags)', flagged: 'Has risk flags' };
              const active = filterRisk === r;
              return (
                <button
                  key={r}
                  onClick={() => setFilter('risk', r)}
                  className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap border ${
                    active
                      ? 'bg-[#5E5C75] text-white border-[#5E5C75]'
                      : 'bg-transparent border-[#2B3437] text-slate-400 hover:border-[#5E5C75] hover:text-white'
                  }`}
                >
                  {labels[r]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-600">
          Showing {filtered.length} of {baseList.length} project{baseList.length !== 1 ? 's' : ''}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No projects match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p =>
            view === 'lessons'
              ? <LessonsCard key={p.slug} project={p} />
              : <ActiveCard key={p.slug} project={p} />,
          )}
        </div>
      )}

      <div className="mt-8 p-5 rounded-xl border border-[#2B3437] bg-[#1A1A2E] text-center">
        <span className="material-symbols-outlined text-slate-600 text-3xl mb-2 block">
          pending
        </span>
        <p className="text-sm text-slate-500">
          More profiles being added. All data sourced from official project websites, regulator filings, and DeFiLlama.
        </p>
      </div>
    </div>
  );
}
