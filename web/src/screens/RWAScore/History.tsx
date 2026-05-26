/**
 * Assessment history screen: list of past due diligence workbooks.
 * Shows private RARM scores (user's own, never published) and status.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi, type AssessmentListItem } from '../../api/client';

const STATUS_STYLES: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  checklist_generated: 'text-[#5E5C75] bg-[#5E5C75]/10 border-[#5E5C75]/20',
  finalized: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  checklist_generated: 'Checklist Ready',
  finalized: 'Finalized',
};

function rarmScoreColor(score: number | null): string {
  if (score === null) return '#737C7F';
  if (score >= 7) return '#4ade80';
  if (score >= 5) return '#facc15';
  if (score >= 3) return '#fb923c';
  return '#f87171';
}

export default function History() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login', { state: { from: '/score/history' } });
      return;
    }
    load();
  }, [accessToken]);

  async function load() {
    try {
      const data = await assessmentApi.list(accessToken!);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this workbook? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await assessmentApi.remove(accessToken!, id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  function openAssessment(item: AssessmentListItem) {
    if (item.status === 'finalized') {
      navigate(`/score/report/${item.id}`);
    } else {
      navigate(`/score/review/${item.id}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-label uppercase tracking-wider">
        <span>Due Diligence</span>
        <span>/</span>
        <span className="text-primary">My Workbooks</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white font-headline">My Due Diligence Workbooks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Private — only visible to you
          </p>
        </div>
        <button
          onClick={() => navigate('/score')}
          className="flex items-center gap-2 px-4 py-2 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold rounded transition-colors"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Workbook
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
            progress_activity
          </span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">
            receipt_long
          </span>
          <p className="text-slate-400">No workbooks yet.</p>
          <button
            onClick={() => navigate('/score')}
            className="mt-4 text-[#5E5C75] hover:text-white text-sm underline transition-colors"
          >
            Start your first due diligence workbook →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg p-4 flex items-center gap-4 hover:border-[#5E5C75]/40 transition-colors group"
            >
              {/* RARM Score (user's own — private) */}
              <div className="w-16 text-center shrink-0">
                <div
                  className="text-2xl font-bold font-headline"
                  style={{ color: rarmScoreColor(item.rarm_score) }}
                >
                  {item.rarm_score?.toFixed(1) ?? '—'}
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider leading-tight">
                  RARM
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {item.protocol_name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {item.asset_class.replace(/_/g, ' ')} ·{' '}
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Status badge */}
              <div
                className={`text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider shrink-0 ${
                  STATUS_STYLES[item.status] ?? STATUS_STYLES.draft
                }`}
              >
                {STATUS_LABELS[item.status] ?? item.status.replace(/_/g, ' ')}
              </div>

              {/* Hover actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openAssessment(item)}
                  className="p-1.5 rounded hover:bg-[#2B3437] text-slate-400 hover:text-white transition-colors"
                  title={item.status === 'finalized' ? 'View Report' : 'Continue Review'}
                >
                  <span className="material-symbols-outlined text-base">
                    {item.status === 'finalized' ? 'description' : 'edit'}
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-base">
                    {deleting === item.id ? 'progress_activity' : 'delete'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 text-[10px] text-slate-700 text-center">
        Your assessments are private and stored only for your own use. RWA-Index does not
        publish, aggregate, or derive ratings from user workbooks.
      </div>
    </div>
  );
}
