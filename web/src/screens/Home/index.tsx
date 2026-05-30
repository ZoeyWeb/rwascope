import { Link } from 'react-router-dom';
import { Boxes, ShieldCheck, AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react';
import OrbitalRings from '../../components/OrbitalRings';
import TickerBar from '../../components/TickerBar';

type Entry = {
  to: string;
  kicker: string;
  heading: string;
  body: string;
  Icon: LucideIcon;
};

const ENTRIES: Entry[] = [
  {
    to: '/projects',
    kicker: 'Decompose',
    heading: 'Project anatomy',
    body: 'Active RWA projects, mapped across 6 risk layers — issuer, custody, oracle, audit, jurisdiction, redemption.',
    Icon: Boxes,
  },
  {
    to: '/licenses',
    kicker: 'Benchmark',
    heading: 'Framework signals',
    body: 'Standardized comparison against SARM (stablecoin) and RARM (tokenized asset) risk dimensions.',
    Icon: ShieldCheck,
  },
  {
    to: '/incidents',
    kicker: 'Learn from failure',
    heading: 'Structured postmortems',
    body: 'What failed, which layer, why — across stablecoins, exchanges, and tokenized credit.',
    Icon: AlertTriangle,
  },
];

export default function Home() {
  return (
    <div className="bg-[#F1F4F6]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1A1A2E] text-white">
        <div className="max-w-[1400px] mx-auto px-8 pt-24 pb-20 md:pt-32 md:pb-24">

          {/* Headline row: h1 left, ring right, bottom-aligned so ring center ≈ subtitle midpoint */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="lg:max-w-[50%]">
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                RWA promised real assets.
                <br />
                <span className="text-slate-400">Some delivered opacity instead.</span>
              </h1>
            </div>
            <div className="hidden lg:block flex-shrink-0">
              <OrbitalRings />
            </div>
          </div>

          {/* Body text — constrained to same half-width as h1 */}
          <div className="mt-20 lg:max-w-[50%] space-y-5 text-[15px] text-slate-400 leading-relaxed">
            <p>
              Algorithmic pegs, reserve gaps, credit defaults — each collapse
              happened in a different layer. Each was visible{' '}
              <em className="text-slate-300">in retrospect</em>. None was visible{' '}
              <em className="text-slate-300">in advance</em>.
            </p>
            <p>
              Most RWA risk isn&apos;t priced — it sits in legal structures,
              custody chains, and reconciliation gaps that no one independently
              verifies.{' '}
              <span className="text-white font-medium">
                RWAscope exists in that structural intelligence layer.
              </span>
            </p>
          </div>
        </div>

        {/* Full-width attribution band */}
        <div className="border-t border-[#2B3437]">
          <p className="px-8 py-7 text-center text-sm text-slate-500 leading-relaxed">
            An independent research platform built at{' '}
            <span className="text-slate-300">HKUST Crypto-Fintech Lab</span>,
            structured around peer-reviewed risk frameworks (SARM / RARM).{' '}
            <span className="text-slate-200 font-medium">
              We don&apos;t rate. We don&apos;t recommend. We decompose.
            </span>
          </p>
        </div>
      </section>

      {/* ── TVL Ticker ──────────────────────────────────────────────────── */}
      <TickerBar />

      {/* ── Three product entries ────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#DBE4E7]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#DBE4E7] border border-[#DBE4E7]">
            {ENTRIES.map(entry => {
              const { Icon } = entry;
              return (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className="group bg-white p-8 md:p-10 hover:bg-[#EAEFF1] transition-colors flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[#5E5C75]">
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <ArrowRight
                      size={20}
                      strokeWidth={1.5}
                      className="text-[#737C7F] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    />
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-wider text-[#5E5C75] mb-2">
                    {entry.kicker}
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-[#2B3437] mb-3 leading-tight">
                    {entry.heading}
                  </h3>
                  <p className="text-sm text-[#737C7F] leading-relaxed">
                    {entry.body}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
