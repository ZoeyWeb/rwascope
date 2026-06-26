import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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

function useEntries(): Entry[] {
  const { t } = useTranslation('home');
  return useMemo(() => [
    {
      to: '/projects',
      kicker: t('entries.projects.kicker'),
      heading: t('entries.projects.heading'),
      body: t('entries.projects.body'),
      Icon: Boxes,
    },
    {
      to: '/licenses',
      kicker: t('entries.framework.kicker'),
      heading: t('entries.framework.heading'),
      body: t('entries.framework.body'),
      Icon: ShieldCheck,
    },
    {
      to: '/incidents',
      kicker: t('entries.incidents.kicker'),
      heading: t('entries.incidents.heading'),
      body: t('entries.incidents.body'),
      Icon: AlertTriangle,
    },
  ], [t]);
}

export default function Home() {
  const { t } = useTranslation('home');
  const entries = useEntries();
  const [stats, setStats] = useState<{ cumulative_pageviews: number } | null>(null);

  useEffect(() => {
    const fetchStats = () =>
      fetch('/data/visitors.json?t=' + Date.now())
        .then(r => r.json())
        .then(setStats)
        .catch(() => {});
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#F1F4F6]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1A1A2E] text-white">
        <div className="max-w-[1400px] mx-auto px-8 pt-24 pb-20 md:pt-32 md:pb-24">

          {/* Headline row: h1 left, ring right */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="lg:max-w-[50%]">
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                {t('hero.headline1')}
                <br />
                <span className="text-slate-400">{t('hero.headline2')}</span>
              </h1>
            </div>
            <div className="hidden lg:block flex-shrink-0">
              <OrbitalRings />
            </div>
          </div>

          {/* Body text */}
          <div className="mt-20 lg:max-w-[50%] space-y-5 text-[15px] text-slate-400 leading-relaxed">
            <p>
              <Trans
                i18nKey="hero.body1"
                ns="home"
                components={{ em: <em className="text-slate-300" /> }}
              />
            </p>
            <p>
              <Trans
                i18nKey="hero.body2"
                ns="home"
                components={{ strong: <span className="text-white font-medium" /> }}
              />
            </p>
          </div>

          {/* Readings counter */}
          <div className="mt-12 border-t border-white/10 pt-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {t('hero.readingsLabel')}
            </div>
            <div className="text-5xl font-bold tabular-nums text-white mt-3 leading-none">
              {stats ? stats.cumulative_pageviews.toLocaleString() : '—'}
            </div>
          </div>

          {/* Attribution */}
          <div className="mt-10 border-t border-white/10 pt-8 text-sm text-white/60 leading-relaxed">
            <Trans
              i18nKey="hero.attribution"
              ns="home"
              components={{
                strong: <span className="text-white/90" />,
                em: <span className="text-white font-medium" />,
              }}
            />
          </div>
        </div>
      </section>

      {/* ── TVL Ticker ──────────────────────────────────────────────────── */}
      <TickerBar />

      {/* ── Three product entries ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 border-y border-[#DBE4E7]">
            {entries.map((entry, i) => {
              const { Icon } = entry;
              return (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className={`group bg-white p-10 hover:bg-[#EAEFF1] transition-colors flex flex-col${
                    i < entries.length - 1
                      ? ' border-b border-[#DBE4E7] md:border-b-0 md:border-r'
                      : ''
                  }`}
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
