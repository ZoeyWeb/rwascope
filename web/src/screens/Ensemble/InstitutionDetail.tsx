import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import type { EnsembleData, EnsemblePhase } from '../../types/ensemble';
import {
  PHASE_META,
  PHASE_DOT,
  INSTITUTION_TYPE_META,
  THEME_ACCENT,
  getInstitution,
} from '../../utils/ensemble';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const DISCLAIMER =
  'This profile compiles publicly available information from HKMA press releases and reported media. RWA-Index does not have access to non-public Ensemble or EnsembleTX data.';

const PHASES_ORDERED: EnsemblePhase[] = ['pre-launch', 'sandbox', 'pilot'];

function PhaseBadge({ phase }: { phase: EnsemblePhase }) {
  const meta = PHASE_META[phase];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: PHASE_DOT[phase] }} />
      {meta.label}
    </span>
  );
}

export default function InstitutionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<EnsembleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/ensemble/ensemble.json')
      .then((r) => r.json())
      .then((d: EnsembleData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Loading…</span>
      </div>
    );
  }

  if (!data || !slug) return <Navigate to="/ensemble/institutions" replace />;

  const inst = getInstitution(data, slug);
  if (!inst) return <Navigate to="/ensemble/institutions" replace />;

  const typeMeta = INSTITUTION_TYPE_META[inst.type];

  // Use cases involving this institution
  const linkedUseCases = data.use_cases.filter((uc) =>
    uc.linked_institutions.includes(slug)
  );

  // Milestones mentioning this institution
  const linkedMilestones = data.milestones.filter((m) =>
    m.linked_institutions.includes(slug)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1 flex-wrap">
        <Link to="/ensemble" className="hover:text-[#2B3437] transition-colors">Ensemble</Link>
        <span>›</span>
        <Link to="/ensemble/institutions" className="hover:text-[#2B3437] transition-colors">
          Institutions
        </Link>
        <span>›</span>
        <span className="text-[#2B3437]">{inst.shortName}</span>
      </nav>

      <DisclaimerBanner text={DISCLAIMER} className="mb-5" />

      <div className="flex gap-6 items-start">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#EAEFF1] flex items-center justify-center text-xl font-bold text-[#5E5C75] flex-shrink-0">
              {inst.shortName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3437] font-headline">{inst.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {typeMeta && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ background: typeMeta.bg, color: typeMeta.color }}
                  >
                    {typeMeta.label}
                  </span>
                )}
                <span className="text-xs bg-[#EAEFF1] text-[#586064] px-1.5 py-0.5 rounded">
                  {inst.jurisdiction}
                </span>
              </div>
            </div>
          </div>

          {/* Role */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-2">
              Role in Project Ensemble
            </h2>
            <p className="text-sm text-[#2B3437] leading-relaxed">{inst.role}</p>
          </section>

          {/* Phases timeline */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
              Phase Participation
            </h2>
            <div className="flex items-center gap-0">
              {PHASES_ORDERED.map((phase, idx) => {
                const participated = inst.phases.includes(phase);
                const dot = PHASE_DOT[phase];
                const meta = PHASE_META[phase];
                return (
                  <div key={phase} className="flex items-center">
                    {idx > 0 && (
                      <div
                        className="h-0.5 w-8"
                        style={{ background: participated ? dot : '#e5e7eb' }}
                      />
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white"
                        style={{
                          background: participated ? dot : '#e5e7eb',
                          boxShadow: participated ? `0 0 0 2px ${dot}33` : undefined,
                        }}
                      />
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: participated ? meta.color : '#9ca3af' }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Themes */}
          {inst.themes.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-2">
                Themes Involved
              </h2>
              <div className="flex flex-wrap gap-2">
                {inst.themes.map((tc) => {
                  const theme = data.themes.find((t) => t.code === tc);
                  const accent = THEME_ACCENT[tc] ?? '#5E5C75';
                  return theme ? (
                    <Link
                      key={tc}
                      to={`/ensemble/use-cases?theme=${tc}`}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border hover:opacity-80 transition-opacity"
                      style={{
                        background: `${accent}15`,
                        color: accent,
                        borderColor: `${accent}40`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                      {theme.title}
                    </Link>
                  ) : null;
                })}
              </div>
            </section>
          )}

          {/* Linked use cases */}
          {linkedUseCases.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                Use Cases
              </h2>
              <div className="space-y-2">
                {linkedUseCases.map((uc) => {
                  const theme = data.themes.find((t) => t.code === uc.theme);
                  const accent = THEME_ACCENT[uc.theme] ?? '#5E5C75';
                  return (
                    <Link
                      key={uc.slug}
                      to="/ensemble/use-cases"
                      className="flex items-start gap-3 p-3 bg-white border border-[#DBE4E7] rounded hover:border-[#5E5C75] transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ background: accent }}
                      />
                      <div>
                        <p className="text-sm font-medium text-[#2B3437]">{uc.title}</p>
                        {theme && (
                          <p className="text-xs text-[#737C7F] mt-0.5">{theme.title}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Linked milestones */}
          {linkedMilestones.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                Associated Milestones
              </h2>
              <div className="space-y-2">
                {linkedMilestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-white border border-[#DBE4E7] rounded"
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: PHASE_DOT[m.phase] }}
                    />
                    <div>
                      <p className="text-xs text-[#737C7F]">{m.date}</p>
                      <p className="text-sm font-medium text-[#2B3437]">{m.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Public references */}
          <section>
            <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
              Public References
            </h2>
            <div className="space-y-2">
              {inst.publicReferences.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-3 bg-white border border-[#DBE4E7] rounded hover:border-[#5E5C75] transition-colors group"
                >
                  <span className="material-symbols-outlined text-sm text-[#737C7F] mt-0.5 flex-shrink-0">
                    open_in_new
                  </span>
                  <div>
                    <p className="text-sm text-[#5E5C75] group-hover:underline">{ref.title}</p>
                    {ref.date && ref.date !== 'ongoing' && (
                      <p className="text-xs text-[#9ca3af] mt-0.5">{ref.date}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="w-52 flex-shrink-0 hidden md:block space-y-4">
          <div className="bg-white border border-[#DBE4E7] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
              Phases
            </h3>
            <div className="space-y-1.5">
              {PHASES_ORDERED.map((phase) => {
                const participated = inst.phases.includes(phase);
                return (
                  <div key={phase} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: participated ? PHASE_DOT[phase] : '#e5e7eb' }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: participated ? PHASE_META[phase].color : '#9ca3af' }}
                    >
                      {PHASE_META[phase].label}
                    </span>
                    {participated && (
                      <span className="text-[10px] text-[#9ca3af]">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/ensemble/institutions"
            className="flex items-center gap-1 text-xs text-[#5E5C75] hover:underline"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            All institutions
          </Link>
        </aside>
      </div>
    </div>
  );
}
