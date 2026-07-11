import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '../../components/Eyebrow';
import SeverityBadge from '../../components/SeverityBadge';
import CiteButton from '../../components/CiteButton';
import type { Incident } from '../../types/incident';
import type { Project } from '../../types/projects';

// ── Small MetaItem component ──────────────────────────────────────────────────

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">{label}</div>
      <div className="text-ed-meta text-ed-text-secondary">{children}</div>
    </div>
  );
}

// ── Layer chip ────────────────────────────────────────────────────────────────

const LAYER_COLORS: Record<string, string> = {
  issuer:       '#9e3f4e',
  custody:      '#e09d2b',
  oracle:       '#5E5C75',
  audit:        '#047857',
  jurisdiction: '#1D4ED8',
  redemption:   '#B45309',
};

function LayerChip({ layer }: { layer: string }) {
  const { t } = useTranslation('incidentsMap');
  const color = LAYER_COLORS[layer] ?? '#737C7F';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-ed-meta font-medium border"
      style={{ color, borderColor: color + '40', background: color + '0D' }}
    >
      {t(`shared.rarmLayer.${layer}`)}
    </span>
  );
}

// ── RARM failure card ─────────────────────────────────────────────────────────

function FailureCard({ f }: { f: { layer: string; layer_name: string; issue: string } }) {
  const { t } = useTranslation('incidentsMap');
  const color = LAYER_COLORS[f.layer.toLowerCase()] ?? '#9e3f4e';
  return (
    <div
      className="border p-4"
      style={{ borderColor: color + '40', borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 border"
          style={{ color, borderColor: color + '50', background: color + '12' }}
        >
          {t(`shared.rarmLayer.${f.layer}`)}
        </span>
        <span className="text-ed-meta font-medium text-ed-ink">{f.layer_name}</span>
      </div>
      <p className="text-ed-meta text-ed-text-secondary leading-relaxed">{f.issue}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RWAIIncidentDetail({ incidentId }: { incidentId: string }) {
  const { t } = useTranslation('incidentsMap');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch('/data/projects/projects.json')
      .then(r => r.json())
      .then((projects: Project[]) => {
        const p = projects.find(proj => proj.incident_id === incidentId);
        if (!p || !p.postmortem || !p.incident_id) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const inc: Incident = {
          incident_id:          p.incident_id,
          incident_date:        p.incident_date!,
          severity:             p.severity as Incident['severity'],
          primary_asset_class:  p.primary_asset_class as Incident['primary_asset_class'],
          affected_rarm_layers: p.affected_rarm_layers as Incident['affected_rarm_layers'],
          permalink:            p.permalink!,
          citation_meta:        p.citation_meta!,
          slug:                 p.slug,
          name:                 p.name,
          postmortem:           p.postmortem,
          status:               p.status,
          asset_class:          p.asset_class,
        };
        setIncident(inc);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-ed-text-muted text-[2rem]">progress_activity</span>
      </div>
    );
  }

  if (notFound || !incident) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-16 text-center">
        <h1 className="text-ed-block-h3 text-ed-ink mb-4">{t('rwai.notFound.h1')}</h1>
        <p className="text-ed-body text-ed-text-secondary mb-6">
          {t('rwai.notFound.description', { id: incidentId })}
        </p>
        <Link to="/incidents" className="text-ed-meta text-ed-accent hover:text-ed-ink">
          {t('rwai.notFound.backLink')}
        </Link>
      </div>
    );
  }

  const { postmortem, citation_meta } = incident;
  const canonicalUrl = `https://rwa-index.com${incident.permalink}`;
  const metaDesc = `Structured postmortem of ${citation_meta.short_title} (${incident.incident_date}). RWAscope incident registry, HKUST.`;

  return (
    <>
      <Helmet>
        <title>{citation_meta.short_title} — {incident.incident_id} | RWAscope</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={`${citation_meta.short_title} — RWAscope`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ScholarlyArticle',
          headline: citation_meta.short_title,
          datePublished: `${citation_meta.first_published_year}-01-01`,
          dateCreated: incident.incident_date,
          identifier: incident.incident_id,
          publisher: { '@type': 'Organization', name: 'HKUST RWAscope' },
          author:    { '@type': 'Organization', name: 'RWAscope Research' },
          url: canonicalUrl,
        })}</script>
      </Helmet>

      <div className="max-w-[1400px] mx-auto px-8">

        {/* ── Breadcrumb ── */}
        <div className="pt-ed-section-sm flex items-center gap-2 text-ed-meta text-ed-text-muted">
          <Link to="/incidents" className="hover:text-ed-ink transition-colors">{t('rwai.breadcrumb')}</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-mono">{incident.incident_id}</span>
        </div>

        {/* ── Hero ── */}
        <section className="pt-ed-section-sm pb-ed-section-sm">
          <div className="flex items-center gap-4 text-ed-meta text-ed-text-muted">
            <span className="font-mono tabular-nums">{incident.incident_id}</span>
            <span>·</span>
            <span>{incident.incident_date}</span>
            <span>·</span>
            <SeverityBadge severity={incident.severity} />
          </div>
          <h1 className="text-4xl md:text-ed-hero-h1 text-ed-ink mt-ed-section-sm leading-tight">
            {citation_meta.short_title}
          </h1>
          <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
            {postmortem.root_cause}
          </p>
        </section>

        {/* ── Meta strip ── */}
        <div className="border-y border-ed-hairline grid grid-cols-2 md:grid-cols-4 py-ed-section-sm gap-x-8 gap-y-4">
          <MetaItem label={t('rwai.metaLabels.assetClass')}>
            <span>{t(`rwai.assetClass.${incident.primary_asset_class}`)}</span>
          </MetaItem>
          <MetaItem label={t('rwai.metaLabels.affectedLayers')}>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {incident.affected_rarm_layers.map(l => (
                <LayerChip key={l} layer={l} />
              ))}
            </div>
          </MetaItem>
          <MetaItem label={t('rwai.metaLabels.project')}>
            <Link to={`/projects/${incident.slug}`} className="hover:text-ed-ink transition-colors underline underline-offset-2">
              {incident.name}
            </Link>
          </MetaItem>
          <MetaItem label={t('rwai.metaLabels.cite')}>
            <div className="mt-0.5">
              <CiteButton incident={incident} />
            </div>
          </MetaItem>
        </div>

        {/* ── Main content: 8+4 grid ── */}
        <article className="mt-ed-section-md grid grid-cols-1 md:grid-cols-12 gap-8 pb-ed-section-md md:pb-ed-section">

          {/* Left: postmortem body */}
          <div className="md:col-span-8 space-y-ed-section-md">

            {/* Outcome */}
            <section>
              <Eyebrow>{t('rwai.sections.outcome')}</Eyebrow>
              <blockquote className="mt-ed-section-sm text-ed-body-lg text-ed-text-primary leading-relaxed border-l-4 border-ed-hairline pl-5">
                {postmortem.outcome}
              </blockquote>
            </section>

            {/* What failed */}
            <section>
              <Eyebrow>{t('rwai.sections.whatFailed')}</Eyebrow>
              <div className="mt-ed-section-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                {postmortem.what_failed.map((f, i) => (
                  <FailureCard key={i} f={f} />
                ))}
              </div>
            </section>

            {/* RARM lesson */}
            <section>
              <Eyebrow>{t('rwai.sections.rarmImplication')}</Eyebrow>
              <p className="mt-ed-section-sm text-ed-body text-ed-text-secondary leading-relaxed bg-[#EFF6FB] border border-[#D6E4EE] px-5 py-4">
                {postmortem.rarm_lesson}
              </p>
            </section>
          </div>

          {/* Right: sticky sidebar */}
          <aside className="md:col-span-4">
            <div className="sticky top-24 space-y-4">

              {/* Severity + ID card */}
              <div className="border border-ed-hairline p-4 space-y-3">
                <div>
                  <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">{t('rwai.sidebar.severity')}</div>
                  <SeverityBadge severity={incident.severity} className="text-base" />
                </div>
                <div>
                  <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">{t('rwai.sidebar.incidentDate')}</div>
                  <div className="text-ed-meta font-mono">{incident.incident_date}</div>
                </div>
                <div>
                  <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">{t('rwai.sidebar.registryId')}</div>
                  <div className="text-ed-meta font-mono">{incident.incident_id}</div>
                </div>
              </div>

              {/* RARM layers */}
              <div className="border border-ed-hairline p-4">
                <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">{t('rwai.sidebar.rarmLayersAffected')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {incident.affected_rarm_layers.map(l => (
                    <LayerChip key={l} layer={l} />
                  ))}
                </div>
              </div>

              {/* Citation box */}
              <div className="border border-ed-hairline p-4">
                <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">{t('rwai.sidebar.citeThisEntry')}</div>
                <CiteButton incident={incident} />
              </div>

              {/* Project link */}
              <div className="border border-ed-hairline p-4">
                <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-2">{t('rwai.sidebar.fullProjectProfile')}</div>
                <Link
                  to={`/projects/${incident.slug}`}
                  className="flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  {incident.name}
                </Link>
              </div>
            </div>
          </aside>
        </article>

        {/* ── Bottom nav ── */}
        <div className="border-t border-ed-hairline py-ed-section-sm flex items-center justify-between">
          <Link
            to="/incidents"
            className="flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            {t('rwai.footer.backLink')}
          </Link>
          <Link
            to={`/projects/${incident.slug}`}
            className="flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors"
          >
            {t('rwai.footer.projectProfile')}
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </>
  );
}
