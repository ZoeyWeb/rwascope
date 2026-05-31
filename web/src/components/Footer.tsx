import { Link } from 'react-router-dom';
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
  return (
    <footer className="border-t border-ed-hairline mt-auto bg-ed-canvas">
      <div className="max-w-[1400px] mx-auto px-8">

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8 py-ed-section-lg">

          {/* Brand + boilerplate, col-span-4 */}
          <div className="col-span-4">
            <div className="flex items-center gap-3">
              <Logo size={32} className="text-ed-ink" />
              <span className="text-ed-item-h4 text-ed-ink">RWA-Index</span>
            </div>
            <p className="text-ed-body text-ed-text-secondary mt-ed-section-sm leading-relaxed max-w-[320px]">
              Independent research platform analyzing structural risks in tokenized
              real-world assets. Built at HKUST Crypto-Fintech Lab.
            </p>
            <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted mt-ed-section-sm">
              We don't rate. We don't recommend. We decompose.
            </div>
          </div>

          {/* Navigate, col-span-2 */}
          <div className="col-span-2">
            <FooterColTitle>Navigate</FooterColTitle>
            <ul className="mt-ed-section-sm space-y-2">
              <FooterLink to="/projects">Projects</FooterLink>
              <FooterLink to="/incidents">Incidents</FooterLink>
              <FooterLink to="/licenses">SARM</FooterLink>
              <FooterLink to="/assets">RARM</FooterLink>
              <FooterLink to="/compliance">Compliance</FooterLink>
              <FooterLink to="/ecosystem">Ecosystem</FooterLink>
              <FooterLink to="/intelligence">Intelligence</FooterLink>
            </ul>
          </div>

          {/* Research, col-span-3 */}
          <div className="col-span-3">
            <FooterColTitle>Research</FooterColTitle>
            <ul className="mt-ed-section-sm space-y-2">
              <FooterLink to="/press">SARM working paper (SSRN)</FooterLink>
              <FooterLink to="/press">RARM working paper (SSRN)</FooterLink>
              <FooterLink to="/press">Press kit</FooterLink>
              <FooterLink to="/feeds/incidents.xml" external>RSS · Incidents</FooterLink>
              <FooterLink to="/feeds/weekly-brief.xml" external>RSS · Weekly Brief</FooterLink>
            </ul>
          </div>

          {/* Contact, col-span-3 */}
          <div className="col-span-3">
            <FooterColTitle>Contact</FooterColTitle>
            <div className="mt-ed-section-sm">
              <Link
                to="/contact"
                className="inline-block text-ed-block-h3 text-ed-ink border-b border-ed-ink hover:border-b-2 transition-all"
              >
                Get in touch →
              </Link>
              <p className="text-ed-meta text-ed-text-secondary mt-3 leading-relaxed">
                For press inquiries, research collaboration, data access,
                and speaking requests.
              </p>
            </div>
            <div className="mt-ed-section-sm">
              <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
                Affiliation
              </div>
              <div className="text-ed-meta text-ed-text-secondary mt-2 leading-relaxed">
                HKUST Crypto-Fintech Lab<br />
                Academy of Interdisciplinary Studies<br />
                Hong Kong SAR
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-ed-hairline py-ed-section-sm flex justify-between items-center text-ed-meta text-ed-text-muted">
          <div>© 2026 RWAscope · Built at HKUST Crypto-Fintech Lab</div>
          <div className="flex gap-6">
            <Link to="/press" className="hover:text-ed-ink transition-colors">Press</Link>
            <Link to="/contact" className="hover:text-ed-ink transition-colors">Contact</Link>
            <a href="/feeds/incidents.xml" className="hover:text-ed-ink transition-colors">RSS</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
