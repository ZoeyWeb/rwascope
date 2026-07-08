import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Issuer, Jurisdiction, JurisdictionCode, IssuerStatus, SARMSignal } from '../../types/licenses';
import { SIGNAL_META, SARM_DIMENSION_KEYS, TYPE_LABELS, getOverallSignal } from '../../utils/sarm';
import { useSarmSignals } from '../../hooks/useSarmSignals';
import SignalDot from '../../components/SignalDot';
import StatusBadge from '../../components/StatusBadge';
import SARMBar from '../../components/SARMBar';
import IssuerLogo from '../../components/IssuerLogo';
import { Eyebrow } from '../../components/Eyebrow';
import { FilterPill } from '../../components/FilterPill';
import { BigStat, BigStatRibbon } from '../../components/BigStat';
import { usePagination } from '../../hooks/usePagination';

// ── Constants ─────────────────────────────────────────────────────────────────

type TabId = 'jurisdictions' | 'issuers' | 'sarm';

const JUR_CODES: JurisdictionCode[] = ['HK', 'SG', 'EU', 'UAE', 'US', 'JP'];

const STATUS_SORT_ORDER: Record<IssuerStatus, number> = {
  licensed:     0,
  under_review: 1,
  sandbox:      2,
  withdrawn:    3,
  rejected:     4,
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function LicensesOverview() {
  const { t } = useTranslation('licensesMap');
  const { signals } = useSarmSignals();

  const TABS: { id: TabId; label: string }[] = [
    { id: 'jurisdictions', label: t('tabs.jurisdictions') },
    { id: 'issuers',       label: t('tabs.issuers')       },
    { id: 'sarm',          label: t('tabs.sarm')          },
  ];

  const STATUS_FILTERS: { value: IssuerStatus | 'all'; label: string }[] = [
    { value: 'all',          label: t('statusFilters.all')         },
    { value: 'sandbox',      label: t('statusFilters.sandbox')     },
    { value: 'under_review', label: t('statusFilters.underReview') },
    { value: 'licensed',     label: t('statusFilters.licensed')    },
    { value: 'withdrawn',    label: t('statusFilters.withdrawn')   },
    { value: 'rejected',     label: t('statusFilters.rejected')    },
  ];

  const REGIME_CHIP: Record<string, { dot: string; label: string } | null> = {
    active:     { dot: '#2E7D32', label: t('regimeChips.active')     },
    developing: { dot: '#e09d2b', label: t('regimeChips.developing') },
    proposed:   { dot: '#A8A29E', label: t('regimeChips.proposed')   },
    none:       null,
  };

  const [issuers,       setIssuers]       = useState<Issuer[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<TabId>('jurisdictions');
  const [jurFilter,     setJurFilter]     = useState<'All' | JurisdictionCode>('All');
  const [statusFilter,  setStatusFilter]  = useState<IssuerStatus | 'all'>('all');
  const [pegFilter,     setPegFilter]     = useState<string>('all');
  const [search,        setSearch]        = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/data/licenses/issuers.json').then(r => r.json()),
      fetch('/data/licenses/jurisdictions.json').then(r => r.json()),
    ])
      .then(([is, jurs]: [Issuer[], Jurisdiction[]]) => {
        setIssuers(is);
        setJurisdictions(jurs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pegs = Array.from(new Set(issuers.map(i => i.peg))).sort();

  const filtered = issuers.filter(i => {
    if (jurFilter !== 'All' && i.jurisdiction_code !== jurFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (pegFilter !== 'all' && i.peg !== pegFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.ticker.toLowerCase().includes(q) ||
        i.parent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const { visible, loadMore, canLoadMore } = usePagination(filtered, 20);

  // Global stats for ribbon
  const globalCounts = {
    licensed:     issuers.filter(i => i.status === 'licensed').length,
    under_review: issuers.filter(i => i.status === 'under_review').length,
    sandbox:      issuers.filter(i => i.status === 'sandbox').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-ed-text-muted text-ed-section-h2">
        progress_activity
      </span>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-8">

      {/* ── Hero (compressed) ────────────────────────────────────────────── */}
      <section className="pt-ed-section-md pb-ed-section-sm">
        <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
        <h1 className="text-4xl md:text-ed-hero-h1 text-ed-ink mt-ed-section-sm">
          {t('hero.title')}
        </h1>
        <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
          {t('hero.lede')}
        </p>
      </section>

      {/* ── Stats ribbon ─────────────────────────────────────────────────── */}
      <BigStatRibbon cols={5}>
        <BigStat value={issuers.length}             label={t('stats.trackingIssuers')} />
        <BigStat value={jurisdictions.length}       label={t('stats.jurisdictions')} />
        <BigStat value={globalCounts.licensed}      label={t('stats.licensed')}      valueColor={globalCounts.licensed     > 0 ? '#2E7D32' : '#A8A29E'} />
        <BigStat value={globalCounts.under_review}  label={t('stats.underReview')}   valueColor={globalCounts.under_review > 0 ? '#e09d2b' : '#A8A29E'} />
        <BigStat value={globalCounts.sandbox}       label={t('stats.sandbox')}       valueColor={globalCounts.sandbox      > 0 ? '#1565C0' : '#A8A29E'} />
      </BigStatRibbon>

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="border-b border-ed-hairline mt-ed-section-sm">
        <div className="flex items-end justify-between">
          <div className="flex gap-4 md:gap-12">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`pb-3 text-ed-item-h4 transition-colors ${
                  activeTab === t.id
                    ? 'text-ed-ink border-b-2 border-ed-ink -mb-px'
                    : 'text-ed-text-secondary hover:text-ed-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Link
            to="/licenses/methodology"
            className="hidden md:block text-ed-meta text-ed-text-muted hover:text-ed-ink pb-3 transition-colors"
          >
            {t('jurisdictionsTab.methodologyLink')}
          </Link>
        </div>
      </div>

      {/* ── Tab 1: Jurisdictions ─────────────────────────────────────────── */}
      {activeTab === 'jurisdictions' && (
        <section className="pt-ed-section-sm pb-ed-section-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-ed-hairline">
            {jurisdictions.map(j => {
              const inJur = issuers.filter(i => i.jurisdiction_code === j.code);
              const counts = {
                total:        inJur.length,
                licensed:     inJur.filter(i => i.status === 'licensed').length,
                under_review: inJur.filter(i => i.status === 'under_review').length,
                sandbox:      inJur.filter(i => i.status === 'sandbox').length,
              };
              const sig: Record<SARMSignal, number> = { green: 0, yellow: 0, red: 0, gray: 0 };
              inJur.forEach(i => SARM_DIMENSION_KEYS.forEach(k => sig[i.sarm[k].signal]++));
              const regimeChip = REGIME_CHIP[j.regime_status] ?? null;

              return (
                <button
                  key={j.code}
                  onClick={() => { setActiveTab('issuers'); setJurFilter(j.code); }}
                  className="border-r border-b border-ed-hairline p-5 text-left bg-ed-canvas hover:bg-ed-surface-cool transition-colors flex flex-col gap-3"
                >
                  {/* Row 1: name + regime chip */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-ed-block-h3 text-ed-ink leading-tight">{j.name}</div>
                      <div className="text-ed-meta text-ed-text-muted mt-0.5">{j.regulator}</div>
                    </div>
                    {regimeChip && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className="inline-block rounded-full"
                          style={{ width: 7, height: 7, background: regimeChip.dot }}
                        />
                        <span className="text-ed-eyebrow text-ed-text-muted">{regimeChip.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 2: framework — 2-line clamp */}
                  <div className="text-ed-meta text-ed-text-muted leading-snug line-clamp-2 min-h-[2.5em]">
                    {j.framework}
                  </div>

                  {/* Row 3: 4-col counts grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-ed-hairline pt-3">
                    <div>
                      <div className="text-ed-eyebrow text-ed-text-muted">{t('jurisdictionsTab.total')}</div>
                      <div className="text-ed-item-h4 text-ed-ink tabular-nums mt-0.5">{counts.total}</div>
                    </div>
                    <div>
                      <div className="text-ed-eyebrow text-ed-text-muted">{t('jurisdictionsTab.licensed')}</div>
                      <div
                        className="text-ed-item-h4 tabular-nums mt-0.5"
                        style={{ color: counts.licensed > 0 ? '#2E7D32' : '#A8A29E' }}
                      >
                        {counts.licensed}
                      </div>
                    </div>
                    <div>
                      <div className="text-ed-eyebrow text-ed-text-muted">{t('jurisdictionsTab.review')}</div>
                      <div
                        className="text-ed-item-h4 tabular-nums mt-0.5"
                        style={{ color: counts.under_review > 0 ? '#e09d2b' : '#A8A29E' }}
                      >
                        {counts.under_review}
                      </div>
                    </div>
                    <div>
                      <div className="text-ed-eyebrow text-ed-text-muted">{t('jurisdictionsTab.sandbox')}</div>
                      <div
                        className="text-ed-item-h4 tabular-nums mt-0.5"
                        style={{ color: counts.sandbox > 0 ? '#1565C0' : '#A8A29E' }}
                      >
                        {counts.sandbox}
                      </div>
                    </div>
                  </div>

                  {/* Row 4: SARM signal strip */}
                  {counts.total > 0 ? (
                    <div className="flex items-center justify-between gap-2 text-ed-meta text-ed-text-secondary tabular-nums border-t border-ed-hairline-faint pt-3">
                      <span className="text-ed-eyebrow text-ed-text-muted">{t('jurisdictionsTab.sarmSignals')}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><SignalDot signal="green"  size={7} />{sig.green}</span>
                        <span className="flex items-center gap-1"><SignalDot signal="yellow" size={7} />{sig.yellow}</span>
                        <span className="flex items-center gap-1"><SignalDot signal="red"    size={7} />{sig.red}</span>
                        <span className="flex items-center gap-1"><SignalDot signal="gray"   size={7} />{sig.gray}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-ed-meta text-ed-text-faint border-t border-ed-hairline-faint pt-3">
                      {t('jurisdictionsTab.noAssessedIssuers')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tab 2: All Issuers ───────────────────────────────────────────── */}
      {activeTab === 'issuers' && (
        <section className="pt-ed-section-sm pb-ed-section-md">

          {/* Jurisdiction filter */}
          <div className="flex items-center gap-2 flex-wrap mb-ed-section-sm">
            <span className="text-ed-eyebrow text-ed-text-muted">{t('issuersTab.jurisdictionLabel')}</span>
            <FilterPill active={jurFilter === 'All'} onClick={() => setJurFilter('All')}>{t('issuersTab.allJurisdictions')}</FilterPill>
            {JUR_CODES.map(c => (
              <FilterPill key={c} active={jurFilter === c} onClick={() => setJurFilter(c)}>{c}</FilterPill>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap mb-ed-section-sm">
            <span className="text-ed-eyebrow text-ed-text-muted">{t('issuersTab.statusLabel')}</span>
            {STATUS_FILTERS.map(f => (
              <FilterPill
                key={f.value}
                active={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </FilterPill>
            ))}
          </div>

          {/* Search + peg */}
          <div className="flex flex-col sm:flex-row gap-3 mb-ed-section-sm">
            <div className="relative flex-1 max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ed-text-muted text-base">
                search
              </span>
              <input
                type="text"
                placeholder={t('issuersTab.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-ed-body border border-ed-hairline bg-ed-surface focus:outline-none focus:ring-1 focus:ring-ed-ink/20"
              />
            </div>
            {pegs.length > 1 && (
              <select
                value={pegFilter}
                onChange={e => setPegFilter(e.target.value)}
                className="text-ed-meta border border-ed-hairline px-3 py-2 bg-ed-surface focus:outline-none focus:ring-1 focus:ring-ed-ink/20"
              >
                <option value="all">{t('issuersTab.allPegs')}</option>
                {pegs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          {/* Table / empty state */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-ed-text-muted text-ed-body">
              {t('issuersTab.noIssuersMatch')}
            </div>
          ) : (
            <div className="border border-ed-hairline overflow-hidden">

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ed-hairline bg-ed-surface-cool">
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.issuer')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.jurisdiction')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.ticker')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.peg')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.type')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.status')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.sarm')}</th>
                      <th className="text-left px-5 py-3 text-ed-eyebrow text-ed-text-muted">{t('issuersTab.tableHeaders.applied')}</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ed-hairline-faint">
                    {visible.map(issuer => {
                      const overall = getOverallSignal(issuer);
                      return (
                        <tr key={issuer.slug} className="hover:bg-ed-surface-cool transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <IssuerLogo issuer={issuer} size={24} />
                              <div>
                                <div className="text-ed-body text-ed-ink">{issuer.name}</div>
                                <div className="text-ed-meta text-ed-text-muted mt-0.5 max-w-[200px] truncate">
                                  {issuer.parent}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-ed-meta text-ed-text-muted tabular-nums">
                              {issuer.jurisdiction_code}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-ed-meta text-ed-text-secondary">
                              {issuer.ticker}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-ed-body text-ed-ink">{issuer.peg}</td>
                          <td className="px-5 py-4 text-ed-body text-ed-text-muted">
                            {TYPE_LABELS[issuer.type] ?? issuer.type}
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={issuer.status} /></td>
                          <td className="px-5 py-4"><SARMBar sarm={issuer.sarm} /></td>
                          <td className="px-5 py-4 text-ed-meta text-ed-text-muted tabular-nums">
                            {issuer.application_date === 'Unknown' ? '—' : issuer.application_date}
                          </td>
                          <td className="px-5 py-4">
                            <Link
                              to={`/licenses/${issuer.slug}`}
                              className="flex items-center gap-1 text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                            >
                              {t('issuersTab.viewAction')}
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
                {visible.map(issuer => {
                  const overall = getOverallSignal(issuer);
                  return (
                    <div key={issuer.slug} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IssuerLogo issuer={issuer} size={24} />
                          <div>
                            <span className="text-ed-body text-ed-ink">{issuer.name}</span>
                            <span className="text-ed-meta text-ed-text-faint ml-2">
                              {issuer.jurisdiction_code}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={issuer.status} />
                      </div>
                      <div className="text-ed-meta text-ed-text-muted">{issuer.parent}</div>
                      <div className="flex items-center gap-4 text-ed-meta text-ed-text-muted">
                        <span className="font-mono text-ed-text-secondary">{issuer.ticker}</span>
                        <span>{issuer.peg}</span>
                        <span>{TYPE_LABELS[issuer.type]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <SARMBar sarm={issuer.sarm} />
                        <Link
                          to={`/licenses/${issuer.slug}`}
                          className="flex items-center gap-1 text-ed-meta text-ed-text-secondary hover:text-ed-ink"
                        >
                          {t('issuersTab.viewProfile')}
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Load more */}
          {canLoadMore && (
            <div className="mt-ed-section-sm border-t border-ed-hairline pt-ed-section-sm">
              <button onClick={loadMore} className="text-ed-meta text-ed-ink hover:underline">
                {t('issuersTab.loadMore', { remaining: filtered.length - visible.length })}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Tab 3: SARM Breakdown ────────────────────────────────────────── */}
      {activeTab === 'sarm' && (
        <section className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-cool pt-ed-section-sm pb-ed-section-md md:pb-ed-section">
          <div className="max-w-[1400px] mx-auto px-8">
            <Eyebrow>{t('sarmTab.eyebrow')}</Eyebrow>
            <h2 className="text-2xl md:text-ed-section-h2 text-ed-ink mt-ed-section-sm">
              {t('sarmTab.title')}
            </h2>
            <p className="text-ed-body text-ed-text-secondary max-w-[720px] mt-ed-section-sm mb-ed-section-lg">
              {t('sarmTab.description')}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-ed-section-sm">
              {[...issuers]
                .sort((a, b) => (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99))
                .map(issuer => (
                  <div key={issuer.slug} className="border border-ed-hairline p-6 bg-ed-canvas">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-ed-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <IssuerLogo issuer={issuer} size={36} />
                        <div className="min-w-0">
                          <div className="text-ed-item-h4 text-ed-ink truncate">{issuer.name}</div>
                          <div className="text-ed-meta text-ed-text-muted">{issuer.jurisdiction_code} · {issuer.peg}</div>
                        </div>
                      </div>
                      <StatusBadge status={issuer.status} />
                    </div>

                    {/* 6 dimension bars */}
                    <div className="flex flex-col gap-2.5 pt-5 border-t border-ed-hairline-faint">
                      {SARM_DIMENSION_KEYS.map(key => {
                        const dim = issuer.sarm[key];
                        const pct = dim.signal === 'green' ? 100 : dim.signal === 'yellow' ? 55 : dim.signal === 'red' ? 25 : 12;
                        const color = SIGNAL_META[dim.signal].color;
                        return (
                          <div key={key} className="flex items-center gap-3 pr-1">
                            <div className="text-ed-meta text-ed-text-secondary w-[120px] flex-shrink-0">{dim.label}</div>
                            <div className="flex-1 h-1 bg-ed-hairline">
                              <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <SignalDot signal={dim.signal} size={8} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Shared footer: legend + disclaimer ──────────────────────────── */}
      <section className="py-ed-section-md border-t border-ed-hairline">
        <div className="flex items-center gap-ed-section-sm flex-wrap text-ed-meta text-ed-text-muted mb-ed-section-sm">
          <span className="text-ed-eyebrow text-ed-text-muted">{t('sarmLegend.eyebrow')}</span>
          <span className="flex items-center gap-1.5"><SignalDot signal="green"  size={8} />{signals['green'].label}</span>
          <span className="flex items-center gap-1.5"><SignalDot signal="yellow" size={8} />{signals['yellow'].label}</span>
          <span className="flex items-center gap-1.5"><SignalDot signal="red"    size={8} />{signals['red'].label}</span>
          <span className="flex items-center gap-1.5"><SignalDot signal="gray"   size={8} />{signals['gray'].label}</span>
        </div>
        <p className="text-ed-meta text-ed-text-muted leading-relaxed max-w-[900px]">
          {t('disclaimer')}
        </p>
      </section>

    </div>
  );
}
