import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Asset, AssetLiveIndex } from '../../types/assets';
import {
  aggregateRARM, RARM_LAYER_KEYS, RARM_LAYER_META, RARM_SIGNAL_META,
  ASSET_CATEGORY_LABELS, ASSET_STATUS_META,
} from '../../utils/rarm';
import DisclaimerBanner from '../../components/DisclaimerBanner';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTvl(n?: number): string {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RARMDots({ asset }: { asset: Asset }) {
  const signals = RARM_LAYER_KEYS.map(k => ({
    key: k, signal: asset.rarm[k].signal, label: RARM_LAYER_META[k].shortLabel,
  }));
  return (
    <div className="flex items-center gap-1">
      {signals.map(({ key, signal, label }) => (
        <span
          key={key}
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: RARM_SIGNAL_META[signal].dot }}
          title={`${label}: ${RARM_SIGNAL_META[signal].label}`}
        />
      ))}
    </div>
  );
}

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
        active
          ? 'bg-[#5E5C75] text-white border-[#5E5C75]'
          : 'bg-white text-[#737C7F] border-[#DBE4E7] hover:border-[#5E5C75] hover:text-[#5E5C75]'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssetsOverview() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [chainFilter, setChainFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetch('/data/assets/assets.json').then(r => r.json()) as Promise<Asset[]>,
      fetch('/data/assets/assets-live.json').then(r => r.json()).catch(() => null) as Promise<AssetLiveIndex | null>,
    ]).then(([staticData, liveData]) => {
      const liveBySlug = liveData?.assets ?? {};
      const merged = staticData.map(a => ({ ...a, ...(liveBySlug[a.slug] ?? {}) }));
      setAssets(merged);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(assets.map(a => a.assetCategory)));
  const chains = Array.from(new Set(assets.flatMap(a => a.chainOrPlatform))).sort();

  const filtered = assets.filter(a => {
    if (categoryFilter !== 'all' && a.assetCategory !== categoryFilter) return false;
    if (chainFilter !== 'all' && !a.chainOrPlatform.includes(chainFilter)) return false;
    return true;
  });

  const totalTvl = assets.reduce((s, a) => s + (a.tvlUsd ?? 0), 0);
  const activeCount = assets.filter(a => a.status === 'active').length;
  const categoryCount = new Set(assets.map(a => a.assetCategory)).size;

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12 flex justify-center">
        <span className="material-symbols-outlined animate-spin text-[#5E5C75]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#2B3437]">Tokenized Asset Risk Observatory</h1>
          <p className="text-sm text-[#737C7F] mt-1 max-w-2xl">
            Academic RARM (Relative Asset Risk Matrix) profiles of major tokenized real-world asset
            products. All layer assessments reflect publicly available information; signals are indicative only.
          </p>
        </div>
        <Link
          to="/assets/methodology"
          className="text-ed-meta text-ed-text-muted hover:text-ed-ink transition-colors whitespace-nowrap"
        >
          RARM Methodology →
        </Link>
      </div>

      <DisclaimerBanner text="This observatory is an academic research tool only. RARM assessments reflect publicly available information at the time of review and do not constitute investment advice, credit ratings, or regulatory opinions. All layer signals should be independently verified before making any investment or operational decision." />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Assets tracked',       value: assets.length.toString() },
          { label: 'Active',               value: activeCount.toString() },
          { label: 'Asset categories',     value: categoryCount.toString() },
          { label: 'Aggregate TVL (est.)', value: formatTvl(totalTvl) },
        ].map(s => (
          <div key={s.label} className="bg-[#F8FAFB] border border-[#DBE4E7] rounded-xl px-4 py-3">
            <div className="text-xl font-black text-[#2B3437]">{s.value}</div>
            <div className="text-xs text-[#737C7F] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* RARM legend */}
      <div className="bg-[#F8FAFB] border border-[#DBE4E7] rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-[#2B3437] mb-2">RARM 6-Layer Framework (left → right)</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {RARM_LAYER_KEYS.map((k, i) => {
            const m = RARM_LAYER_META[k];
            return (
              <div key={k} className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-[#9E9E9E] w-3">{i + 1}</span>
                <span className="text-xs text-[#737C7F]">{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 pt-2 border-t border-[#DBE4E7]">
          {(['green', 'yellow', 'red', 'gray'] as const).map(sig => (
            <div key={sig} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: RARM_SIGNAL_META[sig].dot }} />
              <span className="text-xs text-[#737C7F]">{RARM_SIGNAL_META[sig].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-[#737C7F] uppercase tracking-wider">Category</span>
        <Pill active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All</Pill>
        {categories.map(c => (
          <Pill key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
            {ASSET_CATEGORY_LABELS[c] ?? c}
          </Pill>
        ))}
        <span className="w-px h-4 bg-[#DBE4E7] mx-1" />
        <span className="text-xs font-bold text-[#737C7F] uppercase tracking-wider">Chain</span>
        <Pill active={chainFilter === 'all'} onClick={() => setChainFilter('all')}>All</Pill>
        {['Ethereum', 'Stellar', 'Solana', 'TRON'].map(c => (
          <Pill key={c} active={chainFilter === c} onClick={() => setChainFilter(c)}>{c}</Pill>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-[#737C7F]">
        Showing {filtered.length} of {assets.length} assets
      </p>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-[#DBE4E7] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
              {['Asset', 'Category', 'Chain / Platform', 'TVL (est.)', '(RARM)', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F4F6]">
            {filtered.map(asset => {
              const summary = aggregateRARM(asset.rarm);
              const statusMeta = ASSET_STATUS_META[asset.status];
              return (
                <tr key={asset.slug} className="hover:bg-[#F8FAFB] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#2B3437] text-sm">{asset.ticker.split(' ')[0]}</div>
                    <div className="text-xs text-[#737C7F] mt-0.5 max-w-[220px] truncate">{asset.name}</div>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mt-1"
                      style={{ color: statusMeta.color, background: statusMeta.bg }}
                    >
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#5E5C75] bg-[#EAEFF1] px-2 py-0.5 rounded">
                      {ASSET_CATEGORY_LABELS[asset.assetCategory] ?? asset.assetCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {asset.chainOrPlatform.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] bg-[#F1F4F6] text-[#5E5C75] px-1.5 py-0.5 rounded font-semibold">
                          {c}
                        </span>
                      ))}
                      {asset.chainOrPlatform.length > 3 && (
                        <span className="text-[10px] text-[#737C7F]">+{asset.chainOrPlatform.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-[#2B3437] font-semibold">{formatTvl(asset.tvlUsd)}</div>
                    {asset.tvlUpdatedAt && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {typeof asset.change1d === 'number' && (
                          <span className={`text-[10px] font-bold ${asset.change1d >= 0 ? 'text-[#2E7D32]' : 'text-[#9e3f4e]'}`}>
                            {asset.change1d >= 0 ? '+' : ''}{asset.change1d.toFixed(2)}%
                          </span>
                        )}
                        <span className="text-[9px] text-[#9E9E9E]">DeFiLlama</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      <RARMDots asset={asset} />
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          color: RARM_SIGNAL_META[summary.dominant].color,
                          background: RARM_SIGNAL_META[summary.dominant].bg,
                          border: `1px solid ${RARM_SIGNAL_META[summary.dominant].border}`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: RARM_SIGNAL_META[summary.dominant].dot }} />
                        {RARM_SIGNAL_META[summary.dominant].label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/assets/${asset.slug}`}
                      className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] font-semibold transition-colors whitespace-nowrap"
                    >
                      Profile
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
      <div className="md:hidden space-y-3">
        {filtered.map(asset => {
          const summary = aggregateRARM(asset.rarm);
          return (
            <Link
              key={asset.slug}
              to={`/assets/${asset.slug}`}
              className="block bg-white border border-[#DBE4E7] rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-black text-[#2B3437]">{asset.ticker.split(' ')[0]}</span>
                  <p className="text-xs text-[#737C7F] mt-0.5 line-clamp-1">{asset.name}</p>
                  <p className="text-xs text-[#737C7F] mt-0.5">{asset.issuerOrOperator.split('(')[0].trim()}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-bold text-[#2B3437]">{formatTvl(asset.tvlUsd)}</div>
                  <RARMDots asset={asset} />
                  <span
                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: RARM_SIGNAL_META[summary.dominant].color,
                      background: RARM_SIGNAL_META[summary.dominant].bg,
                    }}
                  >
                    {RARM_SIGNAL_META[summary.dominant].label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] bg-[#EAEFF1] text-[#5E5C75] px-1.5 py-0.5 rounded font-semibold">
                  {ASSET_CATEGORY_LABELS[asset.assetCategory]}
                </span>
                {asset.chainOrPlatform.slice(0, 2).map(c => (
                  <span key={c} className="text-[10px] bg-[#F1F4F6] text-[#737C7F] px-1.5 py-0.5 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#737C7F]">
          <span className="material-symbols-outlined text-4xl mb-3 block">search_off</span>
          <p className="text-sm">No assets match the selected filters.</p>
        </div>
      )}

    </div>
  );
}
