import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import DisclaimerBanner from '../../components/DisclaimerBanner';

export default function EnsembleMethodology() {
  const { t } = useTranslation('ensembleMethodology');

  const whatItIsNotItems = t('sections.whatItIsNot.items', { returnObjects: true }) as Array<{ label: string; desc: string }>;
  const sourceHierarchyItems = t('sections.sourceHierarchy.items', { returnObjects: true }) as Array<{ label: string; desc: string }>;
  const updateBullets = t('sections.updatePolicy.bullets', { returnObjects: true }) as string[];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/ensemble" className="hover:text-[#2B3437] transition-colors">{t('breadcrumb.parent')}</Link>
        <span>›</span>
        <span className="text-[#2B3437]">{t('breadcrumb.current')}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-2">
        {t('title')}
      </h1>
      <p className="text-[#737C7F] text-sm mb-6">
        {t('lede')}
      </p>

      <DisclaimerBanner text={t('disclaimer')} className="mb-8" />

      <div className="space-y-10 text-sm text-[#2B3437] leading-relaxed">

        <Section title={t('sections.whatItIs.title')}>
          <p>{t('sections.whatItIs.p1')}</p>
          <p className="mt-2">{t('sections.whatItIs.p2')}</p>
        </Section>

        <Section title={t('sections.whatItIsNot.title')}>
          <ul className="list-disc pl-5 mt-2 space-y-2 text-[#586064]">
            {whatItIsNotItems.map((item, i) => (
              <li key={i}>
                <strong className="text-[#2B3437]">{item.label}</strong>{' '}
                {item.desc}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('sections.sourceHierarchy.title')}>
          <p>{t('sections.sourceHierarchy.intro')}</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1.5 text-[#586064]">
            {sourceHierarchyItems.map((item, i) => (
              <li key={i}>
                <strong className="text-[#2B3437]">{item.label}</strong>{' '}
                — {item.desc}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-[#737C7F]">
            {t('sections.sourceHierarchy.footnote')}
          </p>
        </Section>

        <Section title={t('sections.scope.title')}>
          <p>{t('sections.scope.p1')}</p>
          <p className="mt-2">
            <Trans i18nKey="sections.scope.p2" ns="ensembleMethodology" components={{ em: <em /> }} />
          </p>
        </Section>

        <Section title={t('sections.updatePolicy.title')}>
          <p>{t('sections.updatePolicy.intro')}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[#586064]">
            {updateBullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p className="mt-2">
            <Trans i18nKey="sections.updatePolicy.p2" ns="ensembleMethodology" components={{ code: <code className="bg-[#EAEFF1] px-1 rounded" /> }} />
          </p>
        </Section>

        <Section title={t('sections.corrections.title')}>
          <p>
            <Trans
              i18nKey="sections.corrections.body"
              ns="ensembleMethodology"
              components={{ email: <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] hover:underline" /> }}
            />
          </p>
        </Section>

        <div className="pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
          {t('footer')}
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
