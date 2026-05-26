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
    <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-white font-headline">{value}</div>
      <div className="text-xs font-semibold text-slate-300 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function GapBadge({ gap }: { gap: EcosystemGap }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 mb-2 ${GAP_SEVERITY_STYLE[gap.severity]}`}>
      <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">
        {GAP_ICON[gap.gap_type]}
      </span>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
          {GAP_LABEL[gap.gap_type]}
        </span>
        <p className="text-[11px] font-semibold leading-tight">{gap.title}</p>
        <p className="text-[10px] opacity-75 leading-snug mt-0.5">{gap.description}</p>
      </div>
    </div>
  );
}

function ParticipantChip({
  p,
  borderColor,
  onNavigate,
}: {
  p: EcosystemParticipant;
  borderColor: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
        style={{
          borderColor: open ? borderColor : '#2B3437',
          color: open ? '#fff' : '#94a3b8',
          background: open ? borderColor + '35' : 'transparent',
        }}
      >
        {p.rarm_signal && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: RARM_COLOR[p.rarm_signal] }}
          />
        )}
        {p.name}
        <span
          className="material-symbols-outlined text-[12px] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          className="absolute z-20 top-full mt-1 left-0 min-w-[260px] max-w-[320px] rounded-lg border p-3 bg-[#0F1117] shadow-xl text-left"
          style={{ borderColor }}
        >
          <div className="text-xs font-bold text-white mb-1">{p.full_name}</div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="inline-block text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: borderColor + '40', color: borderColor }}
            >
              {TYPE_LABEL[p.type] ?? p.type}
            </div>
            {p.confidence_level && p.confidence_level !== 'high' && (
              <div className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400">
                {p.confidence_level} confidence
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{p.role}</p>
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 bg-[#2B3437] text-slate-500 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2.5 pt-2 border-t border-[#2B3437]">
            {p.issuer_slug && (
              <button
                onClick={onNavigate}
                className="text-[10px] text-[#5E5C75] hover:text-white transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                Issuer Profile
              </button>
            )}
            {p.asset_slug && (
              <button
                onClick={onNavigate}
                className="text-[10px] text-[#5E5C75] hover:text-white transition-colors flex items-center gap-1"
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
                className="text-[10px] text-[#5E5C75] hover:text-white transition-colors flex items-center gap-1"
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

// ── 3D Interactive Layer Card ──────────────────────────────────────────────────

function Layer3DCard({
  layer,
  gaps,
  isActive,
  onClick,
}: {
  layer: EcosystemLayer;
  gaps: EcosystemGap[];
  isActive: boolean;
  onClick: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="relative transition-all duration-300"
      style={{ paddingRight: '8px', paddingBottom: '8px' }}
    >
      <div
        className="absolute rounded-r-xl transition-all duration-300"
        style={{
          right: 0, top: '8px', bottom: '8px', width: '8px',
          background: `linear-gradient(to right, ${layer.color}55, ${layer.color}20)`,
          borderTop: `1px solid ${layer.color}40`,
          borderRight: `1px solid ${layer.color}25`,
          borderBottom: `1px solid ${layer.color}25`,
          opacity: isActive ? 1 : 0.55,
        }}
      />
      <div
        className="absolute rounded-b-xl transition-all duration-300"
        style={{
          left: '8px', right: 0, bottom: 0, height: '8px',
          background: `linear-gradient(to bottom, ${layer.color}45, ${layer.color}15)`,
          borderLeft: `1px solid ${layer.color}25`,
          borderRight: `1px solid ${layer.color}25`,
          borderBottom: `1px solid ${layer.color}25`,
          opacity: isActive ? 1 : 0.55,
        }}
      />
      <div
        onClick={onClick}
        className="relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-300 hover:brightness-110"
        style={{
          borderColor: isActive ? layer.border : layer.border + '80',
          background: isActive
            ? `linear-gradient(135deg, ${layer.bg} 0%, #0D0F18 100%)`
            : `linear-gradient(160deg, ${layer.bg}99 0%, #161b27 100%)`,
          boxShadow: isActive
            ? `0 0 0 1px ${layer.color}20, 0 8px 24px ${layer.color}25, 0 2px 8px rgba(0,0,0,0.45)`
            : `0 1px 4px rgba(0,0,0,0.3)`,
          transform: isActive ? 'translate(-3px, -3px)' : 'translate(0, 0)',
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 rounded-l-xl transition-all duration-300"
          style={{
            width: isActive ? '3px' : '2px',
            background: `linear-gradient(to bottom, ${layer.color}, ${layer.color}60)`,
            opacity: isActive ? 1 : 0.7,
          }}
        />
        <div className="flex items-center gap-3 px-4 py-3.5 pl-5 select-none">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
            style={{
              background: layer.color + (isActive ? '28' : '15'),
              color: layer.color,
              border: `2px solid ${layer.color}${isActive ? 'bb' : '40'}`,
              boxShadow: isActive ? `0 0 12px ${layer.color}55` : 'none',
            }}
          >
            {layer.order}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-bold"
                style={{ color: isActive ? layer.color : '#f1f5f9' }}
              >{layer.label}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{layer.sublabel}</span>
              {gaps.length > 0 && !isActive && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: layer.color + '20', color: layer.color }}
                >
                  {gaps.length} gap{gaps.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!isActive && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {layer.participants.length} participant{layer.participants.length !== 1 ? 's' : ''}
                {(layer.participants_note || layer.applicants_note) ? ' (partial list)' : ''}
              </div>
            )}
          </div>
          <span
            className="material-symbols-outlined text-lg transition-all duration-300"
            style={{
              color: isActive ? layer.color : '#4B5563',
              transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            keyboard_arrow_down
          </span>
        </div>
        {isActive && (
          <>
            <div className="mx-4" style={{ height: '1px', background: layer.color + '30' }} />
            <div className="px-5 pb-5 pt-3">
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{layer.description}</p>
              {layer.launched_at && (
                <div className="text-[10px] text-slate-600 mb-3">
                  Launched:{' '}
                  {new Date(layer.launched_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {layer.source && ` · ${layer.source}`}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {layer.participants.map(p => (
                  <ParticipantChip
                    key={p.id}
                    p={p}
                    borderColor={layer.color}
                    onNavigate={() => {
                      if (p.issuer_slug) navigate(`/licenses/${p.issuer_slug}`);
                      else if (p.asset_slug) navigate(`/assets/${p.asset_slug}`);
                    }}
                  />
                ))}
              </div>
              {(layer.participants_note || layer.applicants_note) && (
                <div className="mb-4 flex items-start gap-1.5 text-[10px] text-slate-600 italic">
                  <span className="material-symbols-outlined text-[11px] mt-0.5 text-slate-700">info</span>
                  {layer.participants_note ?? layer.applicants_note}
                </div>
              )}
              {gaps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#2B3437]/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[13px] text-slate-600">report_problem</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Identified Gaps</span>
                  </div>
                  {gaps.map(gap => <GapBadge key={gap.id} gap={gap} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
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
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active
          ? 'text-[#2B3437] border-[#5E5C75]'
          : 'text-slate-400 hover:text-slate-600 border-transparent'
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

  return (
    <div className="max-w-screen-2xl mx-auto py-8 px-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">
          RWA Ecosystem Map
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Multi-region structured overview of tokenized asset ecosystems — regulatory layers, institutions, infrastructure, and enablers.
        </p>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2B3437]">
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
          {regions.length > 0 && (
            <div className="mb-6">
              <RegionSelector
                regions={regions}
                activeRegion={selectedRegion}
                onChange={setSelectedRegion}
              />
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
                progress_activity
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="p-8 text-slate-400">{error}</div>
          )}

          {!loading && !error && data && (() => {
            const { meta, stats, gaps, participant_type_chart } = data;
            return (
              <>
                <DisclaimerBanner text={meta.disclaimer} className="mb-6" />

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                  <StatCard value={stats.regulators} label="Regulators" />
                  <StatCard value={stats.licensed_stablecoin_issuers} label="Licensed Issuers" sub="Cap. 656" />
                  <StatCard value={stats.stablecoin_applicants} label="Applicants" sub="In review" />
                  <StatCard value={stats.ensembletx_institutions} label="EnsembleTX" sub="Institutions" />
                  <StatCard value={stats.licensed_vatps} label="Licensed VATPs" sub="As of Feb 2026" />
                  <StatCard value={stats.hk_linked_rwa_protocols} label="HK-Linked" sub="RWA Protocols" />
                </div>

                {/* Inner tab switcher */}
                <div className="flex gap-1 mb-6 border-b border-[#2B3437]">
                  <button
                    onClick={() => setActiveTab('diagram')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === 'diagram'
                        ? 'text-[#2B3437] border-[#5E5C75]'
                        : 'text-slate-400 hover:text-slate-600 border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base align-middle mr-1.5">account_tree</span>
                    Architecture Diagram
                  </button>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === 'chart'
                        ? 'text-[#2B3437] border-[#5E5C75]'
                        : 'text-slate-400 hover:text-slate-600 border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base align-middle mr-1.5">bar_chart</span>
                    Participant Distribution
                  </button>
                </div>

                {/* Architecture diagram */}
                {activeTab === 'diagram' && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-[15px]">touch_app</span>
                      Click any layer to expand and explore participants
                    </div>
                    <div className="space-y-0">
                      {sortedLayers.map((layer, idx) => (
                        <div key={layer.id}>
                          <Layer3DCard
                            layer={layer}
                            gaps={(gaps ?? []).filter(g => g.layer_id === layer.id)}
                            isActive={activeLayerId === layer.id}
                            onClick={() => setActiveLayerId(activeLayerId === layer.id ? '' : layer.id)}
                          />
                          {idx < sortedLayers.length - 1 && (
                            <div className="flex justify-center h-6 items-center">
                              <span className="material-symbols-outlined text-[16px] text-slate-700">
                                arrow_downward
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {gaps && gaps.length > 0 && (
                      <div className="mt-8 rounded-xl border border-[#2B3437] bg-[#1A1A2E]/50 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-slate-500">report_problem</span>
                          <h2 className="text-sm font-bold text-slate-300">Identified Ecosystem Gaps</h2>
                          <span className="text-xs text-slate-600 ml-auto">
                            {gaps.length} gap{gaps.length !== 1 ? 's' : ''} across {new Set(gaps.map(g => g.layer_id)).size} layers
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {gaps.map(gap => <GapBadge key={gap.id} gap={gap} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Participant distribution chart */}
                {activeTab === 'chart' && (
                  <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#5E5C75]">bar_chart</span>
                      <h2 className="text-sm font-bold text-white">Participant Distribution by Category</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">
                      Confirmed public participants per ecosystem category.
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={participant_type_chart}
                        margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                        barCategoryGap="30%"
                      >
                        <XAxis
                          dataKey="category"
                          tick={{ fill: '#737C7F', fontSize: 11 }}
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                          dy={6}
                        />
                        <YAxis tick={{ fill: '#737C7F', fontSize: 11 }} allowDecimals={false} width={28} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                          {participant_type_chart.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 mt-2 justify-center">
                      {participant_type_chart.map(e => (
                        <div key={e.category} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
                          {e.category}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data sources footer */}
                <div className="mt-10 border-t border-[#2B3437] pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-slate-600 text-sm">source</span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Data Sources</span>
                  </div>
                  <ul className="grid md:grid-cols-2 gap-1">
                    {meta.sources.map((src, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex gap-2">
                        <span className="text-[#5E5C75]">•</span>
                        {src}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-700 mt-3">
                    Last compiled: {new Date(meta.last_compiled).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {' · '}Version {meta.version}
                  </p>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
