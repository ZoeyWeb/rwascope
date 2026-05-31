import { useMemo, useState } from 'react';
import { useMarketSnapshot } from '../../hooks/useMarketSnapshot';
import { usePagination } from '../../hooks/usePagination';
import { FilterPill } from '../../components/FilterPill';
import { Eyebrow } from '../../components/Eyebrow';
import type { TokenizedAsset, TokenizedCategory, TokenizedCategorySummary } from '../../types/market';

type FilterKey = 'all' | TokenizedCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: 'stock',  label: 'Stocks' },
  { key: 'gold',   label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'etf',    label: 'ETFs' },
  { key: 'tbill',  label: 'T-Bills' },
];

const STRIP_ORDER: TokenizedCategory[] = ['stock', 'gold', 'etf', 'silver', 'tbill'];

function fmtUsd(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n >= 1)    return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function PctCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-ed-text-muted">—</span>;
  const neg = value < 0;
  return (
    <span className={neg ? 'text-ed-incident' : 'text-ed-ink'}>
      {neg ? '▼' : '▲'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function TokenizedAssets() {
  const { data, loading, error } = useMarketSnapshot();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredAssets = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.assets;
    return data.assets.filter(a => a.category === filter);
  }, [data, filter]);

  const { visible, loadMore, canLoadMore } = usePagination(filteredAssets, 20);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} />;

  return (
    <div className="bg-ed-canvas h-full overflow-y-auto thin-scrollbar">
      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-[1400px] mx-auto px-8 py-2 text-ed-meta text-amber-900">
          Live data from CoinMarketCap. For research only. Not investment advice.
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-8 pt-16 pb-12">
        <Eyebrow>Market · Tokenized Assets</Eyebrow>
        <h1 className="text-4xl md:text-ed-page-h1 text-ed-ink mt-4">Tokenized Assets</h1>
        <p className="text-ed-lede text-ed-text-secondary mt-6 max-w-3xl">
          Public-market view of tokenized stocks, commodities, ETFs, and treasury bills.{' '}
          {data.assets.length} tokens indexed across 5 asset classes.
        </p>
      </section>

      {/* At a Glance — full-bleed cool */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-cool border-y border-ed-hairline">
        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <Eyebrow>At a Glance</Eyebrow>
          <h2 className="text-2xl md:text-ed-section-h2 text-ed-ink mt-3 mb-10">Market cap by asset class</h2>
          <CategoryStrips summary={data.summary} />
        </div>
      </section>

      {/* Asset Universe */}
      <section className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Eyebrow>Asset Universe</Eyebrow>
            <h2 className="text-2xl md:text-ed-section-h2 text-ed-ink mt-3">All tokens</h2>
          </div>
          {data.last_fetched && (
            <span className="text-ed-meta text-ed-text-muted">
              Updated {new Date(data.last_fetched).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <FilterPill key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </FilterPill>
          ))}
        </div>

        <AssetTable assets={visible} />

        <div className="mt-6 flex items-center justify-between text-ed-meta text-ed-text-muted">
          <span>{visible.length} of {filteredAssets.length}</span>
          {canLoadMore && (
            <button
              onClick={loadMore}
              className="text-ed-meta uppercase tracking-wider text-ed-ink border border-ed-ink px-4 py-2 hover:bg-ed-surface-cool transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      </section>

      {/* Coverage Note — full-bleed sunken */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-sunken border-t border-ed-hairline">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <Eyebrow>Coverage Note</Eyebrow>
          <p className="text-ed-body text-ed-text-secondary mt-4 max-w-3xl leading-relaxed">
            {data.coverage_note}
          </p>
        </div>
      </section>
    </div>
  );
}

function CategoryStrips({ summary }: { summary: TokenizedCategorySummary[] }) {
  const byKey = Object.fromEntries(summary.map(s => [s.category, s])) as Record<TokenizedCategory, TokenizedCategorySummary | undefined>;
  const maxMcap = Math.max(...summary.map(s => s.market_cap_usd ?? 0), 1);

  const labelMap: Record<TokenizedCategory, string> = {
    stock: 'Tokenized Stock',
    gold: 'Tokenized Gold',
    etf: 'Tokenized ETFs',
    silver: 'Tokenized Silver',
    tbill: 'Tokenized T-Bills',
  };

  return (
    <div className="divide-y divide-ed-hairline border-y border-ed-hairline">
      {STRIP_ORDER.map(key => {
        const row = byKey[key];
        const mcap = row?.market_cap_usd ?? 0;
        const pct = maxMcap > 0 ? (mcap / maxMcap) * 100 : 0;
        const limited = mcap === 0;
        return (
          <div key={key} className="flex flex-col gap-1 md:grid md:grid-cols-12 md:gap-6 md:items-center py-5">
            <div className="md:col-span-3 text-ed-item-h4 text-ed-ink">{labelMap[key]}</div>
            <div className="hidden md:block md:col-span-2 text-ed-body text-ed-text-secondary tabular-nums">
              {row?.num_tokens ?? 0}{' '}
              <span className="text-ed-meta text-ed-text-muted">tokens</span>
            </div>
            <div className="md:col-span-2 text-ed-body text-ed-ink tabular-nums">{fmtUsd(mcap)}</div>
            <div className="md:col-span-5 mt-1 md:mt-0">
              {limited ? (
                <span className="text-ed-meta uppercase tracking-wider text-ed-text-muted">
                  Limited coverage
                </span>
              ) : (
                <div className="h-2 bg-ed-hairline relative">
                  <div className="h-full bg-ed-ink" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetTable({ assets }: { assets: TokenizedAsset[] }) {
  return (
    <div className="border-y border-ed-hairline">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ed-hairline">
            <th className="text-left py-3 text-ed-eyebrow uppercase text-ed-text-muted w-10">#</th>
            <th className="text-left py-3 text-ed-eyebrow uppercase text-ed-text-muted">Asset</th>
            <th className="text-right py-3 text-ed-eyebrow uppercase text-ed-text-muted">Price</th>
            <th className="text-right py-3 text-ed-eyebrow uppercase text-ed-text-muted">24h</th>
            <th className="text-right py-3 text-ed-eyebrow uppercase text-ed-text-muted">Market Cap</th>
            <th className="text-right py-3 text-ed-eyebrow uppercase text-ed-text-muted">24h Vol</th>
            <th className="text-left py-3 text-ed-eyebrow uppercase text-ed-text-muted pl-6">Network</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a, i) => (
            <tr key={a.id} className="border-b border-ed-hairline last:border-0 hover:bg-ed-surface-cool transition-colors">
              <td className="py-4 text-ed-meta text-ed-text-muted tabular-nums">{i + 1}</td>
              <td className="py-4">
                <div className="text-ed-item-h4 text-ed-ink">{a.name}</div>
                <div className="text-ed-meta text-ed-text-muted uppercase tracking-wider">{a.symbol}</div>
              </td>
              <td className="py-4 text-right text-ed-body text-ed-ink tabular-nums">{fmtPrice(a.price_usd)}</td>
              <td className="py-4 text-right text-ed-body tabular-nums"><PctCell value={a.percent_change_24h} /></td>
              <td className="py-4 text-right text-ed-body text-ed-ink tabular-nums">{fmtUsd(a.market_cap_usd)}</td>
              <td className="py-4 text-right text-ed-body text-ed-text-secondary tabular-nums">{fmtUsd(a.volume_24h_usd)}</td>
              <td className="py-4 pl-6 text-ed-body text-ed-text-secondary">{a.network ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-32 flex items-center gap-3 text-ed-text-muted">
      <div className="w-5 h-5 border-2 border-[#5E5C75] border-t-transparent rounded-full animate-spin" />
      <span className="text-ed-body">Loading market data…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-32 text-ed-incident text-ed-body">
      Failed to load: {message}
    </div>
  );
}
