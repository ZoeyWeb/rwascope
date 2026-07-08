import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SARMSignal } from '../../types/licenses';
import { SIGNAL_META } from '../../utils/sarm';
import { useSarmSignals } from '../../hooks/useSarmSignals';

// ── Traffic light pill ────────────────────────────────────────────────────────
function TL({ signal }: { signal: SARMSignal }) {
  const { signals } = useSarmSignals();
  const m = signals[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">{title}</h2>
      {children}
    </div>
  );
}

const DIMENSION_KEYS = ['capital_adequacy', 'reserve_quality', 'governance', 'technology', 'redemption', 'disclosure'] as const;
type DimensionKey = typeof DIMENSION_KEYS[number];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LicensesMethodology() {
  const { t } = useTranslation('licensesMethodology');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/licenses" className="hover:text-[#2B3437] transition-colors">{t('breadcrumb.parent')}</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">{t('breadcrumb.current')}</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">{t('title')}</h1>
        <p className="text-sm text-[#737C7F] mt-2 max-w-2xl">{t('lede')}</p>
      </div>

      {/* 1. Design principles */}
      <Section title={t('sections.s1.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.s1.intro')}</p>
          <ul className="list-disc list-outside ml-5 space-y-2">
            {(['regulatory_neutrality', 'transparency', 'source_traceability', 'separation'] as const).map(key => (
              <li key={key}>
                <strong className="text-[#2B3437]">{t(`sections.s1.principles.${key}.heading`)}</strong>{' '}
                {t(`sections.s1.principles.${key}.body`)}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 2. Signal definitions */}
      <Section title={t('sections.s2.title')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(s => {
            const m = SIGNAL_META[s];
            return (
              <div
                key={s}
                className="rounded-lg border p-4 space-y-1"
                style={{ borderColor: m.border, background: m.bg }}
              >
                <TL signal={s} />
                <p className="text-sm" style={{ color: m.color }}>
                  {t(`signals.${s}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Six dimensions */}
      <Section title={t('sections.s3.title')}>
        <p className="text-sm text-[#737C7F]">{t('sections.s3.intro')}</p>

        <div className="space-y-3">
          {DIMENSION_KEYS.map((key: DimensionKey, i) => (
            <div key={key} className="bg-white rounded-lg border border-[#DBE4E7] p-4 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-[#737C7F] w-5 shrink-0">{i + 1}.</span>
                <h3 className="font-bold text-[#2B3437]">{t(`sections.s3.dimensions.${key}.title`)}</h3>
              </div>
              <p className="text-sm text-[#737C7F] ml-7 leading-relaxed">{t(`sections.s3.dimensions.${key}.desc`)}</p>
              <p className="text-xs text-[#737C7F]/70 ml-7 italic">{t('sections.s3.refPrefix')} {t(`sections.s3.dimensions.${key}.ref`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. Rubric table */}
      <Section title={t('sections.s4.title')}>
        <p className="text-sm text-[#737C7F]">{t('sections.s4.intro')}</p>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-[#DBE4E7]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                <th className="text-left px-4 py-3 font-bold text-[#737C7F] uppercase tracking-wider w-36">{t('sections.s4.tableHeaderDimension')}</th>
                {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(s => (
                  <th key={s} className="text-left px-4 py-3">
                    <TL signal={s} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F6]">
              {DIMENSION_KEYS.map((key: DimensionKey) => (
                <tr key={key} className="align-top">
                  <td className="px-4 py-3 font-bold text-[#2B3437]">{t(`sections.s3.dimensions.${key}.title`)}</td>
                  <td className="px-4 py-3 text-[#2B3437]">{t(`sections.s4.rubric.${key}.green`)}</td>
                  <td className="px-4 py-3 text-[#737C7F]">{t(`sections.s4.rubric.${key}.yellow`)}</td>
                  <td className="px-4 py-3 text-[#9e3f4e]">{t(`sections.s4.rubric.${key}.red`)}</td>
                  <td className="px-4 py-3 text-[#737C7F] italic">{t(`sections.s4.rubric.${key}.gray`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {DIMENSION_KEYS.map((key: DimensionKey) => (
            <div key={key} className="bg-white rounded-lg border border-[#DBE4E7] p-4 space-y-3">
              <h3 className="font-bold text-[#2B3437] text-sm">{t(`sections.s3.dimensions.${key}.title`)}</h3>
              {(['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(sig => (
                <div key={sig} className="space-y-1">
                  <TL signal={sig} />
                  <p className="text-xs text-[#737C7F] ml-1">{t(`sections.s4.rubric.${key}.${sig}`)}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Aggregation */}
      <Section title={t('sections.s5.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.s5.intro')}</p>
          <ul className="list-disc list-outside ml-5 space-y-2">
            {(t('sections.s5.reasons', { returnObjects: true }) as string[]).map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
          <p>{t('sections.s5.outro')}</p>
        </div>
      </Section>

      {/* 6. Coverage & Scope */}
      <Section title={t('sections.s6.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.s6.p1')}</p>
          <p>{t('sections.s6.p2')}</p>
          <p>{t('sections.s6.p3')}</p>
        </div>
      </Section>

      {/* 7. Limitations */}
      <Section title={t('sections.s7.title')}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm text-amber-800">
          <p className="font-bold">{t('sections.s7.heading')}</p>
          <ul className="list-disc list-outside ml-5 space-y-1 text-xs leading-relaxed">
            {(t('sections.s7.items', { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link
          to="/licenses"
          className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('nav.backLink')}
        </Link>
        <span className="text-xs text-[#737C7F]">{t('nav.version')}</span>
      </div>
    </div>
  );
}
