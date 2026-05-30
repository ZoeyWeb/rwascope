import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-ed-hairline mt-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-ed-section-sm flex items-center justify-between">
        <p className="text-ed-meta text-ed-text-muted">
          © 2026 RWAscope · Built at HKUST Crypto-Fintech Lab
        </p>
        <nav className="flex items-center gap-6">
          <Link to="/press" className="text-ed-meta text-ed-text-muted hover:text-ed-ink transition-colors">
            Press
          </Link>
          <Link to="/reports" className="text-ed-meta text-ed-text-muted hover:text-ed-ink transition-colors">
            Research
          </Link>
          <a
            href="mailto:hello@rwa-index.com"
            className="text-ed-meta text-ed-text-muted hover:text-ed-ink transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
