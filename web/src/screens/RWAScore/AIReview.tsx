/**
 * Due Diligence Checklist screen.
 *
 * Shows the AI-generated checklist (verification questions, public data sources,
 * red flags to consider) layered on top of the user's preliminary scores.
 * The user reviews the checklist, adjusts their own scores, adds evidence notes,
 * then confirms and saves their final assessment.
 *
 * COMPLIANCE: This screen displays NO AI-generated numeric scores. The AI output
 * is a structured research checklist only. All scoring is the user's own judgment.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  assessmentApi,
  type AssessmentOut,
  type SubScoreOut,
  type ChecklistLayer,
} from '../../api/client';

const SCORE_LABELS: Record<number, string> = {
  0: 'N/A',
  1: 'Critical',
  2: 'Poor',
  3: 'Adequate',
  4: 'Good',
  5: 'Excellent',
};

const SCORE_COLORS: Record<number, string> = {
  0: 'text-slate-500',
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-blue-400',
  5: 'text-emerald-400',
};

const LAYER_NAMES: Record<number, string> = {
  1: 'Legal & Regulatory',
  2: 'Valuation & Transparency',
  3: 'Custody & Security',
  4: 'KYC / Counterparty',
  5: 'Liquidity & Market',
  6: 'Settlement & Ops',
};

export default function AIReview() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<AssessmentOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');

  // User's adjustable final scores and evidence notes
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [finalRationale, setFinalRationale] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accessToken || !id) return;
    loadAssessment();
  }, [accessToken, id]);

  async function loadAssessment() {
    try {
      const data = await assessmentApi.get(accessToken!, id!);
      setAssessment(data);
      initState(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }

  function initState(data: AssessmentOut) {
    const scores: Record<string, number> = {};
    const notes: Record<string, string> = {};
    data.sub_scores.forEach((s) => {
      scores[s.indicator_key] = s.final_score ?? s.user_score;
      notes[s.indicator_key] = s.rationale ?? '';
    });
    setFinalScores(scores);
    setFinalRationale(notes);
  }

  async function generateChecklist() {
    if (!accessToken || !id) return;
    setGenerating(true);
    setError('');
    try {
      const data = await assessmentApi.analyze(accessToken, id);
      setAssessment(data);
      initState(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checklist generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleFinalize() {
    if (!accessToken || !id) return;
    setFinalizing(true);
    setError('');
    try {
      await assessmentApi.finalize(accessToken, id, finalScores, finalRationale);
      navigate(`/score/report/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Finalization failed');
      setFinalizing(false);
    }
  }

  // Group sub-scores by layer
  const grouped: Record<number, SubScoreOut[]> = {};
  assessment?.sub_scores.forEach((s) => {
    (grouped[s.layer_number] ??= []).push(s);
  });

  // Index checklist by layer number for O(1) lookup
  const checklistByLayer: Record<number, ChecklistLayer> = {};
  assessment?.ai_checklist?.checklist.forEach((cl) => {
    checklistByLayer[cl.layer_number] = cl;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8 text-red-400">
        Assessment not found.{' '}
        <button onClick={() => navigate('/score')} className="underline">
          Go back
        </button>
      </div>
    );
  }

  const hasChecklist = !!assessment.ai_checklist;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-label uppercase tracking-wider">
        <button
          onClick={() => navigate('/score/history')}
          className="hover:text-white transition-colors"
        >
          History
        </button>
        <span>/</span>
        <span className="text-primary">Due Diligence — {assessment.protocol_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-headline">
            {assessment.protocol_name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {assessment.asset_class.replace(/_/g, ' ')} ·{' '}
            <span
              className={`font-semibold ${
                assessment.status === 'finalized' ? 'text-emerald-400' : 'text-[#5E5C75]'
              }`}
            >
              {assessment.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </p>
        </div>
        {assessment.rarm_score !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[#5E5C75] font-headline">
              {assessment.rarm_score.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
              Your RARM Score
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-4">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* ── Generate checklist CTA (shown when no checklist yet) ── */}
      {!hasChecklist && (
        <div className="bg-[#1A1A2E] border border-[#5E5C75]/30 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-white font-semibold mb-1">
                Generate Your Due Diligence Checklist
              </div>
              <div className="text-sm text-slate-400 leading-relaxed max-w-lg">
                Our AI research assistant (DeepSeek) will generate a set of verification
                questions, publicly available data sources, and common red flags to consider
                for each of the six RARM layers. Use it to strengthen your own analysis
                before finalising your scores.
              </div>
              <div className="text-xs text-slate-600 mt-2">
                Takes approx. 15–30 seconds · No numeric scores are generated
              </div>
            </div>
            <button
              onClick={generateChecklist}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#5E5C75] hover:bg-[#4E4C65] disabled:opacity-50 text-white text-sm font-bold rounded transition-colors whitespace-nowrap shrink-0"
            >
              {generating ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                  Generating…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">checklist</span>
                  Generate Checklist
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Overall research guidance ── */}
      {hasChecklist && assessment.ai_checklist && (
        <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#5E5C75]">info</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Research Guidance
            </span>
            <span className="ml-auto text-[10px] text-slate-600">
              {assessment.ai_checklist.model_used} ·{' '}
              {new Date(assessment.ai_checklist.created_at).toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {assessment.ai_checklist.overall_notes}
          </p>

          {assessment.ai_checklist.suggested_public_sources.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Suggested Public Sources for This Protocol
              </div>
              <ul className="grid md:grid-cols-2 gap-1">
                {assessment.ai_checklist.suggested_public_sources.map((src, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-xs text-[#5E5C75] shrink-0 mt-0.5">
                      link
                    </span>
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 p-2 bg-blue-500/5 border border-blue-500/10 rounded text-[10px] text-blue-400/70">
            This checklist is a research aid. Review each item, then use the score controls below
            to record your own informed judgment. The AI does not score or rate protocols.
          </div>
        </div>
      )}

      {/* ── Layer-by-layer: checklist + score adjustment ── */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([layerNum, subs]) => {
            const lNum = Number(layerNum);
            const cl = checklistByLayer[lNum];
            return (
              <div
                key={layerNum}
                className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg overflow-hidden"
              >
                {/* Layer header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2B3437] bg-[#0F1117]">
                  <span className="text-xs font-bold text-[#5E5C75] uppercase tracking-wider">
                    L{lNum}
                  </span>
                  <span className="text-sm font-semibold text-white">{LAYER_NAMES[lNum]}</span>
                </div>

                {/* AI checklist for this layer */}
                {cl && (
                  <div className="px-5 py-4 border-b border-[#2B3437] grid md:grid-cols-3 gap-5">
                    {/* Questions to verify */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-sm text-blue-400">
                          help_outline
                        </span>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          Verify
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {cl.questions_to_verify.map((q, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 leading-relaxed flex gap-1.5"
                          >
                            <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Public data sources */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-sm text-emerald-400">
                          database
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Sources
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {cl.public_data_sources.map((src, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 leading-relaxed flex gap-1.5"
                          >
                            <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                            {src}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Red flags */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-sm text-yellow-400">
                          flag
                        </span>
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                          Red Flags
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {cl.red_flags_to_consider.map((flag, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 leading-relaxed flex gap-1.5"
                          >
                            <span className="text-yellow-400 shrink-0 mt-0.5">•</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Sub-indicators: score adjustment + evidence */}
                <div className="divide-y divide-[#2B3437]">
                  {subs.map((sub) => {
                    const finalVal = finalScores[sub.indicator_key];
                    const note = finalRationale[sub.indicator_key] ?? '';
                    return (
                      <div key={sub.indicator_key} className="px-5 py-4 space-y-2">
                        {/* Indicator header */}
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {sub.indicator_label}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              Initial score: {sub.user_score}/5
                            </div>
                          </div>
                          {finalVal !== undefined && (
                            <div className={`text-right shrink-0 ${SCORE_COLORS[finalVal]}`}>
                              <div className="text-xl font-bold font-headline">{finalVal}</div>
                              <div className="text-[10px]">{SCORE_LABELS[finalVal]}</div>
                            </div>
                          )}
                        </div>

                        {/* Final score buttons */}
                        <div className="flex gap-1">
                          <span className="text-[10px] text-slate-600 uppercase tracking-wider w-12 pt-1.5 shrink-0">
                            Final
                          </span>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() =>
                                setFinalScores((prev) => ({
                                  ...prev,
                                  [sub.indicator_key]: n,
                                }))
                              }
                              className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
                                finalVal === n
                                  ? 'bg-[#5E5C75] text-white'
                                  : 'bg-[#0F1117] text-slate-400 hover:bg-[#2B3437] hover:text-white'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>

                        {/* Evidence / rationale text */}
                        <textarea
                          value={note}
                          onChange={(e) =>
                            setFinalRationale((prev) => ({
                              ...prev,
                              [sub.indicator_key]: e.target.value,
                            }))
                          }
                          placeholder="Evidence / rationale for your final score (optional)…"
                          rows={2}
                          className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-[#5E5C75] resize-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* ── Action bar ── */}
      {hasChecklist && (
        <div className="flex gap-3 mt-8 justify-end">
          <button
            onClick={() => navigate('/score/history')}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-[#2B3437] rounded transition-colors"
          >
            Save & Exit
          </button>
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="flex items-center gap-2 px-5 py-2 bg-[#5E5C75] hover:bg-[#4E4C65] disabled:opacity-50 text-white text-sm font-bold rounded transition-colors"
          >
            {finalizing ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check_circle</span>
                Confirm & Save Report
              </>
            )}
          </button>
        </div>
      )}

      {/* Compliance reminder */}
      <div className="mt-8 p-3 border border-[#2B3437] bg-[#0F1117] rounded text-[10px] text-slate-600 text-center leading-relaxed">
        All scores and assessments reflect your own professional judgment. RWA-Index does not
        provide credit ratings, investment advice, or any service requiring regulatory
        authorization. This tool is provided for academic and research purposes only.
      </div>
    </div>
  );
}
