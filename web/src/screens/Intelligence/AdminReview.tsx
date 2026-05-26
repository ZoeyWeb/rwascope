import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  intelligenceAdminApi,
  type IntelligenceDBItem,
  type IntelligenceItemUpdatePayload,
} from '../../api/client';

// ── Inline edit form ──────────────────────────────────────────────────────────

const REGIONS = ['us', 'eu', 'hk', 'sg', 'uae', 'global'];
const EVENT_TYPES = ['regulation', 'institutional', 'project', 'research', 'data_milestone'];
const SIGNIFICANCE_OPTS = ['landmark', 'major', 'notable'];
const CATEGORIES = ['global_policy', 'hk_observation', 'narrative'];

function EditForm({
  item,
  token,
  onSave,
  onCancel,
}: {
  item: IntelligenceDBItem;
  token: string;
  onSave: (updated: IntelligenceDBItem) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<IntelligenceItemUpdatePayload>({
    title: item.title,
    policy_summary: item.policy_summary ?? '',
    event_date: item.event_date ?? '',
    category: item.category ?? 'global_policy',
    region: item.region ?? 'global',
    significance: item.significance ?? 'notable',
    event_type: item.event_type,
    rwa_relevant: item.rwa_relevant,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      const updated = await intelligenceAdminApi.update(token, item.id, draft);
      onSave(updated);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, children: React.ReactNode) {
    return (
      <div>
        <label className="block text-[11px] font-medium text-[#737C7F] mb-1">{label}</label>
        {children}
      </div>
    );
  }

  const inputCls =
    'w-full bg-[#F1F4F6] border border-[#DBE4E7] rounded px-2 py-1.5 text-sm text-[#2B3437] focus:outline-none focus:border-[#5E5C75]';

  const selectCls =
    'bg-[#F1F4F6] border border-[#DBE4E7] rounded px-2 py-1.5 text-sm text-[#2B3437] focus:outline-none focus:border-[#5E5C75]';

  return (
    <div className="mt-3 p-4 bg-[#F1F4F6] rounded-lg border border-[#DBE4E7] space-y-3">
      {field(
        'Title',
        <input
          className={inputCls}
          value={draft.title ?? ''}
          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
        />,
      )}

      {field(
        'Policy summary',
        <textarea
          className={`${inputCls} resize-y`}
          rows={4}
          value={draft.policy_summary ?? ''}
          onChange={e => setDraft(d => ({ ...d, policy_summary: e.target.value }))}
        />,
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {field(
          'Region',
          <select
            className={selectCls}
            value={draft.region ?? ''}
            onChange={e => setDraft(d => ({ ...d, region: e.target.value }))}
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>,
        )}

        {field(
          'Event type',
          <select
            className={selectCls}
            value={draft.event_type ?? ''}
            onChange={e => setDraft(d => ({ ...d, event_type: e.target.value }))}
          >
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>,
        )}

        {field(
          'Significance',
          <select
            className={selectCls}
            value={draft.significance ?? ''}
            onChange={e => setDraft(d => ({ ...d, significance: e.target.value }))}
          >
            <option value="">—</option>
            {SIGNIFICANCE_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>,
        )}

        {field(
          'Category',
          <select
            className={selectCls}
            value={draft.category ?? ''}
            onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>,
        )}
      </div>

      {field(
        'Event date',
        <input
          type="date"
          className={`${inputCls} w-40`}
          value={draft.event_date ?? ''}
          onChange={e => setDraft(d => ({ ...d, event_date: e.target.value }))}
        />,
      )}

      <div className="flex items-center gap-2">
        <input
          id={`rwa-${item.id}`}
          type="checkbox"
          checked={draft.rwa_relevant ?? true}
          onChange={e => setDraft(d => ({ ...d, rwa_relevant: e.target.checked }))}
          className="accent-[#5E5C75]"
        />
        <label htmlFor={`rwa-${item.id}`} className="text-sm text-[#2B3437]">RWA relevant</label>
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-[#5E5C75] hover:bg-[#4e4c65] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-[#DBE4E7] text-xs text-[#737C7F] rounded hover:bg-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  token,
  onUpdate,
}: {
  item: IntelligenceDBItem;
  token: string;
  onUpdate: (updated: IntelligenceDBItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [actioning, setActioning] = useState<'approve' | 'reject' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleApprove() {
    setActioning('approve');
    setErr(null);
    try {
      const updated = await intelligenceAdminApi.approve(token, item.id);
      onUpdate(updated);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed');
      setActioning(null);
    }
  }

  async function handleReject() {
    setActioning('reject');
    setErr(null);
    try {
      const updated = await intelligenceAdminApi.reject(token, item.id);
      onUpdate(updated);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed');
      setActioning(null);
    }
  }

  const sigColor: Record<string, string> = {
    landmark: '#854F0B',
    major: '#2B3437',
    notable: '#737C7F',
  };

  return (
    <div className="border border-[#DBE4E7] rounded-xl bg-white p-4">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {item.region && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F1F4F6] text-[#737C7F]">
                {item.region.toUpperCase()}
              </span>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EEEDFE] text-[#5B21B6]">
              {item.event_type}
            </span>
            {item.significance && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-[#F1F4F6]"
                style={{ color: sigColor[item.significance] ?? '#737C7F' }}
              >
                {item.significance}
              </span>
            )}
            <span className="text-[11px] text-[#737C7F] font-mono">{item.event_date ?? '—'}</span>
          </div>

          <p className="text-sm font-medium text-[#2B3437] leading-snug mb-1">{item.title}</p>

          {item.policy_summary && (
            <p className="text-xs text-[#737C7F] leading-relaxed line-clamp-3">{item.policy_summary}</p>
          )}

          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#5E5C75] hover:underline mt-1"
            >
              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              {item.source_url.length > 60 ? item.source_url.slice(0, 60) + '…' : item.source_url}
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApprove}
            disabled={!!actioning}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#E1F5EE] text-[#085041] hover:bg-[#c8ede0] transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {actioning === 'approve' ? 'Approving…' : 'Approve'}
          </button>

          <button
            onClick={() => setEditing(e => !e)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBE4E7] text-[#2B3437] hover:bg-[#F1F4F6] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Edit
          </button>

          <button
            onClick={handleReject}
            disabled={!!actioning}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FEF2F2] text-[#9e3f4e] hover:bg-[#fde8ea] transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            {actioning === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>

      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}

      {/* Edit form */}
      {editing && (
        <EditForm
          item={item}
          token={token}
          onSave={updated => {
            onUpdate(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IntelligenceAdminReview() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<IntelligenceDBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    if (user && !user.is_admin) {
      setLoading(false);
      return;
    }
    if (!user) return; // still loading auth

    intelligenceAdminApi
      .listPending(accessToken)
      .then(setItems)
      .catch(e => setErr(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [accessToken, user, navigate]);

  function handleUpdate(updated: IntelligenceDBItem) {
    // Remove from list when actioned (status changed away from pending)
    if (updated.status !== 'pending') {
      setItems(prev => prev.filter(i => i.id !== updated.id));
    } else {
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">progress_activity</span>
      </div>
    );
  }

  if (user && !user.is_admin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-[#9e3f4e] mb-3 block">lock</span>
        <p className="text-sm text-[#2B3437]">Administrator access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-[10px] font-bold text-[#737C7F] uppercase tracking-widest mb-1">
          Intelligence · Admin
        </div>
        <h1 className="text-xl font-medium text-[#2B3437] mb-1">Review Queue</h1>
        <p className="text-xs text-[#737C7F]">
          {items.length} pending item{items.length !== 1 ? 's' : ''}
          {' · '}Approve to publish, or reject to discard.
        </p>
      </div>

      {err && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {err}
        </div>
      )}

      {items.length === 0 && !err ? (
        <div className="text-center py-20 text-[#737C7F]">
          <span className="material-symbols-outlined text-4xl block mb-2">done_all</span>
          <p className="text-sm">No pending items. Queue is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              token={accessToken!}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
