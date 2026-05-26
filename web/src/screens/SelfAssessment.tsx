/**
 * The public (unauthenticated) RARM scoring tool has been removed.
 *
 * Rationale: A publicly accessible scoring tool that computes and displays
 * protocol-level scores for any visitor risks being characterised as
 * "providing credit ratings to the public" under Hong Kong SFC Type 10
 * regulations. To avoid this, scoring is only available to registered users
 * and results are stored privately per user — not broadcast publicly.
 *
 * Registered users can access the full RARM due diligence tool at /score.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FRAMEWORK_LAYERS = [
  { id: 1, label: 'Legal & Jurisdictional', icon: 'gavel' },
  { id: 2, label: 'Asset Valuation & Oracles', icon: 'price_check' },
  { id: 3, label: 'Custody & Asset Control', icon: 'lock' },
  { id: 4, label: 'KYC / AML Permissioning', icon: 'verified_user' },
  { id: 5, label: 'Secondary Market Liquidity', icon: 'swap_horiz' },
  { id: 6, label: 'Settlement Finality', icon: 'check_circle' },
];

export default function SelfAssessment() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  return (
    <div className="flex-1 overflow-y-auto thin-scrollbar bg-surface p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Hero */}
        <div className="border-b border-outline-variant/20 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-label font-bold text-primary tracking-widest uppercase">
              RARM Framework
            </span>
            <div className="h-[1px] w-8 bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-3">
            RARM Framework Overview
          </h1>
          <p className="text-on-surface-variant max-w-2xl font-body leading-relaxed">
            The RARM (RWA Asset Risk Matrix) is an academic methodology for structured due diligence
            on tokenized real-world asset protocols. It provides a six-layer checklist framework
            for practitioners to organize their own analysis.
          </p>
        </div>

        {/* Educational notice */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-600 shrink-0">school</span>
          <div>
            <p className="text-sm font-bold text-blue-800">Academic Research Tool</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              RWA-Index provides the RARM methodology framework as an educational tool.
              It does not generate, publish, or distribute ratings or assessments of any protocol.
              To apply this framework to your own due diligence work, create a free account.
            </p>
          </div>
        </div>

        {/* Six layers overview (educational content only) */}
        <section>
          <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-5 font-label">
            The Six Evaluation Dimensions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FRAMEWORK_LAYERS.map((layer) => (
              <div key={layer.id}
                   className="flex items-start gap-4 p-5 bg-surface-container border border-outline-variant/20">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{layer.icon}</span>
                </div>
                <div>
                  <div className="text-[10px] font-label font-bold text-primary uppercase tracking-widest mb-0.5">
                    Layer {String(layer.id).padStart(2, '0')}
                  </div>
                  <div className="text-sm font-bold font-headline text-on-surface">
                    {layer.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reference block */}
        <section className="p-6 bg-surface-container-low border border-outline-variant/10">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4 font-label">
            RARM Reference
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1 h-auto bg-primary/20 shrink-0" />
              <p className="text-[11px] font-body text-on-surface-variant italic leading-relaxed">
                "The RARM framework provides a structured six-layer methodology for practitioners
                to conduct their own due diligence on RWA protocols. Each dimension addresses a
                distinct operational risk category relevant to tokenized real-world assets."
              </p>
            </div>
            <a href="/framework"
               className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
              <span className="material-symbols-outlined text-base">description</span>
              Read the full methodology →
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1A1A2E] p-8 text-white">
          <h2 className="text-2xl font-bold font-headline mb-2">
            Apply the Framework to Your Own Analysis
          </h2>
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
                <button onClick={() => navigate('/framework')}
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
