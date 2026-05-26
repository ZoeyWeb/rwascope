import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EnsembleData, EnsemblePhase } from '../../types/ensemble';
import {
  PHASE_META,
  PHASE_DOT,
  THEME_ACCENT,
  getDaysSinceLaunch,
} from '../../utils/ensemble';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const DISCLAIMER =
  'This tracker compiles publicly available information from HKMA press releases, official announcements, and reported media coverage. RWA-Index does not have access to non-public Ensemble or EnsembleTX data. All content is sourced; gaps reflect information not in the public domain.';

function PhaseBadge({ phase }: { phase: EnsemblePhase }) {
  const meta = PHASE_META[phase];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PHASE_DOT[phase] }} />
      {meta.label}
    </span>
  );
}

export default function EnsembleOverview() {
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
        <span className="text-[#737C7F] text-sm">Loading tracker…</span>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Failed to load data.</span>
      </div>
    );
  }

  // Stats
  const daysSince = getDaysSinceLaunch();
  const institutionCount = data.institutions.filter(
    (i) => i.type !== 'regulator'
  ).length;
  const milestoneCount = data.milestones.length;

  // Latest 3 milestones (reverse chronological)
  const sortedMilestones = [...data.milestones].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
  const latestMilestones = sortedMilestones.slice(0, 3);
  const latestMilestone = sortedMilestones[0];

  const currentPhaseMeta = PHASE_META[data.current_phase];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-1">
          Project Ensemble Public Tracker
        </h1>
        <p className="text-sm text-[#737C7F] max-w-2xl">
          Public archive of HKMA's wholesale CBDC and tokenization initiative — from sandbox to real-value pilot
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link to="/ensemble/methodology" className="text-xs text-[#5E5C75] hover:underline">
            Methodology
          </Link>
          <span className="text-[#DBE4E7]">·</span>
          <Link to="/ensemble/timeline" className="text-xs text-[#5E5C75] hover:underline">
            Full Timeline
          </Link>
          <span className="text-[#DBE4E7]">·</span>
          <span className="text-xs text-[#737C7F]">
            v{data.tracker_version} · compiled {data.last_compiled}
          </span>
        </div>
      </div>

      <DisclaimerBanner text={`${DISCLAIMER} Last updated: ${data.last_compiled}.`} className="mb-5" />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBox value={String(daysSince)} label="Days Since Launch" />
        <StatBox value={String(data.themes.length)} label="Use Case Themes" />
        <StatBox value={String(institutionCount)} label="Participating Institutions" note="public disclosures only" />
        <StatBox value={String(milestoneCount)} label="Public Milestones" />
      </div>

      {/* Block 1: Current Status */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-[#2B3437] mb-3">Current Status</h2>
        <div className="bg-white border border-[#DBE4E7] rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PhaseBadge phase={data.current_phase} />
              </div>
              <p className="text-sm text-[#2B3437] leading-relaxed">
                {data.phase_description}
              </p>
            </div>
          </div>
          {/* Latest milestone as hero */}
          {latestMilestone && (
            <div
              className="mt-4 pt-4 border-t border-[#DBE4E7] flex items-start gap-3"
            >
              <div
                className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: PHASE_DOT[latestMilestone.phase] }}
              />
              <div>
                <p className="text-xs text-[#737C7F] mb-0.5">{latestMilestone.date}</p>
                <p className="text-sm font-semibold text-[#2B3437]">{latestMilestone.title}</p>
                <p className="text-xs text-[#586064] mt-1 leading-relaxed">
                  {latestMilestone.description.slice(0, 200)}
                  {latestMilestone.description.length > 200 ? '…' : ''}
                </p>
                {latestMilestone.sources[0] && (
                  <a
                    href={latestMilestone.sources[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#5E5C75] hover:underline mt-1 inline-block"
                  >
                    Source ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Block 2: Milestone Timeline preview */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#2B3437]">Milestone Timeline</h2>
          <Link
            to="/ensemble/timeline"
            className="text-xs text-[#5E5C75] hover:underline"
          >
            View all {milestoneCount} milestones →
          </Link>
        </div>
        <div className="relative pl-5">
          {/* Vertical line */}
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-[#DBE4E7]" />
          <div className="space-y-5">
            {latestMilestones.map((m, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div
                  className="absolute -left-[13px] top-1.5 w-3 h-3 rounded-full border-2 border-white flex-shrink-0"
                  style={{ background: PHASE_DOT[m.phase] }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs text-[#737C7F]">{m.date}</span>
                    <PhaseBadge phase={m.phase} />
                  </div>
                  <p className="text-sm font-medium text-[#2B3437]">{m.title}</p>
                  <p className="text-xs text-[#586064] mt-0.5 leading-relaxed">
                    {m.description.slice(0, 160)}{m.description.length > 160 ? '…' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 3: Use Case Themes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#2B3437]">Use Case Themes</h2>
          <Link
            to="/ensemble/use-cases"
            className="text-xs text-[#5E5C75] hover:underline"
          >
            Browse use cases →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.themes.map((theme) => {
            const accent = THEME_ACCENT[theme.code] ?? '#5E5C75';
            const useCaseCount = data.use_cases.filter(
              (uc) => uc.theme === theme.code
            ).length;
            return (
              <Link
                key={theme.code}
                to={`/ensemble/use-cases?theme=${theme.code}`}
                className="bg-white border border-[#DBE4E7] rounded-lg p-4 hover:border-[#5E5C75] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: accent }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2B3437] group-hover:text-[#5E5C75] transition-colors">
                      {theme.title}
                    </p>
                    <p className="text-xs text-[#737C7F] mt-1 leading-relaxed">
                      {theme.description}
                    </p>
                    <p className="text-xs text-[#5E5C75] mt-2">
                      {useCaseCount} use case{useCaseCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom links */}
      <div className="mt-10 pt-6 border-t border-[#DBE4E7] flex flex-wrap gap-4 text-xs text-[#737C7F]">
        <Link to="/ensemble/institutions" className="text-[#5E5C75] hover:underline">
          Institutions registry →
        </Link>
        <Link to="/ensemble/timeline" className="text-[#5E5C75] hover:underline">
          Full timeline →
        </Link>
        <Link to="/ensemble/methodology" className="text-[#5E5C75] hover:underline">
          Methodology →
        </Link>
      </div>
    </div>
  );
}

function StatBox({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="bg-white border border-[#DBE4E7] rounded-lg px-4 py-3">
      <p className="text-xl font-bold text-[#2B3437] font-headline">{value}</p>
      <p className="text-xs text-[#737C7F] mt-0.5">{label}</p>
      {note && <p className="text-[10px] text-[#9ca3af] mt-0.5">{note}</p>}
    </div>
  );
}
