import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useComplianceSignals } from '../../hooks/useComplianceSignals';

export default function ComplianceMethodology() {
  const { t } = useTranslation('complianceMethodology');
  const { signals } = useComplianceSignals();
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/compliance" className="hover:text-[#2B3437] transition-colors">
          {t('breadcrumb.parent')}
        </Link>
        <span>›</span>
        <span className="text-[#2B3437]">{t('breadcrumb.current')}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">
        {t('title')}
      </h1>
      <p className="text-[#737C7F] text-sm mb-8">
        {t('lede')}
      </p>

      <div className="space-y-10 text-sm text-[#2B3437] leading-relaxed">
        {/* 1 */}
        <Section title={t('sections.s1.title')}>
          <p>{t('sections.s1.p1')}</p>
          <p className="mt-2">{t('sections.s1.p2')}</p>
        </Section>

        {/* 2 */}
        <Section title={t('sections.s2.title')}>
          <p>{t('sections.s2.intro')}</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DBE4E7]">
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">{t('sections.s2.tableHeaders.signal')}</th>
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">{t('sections.s2.tableHeaders.meaning')}</th>
                  <th className="text-left py-2 text-[#737C7F] font-medium">{t('sections.s2.tableHeaders.typical')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE4E7]">
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      {signals.open.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    {t('sections.s2.rows.open.meaning')}
                  </td>
                  <td className="py-2 text-[#586064]">
                    {t('sections.s2.rows.open.typical')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                      {signals.conditional.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    {t('sections.s2.rows.conditional.meaning')}
                  </td>
                  <td className="py-2 text-[#586064]">
                    {t('sections.s2.rows.conditional.typical')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      {signals.restricted.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    {t('sections.s2.rows.restricted.meaning')}
                  </td>
                  <td className="py-2 text-[#586064]">
                    {t('sections.s2.rows.restricted.typical')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#d1d5db]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                      {signals.placeholder.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#586064]">
                    {t('sections.s2.rows.placeholder.meaning')}
                  </td>
                  <td className="py-2 text-[#586064]">
                    {t('sections.s2.rows.placeholder.typical')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#737C7F]">
            {t('sections.s2.footnote')}
          </p>
        </Section>

        {/* 3 */}
        <Section title={t('sections.s3.title')}>
          <p>{t('sections.s3.intro')}</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1.5 text-[#586064]">
            <li>
              <strong className="text-[#2B3437]">{t('sections.s3.sources.statutes.heading')}</strong>{' '}
              {t('sections.s3.sources.statutes.body')}
            </li>
            <li>
              <strong className="text-[#2B3437]">{t('sections.s3.sources.guidance.heading')}</strong>{' '}
              {t('sections.s3.sources.guidance.body')}
            </li>
            <li>
              <strong className="text-[#2B3437]">{t('sections.s3.sources.registers.heading')}</strong>{' '}
              {t('sections.s3.sources.registers.body')}
            </li>
            <li>
              <strong className="text-[#2B3437]">{t('sections.s3.sources.statements.heading')}</strong>{' '}
              {t('sections.s3.sources.statements.body')}
            </li>
            <li>
              <strong className="text-[#2B3437]">{t('sections.s3.sources.court.heading')}</strong>{' '}
              {t('sections.s3.sources.court.body')}
            </li>
            <li>
              <strong className="text-[#2B3437]">{t('sections.s3.sources.media.heading')}</strong>{' '}
              {t('sections.s3.sources.media.body')}
            </li>
          </ol>
        </Section>

        {/* 4 */}
        <Section title={t('sections.s4.title')}>
          <p>
            <Trans
              i18nKey="sections.s4.p1"
              ns="complianceMethodology"
              components={{ code: <code className="bg-[#EAEFF1] px-1 rounded" /> }}
            />
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            {(t('sections.s4.triggers', { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="mt-2">
            <Trans
              i18nKey="sections.s4.p2"
              ns="complianceMethodology"
              components={{ code: <code className="bg-[#EAEFF1] px-1 rounded" /> }}
            />
          </p>
        </Section>

        {/* 5 */}
        <Section title={t('sections.s5.title')}>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-[#586064]">
            {(t('sections.s5.items', { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 6 */}
        <Section title={t('sections.s6.title')}>
          <p>
            <Trans
              i18nKey="sections.s6.body"
              ns="complianceMethodology"
              components={{
                a: <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] hover:underline" />,
              }}
            />
          </p>
        </Section>

        {/* Disclaimer */}
        <div className="pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
          {t('disclaimer')}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-[#2B3437] mb-3">{title}</h2>
      {children}
    </section>
  );
}
