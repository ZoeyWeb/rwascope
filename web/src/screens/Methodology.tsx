import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RARM_LAYER_META, RARM_LAYER_KEYS } from '../utils/rarm';
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

const SALIENCE_META: Record<Salience, { label: string; bg: string; color: string }> = {
  H: { label: 'High',   bg: '#FCE4EC', color: '#880E4F' },
  M: { label: 'Medium', bg: '#FFF8E1', color: '#7B5800' },
  L: { label: 'Low',    bg: '#E8F5E9', color: '#1B5E20' },
};

const SALIENCE_HEADERS = ['L1 Legal', 'L2 Valuation', 'L3 Custody', 'L4 KYC/AML', 'L5 Liquidity', 'L6 Settlement'];

// Qualitative assessment of which RARM layers warrant most attention per asset class.
// Editorial judgment based on observed due diligence practice; not a numeric weighting system.
const SALIENCE_ROWS: { cls: string; s: Salience[] }[] = [
  { cls: 'Gov. Treasuries',    s: ['M', 'L', 'H', 'M', 'L', 'L'] },
  { cls: 'Money Market Funds', s: ['M', 'L', 'H', 'M', 'L', 'L'] },
  { cls: 'Real Estate',        s: ['H', 'H', 'H', 'M', 'H', 'M'] },
  { cls: 'Private Credit',     s: ['H', 'H', 'M', 'H', 'H', 'M'] },
  { cls: 'Commodities',        s: ['M', 'H', 'H', 'L', 'M', 'M'] },
  { cls: 'Tokenized Equity',   s: ['M', 'L', 'M', 'H', 'L', 'L'] },
];

// ── Friction analysis ─────────────────────────────────────────────────────────
type FLevel = 'High' | 'Medium' | 'Low';

const FLEVEL_META: Record<FLevel, { bg: string; border: string; color: string }> = {
  High:   { bg: '#FCE4EC', border: '#F48FB1', color: '#880E4F' },
  Medium: { bg: '#FFF8E1', border: '#FFD54F', color: '#7B5800' },
  Low:    { bg: '#E8F5E9', border: '#A5D6A7', color: '#1B5E20' },
};

const FRICTION_COLUMNS = ['Gov. Treasuries', 'Real Estate', 'Private Credit', 'Commodities', 'Tokenized Equity'];

const FRICTION_ROWS: {
  key: string;
  layer: string;
  icon: string;
  barrier: string;
  cells: FLevel[];
}[] = [
  {
    key: 'L1', layer: 'Legal & Jurisdictional', icon: 'gavel',
    barrier: 'Cross-border SPV enforceability, title transfer law variability, and investor rights recognition differ widely across jurisdictions.',
    cells: ['Medium', 'High', 'High', 'Medium', 'Medium'],
  },
  {
    key: 'L2', layer: 'Valuation & Oracles', icon: 'price_check',
    barrier: 'Appraisal frequency, oracle manipulation risk, and mark-to-model gaps create pricing uncertainty for illiquid assets.',
    cells: ['Low', 'High', 'High', 'High', 'Low'],
  },
  {
    key: 'L3', layer: 'Custody & Asset Control', icon: 'lock',
    barrier: 'Registrar infrastructure, bankruptcy-remoteness of SPV structures, and qualified custodian availability vary significantly by asset class.',
    cells: ['High', 'High', 'Medium', 'High', 'Medium'],
  },
  {
    key: 'L4', layer: 'KYC / AML & Permissioning', icon: 'verified_user',
    barrier: 'Accredited investor onboarding, sanctions screening, and transfer whitelist enforcement add onboarding latency across all categories.',
    cells: ['Medium', 'Medium', 'High', 'Low', 'High'],
  },
  {
    key: 'L5', layer: 'Secondary Market Liquidity', icon: 'swap_horiz',
    barrier: 'Transfer restrictions, lock-up periods, and absence of standardised secondary venues limit exit options for most RWA categories.',
    cells: ['Low', 'High', 'High', 'Medium', 'Low'],
  },
  {
    key: 'L6', layer: 'Settlement Finality', icon: 'check_circle',
    barrier: 'DVP matching, on-chain finality recognition, and insolvency law treatment of token records remain evolving across jurisdictions.',
    cells: ['Low', 'Medium', 'Medium', 'Medium', 'Low'],
  },
];

// ── Tab components ────────────────────────────────────────────────────────────

function OverviewTab({ onGoToFramework }: { onGoToFramework: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="bg-surface p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="border-b border-outline-variant/20 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-label font-bold text-primary tracking-widest uppercase">RARM Framework</span>
            <div className="h-[1px] w-8 bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-3">
            RARM Framework Overview
          </h1>
          <p className="text-on-surface-variant max-w-2xl font-body leading-relaxed">
            The RARM (RWA Asset Risk Matrix) is an academic methodology for structured due diligence
            on tokenized real-world assets. It organises analysis across six layers of operational
            risk, giving practitioners a consistent checklist framework regardless of asset class.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-600 shrink-0">school</span>
          <div>
            <p className="text-sm font-bold text-blue-800">Academic Research Tool</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              RWA-Index provides the RARM methodology as an educational framework.
              It does not generate, publish, or distribute ratings or assessments of any protocol.
              To apply this framework to your own due diligence work, create a free account.
            </p>
          </div>
        </div>

        <section>
          <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-5 font-label">
            The Six Evaluation Dimensions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RARM_LAYER_KEYS.map((key) => {
              const meta = RARM_LAYER_META[key];
              return (
                <div key={key}
                     className="flex items-start gap-4 p-5 bg-surface-container border border-outline-variant/20">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">{LAYER_ICONS[key]}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-label font-bold text-primary uppercase tracking-widest mb-0.5">
                      Layer {String(meta.index).padStart(2, '0')}
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
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4 font-label">Signal Scale</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { signal: 'green',  dot: '#2E7D32', label: 'Adequate',          desc: 'Adequate controls and disclosures across this dimension.' },
              { signal: 'yellow', dot: '#e09d2b', label: 'Notable Concerns',  desc: 'Issues present; warrants further investigation.' },
              { signal: 'red',    dot: '#9e3f4e', label: 'Material Concerns', desc: 'Significant deficiencies or red flags identified.' },
              { signal: 'gray',   dot: '#9E9E9E', label: 'Insufficient Data', desc: 'Public information too limited to assess.' },
            ] as const).map(({ signal, dot, label, desc }) => (
              <div key={signal} className="flex flex-col gap-2 p-3 bg-white border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
                  <span className="text-xs font-bold text-on-surface">{label}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/10">
            <button onClick={onGoToFramework}
               className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
              <span className="material-symbols-outlined text-base">description</span>
              Read the full methodology →
            </button>
          </div>
        </section>

        <section className="bg-[#1A1A2E] p-8 text-white">
          <h2 className="text-2xl font-bold font-headline mb-2">Apply the Framework to Your Own Analysis</h2>
          <p className="text-[#6B7494] text-sm mb-6 max-w-lg leading-relaxed">
            Registered users can access the full RARM due diligence workbook — a six-layer
            sub-indicator tool that helps structure your own professional analysis.
            Results are stored privately and reflect your judgment, not a platform rating.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <button onClick={() => navigate('/score')}
                className="px-6 py-3 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold uppercase tracking-widest transition-colors">
                Open Due Diligence Tool
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold uppercase tracking-widest transition-colors">
                  Create Free Account
                </button>
                <button onClick={onGoToFramework}
                  className="px-6 py-3 border border-white/20 hover:bg-white/5 text-sm font-bold uppercase tracking-widest transition-colors">
                  Learn the Framework
                </button>
              </>
            )}
          </div>
          <p className="text-[9px] text-[#4A5568] mt-4">
            RWA-Index does not provide credit ratings, investment advice, or any service requiring
            regulatory authorization. All assessments reflect the user's own professional judgment.
          </p>
        </section>

      </div>
    </div>
  );
}

function FrameworkTab() {
  return (
    <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto w-full">

      <section className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface max-w-4xl font-headline">
          Six-Layer Framework <span className="text-primary-dim">Methodology</span>
        </h1>
        <p className="text-lg text-on-surface-variant font-light max-w-2xl leading-relaxed">
          A structured decomposition of tokenized real-world asset risk, organising due diligence
          across six operationally distinct dimensions.
        </p>
      </section>

      <section className="bg-surface-container border-l-[6px] border-primary p-10 flex flex-col md:flex-row items-start gap-12">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Framework Overview</div>
            <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline">
              The Relative Asset Risk Matrix (RARM)
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            RARM organises due diligence for tokenized real-world assets into six layers,
            each addressing a distinct operational risk category. Practitioners work through
            each layer systematically, recording evidence and signal assessments based on
            publicly available disclosures.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            The framework does not generate platform ratings or composite scores. Each
            assessment is the analyst's own professional judgment, stored privately in
            their workbook.
          </p>
        </div>
        <div className="flex-1 space-y-4 text-sm border-l border-outline-variant/30 pl-8">
          <h3 className="font-bold text-on-surface uppercase tracking-wider text-xs">Conservative Aggregation Logic</h3>
          <p className="text-on-surface-variant">
            The summary signal follows a conservative rule that prevents an incomplete
            assessment from appearing more favourable than warranted.
          </p>
          <div className="mt-4 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9E9E9E] shrink-0" />
              <span className="text-on-surface-variant">Any gray layer → <span className="font-bold text-[#424242]">gray</span> (data gap)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9e3f4e] shrink-0" />
              <span className="text-on-surface-variant">Any red layer → <span className="font-bold text-[#880E4F]">red</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] shrink-0" />
              <span className="text-on-surface-variant">≥ 4 green, no red → <span className="font-bold text-[#1B5E20]">green</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#e09d2b] shrink-0" />
              <span className="text-on-surface-variant">Otherwise → <span className="font-bold text-[#7B5800]">yellow</span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {RARM_LAYER_KEYS.map((key) => {
          const meta = RARM_LAYER_META[key];
          return (
            <div key={key}
                 className="bg-surface-container-low hover:bg-surface-container-high p-8 border-t border-primary/20 transition-colors">
              <div className="text-outline text-xs font-mono mb-6">LAYER_{String(meta.index).padStart(2, '0')}</div>
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
          <h2 className="text-3xl font-black tracking-tight font-headline">Layer Salience by Asset Class</h2>
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Qualitative assessment of which RARM layers warrant the most attention during due
            diligence, based on the structural characteristics of each asset class.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant/30">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface w-1/4">Asset Class</th>
                {SALIENCE_HEADERS.map((h) => (
                  <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/10">
              {SALIENCE_ROWS.map((row) => (
                <tr key={row.cls} className="hover:bg-surface-container transition-colors">
                  <td className="p-4 font-bold text-on-surface">{row.cls}</td>
                  {row.s.map((sal, i) => {
                    const m = SALIENCE_META[sal];
                    return (
                      <td key={i} className="p-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-sm"
                              style={{ background: m.bg, color: m.color }}>
                          {m.label}
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
          Salience levels reflect editorial judgment on typical due diligence practice, not a scoring system.
          Individual assessments may weigh layers differently depending on the specific protocol and jurisdiction.
        </p>
      </section>

    </div>
  );
}

function FrictionTab() {
  const highFrictionRows = FRICTION_ROWS.filter(r => r.cells.some(c => c === 'High'));

  return (
    <div className="bg-surface p-8">
      <div className="max-w-7xl mx-auto w-full space-y-10">

        <header>
          <div className="flex items-center gap-2 mb-2 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
            <span>Methodology</span>
            <span>/</span>
            <span className="text-primary font-bold">Tokenization Friction</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter font-headline leading-tight mb-4">
            Structural Barriers to<br />Asset Tokenization
          </h1>
          <p className="max-w-2xl text-on-surface-variant font-body leading-relaxed">
            Not all real-world asset classes face the same tokenization challenges.
            This analysis maps the structural friction practitioners encounter across
            each RARM dimension for common RWA categories.
          </p>
        </header>

        <section className="bg-white border border-outline-variant/20 p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h2 className="text-xl font-bold text-on-surface font-headline">Friction by Layer and Asset Class</h2>
            <div className="flex gap-5">
              {(['High', 'Medium', 'Low'] as FLevel[]).map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: FLEVEL_META[l].color }} />
                  <span className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-on-surface/10">
                  <th className="py-3 pr-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant font-label w-[22%]">Layer</th>
                  {FRICTION_COLUMNS.map((c) => (
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
                          <div className="font-bold text-sm font-headline text-on-surface">{row.layer}</div>
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
                            {level}
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
            High-Friction Dimensions — Key Barriers
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
                    <div className="text-sm font-bold text-on-surface font-headline">{row.layer}</div>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{row.barrier}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-600 shrink-0 text-sm mt-0.5">info</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            Friction levels are qualitative editorial assessments based on observed industry practice
            and regulatory disclosures. They do not constitute ratings of any specific protocol.
            Individual implementations may differ materially from the general patterns described here.
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',   label: 'Overview' },
  { key: 'framework',  label: 'Six-Layer Framework' },
  { key: 'friction',   label: 'Tokenization Friction' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Main export ───────────────────────────────────────────────────────────────
export default function Methodology() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const activeTab: TabKey = raw === 'framework' ? 'framework' : raw === 'friction' ? 'friction' : 'overview';

  function goToTab(tab: TabKey) {
    setSearchParams(tab === 'overview' ? {} : { tab });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex bg-white border-b border-[#DBE4E7] px-6 shrink-0">
        {TABS.map(({ key, label }) => (
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
