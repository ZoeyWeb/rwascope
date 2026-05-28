import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '../../hooks/usePagination';
import { Link, useSearchParams } from 'react-router-dom';
import type { Project, ProjectAssetClass, ProjectStatus } from '../../types/projects';
import { ASSET_CLASS_META, STATUS_META } from '../../types/projects';
import { projectsApi } from '../../api/client';

const RISK_FLAG_LABELS: Record<string, string> = {
  de_peg: 'De-peg', regulatory_action: 'Regulatory Action', audit_issue: 'Audit Issue',
  paused: 'Paused', failed: 'Failed', historical_pool_defaults: 'Historical Pool Defaults',
  early_underwriting_issues: 'Early Underwriting Issues', silicon_valley_bank_exposure: 'SVB Exposure',
  regulatory_uncertainty: 'Regulatory Uncertainty', real_estate_liquidity_crisis: 'RE Liquidity Crisis',
  illiquid_backing: 'Illiquid Backing', defi_integration_risk: 'DeFi Integration Risk',
  mim_liquidation_cascade: 'MIM Liquidation Cascade', governance_conflict: 'Governance Conflict',
  low_volume: 'Low Volume', nft_liquidity_risk: 'NFT Liquidity', legal_uncertainty: 'Legal Uncertainty',
  algorithmic_peg_failure: 'Algorithmic Peg Failure', reflexive_collateral: 'Reflexive Collateral',
  bank_run_dynamics: 'Bank Run Dynamics', yield_sustainability: 'Yield Sustainability',
  ponzi_dynamics: 'Ponzi Dynamics', custody_risk: 'Custody Risk',
  undercollateralisation: 'Undercollateralisation', pool_default: 'Pool Default',
  inadequate_disclosure: 'Inadequate Disclosure',
};

type RegionFilter = 'all' | 'HongKong' | 'Singapore' | 'UnitedStates' | 'EuropeanUnion' | 'UAE' | 'Switzerland' | 'Japan' | 'Australia' | 'Brazil' | 'India' | 'OtherEmerging';
const ALL_REGIONS: RegionFilter[] = ['all', 'HongKong', 'Singapore', 'UnitedStates', 'EuropeanUnion', 'UAE', 'Switzerland', 'Japan', 'Australia', 'Brazil', 'India', 'OtherEmerging'];
const REGION_LABELS: Record<RegionFilter, string> = {
  all: 'All', HongKong: 'Hong Kong', Singapore: 'Singapore', UnitedStates: 'United States',
  EuropeanUnion: 'EU', UAE: 'UAE', Switzerland: 'Switzerland', Japan: 'Japan',
  Australia: 'Australia', Brazil: 'Brazil', India: 'India', OtherEmerging: 'Other',
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

// ── Logo: Clearbit + initials fallback ───────────────────────────────────────

function ProjectLogo({ website, shortName, assetColor }: { website: string; shortName: string; assetColor: string }) {
  const [failed, setFailed] = useState(false);
  const domain = (() => {
    try { return new URL(website).hostname.replace(/^www\./, ''); } catch { return ''; }
  })();
  const initials = shortName.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase();

  if (!domain || failed) {
    return (
      <div
        className="w-11 h-11 flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ background: assetColor + 'cc' }}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={shortName}
      className="w-11 h-11 object-contain shrink-0 bg-white p-1 border border-ed-hairline"
      onError={() => setFailed(true)}
    />
  );
}

// ── Active project card ───────────────────────────────────────────────────────

function ActiveCard({ project }: { project: Project }) {
  const isBoth = project.lessons_visibility === 'both';
  const assetMeta = ASSET_CLASS_META[project.asset_class] ?? { label: project.asset_class, color: '#78716C' };
  const statusMeta = STATUS_META[project.status] ?? { label: project.status };

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="flex flex-col border border-ed-hairline bg-ed-surface hover:border-ed-ink hover:shadow-sm transition-all group p-5"
      data-testid="project-card"
    >
      {/* Logo + meta */}
      <div className="flex items-start gap-3 mb-4">
        <ProjectLogo website={project.website ?? ''} shortName={project.short_name} assetColor={assetMeta.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="text-ed-eyebrow uppercase tracking-[0.10em] font-medium text-[10px]"
              style={{ color: assetMeta.color }}
            >
              {assetMeta.label}
            </span>
            <span className="text-ed-text-faint text-[10px]">·</span>
            <span className="text-ed-eyebrow uppercase tracking-[0.10em] font-medium text-[10px] text-ed-text-muted">
              {statusMeta.label}
            </span>
            {isBoth && (
              <>
                <span className="text-ed-text-faint text-[10px]">·</span>
                <span className="text-ed-eyebrow uppercase tracking-[0.10em] font-medium text-[10px] text-ed-incident">
                  Incident
                </span>
              </>
            )}
          </div>
          <h3 className="text-ed-item-h4 font-semibold text-ed-text-primary group-hover:text-ed-ink-hover leading-tight">
            {project.short_name}
          </h3>
          <p className="text-[11px] text-ed-text-faint mt-0.5 truncate">{project.jurisdiction.split(',')[0]}</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-ed-body text-ed-text-secondary leading-relaxed line-clamp-3 flex-1 mb-4">
        {project.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-ed-hairline">
        <span className="text-[11px] text-ed-text-faint">{project.chain.split(',')[0].trim()}</span>
        <span className="material-symbols-outlined text-[14px] text-ed-text-faint group-hover:text-ed-ink transition-colors">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

// ── Lessons Learned card ──────────────────────────────────────────────────────

function LessonsCard({ project }: { project: Project }) {
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
  const assetMeta = ASSET_CLASS_META[project.asset_class] ?? { label: project.asset_class, color: '#78716C' };

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="block border border-ed-incident/20 bg-ed-surface hover:border-ed-incident/50 hover:shadow-sm transition-all group p-5 relative overflow-hidden"
      data-testid="project-card-lessons"
    >
      {/* Incident strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-ed-incident" />

      {/* Logo + meta */}
      <div className="flex items-start gap-3 mb-4 mt-1">
        <ProjectLogo website={project.website ?? ''} shortName={project.short_name} assetColor="#B91C1C" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-ed-eyebrow uppercase tracking-[0.10em] font-medium text-[10px] text-ed-incident">
              Lessons Learned
            </span>
            <span className="text-ed-text-faint text-[10px]">·</span>
            <span
              className="text-ed-eyebrow uppercase tracking-[0.10em] font-medium text-[10px]"
              style={{ color: assetMeta.color }}
            >
              {assetMeta.label}
            </span>
          </div>
          <h3 className="text-ed-item-h4 font-semibold text-ed-text-primary group-hover:text-ed-incident leading-tight">
            {project.short_name}
          </h3>
          {peakTvl && (
            <p className="text-[11px] text-ed-text-faint mt-0.5">Peak TVL {peakTvl}</p>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {visibleFlags.map(flag => (
            <span
              key={flag}
              className="px-2 py-0.5 text-[10px] font-medium border border-ed-incident/25 text-ed-incident bg-ed-incident/5"
            >
              {RISK_FLAG_LABELS[flag] ?? flag}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-ed-text-muted border border-ed-hairline">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      <p className="text-ed-body text-ed-text-secondary leading-relaxed line-clamp-3 mb-4">
        {project.summary}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-ed-hairline">
        <span className="text-[11px] text-ed-text-faint">{project.jurisdiction.split(',')[0]}</span>
        <span className="material-symbols-outlined text-[14px] text-ed-text-faint group-hover:text-ed-incident transition-colors">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────────────

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] border transition-colors whitespace-nowrap ${
        active
          ? 'bg-ed-ink text-white border-ed-ink'
          : 'bg-transparent border-ed-hairline text-ed-text-muted hover:border-ed-ink hover:text-ed-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const ALL_ASSET_CLASSES: Array<ProjectAssetClass | 'all'> = [
  'all', 'gov_bond', 'real_estate', 'commodity', 'private_credit',
  'ip_revenue', 'infrastructure', 'insurance',
];
const ALL_STATUSES: Array<ProjectStatus | 'all'> = [
  'all', 'active', 'pilot', 'announced', 'inactive', 'paused', 'failed',
];

export default function ProjectsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') ?? 'active') as 'active' | 'lessons';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterClass  = (searchParams.get('class')  ?? 'all') as ProjectAssetClass | 'all';
  const filterStatus = (searchParams.get('status') ?? 'all') as ProjectStatus | 'all';
  const filterRegion = (searchParams.get('region') ?? 'all') as RegionFilter;
  const filterRisk   = (searchParams.get('risk')   ?? 'all') as RiskFilter;
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
    }), [projects]);

  const lessonsProjects = useMemo(() =>
    projects
      .filter(p => {
        const v = p.lessons_visibility ?? 'active_only';
        return v === 'lessons_only' || v === 'both';
      })
      .sort((a, b) => (b.peak_tvl_usd ?? 0) - (a.peak_tvl_usd ?? 0)),
    [projects]);

  const baseList = view === 'lessons' ? lessonsProjects : activeProjects;

  const filtered = useMemo(() =>
    baseList
      .filter(p => filterClass  === 'all' || p.asset_class === filterClass)
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
      }),
    [baseList, filterClass, filterStatus, filterRegion, filterRisk, search]);

  const { visible, loadMore, canLoadMore } = usePagination(filtered, 20);

  const glanceStats = useMemo(() => ({
    total:        projects.length,
    active:       projects.filter(p => p.status === 'active').length,
    jurisdictions: new Set(projects.map(p => p.jurisdiction)).size,
    assetClasses: new Set(projects.map(p => p.asset_class)).size,
  }), [projects]);

  function switchView(v: 'active' | 'lessons') {
    setSearchParams(v === 'active' ? {} : { view: 'lessons' }, { replace: true });
    setSearch('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-3xl text-ed-text-muted">
          progress_activity
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-16 text-center text-ed-incident text-ed-body">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-ed-canvas min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 pt-16 pb-12">
        <p className="text-ed-eyebrow uppercase tracking-[0.18em] font-medium text-ed-text-muted mb-4">
          Projects
        </p>
        <h1 className="text-ed-hero-h1 font-semibold text-ed-text-primary leading-none mb-5 max-w-3xl">
          RWA Project Library
        </h1>
        <p className="text-ed-lede text-ed-text-secondary leading-relaxed max-w-2xl mb-2">
          Structured anatomy of leading RWA tokenization projects — entity maps, RARM reference
          assessments, and regulatory context. Curated from public disclosures.
        </p>
        <p className="text-ed-body text-ed-text-muted max-w-2xl">
          Not a platform rating or investment recommendation. Use the{' '}
          <Link to="/score" className="underline hover:text-ed-text-primary transition-colors">
            Due Diligence Workbook
          </Link>{' '}
          to build your own private RARM assessment.
        </p>
      </section>

      {/* ── At a Glance — full-bleed cool ─────────────────────────────────── */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-cool border-y border-ed-hairline">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-ed-hairline">
            {([
              { label: 'Total profiles',  value: glanceStats.total },
              { label: 'Active',          value: glanceStats.active },
              { label: 'Jurisdictions',   value: glanceStats.jurisdictions },
              { label: 'Asset classes',   value: glanceStats.assetClasses },
            ] as const).map(({ label, value }) => (
              <div key={label} className="px-8 first:pl-0 last:pr-0 py-1">
                <div className="text-ed-section-h2 font-semibold text-ed-text-primary tabular-nums leading-none mb-1">
                  {value}
                </div>
                <div className="text-ed-eyebrow uppercase tracking-[0.12em] text-ed-text-muted">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Directory ─────────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 py-12">

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-ed-hairline mb-8">
          <button
            onClick={() => switchView('active')}
            className={`px-0 mr-8 py-3 text-ed-body-lg font-medium border-b-2 -mb-px transition-colors ${
              view === 'active'
                ? 'border-ed-ink text-ed-text-primary'
                : 'border-transparent text-ed-text-muted hover:text-ed-text-primary'
            }`}
          >
            Active Projects
            <span className="ml-2 text-ed-meta text-ed-text-faint tabular-nums">
              {activeProjects.length}
            </span>
          </button>
          <button
            onClick={() => switchView('lessons')}
            className={`px-0 py-3 text-ed-body-lg font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              view === 'lessons'
                ? 'border-ed-incident text-ed-incident'
                : 'border-transparent text-ed-text-muted hover:text-ed-text-primary'
            }`}
          >
            Lessons Learned
            <span className="text-ed-meta text-ed-text-faint tabular-nums">
              {lessonsProjects.length}
            </span>
          </button>
        </div>

        {/* Lessons context strip */}
        {view === 'lessons' && (
          <div className="mb-8 border-l-2 border-ed-incident pl-4">
            <p className="text-ed-body text-ed-text-secondary leading-relaxed">
              Historical RWA and stablecoin failures analysed through the RARM framework.
              Each profile identifies which RARM layers failed and what structural safeguards
              could have prevented or mitigated the incident.
            </p>
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-8 space-y-3">
          {/* Search */}
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-ed-text-faint text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-ed-hairline bg-ed-surface pl-9 pr-4 py-2 text-ed-body text-ed-text-primary placeholder-ed-text-faint focus:outline-none focus:border-ed-ink transition-colors"
            />
          </div>

          {/* Asset class */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-ed-eyebrow uppercase tracking-[0.12em] text-ed-text-faint w-24 shrink-0">
              Asset class
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ASSET_CLASSES.map(c => (
                <Pill key={c} active={filterClass === c} onClick={() => setFilter('class', c)}>
                  {c === 'all' ? 'All' : ASSET_CLASS_META[c].label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-ed-eyebrow uppercase tracking-[0.12em] text-ed-text-faint w-24 shrink-0">
              Status
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map(s => (
                <Pill key={s} active={filterStatus === s} onClick={() => setFilter('status', s)}>
                  {s === 'all' ? 'All' : STATUS_META[s].label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Region */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-ed-eyebrow uppercase tracking-[0.12em] text-ed-text-faint w-24 shrink-0">
              Region
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_REGIONS.map(r => (
                <Pill key={r} active={filterRegion === r} onClick={() => setFilter('region', r)}>
                  {REGION_LABELS[r]}
                </Pill>
              ))}
            </div>
          </div>

          {/* Risk flags — active tab only */}
          {view !== 'lessons' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-ed-eyebrow uppercase tracking-[0.12em] text-ed-text-faint w-24 shrink-0">
                Risk flags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'clean', 'flagged'] as RiskFilter[]).map(r => {
                  const labels: Record<RiskFilter, string> = {
                    all: 'All', clean: 'No flags', flagged: 'Flagged',
                  };
                  return (
                    <Pill key={r} active={filterRisk === r} onClick={() => setFilter('risk', r)}>
                      {labels[r]}
                    </Pill>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear */}
          {hasActiveFilters && (
            <div>
              <button
                onClick={clearFilters}
                className="text-ed-meta text-ed-text-muted hover:text-ed-text-primary flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Card list */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-ed-body text-ed-text-muted">
            No projects match the current filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map(p =>
                view === 'lessons'
                  ? <LessonsCard key={p.slug} project={p} />
                  : <ActiveCard  key={p.slug} project={p} />,
              )}
            </div>
            {canLoadMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-2.5 text-ed-body text-ed-text-muted border border-ed-hairline hover:border-ed-ink hover:text-ed-text-primary transition-colors"
                >
                  Load more
                  <span className="ml-2 text-ed-meta text-ed-text-faint tabular-nums">
                    {filtered.length - visible.length} remaining
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-ed-hairline">
          <p className="text-ed-meta text-ed-text-faint">
            Profiles sourced from official project websites, regulator filings, and DeFiLlama.
            Coverage expanding.
          </p>
        </div>

      </section>
    </div>
  );
}
