import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow } from '../../components/Eyebrow';
import { BigStat, BigStatRibbon } from '../../components/BigStat';
import SeverityBadge from '../../components/SeverityBadge';
import { useIncidents } from '../../hooks/useIncidents';
import { useIncidentsDatabase } from '../../hooks/useIncidentsDatabase';

function formatAssetClass(raw: string) {
  return raw.replace(/_/g, ' ');
}

function assetClassLabel(raw: string): string {
  const map: Record<string, string> = {
    'stablecoin':              'Stablecoin',
    'infrastructure':          'Infrastructure',
    'tokenized-real-estate':   'Tokenized RE',
    'tokenized-treasury':      'Tokenized Treasury',
    'tokenized-private-credit':'Private Credit',
    'tokenized-commodity':     'Tokenized Commodity',
  };
  return map[raw] ?? raw.replace(/-/g, ' ');
}

const DB_SEVERITY_COLOR: Record<string, string> = {
  critical: '#B91C1C',
  high:     '#E09D2B',
  medium:   '#737C7F',
  low:      '#9CA3AF',
};

export default function IncidentsIndex() {
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
              <Eyebrow>RWAscope Incident Registry</Eyebrow>
              <h1 className="text-4xl md:text-ed-page-h1 text-ed-ink mt-ed-section-sm">
                RWA Incident Database
              </h1>
              <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
                Indexed postmortems with permanent RWAI identifiers for academic citation,
                complemented by a broader incident database covering events across the RWA ecosystem.
              </p>
            </div>
            <a
              href="/feeds/incidents.xml"
              className="shrink-0 mt-1 text-ed-meta text-ed-text-secondary border border-ed-hairline px-3 py-1 hover:border-ed-ink hover:text-ed-ink transition-colors uppercase tracking-[0.1em]"
            >
              RSS Subscribe
            </a>
          </div>
        </section>

        {/* ── RWAI stats ribbon ── */}
        <BigStatRibbon cols={4}>
          <BigStat value={stats.total}           label="Indexed incidents" />
          <BigStat value={stats.catastrophic}    label="Catastrophic" valueColor="#9e3f4e" />
          <BigStat value={stats.yearsCount}      label="Years covered" />
          <BigStat value={stats.assetClassCount} label="Asset classes" />
        </BigStatRibbon>

        {/* ── RWAI Registry section ── */}
        <section className="py-ed-section-md">
          <Eyebrow>RWAscope · Indexed Registry</Eyebrow>
          <h2 className="text-ed-section-h2 text-ed-ink mt-ed-section-sm">RWA Incident Registry</h2>

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
                      {inc.affected_rarm_layers.join(' · ')}
                    </div>
                  </div>
                  {/* Asset class + date (mobile) */}
                  <div className="md:col-span-2 text-ed-meta text-ed-text-secondary capitalize flex gap-2 md:block">
                    <span className="md:hidden text-ed-text-muted">{inc.incident_date} ·</span>
                    {formatAssetClass(inc.primary_asset_class)}
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
              Identifiers follow the pattern <span className="font-mono">RWAI-YYYY-NNN</span>.
              Each entry is citable and carries a permanent URL.
            </p>
            <Link
              to="/incidents/methodology"
              className="text-ed-meta text-ed-accent hover:text-ed-ink transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">info</span>
              Methodology
            </Link>
          </div>
        </section>
      </div>

      {/* ── Incident Database section ── */}
      <section className="py-ed-section border-t border-ed-hairline">
        <div className="max-w-[1400px] mx-auto px-8">
          <Eyebrow>RWAscope · Broader Corpus</Eyebrow>
          <h2 className="text-ed-section-h2 text-ed-ink mt-ed-section-sm">Incident Database</h2>

          <BigStatRibbon cols={4}>
            <BigStat value={dbStats.total}           label="Incidents" />
            <BigStat value={dbStats.critical}        label="Critical" valueColor="#B91C1C" />
            <BigStat value={dbStats.yearRange}       label="Years covered" />
            <BigStat value={`${dbStats.assetClassCount} of 7`} label="Asset classes" />
          </BigStatRibbon>

          {/* Column headers — desktop only */}
          <div className="hidden md:grid md:grid-cols-[140px_120px_1fr_180px_100px] md:gap-6 text-ed-meta text-ed-text-muted uppercase tracking-[0.08em] border-b border-ed-hairline pb-2 mt-ed-section-md">
            <span>Date</span>
            <span>Severity</span>
            <span>Incident</span>
            <span>Asset Class</span>
            <span className="text-right">Loss (USD)</span>
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
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-ed-item-h4 text-ed-ink">{inc.title}</div>
                  <div className="text-ed-meta text-ed-text-secondary">{assetClassLabel(inc.assetClass)}</div>
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
