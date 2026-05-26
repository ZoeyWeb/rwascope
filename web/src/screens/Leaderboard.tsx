import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
// Only DeFiLlama public fields — no platform-computed scores.
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

// ── Constants ─────────────────────────────────────────────────────────────────
const ASSET_CLASSES = ['All', 'Gov. Treasuries', 'Commodities', 'Real Estate', 'Private Credit', 'Trade Finance', 'Precious Metal'];
const SORT_OPTIONS = [
  { key: 'tvl',  label: 'TVL (High → Low)' },
  { key: 'name', label: 'Name (A → Z)' },
  { key: 'class', label: 'Asset Class' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function changeFmt(v: number) {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function changeColor(v: number) {
  if (v > 0) return 'text-[#1B6B35]';
  if (v < 0) return 'text-[#BA1A1A]';
  return 'text-[#737C7F]';
}

// ── Chain pill list ───────────────────────────────────────────────────────────
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

// ── Protocol logo with fallback ───────────────────────────────────────────────
function ProtocolLogo({ logo, name }: { logo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err || !logo) {
    return (
      <div className="w-8 h-8 bg-[#5E5C75] flex items-center justify-center text-white text-xs font-bold shrink-0">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={logo} alt={name} className="w-8 h-8 object-contain bg-white shrink-0"
      onError={() => setErr(true)} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProtocolDirectory() {
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

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const protocols = (data?.protocols ?? [])
    .filter((p) => activeClass === 'All' || p.asset_class === activeClass)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'tvl')   return b.tvl - a.tvl;
      if (sortKey === 'name')  return a.name.localeCompare(b.name);
      if (sortKey === 'class') return a.asset_class.localeCompare(b.asset_class) || b.tvl - a.tvl;
      return b.tvl - a.tvl;
    });

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 overflow-y-auto bg-surface p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-20 bg-surface-container animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-container animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex-1 overflow-y-auto bg-surface p-8 flex items-center justify-center">
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
    <div className="flex-1 overflow-y-auto thin-scrollbar bg-surface">

      {/* ── Disclaimer banner ─────────────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200 px-8 py-2 flex items-center gap-3 text-xs text-amber-800">
        <span className="material-symbols-outlined text-amber-600 text-base shrink-0">info</span>
        <span>
          <strong>Research tool only.</strong> Data sourced from DeFiLlama.
          RWA-Index does not provide assessments, ratings, or investment advice.
          This directory is for educational and research purposes only.
        </span>
      </div>

      {/* ── Hero header ───────────────────────────────────────────────── */}
      <div className="bg-[#1A1A2E] px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-label text-[#6B7494] uppercase tracking-widest">
            <span>RWA-Index</span>
            <span>/</span>
            <span className="text-[#5E5C75] font-bold">RWA Protocol Directory</span>
          </div>
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
            {/* Stats — TVL and count only, no computed scores */}
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

      {/* ── Controls bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[#F1F4F6] border-b border-[#D8E2E6] px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

          {/* Asset class filter tabs */}
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

          {/* Sort + search */}
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

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-6">

        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[56px_1fr_140px_120px_80px_80px_100px_40px]
                        gap-4 px-4 py-2 text-[9px] font-bold text-[#737C7F] uppercase tracking-widest
                        border-b border-[#D8E2E6]">
          <span>#</span>
          <span>Protocol</span>
          <span>TVL</span>
          <span>Chains</span>
          <span className="text-right">24h</span>
          <span className="text-right">7d</span>
          <span className="text-center">Audits</span>
          <span />
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

              {/* ── Main row ───────────────────────────────────────── */}
              <button onClick={() => setExpandedSlug(expanded ? null : p.slug)}
                className="w-full text-left hover:bg-[#F8F9FA] transition-colors">
                <div className="grid grid-cols-[56px_1fr] lg:grid-cols-[56px_1fr_140px_120px_80px_80px_100px_40px]
                                gap-4 px-4 py-3 items-center">

                  {/* Rank */}
                  <div className="text-xs font-mono text-[#737C7F]">
                    {String(p.rank).padStart(2, '0')}
                  </div>

                  {/* Name + logo + asset class */}
                  <div className="flex items-center gap-3 min-w-0">
                    <ProtocolLogo logo={p.logo} name={p.name} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm font-headline text-on-surface truncate">{p.name}</div>
                      <div className="text-[9px] text-outline font-label uppercase mt-0.5">{p.asset_class}</div>
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="hidden lg:block">
                    <div className="text-sm font-bold font-headline text-on-surface">{p.tvl_fmt}</div>
                    <div className="text-[9px] text-outline font-label">Total Value Locked</div>
                  </div>

                  {/* Chains */}
                  <div className="hidden lg:block">
                    <ChainList chains={p.chains} total={p.chain_count} />
                  </div>

                  {/* 24h */}
                  <div className={`hidden lg:block text-right text-xs font-bold ${changeColor(p.change_1d)}`}>
                    {changeFmt(p.change_1d)}
                  </div>

                  {/* 7d */}
                  <div className={`hidden lg:block text-right text-xs font-bold ${changeColor(p.change_7d)}`}>
                    {changeFmt(p.change_7d)}
                  </div>

                  {/* Audits */}
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

                  {/* Expand */}
                  <div className="hidden lg:flex justify-center">
                    <span className="material-symbols-outlined text-outline text-sm transition-transform"
                          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </div>
                </div>
              </button>

              {/* ── Expanded info panel ─────────────────────────── */}
              {expanded && (
                <div className="bg-[#F8F9FA] border-t border-[#D8E2E6] px-8 py-6 grid
                                grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Public links */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">
                      Public Information
                    </h4>

                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-3 p-3 bg-white border border-[#D8E2E6] hover:border-primary/40 transition-colors group">
                        <span className="material-symbols-outlined text-primary text-base">language</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                            Official Website
                          </div>
                          <div className="text-[10px] text-outline truncate">{p.url}</div>
                        </div>
                        <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                      </a>
                    )}

                    <a href={`https://defillama.com/protocol/${p.slug}`}
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 bg-white border border-[#D8E2E6] hover:border-primary/40 transition-colors group">
                      <span className="material-symbols-outlined text-primary text-base">bar_chart</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          DeFiLlama Data
                        </div>
                        <div className="text-[10px] text-outline">Historical TVL, yield, token data</div>
                      </div>
                      <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                    </a>

                    <a href={`https://etherscan.io/search?q=${encodeURIComponent(p.name)}`}
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 bg-white border border-[#D8E2E6] hover:border-primary/40 transition-colors group">
                      <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          On-chain Contracts
                        </div>
                        <div className="text-[10px] text-outline">Search on Etherscan</div>
                      </div>
                      <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                    </a>
                  </div>

                  {/* Basic public facts */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">
                      Protocol Facts
                    </h4>
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

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 pb-8 space-y-2">
        <div className="flex items-center gap-3 text-[10px] font-label text-outline">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span>Last updated: {updated}</span>
          <span>·</span>
          <span>Data source: {data?.source ?? 'DeFiLlama'}</span>
        </div>
        <p className="text-[9px] text-outline max-w-3xl leading-relaxed">
          RWA-Index is an academic research tool implementing the RARM methodology framework.
          It does not provide credit ratings, investment advice, or any regulated service.
          All data is sourced from public third-party providers and is provided without warranty.
        </p>
      </div>
    </div>
  );
}
