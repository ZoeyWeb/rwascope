import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { RARM_LAYER_KEYS, RARM_SIGNAL_META } from '../../utils/rarm';
import { useRarmMeta } from '../../hooks/useRarmMeta';
import type { RARMBlock, RARMSignal } from '../../types/assets';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">{title}</h2>
      {children}
    </div>
  );
}

function SignalChip({ signal }: { signal: RARMSignal }) {
  const m = RARM_SIGNAL_META[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssetsMethodology() {
  const { layers } = useRarmMeta();
  const { t } = useTranslation('assetsMethodology');

  const aggregationRows = ['row1', 'row2', 'row3', 'row4'] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/assets" className="hover:text-[#2B3437] transition-colors">{t('breadcrumb.assetObservatory')}</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">{t('breadcrumb.methodology')}</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">{t('title')}</h1>
        <p className="text-sm text-[#737C7F] mt-2 max-w-2xl">{t('lede')}</p>
      </div>

      {/* 1. Purpose */}
      <Section title={t('sections.purpose.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.purpose.p1')}</p>
          <p>{t('sections.purpose.p2')}</p>
          <p>{t('sections.purpose.p3')}</p>
        </div>
      </Section>

      {/* 2. RARM layers */}
      <Section title={t('sections.sixLayers.title')}>
        <div className="divide-y divide-[#F1F4F6] rounded-xl border border-[#DBE4E7] overflow-hidden">
          {RARM_LAYER_KEYS.map((k, i) => {
            const m = layers[k];
            return (
              <div key={k} className="px-4 py-3 flex items-baseline gap-3">
                <span className="text-xs font-black text-[#5E5C75] w-6 shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-[#2B3437]">{m.label}</p>
                  <p className="text-xs text-[#737C7F] mt-0.5">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Signal rubric 6×4 */}
      <Section title={t('sections.signalDefs.title')}>
        <p className="text-sm text-[#737C7F]">{t('sections.signalDefs.intro')}</p>
        <div className="space-y-6">
          {RARM_LAYER_KEYS.map((k, i) => {
            const m = layers[k];
            return (
              <div key={k} className="rounded-xl border border-[#DBE4E7] overflow-hidden">
                <div className="bg-[#F8FAFB] px-4 py-3 border-b border-[#DBE4E7]">
                  <span className="text-xs font-black text-[#5E5C75] mr-2">{i + 1}</span>
                  <span className="text-sm font-bold text-[#2B3437]">{m.label}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-[#F1F4F6]">
                    {(['green', 'yellow', 'red', 'gray'] as RARMSignal[]).map(sig => (
                      <tr key={sig}>
                        <td className="px-4 py-3 w-36 align-top">
                          <SignalChip signal={sig} />
                        </td>
                        <td className="px-4 py-3 text-[#737C7F] leading-relaxed align-top">
                          {t(`rubric.${k as keyof RARMBlock}.${sig}`)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 4. Aggregation */}
      <Section title={t('sections.aggregation.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.aggregation.intro')}</p>
          <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-12">{t('sections.aggregation.table.headers.priority')}</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-36">{t('sections.aggregation.table.headers.condition')}</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">{t('sections.aggregation.table.headers.result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F6]">
                {aggregationRows.map(row => (
                  <tr key={row}>
                    <td className="px-4 py-3 font-black text-[#5E5C75] text-xs">{t(`sections.aggregation.table.${row}.priority`)}</td>
                    <td className="px-4 py-3 text-xs text-[#2B3437] font-semibold">{t(`sections.aggregation.table.${row}.condition`)}</td>
                    <td className="px-4 py-3 text-xs text-[#737C7F]">{t(`sections.aggregation.table.${row}.result`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{t('sections.aggregation.closing')}</p>
        </div>
      </Section>

      {/* 5. Inclusion criteria */}
      <Section title={t('sections.inclusion.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.inclusion.intro')}</p>
          <ul className="list-disc list-outside ml-5 space-y-1.5 leading-relaxed">
            <li>{t('sections.inclusion.item1')}</li>
            <li>{t('sections.inclusion.item2')}</li>
            <li>{t('sections.inclusion.item3')}</li>
            <li>{t('sections.inclusion.item4')}</li>
          </ul>
          <p>{t('sections.inclusion.closing')}</p>
        </div>
      </Section>

      {/* 6. Review process */}
      <Section title={t('sections.review.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.review.p1')}</p>
          <p>{t('sections.review.p2')}</p>
          <p>{t('sections.review.p3')}</p>
        </div>
      </Section>

      {/* 7. Scope limitations */}
      <Section title={t('sections.scope.title')}>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-amber-900">{t('sections.scope.header')}</p>
          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-outside ml-4 leading-relaxed">
            <li>{t('sections.scope.item1')}</li>
            <li>{t('sections.scope.item2')}</li>
            <li>{t('sections.scope.item3')}</li>
            <li>{t('sections.scope.item4')}</li>
            <li>{t('sections.scope.item5')}</li>
            <li>{t('sections.scope.item6')}</li>
            <li>{t('sections.scope.item7')}</li>
          </ul>
        </div>
      </Section>

      {/* 8. Submissions */}
      <Section title={t('sections.submissions.title')}>
        <p className="text-sm text-[#737C7F] leading-relaxed">
          <Trans
            i18nKey="sections.submissions.body"
            ns="assetsMethodology"
            components={{
              email: <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] underline hover:text-[#2B3437]" />,
            }}
          />
        </p>
      </Section>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link to="/assets" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('nav.backLink')}
        </Link>
        <span className="text-xs text-[#737C7F]">{t('nav.version')}</span>
      </div>

    </div>
  );
}
