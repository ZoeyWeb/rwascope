import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

type Row = { sec: string; type: string; desc: string };

export default function ReportsMethodology() {
  const { t } = useTranslation('reportsMethodology');
  const rows = t('sections.sectionStructure.rows', { returnObjects: true }) as Row[];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/reports" className="hover:text-[#2B3437] transition-colors">{t('breadcrumb.parent')}</Link>
        <span>›</span>
        <span className="text-[#2B3437]">{t('breadcrumb.current')}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">{t('title')}</h1>
      <p className="text-[#737C7F] text-sm mb-8">{t('lede')}</p>

      <div className="space-y-10 text-sm text-[#2B3437] leading-relaxed">

        {/* 1 */}
        <Section title={t('sections.cadence.title')}>
          <p>
            <Trans
              i18nKey="sections.cadence.p1"
              ns="reportsMethodology"
              components={{ em: <em /> }}
            />
          </p>
          <p className="mt-2">
            <Trans
              i18nKey="sections.cadence.p2"
              ns="reportsMethodology"
              components={{ em: <em /> }}
            />
          </p>
        </Section>

        {/* 2 */}
        <Section title={t('sections.dataSources.title')}>
          <p>{t('sections.dataSources.intro')}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>
              <Trans
                i18nKey="sections.dataSources.items.market"
                ns="reportsMethodology"
                components={{
                  strong: <strong className="text-[#2B3437]" />,
                  link: <Link to="/market" className="text-[#5E5C75] hover:underline" />,
                }}
              />
            </li>
            <li>
              <Trans
                i18nKey="sections.dataSources.items.licenses"
                ns="reportsMethodology"
                components={{
                  strong: <strong className="text-[#2B3437]" />,
                  link: <Link to="/licenses" className="text-[#5E5C75] hover:underline" />,
                }}
              />
            </li>
            <li>
              <Trans
                i18nKey="sections.dataSources.items.assets"
                ns="reportsMethodology"
                components={{
                  strong: <strong className="text-[#2B3437]" />,
                  link: <Link to="/assets" className="text-[#5E5C75] hover:underline" />,
                }}
              />
            </li>
            <li>
              <Trans
                i18nKey="sections.dataSources.items.incidents"
                ns="reportsMethodology"
                components={{
                  strong: <strong className="text-[#2B3437]" />,
                  link: <Link to="/incidents" className="text-[#5E5C75] hover:underline" />,
                }}
              />
            </li>
          </ul>
          <p className="mt-3 text-slate-500 text-xs">{t('sections.dataSources.footnote')}</p>
        </Section>

        {/* 3 */}
        <Section title={t('sections.sectionStructure.title')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-2 border-collapse">
              <thead>
                <tr className="border-b border-[#DBE4E7]">
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">{t('sections.sectionStructure.tableHeaders.section')}</th>
                  <th className="text-left py-2 pr-4 text-[#737C7F] font-medium">{t('sections.sectionStructure.tableHeaders.type')}</th>
                  <th className="text-left py-2 text-[#737C7F] font-medium">{t('sections.sectionStructure.tableHeaders.content')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE4E7]">
                {rows.map((row) => (
                  <tr key={row.sec} className="text-[#586064]">
                    <td className="py-2 pr-4 text-[#2B3437] font-medium">{row.sec}</td>
                    <td className="py-2 pr-4">
                      <span className="px-1.5 py-0.5 rounded bg-[#EAEFF1] text-[#586064]">{row.type}</span>
                    </td>
                    <td className="py-2">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 4 */}
        <Section title={t('sections.editorialStandards.title')}>
          <p>{t('sections.editorialStandards.intro')}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>{t('sections.editorialStandards.bullets.0')}</li>
            <li>{t('sections.editorialStandards.bullets.1')}</li>
            <li>{t('sections.editorialStandards.bullets.2')}</li>
            <li>
              <Trans
                i18nKey="sections.editorialStandards.bullets.3"
                ns="reportsMethodology"
                components={{
                  link: <Link to="/methodology?tab=framework" className="text-[#5E5C75] hover:underline" />,
                }}
              />
            </li>
            <li>{t('sections.editorialStandards.bullets.4')}</li>
          </ul>
        </Section>

        {/* 5 */}
        <Section title={t('sections.revisionPolicy.title')}>
          <p>{t('sections.revisionPolicy.intro')}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            <li>{t('sections.revisionPolicy.bullets.0')}</li>
            <li>{t('sections.revisionPolicy.bullets.1')}</li>
            <li>{t('sections.revisionPolicy.bullets.2')}</li>
          </ul>
          <p className="mt-2">{t('sections.revisionPolicy.p2')}</p>
        </Section>

        {/* 6 */}
        <Section title={t('sections.corrections.title')}>
          <p>
            <Trans
              i18nKey="sections.corrections.body"
              ns="reportsMethodology"
              components={{
                email: <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] hover:underline" />,
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
