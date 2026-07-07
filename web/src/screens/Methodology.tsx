import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { RARM_LAYER_KEYS } from '../utils/rarm';
import { useRarmMeta } from '../hooks/useRarmMeta';
import type { RARMBlock } from '../types/assets';

// ── Layer icons (aligned to RARM_LAYER_KEYS order) ────────────────────────────
const LAYER_ICONS: Record<keyof RARMBlock, string> = {
  legal_jurisdictional:       'gavel',
  valuation_oracles:          'price_check',
  custody_asset_control:      'lock',
  kyc_aml_permissioning:      'verified_user',
  secondary_market_liquidity: 'swap_horiz',
  settlement_finality:        'check_circle',
};

// ── Layer salience table ──────────────────────────────────────────────────────
type Salience = 'H' | 'M' | 'L';

const SALIENCE_META: Record<Salience, { bg: string; color: string }> = {
  H: { bg: '#FCE4EC', color: '#880E4F' },
  M: { bg: '#FFF8E1', color: '#7B5800' },
  L: { bg: '#E8F5E9', color: '#1B5E20' },
};

// Qualitative assessment of which RARM layers warrant most attention per asset class.
// Editorial judgment based on observed due diligence practice; not a numeric weighting system.
const SALIENCE_ROWS: { key: string; s: Salience[] }[] = [
  { key: 'govTreasuries',   s: ['M', 'L', 'H', 'M', 'L', 'L'] },
  { key: 'moneyMarket',     s: ['M', 'L', 'H', 'M', 'L', 'L'] },
  { key: 'realEstate',      s: ['H', 'H', 'H', 'M', 'H', 'M'] },
  { key: 'privateCredit',   s: ['H', 'H', 'M', 'H', 'H', 'M'] },
  { key: 'commodities',     s: ['M', 'H', 'H', 'L', 'M', 'M'] },
  { key: 'tokenizedEquity', s: ['M', 'L', 'M', 'H', 'L', 'L'] },
];

// ── Friction analysis ─────────────────────────────────────────────────────────
type FLevel = 'High' | 'Medium' | 'Low';

const FLEVEL_META: Record<FLevel, { bg: string; border: string; color: string }> = {
  High:   { bg: '#FCE4EC', border: '#F48FB1', color: '#880E4F' },
  Medium: { bg: '#FFF8E1', border: '#FFD54F', color: '#7B5800' },
  Low:    { bg: '#E8F5E9', border: '#A5D6A7', color: '#1B5E20' },
};

const FRICTION_ROWS: {
  key: string;
  rarmKey: keyof RARMBlock;
  icon: string;
  cells: FLevel[];
}[] = [
  { key: 'L1', rarmKey: 'legal_jurisdictional',       icon: 'gavel',         cells: ['Medium', 'High',   'High',   'Medium', 'Medium'] },
  { key: 'L2', rarmKey: 'valuation_oracles',          icon: 'price_check',   cells: ['Low',    'High',   'High',   'High',   'Low']    },
  { key: 'L3', rarmKey: 'custody_asset_control',      icon: 'lock',          cells: ['High',   'High',   'Medium', 'High',   'Medium'] },
  { key: 'L4', rarmKey: 'kyc_aml_permissioning',      icon: 'verified_user', cells: ['Medium', 'Medium', 'High',   'Low',    'High']   },
  { key: 'L5', rarmKey: 'secondary_market_liquidity', icon: 'swap_horiz',    cells: ['Low',    'High',   'High',   'Medium', 'Low']    },
  { key: 'L6', rarmKey: 'settlement_finality',        icon: 'check_circle',  cells: ['Low',    'Medium', 'Medium', 'Medium', 'Low']    },
];

// ── Tab components ────────────────────────────────────────────────────────────

function OverviewTab({ onGoToFramework }: { onGoToFramework: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { layers } = useRarmMeta();
  const { t } = useTranslation('methodology');

  return (
    <div className="bg-surface p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="border-b border-outline-variant/20 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-label font-bold text-primary tracking-widest uppercase">{t('overview.eyebrow')}</span>
            <div className="h-[1px] w-8 bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-3">
            {t('overview.h1')}
          </h1>
          <p className="text-on-surface-variant max-w-2xl font-body leading-relaxed">
            {t('overview.lede')}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-600 shrink-0">school</span>
          <div>
            <p className="text-sm font-bold text-blue-800">{t('overview.researchTool.title')}</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              {t('overview.researchTool.body')}
            </p>
          </div>
        </div>

        <section>
          <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-5 font-label">
            {t('overview.sixDimensions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RARM_LAYER_KEYS.map((key) => {
              const meta = layers[key];
              return (
                <div key={key}
                     className="flex items-start gap-4 p-5 bg-surface-container border border-outline-variant/20">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">{LAYER_ICONS[key]}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-label font-bold text-primary uppercase tracking-widest mb-0.5">
                      {t('overview.layerBadge')} {String(meta.index).padStart(2, '0')}
                    </div>
                    <div className="text-sm font-bold font-headline text-on-surface">{meta.label}</div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{meta.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="p-6 bg-surface-container-low border border-outline-variant/10">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4 font-label">{t('overview.signalScale.heading')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { signal: 'green',  dot: '#2E7D32' },
              { signal: 'yellow', dot: '#e09d2b' },
              { signal: 'red',    dot: '#9e3f4e' },
              { signal: 'gray',   dot: '#9E9E9E' },
            ] as const).map(({ signal, dot }) => (
              <div key={signal} className="flex flex-col gap-2 p-3 bg-white border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
                  <span className="text-xs font-bold text-on-surface">{t(`overview.signalScale.${signal}.label`)}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{t(`overview.signalScale.${signal}.desc`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/10">
            <button onClick={onGoToFramework}
               className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
              <span className="material-symbols-outlined text-base">description</span>
              {t('overview.signalScale.readMore')}
            </button>
          </div>
        </section>

        <section className="bg-[#1A1A2E] p-8 text-white">
          <h2 className="text-2xl font-bold font-headline mb-2">{t('overview.cta.h2')}</h2>
          <p className="text-[#6B7494] text-sm mb-6 max-w-lg leading-relaxed">
            {t('overview.cta.body')}
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <button onClick={() => navigate('/score')}
                className="px-6 py-3 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold uppercase tracking-widest transition-colors">
                {t('overview.cta.openTool')}
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold uppercase tracking-widest transition-colors">
                  {t('overview.cta.createAccount')}
                </button>
                <button onClick={onGoToFramework}
                  className="px-6 py-3 border border-white/20 hover:bg-white/5 text-sm font-bold uppercase tracking-widest transition-colors">
                  {t('overview.cta.learnFramework')}
                </button>
              </>
            )}
          </div>
          <p className="text-[9px] text-[#4A5568] mt-4">
            {t('overview.cta.disclaimer')}
          </p>
        </section>

      </div>
    </div>
  );
}

function FrameworkTab() {
  const { layers } = useRarmMeta();
  const { t } = useTranslation('methodology');
  const salienceHeaders = t('framework.salience.headers', { returnObjects: true }) as string[];

  return (
    <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto w-full">

      <section className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface max-w-4xl font-headline">
          {t('framework.h1Main')} <span className="text-primary-dim">{t('framework.h1Accent')}</span>
        </h1>
        <p className="text-lg text-on-surface-variant font-light max-w-2xl leading-relaxed">
          {t('framework.lede')}
        </p>
      </section>

      <section className="bg-surface-container border-l-[6px] border-primary p-10 flex flex-col md:flex-row items-start gap-12">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">{t('framework.overview.eyebrow')}</div>
            <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline">
              {t('framework.overview.h2')}
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            {t('framework.overview.para1')}
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            {t('framework.overview.para2')}
          </p>
        </div>
        <div className="flex-1 space-y-4 text-sm border-l border-outline-variant/30 pl-8">
          <h3 className="font-bold text-on-surface uppercase tracking-wider text-xs">{t('framework.aggregation.h3')}</h3>
          <p className="text-on-surface-variant">
            {t('framework.aggregation.intro')}
          </p>
          <div className="mt-4 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9E9E9E] shrink-0" />
              <span className="text-on-surface-variant">
                <Trans i18nKey="framework.aggregation.gray" ns="methodology" components={{ signal: <span className="font-bold text-[#424242]" /> }} />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9e3f4e] shrink-0" />
              <span className="text-on-surface-variant">
                <Trans i18nKey="framework.aggregation.red" ns="methodology" components={{ signal: <span className="font-bold text-[#880E4F]" /> }} />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] shrink-0" />
              <span className="text-on-surface-variant">
                <Trans i18nKey="framework.aggregation.green" ns="methodology" components={{ signal: <span className="font-bold text-[#1B5E20]" /> }} />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#e09d2b] shrink-0" />
              <span className="text-on-surface-variant">
                <Trans i18nKey="framework.aggregation.yellow" ns="methodology" components={{ signal: <span className="font-bold text-[#7B5800]" /> }} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {RARM_LAYER_KEYS.map((key) => {
          const meta = layers[key];
          return (
            <div key={key}
                 className="bg-surface-container-low hover:bg-surface-container-high p-8 border-t border-primary/20 transition-colors">
              <div className="text-outline text-xs font-mono mb-6">{t('framework.layerPrefix')}{String(meta.index).padStart(2, '0')}</div>
              <div className="mb-5">
                <span className="material-symbols-outlined text-primary text-4xl">{LAYER_ICONS[key]}</span>
              </div>
              <h3 className="text-xl font-extrabold mb-3 tracking-tight font-headline">{meta.label}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{meta.description}</p>
            </div>
          );
        })}
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight font-headline">{t('framework.salience.h2')}</h2>
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {t('framework.salience.para')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant/30">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface w-1/4">{t('framework.salience.colHeader')}</th>
                {salienceHeaders.map((h) => (
                  <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/10">
              {SALIENCE_ROWS.map((row) => (
                <tr key={row.key} className="hover:bg-surface-container transition-colors">
                  <td className="p-4 font-bold text-on-surface">{t(`framework.salience.rows.${row.key}`)}</td>
                  {row.s.map((sal, i) => {
                    const m = SALIENCE_META[sal];
                    return (
                      <td key={i} className="p-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-sm"
                              style={{ background: m.bg, color: m.color }}>
                          {t(`framework.salience.${sal}`)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-on-surface-variant italic">
          {t('framework.salience.footnote')}
        </p>
      </section>

    </div>
  );
}

function FrictionTab() {
  const { layers } = useRarmMeta();
  const { t } = useTranslation('methodology');
  const frictionColumns = t('friction.table.columns', { returnObjects: true }) as string[];
  const highFrictionRows = FRICTION_ROWS.filter(r => r.cells.some(c => c === 'High'));

  return (
    <div className="bg-surface p-8">
      <div className="max-w-7xl mx-auto w-full space-y-10">

        <header>
          <div className="flex items-center gap-2 mb-2 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
            <span>{t('friction.breadcrumb.parent')}</span>
            <span>/</span>
            <span className="text-primary font-bold">{t('friction.breadcrumb.current')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter font-headline leading-tight mb-4">
            {t('friction.h1Line1')}<br />{t('friction.h1Line2')}
          </h1>
          <p className="max-w-2xl text-on-surface-variant font-body leading-relaxed">
            {t('friction.lede')}
          </p>
        </header>

        <section className="bg-white border border-outline-variant/20 p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h2 className="text-xl font-bold text-on-surface font-headline">{t('friction.table.h2')}</h2>
            <div className="flex gap-5">
              {(['High', 'Medium', 'Low'] as FLevel[]).map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: FLEVEL_META[l].color }} />
                  <span className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant">{t(`friction.table.${l}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-on-surface/10">
                  <th className="py-3 pr-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant font-label w-[22%]">{t('friction.table.colLayer')}</th>
                  {frictionColumns.map((c) => (
                    <th key={c} className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-on-surface-variant font-label">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface/5">
                {FRICTION_ROWS.map((row) => (
                  <tr key={row.key} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-base">{row.icon}</span>
                        <div>
                          <div className="font-bold text-sm font-headline text-on-surface">{layers[row.rarmKey].label}</div>
                          <div className="text-[10px] font-mono text-outline">{row.key}</div>
                        </div>
                      </div>
                    </td>
                    {row.cells.map((level, i) => {
                      const m = FLEVEL_META[level];
                      return (
                        <td key={i} className="py-5 px-3">
                          <span className="inline-block px-2 py-1 text-[10px] font-bold rounded-sm"
                                style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
                            {t(`friction.table.${level}`)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-5 font-label">
            {t('friction.highFriction')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highFrictionRows.map((row) => (
              <div key={row.key} className="p-6 bg-surface-container border border-outline-variant/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/10 shrink-0">
                    <span className="material-symbols-outlined text-primary text-base">{row.icon}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-outline">{row.key}</div>
                    <div className="text-sm font-bold text-on-surface font-headline">{layers[row.rarmKey].label}</div>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{t(`friction.rows.${row.key}.barrier`)}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-600 shrink-0 text-sm mt-0.5">info</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            {t('friction.infoBox')}
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'framework' | 'friction';

// ── Main export ───────────────────────────────────────────────────────────────
export default function Methodology() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation('methodology');
  const raw = searchParams.get('tab');
  const activeTab: TabKey = raw === 'framework' ? 'framework' : raw === 'friction' ? 'friction' : 'overview';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview',  label: t('tabs.overview') },
    { key: 'framework', label: t('tabs.framework') },
    { key: 'friction',  label: t('tabs.friction') },
  ];

  function goToTab(tab: TabKey) {
    setSearchParams(tab === 'overview' ? {} : { tab });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex bg-white border-b border-[#DBE4E7] px-6 shrink-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => goToTab(key)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors mr-2 ${
              activeTab === key
                ? 'border-[#5E5C75] text-[#2B3437]'
                : 'border-transparent text-[#737C7F] hover:text-[#2B3437]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {activeTab === 'overview'  && <OverviewTab onGoToFramework={() => goToTab('framework')} />}
        {activeTab === 'framework' && <FrameworkTab />}
        {activeTab === 'friction'  && <FrictionTab />}
      </div>
    </div>
  );
}
