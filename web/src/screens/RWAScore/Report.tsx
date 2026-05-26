/**
 * Due Diligence Report — user's private RARM assessment record.
 *
 * Shows the user's own finalized scores, evidence notes, and the AI-generated
 * checklist used during the review process.
 *
 * COMPLIANCE: This report belongs to the user and is stored privately. It is NOT
 * published, broadcast, or shown to other users. It does NOT constitute a credit
 * rating, investment recommendation, or platform endorsement of any protocol.
 * The "RARM Score" is the user's own framework calculation — not a platform rating.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi, type AssessmentOut } from '../../api/client';

const LAYER_NAMES: Record<string, string> = {
  '1': 'Legal & Regulatory',
  '2': 'Valuation & Transparency',
  '3': 'Custody & Security',
  '4': 'KYC / Counterparty',
  '5': 'Liquidity & Market',
  '6': 'Settlement & Ops',
};

const SCORE_COLORS: Record<number, string> = {
  0: 'text-slate-500',
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-blue-400',
  5: 'text-emerald-400',
};

function rarmColor(score: number | null): string {
  if (score === null) return '#737C7F';
  if (score >= 7) return '#4ade80';
  if (score >= 5) return '#facc15';
  if (score >= 3) return '#fb923c';
  return '#f87171';
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<AssessmentOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    assessmentApi
      .get(accessToken, id)
      .then(setAssessment)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

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
      <div className="p-8 text-slate-400">
        {error || 'Report not available.'}
        <button
          onClick={() => navigate('/score/history')}
          className="ml-2 text-[#5E5C75] underline"
        >
          Go to History
        </button>
      </div>
    );
  }

  // Compute layer averages from final (or user) scores
  const layerScores: Record<number, number[]> = {};
  assessment.sub_scores.forEach((s) => {
    const score = s.final_score ?? s.user_score;
    (layerScores[s.layer_number] ??= []).push(score);
  });

  const authorName = user?.full_name || user?.email || 'Registered User';
  const reportDate = new Date(assessment.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownloadPDF = useCallback(async () => {
    if (!assessment) return;
    setPdfLoading(true);
    try {
      const { generateAssessmentPDF } = await import('../../components/AssessmentPDF/index');
      await generateAssessmentPDF(assessment, authorName);
    } catch {
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, [assessment, authorName]);

  const handleDownloadJSON = useCallback(async () => {
    if (!accessToken || !id) return;
    setJsonLoading(true);
    try {
      const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
      const res = await fetch(`${BASE}/assessments/${id}/json`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = assessment!.protocol_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      a.download = `rwa-dd-${safeName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('JSON export failed. Please try again.');
    } finally {
      setJsonLoading(false);
    }
  }, [accessToken, id, assessment]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-label uppercase tracking-wider">
        <button onClick={() => navigate('/score/history')} className="hover:text-white">
          History
        </button>
        <span>/</span>
        <span className="text-primary">Report — {assessment.protocol_name}</span>
      </div>

      {/* ── Report header ── */}
      <div
        className="rounded-lg p-6 mb-8 border"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #0F1117 100%)',
          borderColor: rarmColor(assessment.rarm_score) + '40',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Due Diligence Report
            </div>
            <h1 className="text-2xl font-bold text-white font-headline">
              {assessment.protocol_name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {assessment.asset_class.replace(/_/g, ' ')}
              {assessment.chains ? ` · ${assessment.chains}` : ''}
            </p>

            {/* Attribution */}
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">person</span>
              Prepared by{' '}
              <span className="text-slate-300 font-semibold">{authorName}</span>
              <span className="text-slate-600">·</span>
              {reportDate}
            </div>
          </div>

          {/* RARM Score */}
          <div className="text-right shrink-0">
            {assessment.rarm_score !== null ? (
              <>
                <div
                  className="text-4xl font-bold font-headline"
                  style={{ color: rarmColor(assessment.rarm_score) }}
                >
                  {assessment.rarm_score.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                  RARM Score
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  User's own calculation · Private
                </div>
              </>
            ) : (
              <div className="text-slate-600 text-sm">Score pending</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Layer score summary ── */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Layer Summary
        </h2>
        <div className="space-y-3">
          {Object.entries(layerScores)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([lNum, scores]) => {
              const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
              const pct = (avg / 5) * 100;
              return (
                <div
                  key={lNum}
                  className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#5E5C75]">L{lNum}</span>
                      <span className="text-sm font-semibold text-white">
                        {LAYER_NAMES[lNum]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-[#2B3437] rounded">
                        <div
                          className="h-1.5 rounded transition-all"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 70 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171',
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-300 w-8 text-right">
                        {avg.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Sub-indicators */}
                  <div className="mt-2 space-y-1.5">
                    {assessment.sub_scores
                      .filter((s) => s.layer_number === Number(lNum))
                      .map((s) => {
                        const score = s.final_score ?? s.user_score;
                        return (
                          <div key={s.indicator_key} className="flex gap-3 items-start">
                            <span
                              className={`text-xs font-bold w-5 shrink-0 pt-0.5 ${SCORE_COLORS[score]}`}
                            >
                              {score}
                            </span>
                            <div className="flex-1">
                              <div className="text-xs text-slate-400">{s.indicator_label}</div>
                              {s.rationale && (
                                <div className="text-[10px] text-slate-600 mt-0.5 italic">
                                  {s.rationale}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ── AI checklist summary (collapsible context) ── */}
      {assessment.ai_checklist && (
        <section className="mb-6 bg-[#1A1A2E] border border-[#2B3437] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#5E5C75]">checklist</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Due Diligence Checklist Used
            </span>
            <span className="ml-auto text-[10px] text-slate-600">
              {assessment.ai_checklist.model_used}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {assessment.ai_checklist.overall_notes}
          </p>
          {assessment.ai_checklist.suggested_public_sources.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Sources consulted
              </div>
              <ul className="grid md:grid-cols-2 gap-1">
                {assessment.ai_checklist.suggested_public_sources.map((src, i) => (
                  <li key={i} className="text-[10px] text-slate-500 flex gap-1.5">
                    <span className="text-[#5E5C75] shrink-0">•</span>
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── RARM methodology note ── */}
      <section className="mb-6 bg-[#1A1A2E] border border-[#2B3437]/50 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-slate-500">info</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            About the RARM Framework
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The RARM (RWA Asset Risk Matrix) is a six-layer structured due diligence methodology
          for tokenized real-world asset protocols. The RARM Score shown above (0–10) is computed
          from the user's own sub-indicator scores using the layer weightings for the selected
          asset class. It is a private analytical tool — not a credit rating, investment grade,
          or public assessment published by RWA-Index.
        </p>
      </section>

      {/* ── Footer actions ── */}
      <div className="flex flex-wrap gap-3 justify-between items-center mt-8">
        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 hover:text-white border border-[#2B3437] hover:border-[#5E5C75] rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="material-symbols-outlined text-base">
              {pdfLoading ? 'progress_activity' : 'picture_as_pdf'}
            </span>
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </button>
          <button
            onClick={handleDownloadJSON}
            disabled={jsonLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 hover:text-white border border-[#2B3437] hover:border-[#5E5C75] rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="material-symbols-outlined text-base">
              {jsonLoading ? 'progress_activity' : 'data_object'}
            </span>
            {jsonLoading ? 'Exporting…' : 'Export JSON'}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/score/history')}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-[#2B3437] rounded transition-colors"
          >
            View History
          </button>
          <button
            onClick={() => navigate('/score')}
            className="flex items-center gap-2 px-5 py-2 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold rounded transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            New Workbook
          </button>
        </div>
      </div>

      {/* ── Legal disclaimer ── */}
      <div className="mt-8 p-4 border border-[#2B3437]/50 bg-[#0F1117] rounded text-[10px] text-slate-600 leading-relaxed space-y-1">
        <p>
          <strong className="text-slate-500">Disclaimer:</strong> This document is a private
          due diligence workbook prepared by the user named above using the RARM academic
          methodology framework provided by RWA-Index. It does not constitute a credit rating,
          investment advice, or any regulated financial service.
        </p>
        <p>
          RWA-Index does not endorse, verify, or publish this assessment. All opinions and
          scores herein are the sole responsibility of the author. Past analysis does not
          guarantee future accuracy. This document is for internal research purposes only.
        </p>
      </div>
    </div>
  );
}
