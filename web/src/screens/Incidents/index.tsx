import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow } from '../../components/Eyebrow';
import { BigStat, BigStatRibbon } from '../../components/BigStat';
import SeverityBadge from '../../components/SeverityBadge';
import { useIncidents } from '../../hooks/useIncidents';

function formatAssetClass(raw: string) {
  return raw.replace(/_/g, ' ');
}

export default function IncidentsIndex() {
  const { incidents, loading } = useIncidents();

  const stats = useMemo(() => ({
    total:           incidents.length,
    catastrophic:    incidents.filter(i => i.severity === 'catastrophic').length,
    yearsCount:      new Set(incidents.map(i => i.incident_date.slice(0, 4))).size,
    assetClassCount: new Set(incidents.map(i => i.primary_asset_class)).size,
  }), [incidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-ed-text-muted text-[2rem]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8">
      {/* ── Hero ── */}
      <section className="pt-ed-section-md pb-ed-section-sm">
        <Eyebrow>RWAscope Incident Registry</Eyebrow>
        <h1 className="text-ed-page-h1 text-ed-ink mt-ed-section-sm">
          RWA Incident Database
        </h1>
        <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
          Structured postmortems of tokenized real-world asset failures, indexed with
          permanent identifiers for academic citation and industry reference.
        </p>
      </section>

      {/* ── Stats ribbon ── */}
      <BigStatRibbon cols={4}>
        <BigStat value={stats.total}           label="Indexed incidents" />
        <BigStat value={stats.catastrophic}    label="Catastrophic" valueColor="#9e3f4e" />
        <BigStat value={stats.yearsCount}      label="Years covered" />
        <BigStat value={stats.assetClassCount} label="Asset classes" />
      </BigStatRibbon>

      {/* ── Registry list ── */}
      <div className="border-t border-ed-hairline mt-ed-section-md">
        {incidents.map(inc => (
          <Link
            key={inc.incident_id}
            to={inc.permalink}
            className="block border-b border-ed-hairline py-ed-section-sm hover:bg-ed-surface-cool transition-colors"
          >
            <div className="grid grid-cols-12 gap-8 items-baseline">
              {/* ID */}
              <div className="col-span-2 text-ed-meta tabular-nums text-ed-text-muted font-mono">
                {inc.incident_id}
              </div>
              {/* Date */}
              <div className="col-span-2 text-ed-meta tabular-nums text-ed-text-secondary">
                {inc.incident_date}
              </div>
              {/* Title + layers */}
              <div className="col-span-5">
                <div className="text-ed-item-h4 text-ed-ink">{inc.citation_meta.short_title}</div>
                <div className="text-ed-meta text-ed-text-muted mt-1">
                  {inc.affected_rarm_layers.join(' · ')}
                </div>
              </div>
              {/* Asset class */}
              <div className="col-span-2 text-ed-meta text-ed-text-secondary capitalize">
                {formatAssetClass(inc.primary_asset_class)}
              </div>
              {/* Severity */}
              <div className="col-span-1 text-right">
                <SeverityBadge severity={inc.severity} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Footer note ── */}
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
    </div>
  );
}
