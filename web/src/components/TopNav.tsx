import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Eye,
  AlertTriangle,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Layers,
  Globe,
  GitCompare,
  Network,
  Map,
  BookOpen,
  Scale,
  Building2,
  PieChart,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

type SubItem = {
  to: string;
  label: string;
  subtitle: string;
  Icon: LucideIcon;
};
type NavBlock = {
  label: string;
  to: string;
  activePaths: string[];
  sub?: SubItem[];
  dropdownHeader?: string;
};

const NAV_BLOCKS: NavBlock[] = [
  {
    label: 'Intelligence',
    to: '/intelligence',
    activePaths: ['/intelligence', '/incidents', '/reports', '/enforcement', '/disclosures'],
    dropdownHeader: 'Intelligence',
    sub: [
      {
        to: '/intelligence',
        label: 'Market Signal',
        subtitle: 'Weekly brief and cross-market signals',
        Icon: Activity,
      },
      {
        to: '/intelligence/hk',
        label: 'HK Observation',
        subtitle: 'Daily monitoring of HK regulatory and market signals',
        Icon: Eye,
      },
      {
        to: '/incidents',
        label: 'Incident Registry',
        subtitle: 'Permanent-ID postmortems of RWA and stablecoin failures (RWAI-YYYY-NNN)',
        Icon: AlertTriangle,
      },
      {
        to: '/enforcement',
        label: 'Enforcement',
        subtitle: 'SEC, CFTC, SFC, MAS regulatory and legal actions',
        Icon: Scale,
      },
      {
        to: '/disclosures',
        label: 'Issuer Disclosures',
        subtitle: 'NAV reports, attestations, and filings from institutional issuers',
        Icon: Building2,
      },
      {
        to: '/reports',
        label: 'Reports',
        subtitle: 'In-depth research on tokenization, stablecoins, and policy',
        Icon: FileText,
      },
    ],
  },
  {
    label: 'Market',
    to: '/market',
    activePaths: ['/market', '/reserves'],
    dropdownHeader: 'Market',
    sub: [
      {
        to: '/market',
        label: 'Overview',
        subtitle: 'TVL trends, asset class breakdown, market signals',
        Icon: LayoutDashboard,
      },
      {
        to: '/reserves',
        label: 'Reserve Monitor',
        subtitle: 'Stablecoin reserve composition and attestation history',
        Icon: PieChart,
      },
    ],
  },
  {
    label: 'Framework',
    to: '/licenses',
    activePaths: ['/licenses', '/assets', '/compliance', '/ensemble', '/methodology', '/glossary'],
    dropdownHeader: 'Framework',
    sub: [
      {
        to: '/licenses',
        label: 'SARM',
        subtitle: 'Stablecoin Architecture & Resilience Matrix',
        Icon: ShieldCheck,
      },
      {
        to: '/assets',
        label: 'RARM',
        subtitle: 'Six-layer due diligence framework for tokenized assets',
        Icon: Layers,
      },
      {
        to: '/compliance',
        label: 'Compliance Map',
        subtitle: 'Cross-border regulatory signal matrix',
        Icon: Map,
      },
      {
        to: '/glossary',
        label: 'Glossary',
        subtitle: 'Key terms across RARM, SARM, and tokenized finance',
        Icon: BookOpen,
      },
    ],
  },
  {
    label: 'Projects',
    to: '/projects',
    activePaths: ['/projects'],
  },
  {
    label: 'Ecosystem',
    to: '/ecosystem',
    activePaths: ['/ecosystem'],
  },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function isBlockActive(block: NavBlock) {
    return block.activePaths.some(
      p => pathname === p || pathname.startsWith(p + '/'),
    );
  }

  function isSubActive(to: string) {
    return pathname === to || pathname.startsWith(to + '/');
  }

  return (
    <>
    <header className="w-full h-20 bg-[#1A1A2E] border-b border-[#2B3437] fixed top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 h-full flex justify-between items-center">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <Logo size={44} className="text-white group-hover:text-slate-300 transition-colors" />
          <span className="text-2xl font-bold tracking-tight text-white font-headline group-hover:text-slate-300 transition-colors">
            RWA-Index
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {NAV_BLOCKS.map(block => {
            const active = isBlockActive(block);
            return (
              <div key={block.to} className="relative group">
                <Link
                  to={block.to}
                  className={`flex items-center gap-0.5 px-3.5 py-1.5 rounded text-base font-medium transition-colors ${
                    active
                      ? 'text-white bg-[#2B3437]'
                      : 'text-slate-400 hover:text-white hover:bg-[#2B3437]/50'
                  }`}
                >
                  {block.label}
                  {block.sub && (
                    <span className="material-symbols-outlined text-[16px] opacity-40 group-hover:opacity-70 transition-opacity">
                      expand_more
                    </span>
                  )}
                </Link>

                {block.sub && (
                  <div className="absolute left-0 top-full pt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="w-80 bg-[#13141f] border border-[#2B3437] rounded-xl shadow-2xl overflow-hidden">
                      {block.dropdownHeader && (
                        <Link
                          to={block.to}
                          className="flex items-center gap-2 px-4 h-12 bg-[#0D0E1A] border-b border-[#2B3437] hover:bg-[#0A0B14] transition-colors"
                        >
                          <Logo size={20} className="text-white shrink-0" />
                          <span className="text-slate-500 select-none font-light">/</span>
                          <span className="text-base font-semibold text-slate-200">{block.dropdownHeader}</span>
                        </Link>
                      )}
                      <div className="py-1.5">
                        {block.sub.map(item => {
                          const { Icon } = item;
                          const subActive = isSubActive(item.to);
                          return (
                            <Link
                              key={`${item.to}-${item.label}`}
                              to={item.to}
                              className={`flex items-start gap-3 px-3 py-3 mx-1.5 rounded-lg transition-colors ${
                                subActive
                                  ? 'bg-[#2B3437] text-white'
                                  : 'text-slate-400 hover:bg-[#2B3437]/50 hover:text-white'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0 text-[#5E5C75]">
                                <Icon size={18} strokeWidth={1.75} />
                              </div>
                              <div className="min-w-0">
                                <div className={`text-sm font-semibold leading-tight ${subActive ? 'text-white' : 'text-slate-200'}`}>
                                  {item.label}
                                </div>
                                <div className="text-xs text-slate-500 leading-snug mt-0.5">
                                  {item.subtitle}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Due Diligence — auth-gated utility, shown separately */}
        <Link
          to="/score"
          className={`hidden lg:flex text-xs font-bold px-3 py-1.5 rounded border transition-colors ${
            pathname.startsWith('/score')
              ? 'text-white border-[#5E5C75] bg-[#5E5C75]/20'
              : 'text-slate-500 border-[#2B3437] hover:text-white hover:border-[#5E5C75]/60'
          }`}
        >
          Due Diligence
        </Link>

        {/* Auth — desktop only */}
        {user ? (
          <div className="hidden md:flex items-center gap-2 group relative">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-[#5E5C75] flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(user.full_name ?? user.email)[0].toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 hidden lg:block max-w-[120px] truncate">
                {user.full_name ?? user.email}
              </span>
            </div>
            <div className="absolute right-0 top-8 w-40 bg-[#1A1A2E] border border-[#2B3437] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => navigate('/score/history')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-[#2B3437] transition-colors"
              >
                <span className="material-symbols-outlined text-base">history</span>
                My Reports
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-[#2B3437] transition-colors border-t border-[#2B3437]"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
        )}

        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 -mr-2"
          aria-label="Open menu"
        >
          <span className="block w-5 h-px bg-white" />
          <span className="block w-5 h-px bg-white" />
          <span className="block w-5 h-px bg-white" />
        </button>
      </div>
      </div>
    </header>

    {/* Mobile full-screen drawer */}
    {menuOpen && (
      <div className="fixed inset-0 z-50 bg-ed-ink text-white overflow-y-auto md:hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/15">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
            <Logo size={44} className="text-white" />
            <span className="text-ed-item-h4 text-white font-bold tracking-tight font-headline">RWA-Index</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center -mr-2"
            aria-label="Close menu"
          >
            <span className="relative w-5 h-5 block">
              <span className="absolute inset-0 m-auto w-5 h-px bg-white rotate-45" />
              <span className="absolute inset-0 m-auto w-5 h-px bg-white -rotate-45" />
            </span>
          </button>
        </div>

        {/* Nav list */}
        <nav className="px-6 py-ed-section-sm">
          {NAV_BLOCKS.map((block) => (
            <div key={block.label} className="py-6 border-b border-white/10">
              {!block.sub ? (
                <Link
                  to={block.to}
                  onClick={() => setMenuOpen(false)}
                  className="block text-ed-block-h3 text-white hover:text-white/70 transition-colors"
                >
                  {block.label}
                </Link>
              ) : (
                <>
                  <div className="text-ed-eyebrow text-white/50 uppercase mb-4">{block.label}</div>
                  <ul className="space-y-4">
                    {block.sub.map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className="block text-ed-item-h4 text-white hover:text-white/70 transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}

          {/* Due Diligence CTA */}
          <div className="pt-8 pb-4">
            <Link
              to="/score"
              onClick={() => setMenuOpen(false)}
              className="block text-center py-4 border border-white text-ed-item-h4 text-white hover:bg-white hover:text-ed-ink transition-colors"
            >
              Due Diligence
            </Link>
          </div>

          {/* Auth */}
          <div className="pt-6 border-t border-white/15 pb-8">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#5E5C75] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(user.full_name ?? user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-ed-body text-white/70 truncate">
                    {user.full_name ?? user.email}
                  </span>
                </div>
                <button
                  onClick={() => { navigate('/score/history'); setMenuOpen(false); }}
                  className="flex items-center gap-2 py-3 text-ed-body text-white/70 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-base">history</span>
                  My Reports
                </button>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 py-3 text-ed-body text-white/70 hover:text-white transition-colors border-t border-white/10"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigate('/login'); setMenuOpen(false); }}
                className="text-ed-item-h4 text-white hover:text-white/70 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
    )}
    </>
  );
}
