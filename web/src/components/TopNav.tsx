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
        to: '/intelligence/hk',
        label: 'HK Observation',
        subtitle: 'Daily monitoring of HK regulatory and market signals',
        Icon: Eye,
      },
      {
        to: '/incidents',
        label: 'Incidents',
        subtitle: 'Postmortem analysis of major RWA and stablecoin failures',
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
    label: 'Projects',
    to: '/projects',
    activePaths: ['/projects'],
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
    label: 'Ecosystem',
    to: '/ecosystem',
    activePaths: ['/ecosystem'],
  },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function isBlockActive(block: NavBlock) {
    return block.activePaths.some(
      p => pathname === p || pathname.startsWith(p + '/'),
    );
  }

  function isSubActive(to: string) {
    return pathname === to || pathname.startsWith(to + '/');
  }

  return (
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

        {/* Auth */}
        {user ? (
          <div className="flex items-center gap-2 group relative">
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
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
      </div>
    </header>
  );
}
