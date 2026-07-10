import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Project, EntityEntry, TimelineEvent, Postmortem, ProjectSource } from '../../types/projects';
import {
  ASSET_CLASS_META,
  STATUS_META,
  ENTITY_TYPE_META,
} from '../../types/projects';
import DisclaimerBanner from '../../components/DisclaimerBanner';
import { projectsApi } from '../../api/client';

// ── RARM 6-layer section ─────────────────────────────────────────────────────

interface LayerField {
  label: string;
  value: ReactNode;
}

const LAYER_COLORS = [
  '#0C447C', // L1 Legal
  '#2E7D32', // L2 Asset
  '#854F0B', // L3 Counterparty
  '#5E5C75', // L4 Token & Market
  '#6B21A8', // L5 Technology
  '#9e3f4e', // L6 Governance
];

function RARMLayerCard({ layer, title, fields }: { layer: number; title: string; fields: LayerField[] }) {
  const color = LAYER_COLORS[layer - 1];
  const visible = fields.filter(
    f => f.value !== null && f.value !== undefined && f.value !== '' && f.value !== false,
  );
  if (visible.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#DBE4E7] bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: color + '18', color }}
        >
          L{layer}
        </span>
        <h3 className="text-[10px] font-bold text-[#737C7F] uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {visible.map((f, i) => (
          <div key={i}>
            <div className="text-[10px] font-medium text-[#737C7F] uppercase tracking-wider mb-0.5">
              {f.label}
            </div>
            <div className="text-sm text-[#2B3437] leading-snug">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntityValue({ entity }: { entity: EntityEntry }) {
  const { t } = useTranslation('projectsMap');
  const typeMeta = ENTITY_TYPE_META[entity.type];
  return (
    <span className="inline-flex flex-col gap-0">
      {entity.url ? (
        <a
          href={entity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-sm font-medium hover:underline"
          style={{ color: '#5E5C75' }}
        >
          {entity.name}
          <span className="material-symbols-outlined text-[11px]">open_in_new</span>
        </a>
      ) : (
        <span className="text-sm text-[#2B3437]">{entity.name}</span>
      )}
      {typeMeta && (
        <span className="text-[10px] text-[#737C7F]">{t('entityType.' + entity.type)}</span>
      )}
    </span>
  );
}

function RARMLayersSection({ project }: { project: Project }) {
  const { t } = useTranslation('projectsMap');
  const { entity_map } = project;

  const auditValue = project.smart_contract_audit
    ? (
      <span className="inline-flex flex-col gap-0.5">
        <span>{project.smart_contract_audit.auditor} — {project.smart_contract_audit.date}</span>
        {project.smart_contract_audit.report_url && (
          <a
            href={project.smart_contract_audit.report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#5E5C75] hover:underline inline-flex items-center gap-0.5"
          >
            {t('detail.rarm.field.viewReport')}
            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
          </a>
        )}
      </span>
    )
    : null;

  const layers = [
    {
      layer: 1,
      title: t('detail.rarm.l1'),
      fields: [
        { label: t('detail.rarm.field.issuer'),      value: entity_map.issuer    ? <EntityValue entity={entity_map.issuer} />    : null },
        { label: t('detail.rarm.field.regulator'),   value: entity_map.regulator ? <EntityValue entity={entity_map.regulator} /> : null },
        { label: t('detail.rarm.field.legalCounsel'), value: entity_map.law_firm ? <EntityValue entity={entity_map.law_firm} />  : null },
        { label: t('detail.rarm.field.jurisdiction'), value: project.jurisdiction },
      ],
    },
    {
      layer: 2,
      title: t('detail.rarm.l2'),
      fields: [
        { label: t('detail.rarm.field.underlyingAsset'),    value: project.underlying_asset },
        { label: t('detail.rarm.field.reserveComposition'), value: project.reserve_composition },
      ],
    },
    {
      layer: 3,
      title: t('detail.rarm.l3'),
      fields: [
        { label: t('detail.rarm.field.custodian'), value: entity_map.custodian ? <EntityValue entity={entity_map.custodian} /> : null },
        { label: t('detail.rarm.field.auditor'),   value: entity_map.auditor   ? <EntityValue entity={entity_map.auditor} />   : null },
      ],
    },
    {
      layer: 4,
      title: t('detail.rarm.l4'),
      fields: [
        { label: t('detail.rarm.field.chain'),          value: project.chain },
        { label: t('detail.rarm.field.tokenStandard'),  value: entity_map.token_standard },
        {
          label: t('detail.rarm.field.tvl'),
          value: project.tvl_usd
            ? t('detail.rarm.field.tvlValue', { amount: (project.tvl_usd / 1e6).toFixed(0) })
            : null,
        },
        {
          label: t('detail.rarm.field.minInvestment'),
          value: project.min_investment_usd
            ? `$${project.min_investment_usd.toLocaleString('en-US')}`
            : null,
        },
        { label: t('detail.rarm.field.secondaryMarket'), value: project.secondary_market },
      ],
    },
    {
      layer: 5,
      title: t('detail.rarm.l5'),
      fields: [
        { label: t('detail.rarm.field.oracleProvider'),     value: project.oracle_provider },
        { label: t('detail.rarm.field.smartContractAudit'), value: auditValue },
        { label: t('detail.rarm.field.chainInfra'),         value: entity_map.chain_infra ? <EntityValue entity={entity_map.chain_infra} /> : null },
      ],
    },
    {
      layer: 6,
      title: t('detail.rarm.l6'),
      fields: [
        { label: t('detail.rarm.field.redemptionMechanism'), value: project.redemption_mechanism },
        { label: t('detail.rarm.field.upgradeAuthority'),    value: project.upgrade_authority },
      ],
    },
  ];

  return (
    <div>
      <h2 className="text-[10px] font-bold text-[#737C7F] uppercase tracking-widest mb-1">
        {t('detail.rarm.sectionTitle')}
      </h2>
      <p className="text-xs text-[#737C7F] mb-4 leading-relaxed">
        {t('detail.rarm.sectionLede')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {layers.map(l => (
          <RARMLayerCard key={l.layer} layer={l.layer} title={l.title} fields={l.fields} />
        ))}
      </div>
    </div>
  );
}

// ── Timeline section ──────────────────────────────────────────────────────────

function TimelineSection({ timeline }: { timeline?: TimelineEvent[] }) {
  const { t } = useTranslation('projectsMap');
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#DBE4E7] bg-white p-5">
      <h2 className="text-[10px] font-bold text-[#737C7F] uppercase tracking-widest mb-5">
        {t('detail.timeline.title')}
      </h2>
      <div className="relative">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#DBE4E7]" />
        <div className="space-y-5">
          {timeline.map((ev, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 mt-0.5"
                style={{ background: '#5E5C75', zIndex: 1 }}
              />
              <div>
                <div className="text-[10px] font-medium text-[#737C7F] mb-0.5">{ev.date}</div>
                <div className="text-sm text-[#2B3437]">{ev.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sources section ───────────────────────────────────────────────────────────

function SourcesSection({ sources }: { sources: Array<string | ProjectSource> }) {
  const { t } = useTranslation('projectsMap');
  return (
    <div className="rounded-xl border border-[#DBE4E7] bg-white p-5">
      <h2 className="text-[10px] font-bold text-[#737C7F] uppercase tracking-widest mb-3">
        {t('detail.sources.title')}
      </h2>
      <ul className="space-y-2">
        {sources.map((src, i) => {
          const href = typeof src === 'string' ? src : src.url;
          const label = typeof src === 'string' ? src : src.title;
          return (
            <li key={i} className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[13px] text-[#737C7F] mt-0.5 shrink-0">
                open_in_new
              </span>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors break-all leading-relaxed"
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Postmortem section ────────────────────────────────────────────────────────

// Postmortem context: all failed layers shown in unified red
const LAYER_BORDER: Record<string, string> = {
  L1: '#9e3f4e',
  L2: '#9e3f4e',
  L3: '#9e3f4e',
  L4: '#9e3f4e',
  L5: '#9e3f4e',
  L6: '#9e3f4e',
};

function PostmortemSection({ postmortem, incidentId }: { postmortem: Postmortem; incidentId?: string }) {
  const { t } = useTranslation('projectsMap');
  return (
    <div className="rounded-xl border border-red-200 bg-white p-5">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-bold text-[#737C7F] uppercase tracking-widest">
            {t('detail.postmortem.title')}
          </h2>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ background: '#FEE2E2', color: '#9e3f4e' }}
          >
            {t('detail.postmortem.incidentBadge', { date: postmortem.incident_date })}
          </span>
        </div>
        {incidentId && (
          <Link
            to={`/incidents/${incidentId}`}
            className="flex items-center gap-1 text-[10px] font-bold text-[#5E5C75] hover:text-[#2B3437] transition-colors shrink-0"
          >
            {t('detail.postmortem.viewAsIncident')}
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </Link>
        )}
      </div>

      {/* Root Cause */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#737C7F] uppercase tracking-wider mb-1.5">
          {t('detail.postmortem.rootCause')}
        </div>
        <p className="text-sm text-[#2B3437] leading-relaxed">{postmortem.root_cause}</p>
      </div>

      {/* What Failed grid */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#737C7F] uppercase tracking-wider mb-3">
          {t('detail.postmortem.whatFailed')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {postmortem.what_failed.map((f, i) => {
            const borderColor = LAYER_BORDER[f.layer] ?? '#9e3f4e';
            return (
              <div
                key={i}
                className="rounded-lg border p-4"
                style={{ borderColor: borderColor + '60', borderLeftWidth: 3, borderLeftColor: borderColor }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                    style={{ color: borderColor, borderColor: borderColor + '50', background: borderColor + '12' }}
                  >
                    {f.layer}
                  </span>
                  <span className="text-[11px] font-semibold text-[#2B3437]">{f.layer_name}</span>
                </div>
                <p className="text-xs text-[#737C7F] leading-relaxed">{f.issue}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcome */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#737C7F] uppercase tracking-wider mb-1.5">
          {t('detail.postmortem.outcome')}
        </div>
        <blockquote className="text-sm text-[#2B3437] leading-relaxed bg-[#F1F4F6] rounded-lg px-4 py-3 border-l-4 border-[#737C7F]">
          {postmortem.outcome}
        </blockquote>
      </div>

      {/* RARM Lesson */}
      <div>
        <div className="text-[10px] font-bold text-[#737C7F] uppercase tracking-wider mb-1.5">
          {t('detail.postmortem.rarmLesson')}
        </div>
        <blockquote className="text-sm italic text-[#0C447C] leading-relaxed bg-blue-50 rounded-lg px-4 py-3 border-l-4 border-[#0C447C]">
          {postmortem.rarm_lesson}
        </blockquote>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { t } = useTranslation('projectsMap');
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    projectsApi.get(slug)
      .then(setProject)
      .catch(() => setError(t('detail.notFound')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 text-sm mb-4">{error ?? t('detail.notFound')}</p>
        <Link to="/projects" className="text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          {t('detail.backToProjects')}
        </Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[project.status] ?? { label: project.status, color: '#737C7F', bg: 'bg-slate-800/40' };
  const classMeta = ASSET_CLASS_META[project.asset_class] ?? { label: project.asset_class, color: '#94a3b8' };

  const STATUS_LIGHT: Record<string, { bg: string; color: string }> = {
    active:    { bg: '#DCF5E5', color: '#2E7D32' },
    pilot:     { bg: '#FAEEDA', color: '#854F0B' },
    announced: { bg: '#EEEDFE', color: '#3C3489' },
    inactive:  { bg: '#F1F4F6', color: '#737C7F' },
    failed:    { bg: '#FEE2E2', color: '#9e3f4e' },
    paused:    { bg: '#F1F4F6', color: '#64748b' },
  };
  const CLASS_LIGHT: Record<string, { bg: string; color: string }> = {
    gov_bond:               { bg: '#E6F1FB', color: '#0C447C' },
    real_estate:            { bg: '#DCF5E5', color: '#2E7D32' },
    commodity:              { bg: '#FAEEDA', color: '#854F0B' },
    private_credit:         { bg: '#FBEAF0', color: '#9e3f4e' },
    other:                  { bg: '#F1F4F6', color: '#737C7F' },
    stablecoin_algorithmic: { bg: '#FFF0E6', color: '#c2410c' },
    stablecoin_fiat_backed: { bg: '#EFF6FF', color: '#1d4ed8' },
    fintech_wrapper:        { bg: '#F5F3FF', color: '#7c3aed' },
  };
  const DEFAULT_BADGE = { bg: '#F1F4F6', color: '#737C7F' };
  const sBadge = STATUS_LIGHT[project.status] ?? DEFAULT_BADGE;
  const cBadge = CLASS_LIGHT[project.asset_class] ?? DEFAULT_BADGE;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F] mb-5">
        <Link to="/projects" className="hover:text-[#2B3437] transition-colors">{t('detail.breadcrumb')}</Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-[#2B3437]">{project.short_name}</span>
      </div>

      <DisclaimerBanner
        text={t('detail.disclaimer')}
        className="mb-6"
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
                style={{ color: sBadge.color, borderColor: sBadge.color + '50', background: sBadge.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: sBadge.color }} />
                {t('status.' + project.status, { defaultValue: statusMeta.label })}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                style={{ color: cBadge.color, borderColor: cBadge.color + '40', background: cBadge.bg }}
              >
                {t('assetClass.' + project.asset_class, { defaultValue: classMeta.label })}
              </span>
              <span className="text-[10px] text-[#737C7F] font-mono">
                {project.jurisdiction} · {project.chain}
              </span>
            </div>
            <h1 className="text-2xl font-medium text-[#2B3437]">{project.short_name}</h1>
            <p className="text-sm text-[#737C7F] mt-0.5">{project.name}</p>
            {project.launched_at && (
              <p className="text-[11px] text-[#737C7F] mt-1">
                {t('detail.launchedAt', { date: project.launched_at })}
              </p>
            )}
          </div>
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DBE4E7] bg-white text-xs text-[#737C7F] hover:text-[#2B3437] hover:border-[#5E5C75] transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            {t('detail.officialSite')}
          </a>
        </div>

        <p className="text-sm text-[#2B3437] leading-relaxed max-w-3xl">{project.summary}</p>

        {project.asset_slug && (
          <div className="mt-3">
            <Link
              to={`/assets/${project.asset_slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">link</span>
              {t('detail.viewRarmAssessment')}
            </Link>
          </div>
        )}

        {project.risk_flags && project.risk_flags.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {project.risk_flags.map(flag => (
              <span
                key={flag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                style={{ background: '#FEE2E2', color: '#9e3f4e' }}
              >
                <span className="material-symbols-outlined text-[12px]">warning</span>
                {t('riskFlag.' + flag, { defaultValue: flag })}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* RARM 6-layer anatomy */}
      <div className="mb-6">
        <RARMLayersSection project={project} />
      </div>

      {/* Timeline */}
      <div className="mb-5">
        <TimelineSection timeline={project.timeline} />
      </div>

      {/* Postmortem */}
      {project.postmortem && (
        <div className="mb-5">
          <PostmortemSection postmortem={project.postmortem} incidentId={project.incident_id} />
        </div>
      )}

      {/* Sources */}
      <SourcesSection sources={project.sources} />

      <div className="mt-6 pt-4 border-t border-[#DBE4E7]">
        <div className="flex items-center justify-between text-xs text-[#737C7F]">
          <Link to="/projects" className="inline-flex items-center gap-1 hover:text-[#2B3437] transition-colors">
            <span className="material-symbols-outlined text-[13px]">arrow_back</span>
            {t('detail.backToProjectsShort')}
          </Link>
          <span>{t('detail.lastUpdated', { date: project.updated_at })}</span>
        </div>
      </div>
    </div>
  );
}
