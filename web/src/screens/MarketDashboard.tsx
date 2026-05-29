import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TokenizedAssets } from './Market/TokenizedAssets';
import { Eyebrow } from '../components/Eyebrow';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Protocol {
  rank: number;
  name: string;
  slug: string;
  logo: string;
  url: string;
  tvl: number;
  tvl_fmt: string;
  change_1d: number;
  change_7d: number;
  chains: string[];
  chain_count: number;
  audits: number;
  asset_class: string;
}

interface DirectoryData {
  updated_at: string;
  source: string;
  total_count: number;
  total_tvl_fmt: string;
  asset_class_counts: Record<string, number>;
  protocols: Protocol[];
}

// ── Fallback (raw DeFiLlama fields only) ──────────────────────────────────────
const FALLBACK: Protocol[] = [
  {
    rank: 1, name: 'BlackRock BUIDL', slug: 'blackrock-buidl', logo: '',
    url: 'https://www.blackrock.com/cash/en-us/products/buidl',
    tvl: 3_035_834_998, tvl_fmt: '$3.04B', change_1d: 0.3, change_7d: 1.1,
    chains: ['Ethereum', 'Polygon', 'Arbitrum'], chain_count: 8, audits: 1,
    asset_class: 'Gov. Treasuries',
  },
  {
    rank: 2, name: 'Ondo USDY', slug: 'ondo-usdy', logo: '',
    url: 'https://ondo.finance',
    tvl: 980_000_000, tvl_fmt: '$980M', change_1d: 0.1, change_7d: 2.1,
    chains: ['Ethereum', 'Solana'], chain_count: 2, audits: 2,
    asset_class: 'Gov. Treasuries',
  },
  {
    rank: 3, name: 'Paxos Gold', slug: 'paxos-gold', logo: '',
    url: 'https://paxos.com/paxgold',
    tvl: 750_000_000, tvl_fmt: '$750M', change_1d: -0.5, change_7d: 1.4,
    chains: ['Ethereum'], chain_count: 1, audits: 1,
    asset_class: 'Precious Metal',
  },
  {
    rank: 4, name: 'Maple Finance', slug: 'maple-finance', logo: '',
    url: 'https://maple.finance',
    tvl: 320_000_000, tvl_fmt: '$320M', change_1d: 0.2, change_7d: -0.5,
    chains: ['Ethereum'], chain_count: 1, audits: 1,
    asset_class: 'Private Credit',
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const ASSET_CLASSES = ['All', 'Gov. Treasuries', 'Commodities', 'Real Estate', 'Private Credit', 'Trade Finance', 'Precious Metal'];
const SORT_OPTIONS = [
  { key: 'tvl',  label: 'TVL (High → Low)' },
  { key: 'name', label: 'Name (A → Z)' },
  { key: 'class', label: 'Asset Class' },
];
const ASSET_CLASS_ICONS: Record<string, string> = {
  'Gov. Treasuries': 'account_balance',
  'Commodities':     'diamond',
  'Real Estate':     'foundation',
  'Private Credit':  'credit_card',
  'Trade Finance':   'local_shipping',
  'Precious Metal':  'diamond',
};
const ASSET_CLASS_COLORS: Record<string, string> = {
  'Gov. Treasuries': '#5E5C75',
  'Precious Metal':  '#e09d2b',
  'Private Credit':  '#2E7D32',
  'Real Estate':     '#737C7F',
  'Commodities':     '#9e3f4e',
  'Trade Finance':   '#2B3437',
};
const AC_COLOR_FALLBACK = '#DBE4E7';

// ── Helpers ───────────────────────────────────────────────────────────────────
function changeFmt(v: number) {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function changeColorStyle(v: number) {
  if (v > 0) return '#2E7D32';
  if (v < 0) return '#9e3f4e';
  return '#737C7F';
}
function changeColorClass(v: number) {
  if (v > 0) return 'text-[#1B6B35]';
  if (v < 0) return 'text-[#BA1A1A]';
  return 'text-[#737C7F]';
}
function assetIcon(cls: string) {
  return ASSET_CLASS_ICONS[cls] ?? 'payments';
}
function acColor(cls: string) {
  return ASSET_CLASS_COLORS[cls] ?? AC_COLOR_FALLBACK;
}
function fmtTvl(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}
function fmtAxisTvl(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AssetIconCell({ logo, assetClass }: { logo: string; assetClass: string }) {
  const [err, setErr] = useState(false);
  if (logo && !err) {
    return <img src={logo} alt="" className="w-5 h-5 object-contain" onError={() => setErr(true)} />;
  }
  return (
    <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
      {assetIcon(assetClass)}
    </span>
  );
}

function ProtocolLogo({ logo, name }: { logo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err || !logo) {
    return (
      <div className="w-8 h-8 bg-[#5E5C75] flex items-center justify-center text-white text-xs font-bold shrink-0">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <img src={logo} alt={name} className="w-8 h-8 object-contain bg-white shrink-0" onError={() => setErr(true)} />;
}

function ChainList({ chains, total }: { chains: string[]; total: number }) {
  const shown = chains.slice(0, 3);
  const extra = total - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((c) => (
        <span key={c} className="text-[9px] font-label bg-[#F1F4F6] text-[#737C7F] px-1.5 py-0.5 uppercase tracking-wide">
          {c.length > 8 ? c.slice(0, 7) + '…' : c}
        </span>
      ))}
      {extra > 0 && <span className="text-[9px] font-label text-[#737C7F]">+{extra}</span>}
    </div>
  );
}

const Disclaimer = () => (
  <div className="bg-amber-50 border-b border-amber-200 py-2 shrink-0">
    <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-3 text-xs text-amber-800">
      <span className="material-symbols-outlined text-amber-600 text-base shrink-0">info</span>
      <span>
        <strong>Research tool only.</strong> Data sourced from DeFiLlama. RWA-Index does not provide
        assessments, ratings, or investment advice. All information is for educational purposes only.
      </span>
    </div>
  </div>
);

// ── Overview tab — visual market summary (no protocol table) ──────────────────
function MarketOverview() {
  const [protocols, setProtocols] = useState<Protocol[]>(FALLBACK);
  const [loading, setLoading]     = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    fetch('/data/leaderboard.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        setProtocols(data.protocols as Protocol[]);
        setTotalCount(data.total_count ?? (data.protocols as Protocol[]).length);
        setUpdatedAt(data.updated_at ?? '');
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoading(false));
  }, []);

  const totalTvl = protocols.reduce((s, p) => s + p.tvl, 0);
  const trend7d  = totalTvl > 0
    ? protocols.reduce((s, p) => s + p.tvl * p.change_7d, 0) / totalTvl
    : 0;

  // Donut data: TVL grouped by asset class
  const acMap: Record<string, number> = {};
  for (const p of protocols) acMap[p.asset_class] = (acMap[p.asset_class] ?? 0) + p.tvl;
  const donutData = Object.entries(acMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const topClass  = donutData[0]?.name ?? '—';

  // Bar chart: top 10 protocols
  const top10 = protocols.slice(0, 10).map((p) => ({
    name: p.name,
    tvl: p.tvl,
    asset_class: p.asset_class,
  }));

  // Unique chain count
  const chainCount = new Set(protocols.flatMap((p) => p.chains)).size;

  const updated = updatedAt
    ? new Date(updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
    : '';

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#F1F4F6]">
      <div className="text-center space-y-3">
        <div className="w-7 h-7 border-2 border-[#5E5C75] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#737C7F]">Loading market data…</p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto thin-scrollbar bg-[#F1F4F6]">
      <Disclaimer />

      {/* Stat cards */}
      <div className="max-w-[1400px] mx-auto px-8 pt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total RWA TVL',
            value: fmtTvl(totalTvl),
            sub: `${totalCount} protocols tracked`,
            icon: 'account_balance_wallet',
            accent: '#5E5C75',
          },
          {
            label: '7-Day Market Trend',
            value: changeFmt(trend7d),
            sub: 'TVL-weighted average',
            icon: trend7d >= 0 ? 'trending_up' : 'trending_down',
            accent: trend7d > 0 ? '#2E7D32' : trend7d < 0 ? '#9e3f4e' : '#737C7F',
            valueColor: trend7d > 0 ? '#2E7D32' : trend7d < 0 ? '#9e3f4e' : '#737C7F',
          },
          {
            label: 'Largest Sector',
            value: topClass,
            sub: fmtTvl(donutData[0]?.value ?? 0),
            icon: 'pie_chart',
            accent: acColor(topClass),
          },
          {
            label: 'Active Chains',
            value: String(chainCount),
            sub: 'networks tracked',
            icon: 'hub',
            accent: '#5E5C75',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DBE4E7] p-5">
            <div className="mb-3">
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: s.accent }}
              >
                {s.icon}
              </span>
            </div>
            <div className="text-[9px] font-label uppercase tracking-widest text-[#737C7F] mb-1">{s.label}</div>
            <div
              className="text-xl font-bold font-headline text-[#2B3437] leading-tight"
              style={s.valueColor ? { color: s.valueColor } : undefined}
            >
              {s.value}
            </div>
            <div className="text-[9px] text-[#737C7F] mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="max-w-[1400px] mx-auto px-8 pt-4 pb-2 grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Horizontal bar chart — top 10 protocols */}
        <div className="lg:col-span-3 bg-white border border-[#DBE4E7] p-5">
          <div className="text-sm font-bold text-[#2B3437] font-headline">Top 10 Protocols by TVL</div>
          <div className="text-[10px] text-[#737C7F] mt-0.5 mb-5">Ranked by total value locked · Source: DeFiLlama</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={top10}
              margin={{ left: 0, right: 48, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F6" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={fmtAxisTvl}
                tick={{ fontSize: 9, fill: '#737C7F' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={138}
                tick={{ fontSize: 10, fill: '#2B3437' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 19) + '…' : v}
              />
              <Tooltip
                formatter={(v) => [fmtTvl(Number(v)), 'TVL']}
                contentStyle={{ fontSize: 11, border: '1px solid #DBE4E7', borderRadius: 0, background: '#fff' }}
                cursor={{ fill: '#F1F4F6' }}
              />
              <Bar dataKey="tvl" radius={0} maxBarSize={18}>
                {top10.map((entry, i) => (
                  <Cell key={i} fill={acColor(entry.asset_class)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart — TVL by asset class */}
        <div className="lg:col-span-2 bg-white border border-[#DBE4E7] p-5 flex flex-col">
          <div className="text-sm font-bold text-[#2B3437] font-headline">TVL by Asset Class</div>
          <div className="text-[10px] text-[#737C7F] mt-0.5 mb-3">Share of total tokenized value</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={85}
                dataKey="value"
                paddingAngle={2}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={acColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [fmtTvl(Number(v)), 'TVL']}
                contentStyle={{ fontSize: 11, border: '1px solid #DBE4E7', borderRadius: 0, background: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Custom legend */}
          <div className="mt-3 space-y-2 flex-1">
            {donutData.map((d) => {
              const pct = totalTvl > 0 ? ((d.value / totalTvl) * 100).toFixed(1) : '0.0';
              return (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 shrink-0" style={{ background: acColor(d.name) }} />
                    <span className="text-[10px] text-[#2B3437] truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span className="text-[10px] font-bold text-[#2B3437]">{pct}%</span>
                    <span className="text-[9px] text-[#737C7F] w-14 text-right">{fmtTvl(d.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1400px] mx-auto px-8 pt-2 pb-6 flex items-center gap-3 text-[9px] text-[#737C7F]">
        <span className="material-symbols-outlined text-[12px]">schedule</span>
        {updated && <span>Updated: {updated}</span>}
        {updated && <span>·</span>}
        <span>Data: DeFiLlama · For educational and research purposes only</span>
      </div>

      {/* Protocols Directory (merged from former tab) */}
      <section className="bg-ed-surface-cool border-t border-ed-hairline mt-8">
        <div className="max-w-[1400px] mx-auto px-8 pt-12 pb-4">
          <Eyebrow>Protocols</Eyebrow>
          <h2 className="text-ed-section-h2 text-ed-ink mt-3">RWA Protocols Directory</h2>
        </div>
      </section>
      <ProtocolsDirectory embedded />
    </div>
  );
}

// ── Protocols tab (filterable/searchable full directory) ──────────────────────
function ProtocolsDirectory({ embedded = false }: { embedded?: boolean } = {}) {
  const [data, setData]               = useState<DirectoryData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeClass, setActiveClass] = useState('All');
  const [sortKey, setSortKey]         = useState<'tvl' | 'name' | 'class'>('tvl');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [search, setSearch]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/data/leaderboard.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DirectoryData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const protocols = (data?.protocols ?? [])
    .filter((p) => activeClass === 'All' || p.asset_class === activeClass)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'tvl')   return b.tvl - a.tvl;
      if (sortKey === 'name')  return a.name.localeCompare(b.name);
      if (sortKey === 'class') return a.asset_class.localeCompare(b.asset_class) || b.tvl - a.tvl;
      return b.tvl - a.tvl;
    });

  if (loading) return (
    <div className={`bg-surface p-8 ${embedded ? '' : 'h-full overflow-y-auto'}`}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="h-20 bg-surface-container animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-container animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className={`bg-surface p-8 flex items-center justify-center ${embedded ? '' : 'h-full overflow-y-auto'}`}>
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-error">wifi_off</span>
        <p className="text-on-surface font-bold font-headline text-lg">Data Unavailable</p>
        <p className="text-on-surface-variant text-sm">{error}</p>
        <button onClick={load}
          className="px-6 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  const updated = data
    ? new Date(data.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
    : '';

  return (
    <div className={`bg-surface ${embedded ? '' : 'h-full overflow-y-auto thin-scrollbar'}`}>

      {!embedded && (
        <div className="bg-amber-50 border-b border-amber-200 py-2">
          <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-3 text-xs text-amber-800">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0">info</span>
            <span>
              <strong>Research tool only.</strong> Data sourced from DeFiLlama.
              RWA-Index does not provide assessments, ratings, or investment advice.
              This directory is for educational and research purposes only.
            </span>
          </div>
        </div>
      )}

      {!embedded && (
        <div className="bg-[#1A1A2E] px-8 py-10">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-white tracking-tight">
                  RWA Protocol <span className="text-[#5E5C75]">Directory</span>
                </h1>
                <p className="text-[#6B7494] mt-2 text-sm font-body max-w-xl">
                  Public market data sourced from DeFiLlama. This directory lists protocols
                  for research purposes only — RWA-Index does not evaluate, rate, or rank protocols.
                </p>
              </div>
              <div className="flex gap-4 shrink-0">
                {[
                  { label: 'Protocols', value: String(data?.total_count ?? 0) },
                  { label: 'Total RWA TVL', value: data?.total_tvl_fmt ?? '—' },
                  { label: 'Showing', value: String(protocols.length) },
                ].map((s) => (
                  <div key={s.label} className="bg-[#2B3437] px-4 py-3 border-l-2 border-[#5E5C75] min-w-[100px]">
                    <div className="text-[9px] font-label text-[#6B7494] uppercase tracking-widest mb-1">{s.label}</div>
                    <div className="text-xl font-bold font-headline text-white">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="sticky top-0 z-10 bg-[#F1F4F6] border-b border-[#D8E2E6] px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {ASSET_CLASSES.map((cls) => {
              const count = cls === 'All'
                ? (data?.total_count ?? 0)
                : (data?.asset_class_counts?.[cls] ?? 0);
              return (
                <button key={cls} onClick={() => setActiveClass(cls)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    activeClass === cls
                      ? 'bg-[#5E5C75] text-white'
                      : 'bg-white text-[#737C7F] hover:bg-[#EAEFF1] border border-[#D8E2E6]'
                  }`}>
                  {cls} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-[#737C7F]">search</span>
              <input type="text" placeholder="Search protocols…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white border border-[#D8E2E6] text-on-surface placeholder:text-outline outline-none w-44" />
            </div>
            <select value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase bg-white border border-[#D8E2E6] text-[#737C7F] outline-none">
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>Sort: {o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="hidden lg:grid grid-cols-[56px_1fr_140px_120px_80px_80px_100px_40px]
                        gap-4 px-4 py-2 text-[9px] font-bold text-[#737C7F] uppercase tracking-widest
                        border-b border-[#D8E2E6]">
          <span>#</span><span>Protocol</span><span>TVL</span><span>Chains</span>
          <span className="text-right">24h</span><span className="text-right">7d</span>
          <span className="text-center">Audits</span><span />
        </div>

        {protocols.length === 0 && (
          <div className="py-20 text-center text-on-surface-variant text-sm">
            No protocols match your filter.
          </div>
        )}

        {protocols.map((p) => {
          const expanded = expandedSlug === p.slug;
          return (
            <div key={p.slug} className="border-b border-[#D8E2E6] last:border-0">
              <button onClick={() => setExpandedSlug(expanded ? null : p.slug)}
                className="w-full text-left hover:bg-[#F8F9FA] transition-colors">
                <div className="grid grid-cols-[56px_1fr] lg:grid-cols-[56px_1fr_140px_120px_80px_80px_100px_40px]
                                gap-4 px-4 py-3 items-center">
                  <div className="text-xs font-mono text-[#737C7F]">{String(p.rank).padStart(2, '0')}</div>
                  <div className="flex items-center gap-3 min-w-0">
                    <ProtocolLogo logo={p.logo} name={p.name} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm font-headline text-on-surface truncate">{p.name}</div>
                      <div className="text-[9px] text-outline font-label uppercase mt-0.5">{p.asset_class}</div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-sm font-bold font-headline text-on-surface">{p.tvl_fmt}</div>
                    <div className="text-[9px] text-outline font-label">Total Value Locked</div>
                  </div>
                  <div className="hidden lg:block"><ChainList chains={p.chains} total={p.chain_count} /></div>
                  <div className={`hidden lg:block text-right text-xs font-bold ${changeColorClass(p.change_1d)}`}>{changeFmt(p.change_1d)}</div>
                  <div className={`hidden lg:block text-right text-xs font-bold ${changeColorClass(p.change_7d)}`}>{changeFmt(p.change_7d)}</div>
                  <div className="hidden lg:flex justify-center items-center gap-1">
                    {p.audits > 0 ? (
                      <span className="text-xs font-bold text-[#1B6B35] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        {p.audits}
                      </span>
                    ) : (
                      <span className="text-[10px] text-outline">—</span>
                    )}
                  </div>
                  <div className="hidden lg:flex justify-center">
                    <span className="material-symbols-outlined text-outline text-sm transition-transform"
                          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="bg-[#F8F9FA] border-t border-[#D8E2E6] px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">Public Information</h4>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-3 p-3 bg-white border border-[#D8E2E6] hover:border-primary/40 transition-colors group">
                        <span className="material-symbols-outlined text-primary text-base">language</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Official Website</div>
                          <div className="text-[10px] text-outline truncate">{p.url}</div>
                        </div>
                        <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                      </a>
                    )}
                    <a href={`https://defillama.com/protocol/${p.slug}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 bg-white border border-[#D8E2E6] hover:border-primary/40 transition-colors group">
                      <span className="material-symbols-outlined text-primary text-base">bar_chart</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">DeFiLlama Data</div>
                        <div className="text-[10px] text-outline">Historical TVL, yield, token data</div>
                      </div>
                      <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                    </a>
                    <a href={`https://etherscan.io/search?q=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 bg-white border border-[#D8E2E6] hover:border-primary/40 transition-colors group">
                      <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">On-chain Contracts</div>
                        <div className="text-[10px] text-outline">Search on Etherscan</div>
                      </div>
                      <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                    </a>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">Protocol Facts</h4>
                    {[
                      { label: 'Asset Class', value: p.asset_class },
                      { label: 'Networks', value: `${p.chain_count} chain${p.chain_count !== 1 ? 's' : ''}` },
                      { label: 'Smart Contract Audits', value: p.audits > 0 ? `${p.audits} public audit${p.audits > 1 ? 's' : ''} on record` : 'None found' },
                      { label: 'Total Value Locked', value: p.tvl_fmt },
                      { label: '7-Day TVL Change', value: changeFmt(p.change_7d) },
                    ].map((kv) => (
                      <div key={kv.label} className="flex justify-between items-center border-b border-[#D8E2E6] pb-2">
                        <span className="text-[10px] font-label text-outline uppercase">{kv.label}</span>
                        <span className="text-xs font-bold text-on-surface">{kv.value}</span>
                      </div>
                    ))}
                    <p className="text-[9px] text-outline pt-2 leading-relaxed">
                      Data from DeFiLlama. RWA-Index does not endorse or evaluate this protocol.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="max-w-[1400px] mx-auto px-8 pb-8 space-y-2">
        <div className="flex items-center gap-3 text-[10px] font-label text-outline">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span>Last updated: {updated}</span>
          <span>·</span>
          <span>Data source: {data?.source ?? 'DeFiLlama'}</span>
        </div>
        <p className="text-[9px] text-outline max-w-3xl leading-relaxed">
          RWA-Index is an academic research tool. It does not provide credit ratings, investment advice,
          or any regulated service. All data is sourced from public third-party providers and is provided without warranty.
        </p>
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview' },
  { key: 'tokenized', label: 'Tokenized Assets' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Main export ───────────────────────────────────────────────────────────────
export default function MarketDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const activeTab: TabKey = tab === 'tokenized' ? 'tokenized' : 'overview';
  // ?tab=protocols (old URL) naturally falls back to overview

  return (
    <div className="flex flex-col h-full">

      {/* Tab bar */}
      <div className="bg-white border-b border-[#DBE4E7] shrink-0">
        <div className="max-w-[1400px] mx-auto px-8 flex">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSearchParams(key === 'overview' ? {} : { tab: key })}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors mr-2 ${
              activeTab === key
                ? 'border-[#5E5C75] text-[#2B3437]'
                : 'border-transparent text-[#737C7F] hover:text-[#2B3437]'
            }`}
          >
            {label}
          </button>
        ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'overview'  && <MarketOverview />}
        {activeTab === 'tokenized' && <TokenizedAssets />}
      </div>
    </div>
  );
}
