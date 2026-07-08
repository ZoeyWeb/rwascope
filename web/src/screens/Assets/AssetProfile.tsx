import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Asset, AssetLiveIndex, RARMSignal } from '../../types/assets';
import {
  aggregateRARM, RARM_LAYER_KEYS, RARM_SIGNAL_META,
  ASSET_CATEGORY_LABELS, ASSET_STATUS_META,
} from '../../utils/rarm';
import { useRarmMeta } from '../../hooks/useRarmMeta';
import DisclaimerBanner from '../../components/DisclaimerBanner';

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

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalChip({ signal }: { signal: RARMSignal }) {
  const { signals } = useRarmMeta();
  const m = RARM_SIGNAL_META[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.dot }} />
      {signals[signal].label}
    </span>
  );
}

function SidebarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-[#F1F4F6] last:border-0">
      <span className="text-xs text-[#737C7F] shrink-0">{label}</span>
      <span className="text-xs text-[#2B3437] font-semibold text-right">{children}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">
      {children}
    </h2>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssetProfile() {
  const { t } = useTranslation('assetsMap');
  const { layers, signals } = useRarmMeta();
  const { slug } = useParams<{ slug: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/data/assets/assets.json').then(r => r.json()) as Promise<Asset[]>,
      fetch('/data/assets/assets-live.json').then(r => r.json()).catch(() => null) as Promise<AssetLiveIndex | null>,
    ]).then(([staticData, liveData]) => {
      const liveBySlug = liveData?.assets ?? {};
      const found = staticData.find(a => a.slug === slug);
      if (found) setAsset({ ...found, ...(liveBySlug[found.slug] ?? {}) });
      else setNotFound(true);
      setLoading(false);
    }).catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12 flex justify-center">
        <span className="material-symbols-outlined animate-spin text-[#5E5C75]">progress_activity</span>
      </div>
    );
  }
  if (notFound || !asset) return <Navigate to="/assets" replace />;

  const summary = aggregateRARM(asset.rarm);
  const statusMeta = ASSET_STATUS_META[asset.status];

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/assets" className="hover:text-[#2B3437] transition-colors">{t('profile.breadcrumb.assetObservatory')}</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">{asset.ticker.split(' ')[0]}</span>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-black text-[#2B3437]">{asset.ticker.split(' ')[0]}</span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                style={{ color: statusMeta.color, background: statusMeta.bg }}
              >
                {t(`status.${statusI18nKey(asset.status)}`)}
              </span>
              <span className="text-sm font-semibold text-[#5E5C75] bg-[#EAEFF1] px-2 py-0.5 rounded">
                {t(`categoryLabels.${asset.assetCategory}`, { defaultValue: ASSET_CATEGORY_LABELS[asset.assetCategory] ?? asset.assetCategory })}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#2B3437] mt-1">{asset.name}</h1>
            <p className="text-sm text-[#737C7F] mt-0.5">{asset.issuerOrOperator.split('(')[0].trim()}</p>
          </div>
          <div className="flex items-center gap-2">
            <SignalChip signal={summary.dominant} />
            <Link
              to="/assets/methodology"
              className="text-xs text-[#737C7F] hover:text-[#5E5C75] transition-colors underline"
            >
              {t('profile.header.rarmGuide')}
            </Link>
          </div>
        </div>
        <DisclaimerBanner text={t('profile.disclaimer')} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left content ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <section className="space-y-3">
            <SectionTitle>{t('profile.sections.overview')}</SectionTitle>
            <p className="text-sm text-[#737C7F] leading-relaxed">{asset.description}</p>
          </section>

          {/* RARM assessment table */}
          <section className="space-y-3">
            <SectionTitle>{t('profile.sections.rarmLayers')}</SectionTitle>
            <p className="text-xs text-[#737C7F]">
              {t('profile.rarmTable.sublede')}
            </p>
            <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
              {RARM_LAYER_KEYS.map((k, i) => {
                const layer = asset.rarm[k];
                const meta = layers[k];
                const sigMeta = RARM_SIGNAL_META[layer.signal];
                return (
                  <div
                    key={k}
                    className={`px-5 py-4 ${i < RARM_LAYER_KEYS.length - 1 ? 'border-b border-[#F1F4F6]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#9E9E9E]">{i + 1}</span>
                          <span className="text-sm font-bold text-[#2B3437]">{meta.label}</span>
                        </div>
                        <p className="text-xs text-[#9E9E9E] mt-0.5">{meta.description}</p>
                      </div>
                      <SignalChip signal={layer.signal} />
                    </div>
                    <p className="text-xs text-[#737C7F] leading-relaxed mt-1">{layer.rationale}</p>
                    {layer.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {layer.citations.map((c, ci) => (
                          <a
                            key={ci}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#5E5C75] hover:text-[#2B3437] underline transition-colors"
                          >
                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            {c.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Aggregate */}
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: RARM_SIGNAL_META[summary.dominant].bg, border: `1px solid ${RARM_SIGNAL_META[summary.dominant].border}` }}>
              <div>
                <p className="text-xs font-bold" style={{ color: RARM_SIGNAL_META[summary.dominant].color }}>
                  {t('profile.rarmTable.aggregate.label')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: RARM_SIGNAL_META[summary.dominant].color }}>
                  {t('profile.rarmTable.aggregate.layers', {
                    gray: summary.gray,
                    green: summary.green,
                    yellow: summary.yellow,
                    red: summary.red,
                  })}
                </p>
              </div>
              <SignalChip signal={summary.dominant} />
            </div>
          </section>

          {/* Underlying asset */}
          <section className="space-y-3">
            <SectionTitle>{t('profile.sections.underlyingAsset')}</SectionTitle>
            <p className="text-sm text-[#737C7F] leading-relaxed">{asset.underlyingAsset}</p>
          </section>

          {/* Audit reports */}
          {asset.auditReports && asset.auditReports.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('profile.sections.auditReports')}</SectionTitle>
              <div className="space-y-2">
                {asset.auditReports.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#DBE4E7]">
                    <div>
                      {r.firm && <p className="text-sm font-semibold text-[#2B3437]">{r.firm}</p>}
                      {r.date && <p className="text-xs text-[#737C7F] mt-0.5">{r.date}</p>}
                      {!r.firm && !r.date && <p className="text-xs text-[#737C7F]">{t('profile.auditStatus.fallback')}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'passed'               ? 'text-[#1B5E20] bg-[#E8F5E9]' :
                        r.status === 'passed-with-findings' ? 'text-[#7B5800] bg-[#FFF8E1]' :
                        r.status === 'in-progress'          ? 'text-[#5E5C75] bg-[#EDE7F6]' :
                                                              'text-[#424242] bg-[#F5F5F5]'
                      }`}>
                        {r.status === 'passed'               ? t('profile.auditStatus.passed') :
                         r.status === 'passed-with-findings' ? t('profile.auditStatus.passedWithFindings') :
                         r.status === 'in-progress'          ? t('profile.auditStatus.inProgress') :
                                                               t('profile.auditStatus.seeReport')}
                      </span>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          className="material-symbols-outlined text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
                          open_in_new
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chains */}
          <section className="space-y-3">
            <SectionTitle>{t('profile.sections.blockchainDeployment')}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {asset.chainOrPlatform.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F4F6] text-[#5E5C75] text-xs font-bold rounded-lg border border-[#DBE4E7]">
                  <span className="material-symbols-outlined text-sm">hub</span>
                  {c}
                </span>
              ))}
            </div>
          </section>

          {/* Related incidents */}
          {asset.crossRefIncidentSlugs.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('profile.sections.relatedIncidents')}</SectionTitle>
              <div className="space-y-2">
                {asset.crossRefIncidentSlugs.map(s => (
                  <Link
                    key={s}
                    to={`/incidents/${s}`}
                    className="flex items-center gap-2 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors group"
                  >
                    <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    {s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related issuers */}
          {asset.crossRefIssuerSlugs.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('profile.sections.relatedIssuers')}</SectionTitle>
              <div className="space-y-2">
                {asset.crossRefIssuerSlugs.map(s => (
                  <Link
                    key={s}
                    to={`/licenses/${s}`}
                    className="flex items-center gap-2 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors group"
                  >
                    <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    {s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Sources */}
          {asset.sources.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('profile.sections.sources')}</SectionTitle>
              <div className="space-y-2">
                {asset.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#DBE4E7] hover:border-[#5E5C75] hover:bg-[#F8FAFB] transition-all group"
                  >
                    <span className="material-symbols-outlined text-base text-[#5E5C75] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform">open_in_new</span>
                    <div>
                      <p className="text-sm font-semibold text-[#2B3437]">{src.title}</p>
                      <p className="text-xs text-[#737C7F] mt-0.5">
                        {src.type.replace(/-/g, ' ')}
                        {src.date ? ` · ${src.date}` : ''}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Quick facts */}
          <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
            <div className="bg-[#F8FAFB] px-4 py-3 border-b border-[#DBE4E7]">
              <h3 className="text-xs font-black text-[#2B3437] uppercase tracking-widest">{t('profile.sidebar.quickFacts.heading')}</h3>
            </div>
            <div className="px-4 py-3 divide-y divide-[#F1F4F6]">
              <SidebarRow label={t('profile.sidebar.quickFacts.ticker')}>{asset.ticker.split(' ')[0]}</SidebarRow>
              <SidebarRow label={t('profile.sidebar.quickFacts.category')}>{t(`categoryLabels.${asset.assetCategory}`, { defaultValue: ASSET_CATEGORY_LABELS[asset.assetCategory] ?? asset.assetCategory })}</SidebarRow>
              <SidebarRow label={t('profile.sidebar.quickFacts.status')}>
                <span style={{ color: statusMeta.color }}>{t(`status.${statusI18nKey(asset.status)}`)}</span>
              </SidebarRow>
              <SidebarRow label={t('profile.sidebar.quickFacts.domicile')}>{asset.domicile.split('(')[0].trim()}</SidebarRow>
              {asset.launchDate && (
                <SidebarRow label={t('profile.sidebar.quickFacts.launchDate')}>{asset.launchDate}</SidebarRow>
              )}
              <SidebarRow label={t('profile.sidebar.quickFacts.tvl')}>
                <span className="flex items-center gap-1.5 flex-wrap justify-end">
                  {formatTvl(asset.tvlUsd)}
                  {typeof asset.change1d === 'number' && (
                    <span className={`text-[10px] font-bold ${asset.change1d >= 0 ? 'text-[#2E7D32]' : 'text-[#9e3f4e]'}`}>
                      {asset.change1d >= 0 ? '+' : ''}{asset.change1d.toFixed(2)}%
                    </span>
                  )}
                </span>
              </SidebarRow>
              {asset.tvlUpdatedAt ? (
                <div className="py-1.5">
                  <p className="text-[10px] text-[#9E9E9E] leading-relaxed">
                    {t('profile.sidebar.quickFacts.updatedAt', { date: asset.tvlUpdatedAt, source: asset.tvlSource ?? 'DeFiLlama' })}
                  </p>
                </div>
              ) : asset.tvlNote ? (
                <div className="py-2">
                  <p className="text-[10px] text-[#9E9E9E] leading-relaxed">{asset.tvlNote}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* RARM summary dots */}
          <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
            <div className="bg-[#F8FAFB] px-4 py-3 border-b border-[#DBE4E7]">
              <h3 className="text-xs font-black text-[#2B3437] uppercase tracking-widest">{t('profile.sidebar.rarmAtGlance.heading')}</h3>
            </div>
            <div className="px-4 py-3 space-y-2">
              {RARM_LAYER_KEYS.map((k, i) => {
                const sig = asset.rarm[k].signal;
                const sigMeta = RARM_SIGNAL_META[sig];
                return (
                  <div key={k} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#9E9E9E] w-3 font-black">{i + 1}</span>
                      <span className="text-xs text-[#737C7F]">{layers[k].shortLabel}</span>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ color: sigMeta.color, background: sigMeta.bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sigMeta.dot }} />
                      {signals[sig].label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cite */}
          <div className="rounded-xl border border-[#DBE4E7] p-4 space-y-2">
            <p className="text-xs font-bold text-[#2B3437]">{t('profile.sidebar.cite.heading')}</p>
            <p className="text-[10px] text-[#737C7F] leading-relaxed break-all">
              {t('profile.sidebar.cite.text', { name: asset.name, date: asset.lastUpdatedAt, url: window.location.href })}
            </p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              {copied ? t('profile.sidebar.cite.copied') : t('profile.sidebar.cite.copy')}
            </button>
          </div>

        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link to="/assets" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('profile.footer.backLink')}
        </Link>
        <Link to="/assets/methodology" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          {t('profile.footer.methodologyLink')}
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

    </div>
  );
}
