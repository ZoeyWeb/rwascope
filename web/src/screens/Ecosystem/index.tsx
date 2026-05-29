/**
 * HK RWA Ecosystem Map — public, no login required.
 *
 * Three view modes (controlled via URL params):
 *   /ecosystem                          → Single Region
 *   /ecosystem?view=compare&a=HK&b=SG  → Compare two regions
 *   /ecosystem?view=network             → Global force-directed network
 *
 * No scores, ratings, or platform opinions.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import DisclaimerBanner from '../../components/DisclaimerBanner';
import RegionSelector from '../../components/ecosystem/RegionSelector';
import CompareView from '../../components/ecosystem/CompareView';
import GlobalNetworkView from '../../components/ecosystem/GlobalNetworkView';
import type { Region } from '../../components/ecosystem/RegionSelector';
import type {
  EcosystemData, EcosystemLayer, EcosystemParticipant, EcosystemGap,
} from '../../types/ecosystem';

// ── Data loader ───────────────────────────────────────────────────────────────

async function loadEcosystem(dataFile: string): Promise<EcosystemData> {
  const res = await fetch(`/data/ecosystem/${dataFile}`);
  if (!res.ok) throw new Error('Failed to load ecosystem data');
  return res.json();
}

// ── View mode type ────────────────────────────────────────────────────────────

type ViewMode = 'single' | 'compare' | 'network';

// ── Label maps ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  regulator: 'Regulator',
  exchange: 'Exchange',
  bank: 'Bank',
  consortium: 'Consortium',
  asset_manager: 'Asset Manager',
  vatp: 'VATP',
  international_org: 'International Org',
  sovereign_bond: 'Sovereign Bond',
  commodity: 'Commodity',
  fund: 'Fund',
  custody: 'Custodian',
  issuance_platform: 'Issuance Platform',
  broker: 'Broker-Dealer',
  compliance_provider: 'Compliance',
  legal_firm: 'Legal',
  audit_firm: 'Audit',
};

const RARM_COLOR: Record<string, string> = {
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
  gray: '#737C7F',
};

const GAP_ICON: Record<string, string> = {
  data_gap: 'search',
  market_gap: 'trending_up',
  research_gap: 'warning',
};

const GAP_LABEL: Record<string, string> = {
  data_gap: 'Data Gap',
  market_gap: 'Market Gap',
  research_gap: 'Research Gap',
};

const GAP_SEVERITY_STYLE: Record<string, string> = {
  low: 'border-blue-800 bg-blue-950/50 text-blue-300',
  medium: 'border-amber-700 bg-amber-950/50 text-amber-300',
  high: 'border-orange-700 bg-orange-950/50 text-orange-300',
  critical: 'border-red-700 bg-red-950/50 text-red-300',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <div>
      <div className="text-ed-eyebrow uppercase text-ed-text-muted">{label}</div>
      <div className="text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{value}</div>
      {sub && <div className="text-ed-meta text-ed-text-muted mt-1">{sub}</div>}
    </div>
  );
}

function GapBadge({ gap }: { gap: EcosystemGap }) {
  const isHigh = gap.severity === 'high' || gap.severity === 'critical';
  return (
    <div className={`flex items-start gap-3 border-t border-ed-hairline py-3 ${isHigh ? 'text-ed-incident' : 'text-ed-text-secondary'}`}>
      <span className="material-symbols-outlined text-[15px] mt-0.5 shrink-0">
        {GAP_ICON[gap.gap_type]}
      </span>
      <div>
        <span className="text-ed-eyebrow uppercase block mb-1">
          {GAP_LABEL[gap.gap_type]} · {gap.severity}
        </span>
        <p className="text-ed-meta text-ed-text-primary font-medium leading-snug">{gap.title}</p>
        <p className="text-ed-meta text-ed-text-secondary leading-snug mt-0.5">{gap.description}</p>
      </div>
    </div>
  );
}

function ParticipantChip({
  p,
  accentColor,
  onNavigate,
}: {
  p: EcosystemParticipant;
  accentColor?: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-ed-hairline text-ed-meta text-ed-text-primary hover:border-ed-ink hover:bg-ed-surface-cool transition-colors"
      >
        {p.rarm_signal && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: RARM_COLOR[p.rarm_signal] }}
          />
        )}
        {p.name}
        <span className="material-symbols-outlined text-[12px]">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 min-w-[260px] max-w-[320px] border border-ed-hairline p-4 bg-ed-surface shadow-sm text-left">
          <div className="text-ed-meta font-semibold text-ed-text-primary mb-1">{p.full_name}</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-ed-eyebrow uppercase text-ed-text-muted">
              {TYPE_LABEL[p.type] ?? p.type}
            </span>
            {p.confidence_level && p.confidence_level !== 'high' && (
              <span className="text-ed-eyebrow uppercase text-ed-warn-text">
                {p.confidence_level} confidence
              </span>
            )}
          </div>
          <p className="text-ed-meta text-ed-text-secondary leading-relaxed mb-3">{p.role}</p>
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {p.tags.map(t => (
                <span key={t} className="text-ed-eyebrow uppercase px-1.5 py-0.5 bg-ed-surface-cool text-ed-text-muted">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2 border-t border-ed-hairline">
            {p.issuer_slug && (
              <button
                onClick={onNavigate}
                className="text-ed-eyebrow uppercase text-ed-accent hover:text-ed-ink transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                Issuer Profile
              </button>
            )}
            {p.asset_slug && (
              <button
                onClick={onNavigate}
                className="text-ed-eyebrow uppercase text-ed-accent hover:text-ed-ink transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                Asset Profile
              </button>
            )}
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ed-eyebrow uppercase text-ed-accent hover:text-ed-ink transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[11px]">language</span>
                Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Editorial Layer Row ────────────────────────────────────────────────────────

function Layer3DCard({
  layer,
  gaps,
  isLast,
}: {
  layer: EcosystemLayer;
  gaps: EcosystemGap[];
  isActive: boolean;
  onClick: () => void;
  isLast?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <article className={`border-t border-ed-hairline py-ed-section-md ${isLast ? '' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-8 md:gap-12">
        {/* Left: label + description */}
        <div>
          <div className="w-1 h-6 mb-3" style={{ background: layer.color }} />
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">
            Layer {layer.order}
          </div>
          <h3 className="text-ed-block-h3 text-ed-text-primary mt-2">{layer.label}</h3>
          <div className="text-ed-meta text-ed-text-secondary mt-1">{layer.sublabel}</div>
          <p className="text-ed-body text-ed-text-secondary mt-ed-section-sm leading-relaxed">
            {layer.description}
          </p>
          {layer.launched_at && (
            <div className="text-ed-eyebrow text-ed-text-muted mt-ed-section-sm">
              Launched{' '}
              {new Date(layer.launched_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              {layer.source && ` · ${layer.source}`}
            </div>
          )}
          {gaps.length > 0 && (
            <div className="text-ed-eyebrow text-ed-incident mt-2">
              {gaps.length} structural gap{gaps.length !== 1 ? 's' : ''}
            </div>
          )}
          {(layer.participants_note || layer.applicants_note) && (
            <div className="text-ed-meta text-ed-text-muted mt-ed-section-sm italic">
              {layer.participants_note ?? layer.applicants_note}
            </div>
          )}
        </div>

        {/* Right: participants */}
        <div className="flex flex-wrap gap-2 content-start pt-1">
          {layer.participants.map(p => (
            <ParticipantChip
              key={p.id}
              p={p}
              accentColor={layer.color}
              onNavigate={() => {
                if (p.issuer_slug) navigate(`/licenses/${p.issuer_slug}`);
                else if (p.asset_slug) navigate(`/assets/${p.asset_slug}`);
              }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

// ── Custom tooltip for Recharts ────────────────────────────────────────────────

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { payload: { category: string; count: number; color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1A1A2E] border border-[#2B3437] rounded px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-white">{d.category}</div>
      <div className="text-slate-400 mt-0.5">
        <span style={{ color: d.color }}>{d.count}</span> participant{d.count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ── View mode tab button ───────────────────────────────────────────────────────

function ViewTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-ed-meta uppercase tracking-[0.12em] transition-colors border-b-2 -mb-px ${
        active
          ? 'text-ed-text-primary border-ed-ink'
          : 'text-ed-text-muted hover:text-ed-text-primary border-transparent'
      }`}
    >
      <span className="material-symbols-outlined text-base align-middle">{icon}</span>
      {label}
    </button>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EcosystemMap() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive view mode + compare params from URL
  const urlView = searchParams.get('view') as ViewMode | null;
  const viewMode: ViewMode = urlView === 'compare' || urlView === 'network' ? urlView : 'single';
  const urlA = searchParams.get('a') ?? 'HK';
  const urlB = searchParams.get('b') ?? 'SG';

  // Single-region state
  const [data, setData] = useState<EcosystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'diagram' | 'chart'>('diagram');
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState(urlA !== 'SG' ? urlA : 'HK');
  const [regions, setRegions] = useState<Region[]>([]);

  // Hero stats (for Global Network view)
  const [heroStats, setHeroStats] = useState({ projectCount: 0, assetClassCount: 0 });

  // Load regions list once
  useEffect(() => {
    fetch('/data/ecosystem/regions.json')
      .then(r => r.json())
      .then((d: Region[]) => setRegions(d))
      .catch(() => {});
  }, []);

  // Load hero stats once
  useEffect(() => {
    fetch('/data/projects/projects.json')
      .then(r => r.json())
      .then((projects: { asset_class?: string }[]) => {
        if (!Array.isArray(projects)) return;
        const classes = new Set(projects.map(p => p.asset_class).filter(Boolean));
        setHeroStats({ projectCount: projects.length, assetClassCount: classes.size });
      })
      .catch(() => {});
  }, []);

  // Load single-region data
  useEffect(() => {
    if (viewMode !== 'single') return;
    setLoading(true);
    setError('');
    const region = regions.find(r => r.id === selectedRegion);
    const file = region?.data_file ?? `${selectedRegion.toLowerCase()}.json`;
    loadEcosystem(file)
      .then(d => {
        setData(d);
        const sorted = [...d.layers].sort((a, b) => a.order - b.order);
        if (sorted.length > 0) setActiveLayerId(sorted[0].id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedRegion, viewMode, regions]);

  // ── URL param helpers ────────────────────────────────────────────────────────

  function setViewMode(mode: ViewMode) {
    const next = new URLSearchParams(searchParams);
    if (mode === 'single') {
      next.delete('view');
      next.delete('a');
      next.delete('b');
    } else if (mode === 'compare') {
      next.set('view', 'compare');
      if (!next.get('a')) next.set('a', 'HK');
      if (!next.get('b')) next.set('b', 'SG');
    } else {
      next.set('view', 'network');
      next.delete('a');
      next.delete('b');
    }
    setSearchParams(next, { replace: true });
  }

  function setRegionA(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set('a', id);
    setSearchParams(next, { replace: true });
  }

  function setRegionB(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set('b', id);
    setSearchParams(next, { replace: true });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const sortedLayers = data ? [...data.layers].sort((a, b) => a.order - b.order) : [];

  const currentRegion = regions.find(r => r.id === selectedRegion);

  return (
    <div className="max-w-[1400px] mx-auto px-8">
      {/* Hero */}
      <section className="py-ed-hero">
        <div className="text-ed-eyebrow uppercase text-ed-text-muted">Regional Ecosystem</div>
        <h1 className="text-ed-hero-h1 text-ed-text-primary mt-4">
          {currentRegion?.name ?? 'Ecosystem Map'}
        </h1>
        <p className="text-ed-lede text-ed-text-secondary mt-ed-section-sm max-w-3xl">
          Six-layer participant map across regulators, custodians, issuers, and infrastructure.
        </p>
        {regions.length > 0 && (
          <div className="mt-ed-section-md">
            <RegionSelector
              regions={regions}
              activeRegion={selectedRegion}
              onChange={setSelectedRegion}
            />
          </div>
        )}
      </section>

      {/* View mode tabs */}
      <div className="flex gap-1 mb-8 border-b border-ed-hairline">
        <ViewTab
          active={viewMode === 'single'}
          icon="layers"
          label="Single Region"
          onClick={() => setViewMode('single')}
        />
        <ViewTab
          active={viewMode === 'compare'}
          icon="compare"
          label="Compare"
          onClick={() => setViewMode('compare')}
        />
        <ViewTab
          active={viewMode === 'network'}
          icon="hub"
          label="Global Network"
          onClick={() => setViewMode('network')}
        />
      </div>

      {/* ── COMPARE view ──────────────────────────────────────────────────────── */}
      {viewMode === 'compare' && regions.length > 0 && (
        <CompareView
          regions={regions}
          regionAId={urlA}
          regionBId={urlB}
          onRegionAChange={setRegionA}
          onRegionBChange={setRegionB}
        />
      )}

      {/* ── GLOBAL NETWORK view ───────────────────────────────────────────────── */}
      {viewMode === 'network' && regions.length > 0 && (
        <GlobalNetworkView
          regions={regions}
          projectCount={heroStats.projectCount}
          assetClassCount={heroStats.assetClassCount}
        />
      )}

      {/* ── SINGLE REGION view ────────────────────────────────────────────────── */}
      {viewMode === 'single' && (
        <>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-ed-accent">
                progress_activity
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="py-12 text-ed-meta text-ed-text-muted">{error}</div>
          )}

          {!loading && !error && data && (() => {
            const { meta, stats, gaps, participant_type_chart } = data;
            return (
              <>
                {/* Stats strip */}
                <section className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-cool border-y border-ed-hairline py-ed-section-md mb-8">
                  <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
                    <StatCard value={stats.regulators} label="Regulators" />
                    <StatCard value={stats.licensed_stablecoin_issuers} label="Licensed Issuers" />
                    <StatCard value={stats.ensembletx_institutions} label="EnsembleTX Institutions" />
                    <StatCard value={stats.licensed_vatps} label="Licensed VATPs" />
                  </div>
                </section>

                {/* Inner tab switcher */}
                <div className="flex gap-1 mb-6 border-b border-ed-hairline">
                  <button
                    onClick={() => setActiveTab('diagram')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-ed-meta uppercase tracking-[0.12em] transition-colors border-b-2 -mb-px ${
                      activeTab === 'diagram'
                        ? 'text-ed-text-primary border-ed-ink'
                        : 'text-ed-text-muted hover:text-ed-text-primary border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base align-middle">account_tree</span>
                    Architecture
                  </button>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-ed-meta uppercase tracking-[0.12em] transition-colors border-b-2 -mb-px ${
                      activeTab === 'chart'
                        ? 'text-ed-text-primary border-ed-ink'
                        : 'text-ed-text-muted hover:text-ed-text-primary border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base align-middle">bar_chart</span>
                    Distribution
                  </button>
                </div>

                {/* Architecture diagram */}
                {activeTab === 'diagram' && (
                  <div>
                    {sortedLayers.map((layer, idx) => (
                      <Layer3DCard
                        key={layer.id}
                        layer={layer}
                        gaps={(gaps ?? []).filter(g => g.layer_id === layer.id)}
                        isActive={false}
                        onClick={() => {}}
                        isLast={idx === sortedLayers.length - 1}
                      />
                    ))}
                  </div>
                )}

                {/* Participant distribution chart */}
                {activeTab === 'chart' && (
                  <div className="py-ed-section-md">
                    <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">Participant Distribution</div>
                    <h2 className="text-ed-block-h3 text-ed-text-primary mb-6">By Category</h2>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={participant_type_chart}
                        margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                        barCategoryGap="30%"
                      >
                        <XAxis
                          dataKey="category"
                          tick={{ fill: '#78716C', fontSize: 11 }}
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                          dy={6}
                        />
                        <YAxis tick={{ fill: '#78716C', fontSize: 11 }} allowDecimals={false} width={28} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1A1A2E08' }} />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {participant_type_chart.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-4">
                      {participant_type_chart.map(e => (
                        <div key={e.category} className="flex items-center gap-1.5 text-ed-eyebrow uppercase text-ed-text-muted">
                          <span className="w-2 h-2" style={{ background: e.color }} />
                          {e.category}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps — full-bleed sunken */}
                {gaps && gaps.length > 0 && (
                  <section className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-sunken border-y border-ed-hairline py-ed-section mt-ed-section">
                    <div className="max-w-[1400px] mx-auto px-8">
                      <div className="text-ed-eyebrow uppercase text-ed-text-muted">Structural Gaps</div>
                      <h2 className="text-ed-section-h2 text-ed-text-primary mt-3">
                        Where the ecosystem is incomplete
                      </h2>
                      <div className="mt-ed-section-md">
                        {gaps.map(gap => <GapBadge key={gap.id} gap={gap} />)}
                        <div className="border-t border-ed-hairline" />
                      </div>
                    </div>
                  </section>
                )}

                {/* Data sources footer */}
                <div className="mt-ed-section-lg border-t border-ed-hairline pt-ed-section-md">
                  <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">Data Sources</div>
                  <ul className="grid md:grid-cols-2 gap-1">
                    {meta.sources.map((src, i) => (
                      <li key={i} className="text-ed-meta text-ed-text-secondary flex gap-2">
                        <span className="text-ed-accent">·</span>
                        {src}
                      </li>
                    ))}
                  </ul>
                  <p className="text-ed-eyebrow text-ed-text-faint mt-3">
                    Last compiled: {new Date(meta.last_compiled).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {' · '}Version {meta.version}
                  </p>
                </div>

                <DisclaimerBanner text={meta.disclaimer} className="mt-6" />
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
