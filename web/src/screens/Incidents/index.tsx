import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Eyebrow } from '../../components/Eyebrow';
import { BigStat, BigStatRibbon } from '../../components/BigStat';
import SeverityBadge from '../../components/SeverityBadge';
import { useIncidents } from '../../hooks/useIncidents';
import { useIncidentsDatabase } from '../../hooks/useIncidentsDatabase';

const DB_SEVERITY_COLOR: Record<string, string> = {
  critical: '#B91C1C',
  high:     '#E09D2B',
  medium:   '#737C7F',
  low:      '#9CA3AF',
};

export default function IncidentsIndex() {
  const { t } = useTranslation('incidentsMap');
  const { incidents, loading } = useIncidents();
  const { incidents: dbIncidents, loading: dbLoading } = useIncidentsDatabase();

  const stats = useMemo(() => ({
    total:           incidents.length,
    catastrophic:    incidents.filter(i => i.severity === 'catastrophic').length,
    yearsCount:      new Set(incidents.map(i => i.incident_date.slice(0, 4))).size,
    assetClassCount: new Set(incidents.map(i => i.primary_asset_class)).size,
  }), [incidents]);

  const dbStats = useMemo(() => {
    const years = [...new Set(dbIncidents.map(i => i.date.slice(0, 4)))].map(Number);
    const minYear = years.length > 0 ? Math.min(...years) : 0;
    const maxYear = years.length > 0 ? Math.max(...years) : 0;
    return {
      total:           dbIncidents.length,
      critical:        dbIncidents.filter(i => i.severity === 'critical').length,
      yearRange:       years.length > 0 ? `${minYear}–${maxYear}` : '—',
      assetClassCount: new Set(dbIncidents.map(i => i.assetClass)).size,
    };
  }, [dbIncidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-ed-text-muted text-[2rem]">progress_activity</span>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-8">
        {/* ── Hero ── */}
        <section className="pt-ed-section-md pb-ed-section-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
              <h1 className="text-4xl md:text-ed-page-h1 text-ed-ink mt-ed-section-sm">
                {t('hero.h1')}
              </h1>
              <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
                {t('hero.lede')}
              </p>
            </div>
            <a
              href="/feeds/incidents.xml"
              className="shrink-0 mt-1 text-ed-meta text-ed-text-secondary border border-ed-hairline px-3 py-1 hover:border-ed-ink hover:text-ed-ink transition-colors uppercase tracking-[0.1em]"
            >
              {t('hero.rssSubscribe')}
            </a>
          </div>
        </section>

        {/* ── RWAI stats ribbon ── */}
        <BigStatRibbon cols={4}>
          <BigStat value={stats.total}           label={t('stats.indexedIncidents')} />
          <BigStat value={stats.catastrophic}    label={t('stats.catastrophic')} valueColor="#9e3f4e" />
          <BigStat value={stats.yearsCount}      label={t('stats.yearsCovered')} />
          <BigStat value={stats.assetClassCount} label={t('stats.assetClasses')} />
        </BigStatRibbon>

        {/* ── RWAI Registry section ── */}
        <section className="py-ed-section-md">
          <Eyebrow>{t('registry.eyebrow')}</Eyebrow>
          <h2 className="text-ed-section-h2 text-ed-ink mt-ed-section-sm">{t('registry.h2')}</h2>

          <div className="border-t border-ed-hairline mt-ed-section-md">
            {incidents.map(inc => (
              <Link
                key={inc.incident_id}
                to={inc.permalink}
                className="block border-b border-ed-hairline py-ed-section-sm hover:bg-ed-surface-cool transition-colors"
              >
                <div className="flex flex-col gap-1 md:grid md:grid-cols-12 md:gap-8 md:items-baseline">
                  {/* ID + severity (mobile: same line) */}
                  <div className="md:col-span-2 flex items-center justify-between md:block">
                    <span className="text-ed-meta tabular-nums text-ed-text-muted font-mono">{inc.incident_id}</span>
                    <span className="md:hidden"><SeverityBadge severity={inc.severity} /></span>
                  </div>
                  {/* Date */}
                  <div className="hidden md:block md:col-span-2 text-ed-meta tabular-nums text-ed-text-secondary">
                    {inc.incident_date}
                  </div>
                  {/* Title + layers */}
                  <div className="md:col-span-5">
                    <div className="text-ed-item-h4 text-ed-ink">{inc.citation_meta.short_title}</div>
                    <div className="text-ed-meta text-ed-text-muted mt-1">
                      {inc.affected_rarm_layers.map(l => t(`shared.rarmLayer.${l}`)).join(' · ')}
                    </div>
                  </div>
                  {/* Asset class + date (mobile) */}
                  <div className="md:col-span-2 text-ed-meta text-ed-text-secondary capitalize flex gap-2 md:block">
                    <span className="md:hidden text-ed-text-muted">{inc.incident_date} ·</span>
                    {t(`rwai.assetClass.${inc.primary_asset_class}`)}
                  </div>
                  {/* Severity — desktop only */}
                  <div className="hidden md:block md:col-span-1 text-right">
                    <SeverityBadge severity={inc.severity} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="py-ed-section-sm flex items-center justify-between">
            <p className="text-ed-meta text-ed-text-muted max-w-xl">
              <Trans
                i18nKey="registry.identifierNote"
                ns="incidentsMap"
                components={{ mono: <span className="font-mono" /> }}
              />
            </p>
            <Link
              to="/incidents/methodology"
              className="text-ed-meta text-ed-accent hover:text-ed-ink transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">info</span>
              {t('registry.methodology')}
            </Link>
          </div>
        </section>
      </div>

      {/* ── Incident Database section ── */}
      <section className="py-ed-section border-t border-ed-hairline">
        <div className="max-w-[1400px] mx-auto px-8">
          <Eyebrow>{t('database.eyebrow')}</Eyebrow>
          <h2 className="text-ed-section-h2 text-ed-ink mt-ed-section-sm">{t('database.h2')}</h2>

          <BigStatRibbon cols={4}>
            <BigStat value={dbStats.total}           label={t('database.stats.incidents')} />
            <BigStat value={dbStats.critical}        label={t('database.stats.critical')} valueColor="#B91C1C" />
            <BigStat value={dbStats.yearRange}       label={t('database.stats.yearsCovered')} />
            <BigStat value={t('database.stats.assetClassesCount', { count: dbStats.assetClassCount })} label={t('database.stats.assetClasses')} />
          </BigStatRibbon>

          {/* Column headers — desktop only */}
          <div className="hidden md:grid md:grid-cols-[140px_120px_1fr_180px_100px] md:gap-6 text-ed-meta text-ed-text-muted uppercase tracking-[0.08em] border-b border-ed-hairline pb-2 mt-ed-section-md">
            <span>{t('database.table.date')}</span>
            <span>{t('database.table.severity')}</span>
            <span>{t('database.table.incident')}</span>
            <span>{t('database.table.assetClass')}</span>
            <span className="text-right">{t('database.table.loss')}</span>
          </div>

          {dbLoading ? (
            <div className="flex items-center justify-center py-ed-section">
              <span className="material-symbols-outlined animate-spin text-ed-text-muted text-[2rem]">progress_activity</span>
            </div>
          ) : (
            dbIncidents.map(inc => (
              <Link
                key={inc.slug}
                to={`/incidents/${inc.slug}`}
                className="block border-b border-ed-hairline py-ed-section-sm hover:bg-ed-surface-cool transition-colors"
              >
                <div className="flex flex-col gap-1 md:grid md:grid-cols-[140px_120px_1fr_180px_100px] md:gap-6 md:items-baseline">
                  <div className="text-ed-meta tabular-nums text-ed-text-secondary">{inc.date}</div>
                  <div>
                    <span
                      className="text-ed-meta uppercase tracking-[0.08em] font-medium"
                      style={{ color: DB_SEVERITY_COLOR[inc.severity] ?? '#737C7F' }}
                    >
                      {t(`shared.severity.${inc.severity}`)}
                    </span>
                  </div>
                  <div className="text-ed-item-h4 text-ed-ink">{inc.title}</div>
                  <div className="text-ed-meta text-ed-text-secondary">
                    {t(`database.assetClassShort.${inc.assetClass}`, { defaultValue: inc.assetClass.replace(/-/g, ' ') })}
                  </div>
                  <div className="text-ed-meta tabular-nums text-ed-text-secondary md:text-right">
                    {inc.estimatedLossUsd != null
                      ? `$${(inc.estimatedLossUsd / 1_000_000).toFixed(1)}M`
                      : '—'}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}
