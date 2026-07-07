/**
 * About RWA-Index — explains the platform's academic positioning,
 * what it is and what it is NOT, and links to key resources.
 */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { publicApi } from '../api/client';

interface StatItem {
  label: string;
  value: number | null;
  icon: string;
}

export default function About() {
  const { t } = useTranslation('about');
  const navigate = useNavigate();
  const { user } = useAuth();

  const PILLARS = [
    { icon: 'school',      title: t('pillars.academic.title'), body: t('pillars.academic.body') },
    { icon: 'lock_person', title: t('pillars.private.title'),  body: t('pillars.private.body') },
    { icon: 'smart_toy',   title: t('pillars.ai.title'),       body: t('pillars.ai.body') },
    { icon: 'public',      title: t('pillars.market.title'),   body: t('pillars.market.body') },
  ];

  const NOT_LIST = [
    { id: 'creditRating',      text: t('isNot.creditRating') },
    { id: 'investmentAdviser', text: t('isNot.investmentAdviser') },
    { id: 'financialProvider', text: t('isNot.financialProvider') },
    { id: 'scoringPublisher',  text: t('isNot.scoringPublisher') },
    { id: 'operator',          text: t('isNot.operator') },
  ];

  const IS_LIST = [
    { id: 'researchTool',        text: t('is.researchTool') },
    { id: 'workbook',            text: t('is.workbook') },
    { id: 'methodologyProvider', text: t('is.methodologyProvider') },
    { id: 'dataRelay',           text: t('is.dataRelay') },
    { id: 'checklistGenerator',  text: t('is.checklistGenerator') },
  ];

  const [stats, setStats] = useState<StatItem[]>([
    { label: t('stats.registeredUsers'),  value: null, icon: 'group' },
    { label: t('stats.incidentsTracked'), value: null, icon: 'warning' },
    { label: t('stats.assetsProfiled'),   value: null, icon: 'token' },
    { label: t('stats.licensedIssuers'),  value: null, icon: 'verified' },
    { label: t('stats.complianceCells'),  value: null, icon: 'grid_view' },
    { label: t('stats.quarterlyReports'), value: null, icon: 'description' },
  ]);

  useEffect(() => {
    Promise.all([
      publicApi.stats().catch(() => ({ registered_users: null })),
      fetch('/data/incidents/incidents.json').then((r) => r.json()).catch(() => []),
      fetch('/data/assets/assets.json').then((r) => r.json()).catch(() => []),
      fetch('/data/licenses/issuers.json').then((r) => r.json()).catch(() => []),
      fetch('/data/compliance/matrix.json').then((r) => r.json()).catch(() => ({ cells: [] })),
      fetch('/data/reports/reports.json').then((r) => r.json()).catch(() => []),
    ]).then(([platformStats, incidents, assets, issuers, matrix, reports]) => {
      const populatedCells = Array.isArray(matrix.cells)
        ? (matrix.cells as { status_signal: string }[]).filter((c) => c.status_signal !== 'placeholder').length
        : 0;
      setStats([
        { label: t('stats.registeredUsers'),  value: (platformStats as { registered_users: number | null }).registered_users, icon: 'group' },
        { label: t('stats.incidentsTracked'), value: Array.isArray(incidents) ? incidents.length : null, icon: 'warning' },
        { label: t('stats.assetsProfiled'),   value: Array.isArray(assets) ? assets.length : null, icon: 'token' },
        { label: t('stats.licensedIssuers'),  value: Array.isArray(issuers) ? issuers.length : null, icon: 'verified' },
        { label: t('stats.complianceCells'),  value: populatedCells || null, icon: 'grid_view' },
        { label: t('stats.quarterlyReports'), value: Array.isArray(reports) ? reports.length : null, icon: 'description' },
      ]);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto thin-scrollbar bg-surface p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Hero */}
        <div className="border-b border-outline-variant/20 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-label font-bold text-primary tracking-widest uppercase">
              {t('hero.eyebrow')}
            </span>
            <div className="h-[1px] w-8 bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-3">
            {t('hero.h1')}
          </h1>
          <p className="text-on-surface-variant max-w-2xl font-body leading-relaxed text-lg">
            {t('hero.lede')}
          </p>
        </div>

        {/* Stats bar */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-4 bg-surface-container border border-outline-variant/20 text-center"
            >
              <span className="material-symbols-outlined text-primary text-xl mb-1 block">{s.icon}</span>
              <div className="text-2xl font-extrabold font-headline text-on-surface">
                {s.value !== null ? s.value.toLocaleString() : '—'}
              </div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-label mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* Four pillars */}
        <section>
          <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-5 font-label">
            {t('pillars.sectionLabel')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <div
                key={p.icon}
                className="p-6 bg-surface-container border border-outline-variant/20 flex gap-4"
              >
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{p.icon}</span>
                </div>
                <div>
                  <div className="text-sm font-bold font-headline text-on-surface mb-1">
                    {p.title}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Is / Is Not */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Is NOT */}
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-red-400">cancel</span>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                {t('isNot.heading')}
              </h3>
            </div>
            <ul className="space-y-2">
              {NOT_LIST.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Is */}
          <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                {t('is.heading')}
              </h3>
            </div>
            <ul className="space-y-2">
              {IS_LIST.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Regulatory note */}
        <section className="p-6 bg-blue-500/5 border border-blue-500/20 rounded">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-400">gavel</span>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
              {t('regulatory.heading')}
            </h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
            {t('regulatory.p1')}
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t('regulatory.p2')}
          </p>
          <button
            onClick={() => navigate('/terms')}
            className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            {t('regulatory.readTerms')}
          </button>
        </section>

        {/* CTA */}
        <section className="bg-[#1A1A2E] p-8 text-white">
          <h2 className="text-2xl font-bold font-headline mb-2">{t('cta.h2')}</h2>
          <p className="text-[#6B7494] text-sm mb-6 max-w-lg leading-relaxed">
            {t('cta.lede')}
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <button
                onClick={() => navigate('/score')}
                className="px-6 py-3 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold uppercase tracking-widest transition-colors"
              >
                {t('cta.openWorkbook')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  {t('cta.createAccount')}
                </button>
                <button
                  onClick={() => navigate('/methodology?tab=framework')}
                  className="px-6 py-3 border border-white/20 hover:bg-white/5 text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  {t('cta.learnFramework')}
                </button>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
