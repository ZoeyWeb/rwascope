import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
      {children}
    </div>
  );
}

function FooterLink({
  to,
  external,
  children,
}: {
  to: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <li>
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-ed-body text-ed-text-secondary hover:text-ed-ink transition-colors"
        >
          {children}
          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        to={to}
        className="text-ed-body text-ed-text-secondary hover:text-ed-ink transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  const { t } = useTranslation('footer');

  return (
    <footer className="border-t border-ed-hairline mt-auto bg-ed-canvas">
      <div className="max-w-[1400px] mx-auto px-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 py-ed-section-lg">

          {/* Brand + boilerplate, col-span-4 */}
          <div className="sm:col-span-2 md:col-span-4">
            <div className="flex items-center gap-3">
              <Logo size={32} className="text-ed-ink" />
              <span className="text-ed-item-h4 text-ed-ink">RWA-Index</span>
            </div>
            <p className="text-ed-body text-ed-text-secondary mt-ed-section-sm leading-relaxed max-w-[320px]">
              {t('tagline')}
            </p>
            <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted mt-ed-section-sm">
              {t('motto')}
            </div>
          </div>

          {/* Navigate, col-span-2 */}
          <div className="md:col-span-2">
            <FooterColTitle>{t('col.navigate')}</FooterColTitle>
            <ul className="mt-ed-section-sm space-y-2">
              <FooterLink to="/projects">{t('nav.projects')}</FooterLink>
              <FooterLink to="/incidents">{t('nav.incidents')}</FooterLink>
              <FooterLink to="/licenses">{t('nav.sarm')}</FooterLink>
              <FooterLink to="/assets">{t('nav.rarm')}</FooterLink>
              <FooterLink to="/compliance">{t('nav.compliance')}</FooterLink>
              <FooterLink to="/ecosystem">{t('nav.ecosystem')}</FooterLink>
              <FooterLink to="/intelligence">{t('nav.intelligence')}</FooterLink>
            </ul>
          </div>

          {/* Research, col-span-3 */}
          <div className="md:col-span-3">
            <FooterColTitle>{t('col.research')}</FooterColTitle>
            <ul className="mt-ed-section-sm space-y-2">
              <FooterLink to="/press">{t('research.sarmPaper')}</FooterLink>
              <FooterLink to="/press">{t('research.rarmPaper')}</FooterLink>
              <FooterLink to="/press">{t('research.pressKit')}</FooterLink>
              <FooterLink to="/feeds/incidents.xml" external>{t('research.rssIncidents')}</FooterLink>
              <FooterLink to="/feeds/weekly-brief.xml" external>{t('research.rssWeeklyBrief')}</FooterLink>
            </ul>
          </div>

          {/* Contact, col-span-3 */}
          <div className="md:col-span-3">
            <FooterColTitle>{t('col.contact')}</FooterColTitle>
            <div className="mt-ed-section-sm">
              <Link
                to="/contact"
                className="inline-block text-ed-block-h3 text-ed-ink border-b border-ed-ink hover:border-b-2 transition-all"
              >
                {t('contact.cta')}
              </Link>
              <p className="text-ed-meta text-ed-text-secondary mt-3 leading-relaxed">
                {t('contact.description')}
              </p>
            </div>
            <div className="mt-ed-section-sm">
              <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
                {t('affiliation.label')}
              </div>
              <div className="text-ed-meta text-ed-text-secondary mt-2 leading-relaxed">
                {t('affiliation.lab')}<br />
                {t('affiliation.school')}<br />
                {t('affiliation.location')}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-ed-hairline py-ed-section-sm flex flex-col gap-4 md:flex-row md:justify-between md:items-center md:gap-0 text-ed-meta text-ed-text-muted">
          <div>{t('copyright')}</div>
          <div className="flex gap-6">
            <Link to="/press" className="hover:text-ed-ink transition-colors">{t('bottomBar.press')}</Link>
            <Link to="/contact" className="hover:text-ed-ink transition-colors">{t('col.contact')}</Link>
            <a href="/feeds/incidents.xml" className="hover:text-ed-ink transition-colors">{t('bottomBar.rss')}</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
