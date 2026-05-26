import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminUserOut } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  active:               'bg-green-100 text-green-800',
  pending_review:       'bg-yellow-100 text-yellow-800',
  pending_verification: 'bg-blue-100 text-blue-800',
  suspended:            'bg-red-100 text-red-800',
  rejected:             'bg-gray-100 text-gray-600',
  deleted:              'bg-red-200 text-red-900',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Confirm dialog
function ConfirmModal({
  title, message, confirmLabel, danger,
  onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-[#2B3437] mb-2">{title}</h3>
        <p className="text-sm text-[#737C7F] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#F1F4F6]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-semibold text-white ${
              danger ? 'bg-[#9e3f4e] hover:bg-red-700' : 'bg-[#5E5C75] hover:bg-[#4a4860]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserList() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserOut[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ action: string; userId?: string } | null>(null);
  const [toast, setToast] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = (p = page, s = search, sf = statusFilter) => {
    if (!accessToken) return;
    setLoading(true);
    adminApi.listUsers(accessToken, { search: s || undefined, status: sf || undefined, page: p, per_page: 20 })
      .then(r => { setUsers(r.users); setTotal(r.total); setPages(r.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, search, statusFilter); }, [statusFilter]); // eslint-disable-line
  useEffect(() => { load(page, search, statusFilter); }, [page]); // eslint-disable-line

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v, statusFilter); }, 400);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const action = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); showToast(msg); setSelected(new Set()); load(); }
    catch { showToast('Action failed.'); }
    setConfirm(null);
  };

  const execConfirm = () => {
    if (!confirm || !accessToken) return;
    const id = confirm.userId!;
    if (confirm.action === 'suspend')
      action(() => adminApi.suspend(accessToken, id), 'User suspended.');
    else if (confirm.action === 'unsuspend')
      action(() => adminApi.unsuspend(accessToken, id), 'User unsuspended.');
    else if (confirm.action === 'delete')
      action(() => adminApi.deleteUser(accessToken, id), 'User deleted.');
    else if (confirm.action === 'approve')
      action(() => adminApi.approve(accessToken, id), 'User approved.');
    else if (confirm.action === 'bulk-suspend')
      action(() => Promise.all([...selected].map(sid => adminApi.suspend(accessToken, sid))), `${selected.size} users suspended.`);
    else if (confirm.action === 'bulk-delete')
      action(() => Promise.all([...selected].map(sid => adminApi.deleteUser(accessToken, sid))), `${selected.size} users deleted.`);
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map(u => u.id)));
  };

  const exportCsv = () => {
    if (!accessToken) return;
    const url = adminApi.exportUrl('users') + `?token=${accessToken}`;
    // Use fetch with auth header and create blob download
    fetch(adminApi.exportUrl('users'), { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'rwa-index-users.csv';
        a.click();
      });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#2B3437]">Users</h1>
          <p className="text-sm text-[#737C7F] mt-1">{total} total users</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <>
              <button
                onClick={() => setConfirm({ action: 'bulk-suspend' })}
                className="px-3 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#EAEFF1]"
              >
                Suspend {selected.size}
              </button>
              <button
                onClick={() => setConfirm({ action: 'bulk-delete' })}
                className="px-3 py-2 text-sm rounded-lg bg-[#9e3f4e] text-white hover:bg-red-700"
              >
                Delete {selected.size}
              </button>
            </>
          )}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#EAEFF1]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737C7F]" style={{ fontSize: 16 }}>search</span>
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#DBE4E7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5E5C75]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-[#DBE4E7] rounded-lg bg-white focus:outline-none"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#DBE4E7] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F1F4F6] border-b border-[#DBE4E7]">
            <tr>
              <th className="pl-4 py-3 w-8">
                <input type="checkbox" checked={selected.size === users.length && users.length > 0}
                  onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Email</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Name</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Status</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Registered</th>
              <th className="px-4 py-3 text-left font-bold text-[#2B3437]">Last Login</th>
              <th className="px-4 py-3 text-right font-bold text-[#2B3437]">Assessments</th>
              <th className="px-4 py-3 text-center font-bold text-[#2B3437]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F4F6]">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-[#737C7F]">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-[#737C7F]">No users found.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-[#F8FAFB]">
                <td className="pl-4 py-3">
                  <input type="checkbox" checked={selected.has(u.id)}
                    onChange={() => toggleSelect(u.id)} className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#2B3437] font-medium">{u.email}</span>
                    {u.is_admin && (
                      <span className="text-[10px] bg-[#5E5C75] text-white px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#737C7F]">{u.full_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[u.status] || 'bg-gray-100 text-gray-600'}`}>
                    {u.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#737C7F]">{fmt(u.created_at)}</td>
                <td className="px-4 py-3 text-[#737C7F]">{fmt(u.last_login_at)}</td>
                <td className="px-4 py-3 text-right text-[#737C7F]">{u.assessment_count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="p-1 rounded hover:bg-[#EAEFF1] text-[#5E5C75]"
                      title="View detail"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                    </button>
                    {u.status === 'pending_review' && (
                      <button
                        onClick={() => setConfirm({ action: 'approve', userId: u.id })}
                        className="p-1 rounded hover:bg-green-50 text-green-700"
                        title="Approve"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                      </button>
                    )}
                    {u.status !== 'suspended' ? (
                      <button
                        onClick={() => setConfirm({ action: 'suspend', userId: u.id })}
                        className="p-1 rounded hover:bg-yellow-50 text-yellow-700"
                        title="Suspend"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirm({ action: 'unsuspend', userId: u.id })}
                        className="p-1 rounded hover:bg-green-50 text-green-700"
                        title="Unsuspend"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_open</span>
                      </button>
                    )}
                    <button
                      onClick={() => setConfirm({ action: 'delete', userId: u.id })}
                      className="p-1 rounded hover:bg-red-50 text-[#9e3f4e]"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
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
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#DBE4E7] disabled:opacity-40 hover:bg-[#EAEFF1]"
            >
              ← Prev
            </button>
            <button
              disabled={page === pages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#DBE4E7] disabled:opacity-40 hover:bg-[#EAEFF1]"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          title={
            confirm.action === 'delete' || confirm.action === 'bulk-delete'
              ? 'Delete User'
              : confirm.action === 'suspend' || confirm.action === 'bulk-suspend'
              ? 'Suspend User'
              : confirm.action === 'approve' ? 'Approve User'
              : 'Unsuspend User'
          }
          message={
            confirm.action === 'bulk-delete'
              ? `Delete ${selected.size} selected users? This cannot be undone.`
              : confirm.action === 'bulk-suspend'
              ? `Suspend ${selected.size} selected users?`
              : confirm.action === 'delete'
              ? 'Soft-delete this user? They will be marked as deleted.'
              : confirm.action === 'suspend'
              ? 'Suspend this user? They will not be able to log in.'
              : confirm.action === 'approve'
              ? 'Approve this user and send them an activation email?'
              : 'Restore this user\'s access?'
          }
          confirmLabel={
            confirm.action.includes('delete') ? 'Delete' :
            confirm.action.includes('suspend') ? 'Suspend' :
            confirm.action === 'approve' ? 'Approve' : 'Unsuspend'
          }
          danger={confirm.action.includes('delete') || confirm.action.includes('suspend')}
          onConfirm={execConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#2B3437] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
