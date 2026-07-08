import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Asset, AssetLiveIndex } from '../../types/assets';
import {
  aggregateRARM, RARM_LAYER_KEYS, RARM_SIGNAL_META,
  ASSET_CATEGORY_LABELS, ASSET_STATUS_META,
} from '../../utils/rarm';
import { useRarmMeta } from '../../hooks/useRarmMeta';
import { Eyebrow } from '../../components/Eyebrow';
import { FilterPill } from '../../components/FilterPill';
import { RARMBar } from '../../components/RARMBar';
import SignalDot from '../../components/SignalDot';
import { usePagination } from '../../hooks/usePagination';
import { BigStat, BigStatRibbon } from '../../components/BigStat';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryMeta { code: string; label: string; blurb: string; }

type TabId = 'categories' | 'assets' | 'breakdown';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTvl(n?: number): string {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function statusI18nKey(s: string) {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

// ── Inline sub-components ─────────────────────────────────────────────────────


function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-ed-item-h4 transition-colors ${
        active
          ? 'text-ed-ink border-b-2 border-ed-ink -mb-px'
          : 'text-ed-text-secondary hover:text-ed-ink'
      }`}
    >
      {children}
    </button>
  );
}

function RARMLegend() {
  const { t } = useTranslation('assetsMap');
  const { layers, signals } = useRarmMeta();
  return (
    <div>
      <p className="text-ed-eyebrow text-ed-text-muted uppercase tracking-[0.18em] mb-3">
        {t('legend.frameworkLabel')}
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3">
        {RARM_LAYER_KEYS.map((k, i) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="text-[10px] text-ed-text-faint w-3">{i + 1}</span>
            <span className="text-ed-meta text-ed-text-secondary">{layers[k].label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-ed-hairline">
        {(['green', 'yellow', 'red', 'gray'] as const).map(sig => (
          <div key={sig} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: RARM_SIGNAL_META[sig].dot }}
            />
            <span className="text-ed-meta text-ed-text-secondary">{signals[sig].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Disclaimer() {
  const { t } = useTranslation('assetsMap');
  return (
    <p className="text-ed-meta text-ed-text-muted">
      {t('disclaimer')}
    </p>
  );
}

// ── Panel: Categories ─────────────────────────────────────────────────────────

function CategoriesPanel({
  assets, categories, onSelectCategory,
}: {
  assets: Asset[];
  categories: CategoryMeta[];
  onSelectCategory: (code: string) => void;
}) {
  const { t } = useTranslation('assetsMap');
  const { signals } = useRarmMeta();
  return (
    <section className="pt-ed-section-sm pb-ed-section-md">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-ed-hairline">
          {categories.map(cat => {
            const inCat = assets.filter(a => a.assetCategory === cat.code);
            const catTvl = inCat.reduce((s, a) => s + (a.tvlUsd ?? 0), 0);
            const sig = { green: 0, yellow: 0, red: 0, gray: 0 };
            inCat.forEach(a => RARM_LAYER_KEYS.forEach(k => { sig[a.rarm[k].signal]++; }));

            return (
              <button
                key={cat.code}
                onClick={() => onSelectCategory(cat.code)}
                className="border-r border-b border-ed-hairline p-5 text-left bg-ed-canvas hover:bg-ed-surface-cool transition-colors flex flex-col gap-3"
              >
                {/* Row 1: label */}
                <div className="text-ed-block-h3 text-ed-ink leading-tight">{cat.label}</div>

                {/* Row 2: blurb */}
                <div className="text-ed-meta text-ed-text-muted leading-snug line-clamp-2 min-h-[2.5em]">
                  {cat.blurb}
                </div>

                {/* Row 3: stats */}
                <div className="grid grid-cols-2 border-t border-ed-hairline pt-3">
                  <div>
                    <div className="text-ed-eyebrow text-ed-text-muted">{t('categoryCard.assetsLabel')}</div>
                    <div className="text-ed-item-h4 text-ed-ink tabular-nums mt-0.5">{inCat.length}</div>
                  </div>
                  <div>
                    <div className="text-ed-eyebrow text-ed-text-muted">{t('categoryCard.tvlLabel')}</div>
                    <div className="text-ed-item-h4 text-ed-ink tabular-nums mt-0.5">{formatTvl(catTvl)}</div>
                  </div>
                </div>

                {/* Row 4: RARM signal strip */}
                {inCat.length > 0 ? (
                  <div className="flex items-center justify-between gap-2 text-ed-meta tabular-nums border-t border-ed-hairline-faint pt-3">
                    <span className="text-ed-eyebrow text-ed-text-muted">{t('categoryCard.rarmSignals')}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><SignalDot signal="green"  size={7} />{sig.green}</span>
                      <span className="flex items-center gap-1"><SignalDot signal="yellow" size={7} />{sig.yellow}</span>
                      <span className="flex items-center gap-1"><SignalDot signal="red"    size={7} />{sig.red}</span>
                      <span className="flex items-center gap-1"><SignalDot signal="gray"   size={7} />{sig.gray}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-ed-meta text-ed-text-faint border-t border-ed-hairline-faint pt-3">
                    {t('categoryCard.noAssetsYet')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Panel: All Assets ─────────────────────────────────────────────────────────

function AllAssetsPanel({
  assets, categoryFilter, onCategoryChange,
}: {
  assets: Asset[];
  categoryFilter: string;
  onCategoryChange: (code: string) => void;
}) {
  const { t } = useTranslation('assetsMap');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const { signals } = useRarmMeta();

  const categories = Array.from(new Set(assets.map(a => a.assetCategory)));

  const filtered = assets.filter(a => {
    if (categoryFilter !== 'all' && a.assetCategory !== categoryFilter) return false;
    if (chainFilter !== 'all' && !a.chainOrPlatform.includes(chainFilter)) return false;
    return true;
  });

  const { visible, loadMore, canLoadMore } = usePagination(filtered, 20);

  return (
    <section className="pt-ed-section-sm pb-ed-section-md">
      <div className="max-w-[1400px] mx-auto px-8">

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center mb-ed-section-sm">
          <span className="text-ed-eyebrow text-ed-text-muted uppercase tracking-[0.18em]">{t('filters.categoryLabel')}</span>
          <FilterPill active={categoryFilter === 'all'} onClick={() => onCategoryChange('all')}>{t('filters.all')}</FilterPill>
          {categories.map(c => (
            <FilterPill key={c} active={categoryFilter === c} onClick={() => onCategoryChange(c)}>
              {t(`categoryLabels.${c}`, { defaultValue: ASSET_CATEGORY_LABELS[c] ?? c })}
            </FilterPill>
          ))}
          <span className="w-px h-4 bg-ed-hairline mx-1" />
          <span className="text-ed-eyebrow text-ed-text-muted uppercase tracking-[0.18em]">{t('filters.chainLabel')}</span>
          <FilterPill active={chainFilter === 'all'} onClick={() => setChainFilter('all')}>{t('filters.all')}</FilterPill>
          {['Ethereum', 'Stellar', 'Solana', 'TRON'].map(c => (
            <FilterPill key={c} active={chainFilter === c} onClick={() => setChainFilter(c)}>{c}</FilterPill>
          ))}
        </div>

        {/* Desktop table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-ed-text-muted text-ed-body">
            {t('table.noResults')}
          </div>
        ) : (
          <div className="border border-ed-hairline overflow-hidden">

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ed-hairline bg-ed-surface-cool">
                    {([
                      t('table.headers.asset'),
                      t('table.headers.category'),
                      t('table.headers.chain'),
                      t('table.headers.tvl'),
                      t('table.headers.rarm'),
                      t('table.headers.action'),
                    ]).map((h, i) => (
                      <th
                        key={i}
                        className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ed-hairline-faint">
                  {visible.map(asset => {
                    const summary = aggregateRARM(asset.rarm);
                    const statusMeta = ASSET_STATUS_META[asset.status];
                    return (
                      <tr key={asset.slug} className="hover:bg-ed-surface-cool transition-colors">
                        <td className="px-5 py-4">
                          <div className="text-ed-item-h4 text-ed-ink">{asset.ticker.split(' ')[0]}</div>
                          <div className="text-ed-meta text-ed-text-muted mt-0.5 max-w-[220px] truncate">
                            {asset.name}
                          </div>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] mt-1"
                            style={{ color: statusMeta.color, background: statusMeta.bg }}
                          >
                            {t(`status.${statusI18nKey(asset.status)}`)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-ed-meta font-semibold text-primary bg-[#EAEFF1] px-2 py-0.5 rounded">
                            {t(`categoryLabels.${asset.assetCategory}`, { defaultValue: ASSET_CATEGORY_LABELS[asset.assetCategory] ?? asset.assetCategory })}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {asset.chainOrPlatform.slice(0, 3).map(c => (
                              <span
                                key={c}
                                className="text-[10px] bg-[#F1F4F6] text-primary px-1.5 py-0.5 rounded font-semibold"
                              >
                                {c}
                              </span>
                            ))}
                            {asset.chainOrPlatform.length > 3 && (
                              <span className="text-[10px] text-ed-text-muted">
                                +{asset.chainOrPlatform.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-ed-body text-ed-ink font-semibold">{formatTvl(asset.tvlUsd)}</div>
                          {asset.tvlUpdatedAt && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {typeof asset.change1d === 'number' && (
                                <span
                                  className="text-[10px]"
                                  style={{ color: asset.change1d >= 0 ? '#2E7D32' : '#9e3f4e' }}
                                >
                                  {asset.change1d >= 0 ? '+' : ''}{asset.change1d.toFixed(2)}%
                                </span>
                              )}
                              <span className="text-[9px] text-ed-text-muted">DeFiLlama</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <RARMBar rarm={asset.rarm} />
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                              style={{
                                color:      RARM_SIGNAL_META[summary.dominant].color,
                                background: RARM_SIGNAL_META[summary.dominant].bg,
                                border:     `1px solid ${RARM_SIGNAL_META[summary.dominant].border}`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ background: RARM_SIGNAL_META[summary.dominant].dot }}
                              />
                              {signals[summary.dominant].label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/assets/${asset.slug}`}
                            className="flex items-center gap-1 text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors whitespace-nowrap"
                          >
                            {t('table.viewLink')}
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-ed-hairline-faint">
              {visible.map(asset => {
                const summary = aggregateRARM(asset.rarm);
                return (
                  <Link
                    key={asset.slug}
                    to={`/assets/${asset.slug}`}
                    className="block p-4 space-y-2 hover:bg-ed-surface-cool transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-ed-item-h4 text-ed-ink">{asset.ticker.split(' ')[0]}</span>
                        <p className="text-ed-meta text-ed-text-muted mt-0.5 line-clamp-1">{asset.name}</p>
                        <p className="text-ed-meta text-ed-text-muted mt-0.5">
                          {asset.issuerOrOperator.split('(')[0].trim()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-ed-body text-ed-ink">{formatTvl(asset.tvlUsd)}</div>
                        <RARMBar rarm={asset.rarm} />
                        <span
                          className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            color:      RARM_SIGNAL_META[summary.dominant].color,
                            background: RARM_SIGNAL_META[summary.dominant].bg,
                          }}
                        >
                          {signals[summary.dominant].label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] bg-[#EAEFF1] text-primary px-1.5 py-0.5 rounded font-semibold">
                        {t(`categoryLabels.${asset.assetCategory}`, { defaultValue: ASSET_CATEGORY_LABELS[asset.assetCategory] ?? asset.assetCategory })}
                      </span>
                      {asset.chainOrPlatform.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] bg-[#F1F4F6] text-ed-text-secondary px-1.5 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Load more */}
        {canLoadMore && (
          <div className="mt-ed-section-sm border-t border-ed-hairline pt-ed-section-sm">
            <button onClick={loadMore} className="text-ed-meta text-ed-ink hover:underline">
              {t('table.loadMore', { remaining: filtered.length - visible.length })}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

// ── Asset breakdown card ──────────────────────────────────────────────────────

function AssetBreakdownCard({ asset }: { asset: Asset }) {
  const { t } = useTranslation('assetsMap');
  const { layers } = useRarmMeta();
  const statusMeta = ASSET_STATUS_META[asset.status];
  return (
    <div className="border border-ed-hairline p-6 bg-ed-canvas">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-ed-sm">
        <div className="min-w-0">
          <div className="text-ed-item-h4 text-ed-ink">{asset.ticker.split(' ')[0]}</div>
          <div className="text-ed-meta text-ed-text-muted mt-0.5 max-w-[200px] truncate">{asset.name}</div>
          <div className="text-ed-meta text-ed-text-muted">{asset.issuerOrOperator.split('(')[0].trim()}</div>
        </div>
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
          style={{ color: statusMeta.color, background: statusMeta.bg }}
        >
          {t(`status.${statusI18nKey(asset.status)}`)}
        </span>
      </div>

      {/* 6 RARM layer bars */}
      <div className="flex flex-col gap-3 pt-5 border-t border-ed-hairline-faint">
        {RARM_LAYER_KEYS.map(key => {
          const layer = asset.rarm[key];
          const pct = layer.signal === 'green' ? 100 : layer.signal === 'yellow' ? 55 : layer.signal === 'red' ? 25 : 12;
          const color = RARM_SIGNAL_META[layer.signal].dot;
          return (
            <div key={key}>
              <div className="flex items-center gap-3 pr-1">
                <div className="text-ed-meta text-ed-text-secondary w-[120px] flex-shrink-0">
                  {layers[key].shortLabel}
                </div>
                <div className="flex-1 h-1 bg-ed-hairline">
                  <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <SignalDot signal={layer.signal} size={8} />
              </div>
              <div className="text-[10px] text-ed-text-muted mt-0.5 ml-[132px] line-clamp-1">
                {layer.rationale}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel: RARM Breakdown ─────────────────────────────────────────────────────

function BreakdownPanel({ assets }: { assets: Asset[] }) {
  const { t } = useTranslation('assetsMap');
  return (
    <section className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-cool py-ed-section-md">
      <div className="max-w-[1400px] mx-auto px-8">
        <Eyebrow>{t('breakdown.eyebrow')}</Eyebrow>
        <h2 className="text-2xl md:text-ed-section-h2 text-ed-ink mt-ed-section-sm">
          {t('breakdown.h2')}
        </h2>
        <p className="text-ed-body text-ed-text-secondary max-w-[720px] mt-ed-section-sm mb-ed-section-lg">
          {t('breakdown.body')}
        </p>
        <div className="grid md:grid-cols-2 gap-ed-md">
          {assets.map(a => <AssetBreakdownCard key={a.slug} asset={a} />)}
        </div>
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssetsOverview() {
  const { t } = useTranslation('assetsMap');
  const [assets,         setAssets]         = useState<Asset[]>([]);
  const [categories,     setCategories]     = useState<CategoryMeta[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState<TabId>('categories');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetch('/data/assets/assets.json').then(r => r.json()) as Promise<Asset[]>,
      fetch('/data/assets/assets-live.json').then(r => r.json()).catch(() => null) as Promise<AssetLiveIndex | null>,
      fetch('/data/assets/categories.json').then(r => r.json()) as Promise<CategoryMeta[]>,
    ]).then(([staticData, liveData, cats]) => {
      const liveBySlug = liveData?.assets ?? {};
      const merged = staticData.map(a => ({ ...a, ...(liveBySlug[a.slug] ?? {}) }));
      setAssets(merged);
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleSelectCategory(code: string) {
    setCategoryFilter(code);
    setTab('assets');
  }

  const totalTvl      = assets.reduce((s, a) => s + (a.tvlUsd ?? 0), 0);
  const activeCount   = assets.filter(a => a.status === 'active').length;
  const categoryCount = new Set(assets.map(a => a.assetCategory)).size;
  const totalAssets   = assets.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-ed-text-muted text-ed-section-h2">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-ed-section-md pb-ed-section-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          <h1 className="text-4xl md:text-ed-hero-h1 text-ed-ink mt-ed-section-sm">
            {t('hero.h1')}
          </h1>
          <p className="text-ed-lede text-ed-text-secondary mt-ed-section-sm max-w-3xl">
            {t('hero.lede')}
          </p>
        </div>
      </section>

      {/* ── Stats ribbon ─────────────────────────────────────────────────── */}
      <BigStatRibbon>
        <BigStat value={totalAssets}                               label={t('stats.assets')} />
        <BigStat value={categoryCount}                             label={t('stats.categories')} />
        <BigStat value={activeCount}                               label={t('stats.active')}               valueColor="#2E7D32" />
        <BigStat value={`$${(totalTvl / 1e9).toFixed(1)}B`}       label={t('stats.aggregateTvl')} />
      </BigStatRibbon>

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="border-b border-ed-hairline mt-ed-section-sm">
        <div className="max-w-[1400px] mx-auto px-8 flex items-end justify-between">
          <div className="flex gap-12">
            <TabButton active={tab === 'categories'} onClick={() => setTab('categories')}>
              {t('tabs.categories')}
            </TabButton>
            <TabButton
              active={tab === 'assets'}
              onClick={() => { setTab('assets'); setCategoryFilter('all'); }}
            >
              {t('tabs.allAssets')}
            </TabButton>
            <TabButton active={tab === 'breakdown'} onClick={() => setTab('breakdown')}>
              {t('tabs.breakdown')}
            </TabButton>
          </div>
          <Link
            to="/assets/methodology"
            className="text-ed-meta text-ed-text-muted hover:text-ed-ink pb-3 transition-colors"
          >
            {t('tabs.methodology')}
          </Link>
        </div>
      </div>

      {/* ── Panels ───────────────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <CategoriesPanel
          assets={assets}
          categories={categories}
          onSelectCategory={handleSelectCategory}
        />
      )}
      {tab === 'assets' && (
        <AllAssetsPanel
          assets={assets}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />
      )}
      {tab === 'breakdown' && <BreakdownPanel assets={assets} />}

      {/* ── Legend + disclaimer footer ────────────────────────────────────── */}
      <section className="border-t border-ed-hairline py-ed-section-md bg-ed-surface-sunken">
        <div className="max-w-[1400px] mx-auto px-8 grid md:grid-cols-2 gap-ed-md">
          <RARMLegend />
          <Disclaimer />
        </div>
      </section>

    </div>
  );
}
