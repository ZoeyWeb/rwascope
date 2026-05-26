import { useEffect, useRef, useState } from 'react';
import { adminApi, type AuditLogEntry } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const ACTION_COLORS: Record<string, string> = {
  'user.login':           'bg-blue-100 text-blue-800',
  'user.logout':          'bg-gray-100 text-gray-600',
  'user.register':        'bg-green-100 text-green-700',
  'admin.approve_user':   'bg-green-100 text-green-800',
  'admin.reject_user':    'bg-red-100 text-red-700',
  'admin.suspend_user':   'bg-yellow-100 text-yellow-800',
  'admin.delete_user':    'bg-red-200 text-red-900',
  'admin.make_admin':     'bg-purple-100 text-purple-800',
  'admin.reset_password': 'bg-blue-100 text-blue-700',
  'admin.export_users':   'bg-gray-100 text-gray-700',
};

export default function AdminAuditLog() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = (p = page, a = action) => {
    if (!accessToken) return;
    setLoading(true);
    adminApi.auditLog(accessToken, p, 50, a || undefined)
      .then(r => { setLogs(r.logs); setTotal(r.total); setPages(r.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, action); }, []); // eslint-disable-line
  useEffect(() => { load(page, action); }, [page]); // eslint-disable-line

  const handleAction = (v: string) => {
    setAction(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v); }, 400);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#2B3437]">Audit Log</h1>
          <p className="text-sm text-[#737C7F] mt-1">{total} total entries</p>
        </div>
        <button
          onClick={() => {
            if (!accessToken) return;
            fetch(adminApi.exportUrl('audit-log'), { headers: { Authorization: `Bearer ${accessToken}` } })
              .then(r => r.blob())
              .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'rwa-index-audit-log.csv';
                a.click();
              });
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#EAEFF1]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
          Export CSV
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737C7F]" style={{ fontSize: 16 }}>search</span>
          <input
            type="text"
            placeholder="Filter by action type…"
            value={action}
            onChange={e => handleAction(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#DBE4E7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5E5C75]/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#DBE4E7] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F1F4F6] border-b border-[#DBE4E7]">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Time</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Action</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Actor</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Target</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">IP</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F4F6]">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-[#737C7F]">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-[#737C7F]">No entries found.</td></tr>
            ) : logs.map(lg => (
              <tr key={lg.id} className="hover:bg-[#F8FAFB]">
                <td className="px-4 py-2.5 text-[#737C7F] whitespace-nowrap text-xs">{fmt(lg.timestamp)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[lg.action_type] || 'bg-gray-100 text-gray-600'}`}>
                    {lg.action_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[#737C7F] text-xs">{lg.actor_email || '(system)'}</td>
                <td className="px-4 py-2.5 text-[#737C7F] text-xs">{lg.target_email || '—'}</td>
                <td className="px-4 py-2.5 text-[#737C7F] text-xs">{lg.ip_address || '—'}</td>
                <td className="px-4 py-2.5 text-[#737C7F] text-xs max-w-[200px] truncate">
                  {lg.details ? JSON.stringify(lg.details) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-[#737C7F]">Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#DBE4E7] disabled:opacity-40 hover:bg-[#EAEFF1]">
              ← Prev
            </button>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#DBE4E7] disabled:opacity-40 hover:bg-[#EAEFF1]">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
