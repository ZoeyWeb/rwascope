import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminUserDetail } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  active:               'bg-green-100 text-green-800',
  pending_review:       'bg-yellow-100 text-yellow-800',
  pending_verification: 'bg-blue-100 text-blue-800',
  suspended:            'bg-red-100 text-red-800',
  rejected:             'bg-gray-100 text-gray-600',
};

function InfoRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  return (
    <div className="flex gap-3 py-2 border-b border-[#F1F4F6] last:border-0">
      <dt className="w-44 shrink-0 text-xs text-[#737C7F] font-medium uppercase tracking-wide pt-0.5">{label}</dt>
      <dd className="text-sm text-[#2B3437]">{value === null || value === undefined ? '—' : String(value)}</dd>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-[#2B3437] mb-2">{title}</h3>
        <p className="text-sm text-[#737C7F] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#F1F4F6]">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded-lg font-semibold text-white ${danger ? 'bg-[#9e3f4e] hover:bg-red-700' : 'bg-[#5E5C75] hover:bg-[#4a4860]'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = () => {
    if (!accessToken || !id) return;
    adminApi.getUser(accessToken, id)
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [accessToken, id]); // eslint-disable-line

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const doAction = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); showToast(msg); load(); } catch { showToast('Action failed.'); }
    setConfirm(null);
  };

  const execConfirm = () => {
    if (!confirm || !accessToken || !id) return;
    if (confirm === 'suspend') doAction(() => adminApi.suspend(accessToken, id), 'User suspended.');
    else if (confirm === 'unsuspend') doAction(() => adminApi.unsuspend(accessToken, id), 'User unsuspended.');
    else if (confirm === 'delete') doAction(() => adminApi.deleteUser(accessToken, id).then(() => navigate('/admin/users')), 'User deleted.');
    else if (confirm === 'reset-password') doAction(() => adminApi.resetPassword(accessToken, id), 'Password reset email sent.');
    else if (confirm === 'make-admin') doAction(() => adminApi.makeAdmin(accessToken, id), 'User is now an admin.');
    else if (confirm === 'approve') doAction(() => adminApi.approve(accessToken, id), 'User approved.');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span></div>;
  if (!user) return <div className="p-8 text-[#9e3f4e]">User not found.</div>;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/admin/users')} className="flex items-center gap-1 text-xs text-[#737C7F] hover:text-[#2B3437] mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span> Users
          </button>
          <h1 className="text-2xl font-black text-[#2B3437]">{user.full_name || user.email}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}>
              {user.status.replace(/_/g, ' ')}
            </span>
            {user.is_admin && <span className="text-xs bg-[#5E5C75] text-white px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap justify-end">
          {user.status === 'pending_review' && (
            <button onClick={() => setConfirm('approve')} className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">
              Approve
            </button>
          )}
          <button onClick={() => setConfirm('reset-password')} className="px-3 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#EAEFF1]">
            Reset Password
          </button>
          {!user.is_admin && user.status === 'active' && (
            <button onClick={() => setConfirm('make-admin')} className="px-3 py-2 text-sm rounded-lg border border-[#DBE4E7] text-[#737C7F] hover:bg-[#EAEFF1]">
              Make Admin
            </button>
          )}
          {user.status !== 'suspended' ? (
            <button onClick={() => setConfirm('suspend')} className="px-3 py-2 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600">
              Suspend
            </button>
          ) : (
            <button onClick={() => setConfirm('unsuspend')} className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">
              Unsuspend
            </button>
          )}
          <button onClick={() => setConfirm('delete')} className="px-3 py-2 text-sm rounded-lg bg-[#9e3f4e] text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-[#DBE4E7] p-6">
          <h2 className="text-sm font-bold text-[#2B3437] mb-4 uppercase tracking-widest">Account Info</h2>
          <dl>
            <InfoRow label="ID" value={user.id} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Full Name" value={user.full_name} />
            <InfoRow label="Organization" value={user.organization} />
            <InfoRow label="Use Case" value={user.use_case} />
            <InfoRow label="Registration IP" value={user.registration_ip} />
            <InfoRow label="Terms Version" value={user.terms_version} />
            <InfoRow label="Auto Approved" value={user.auto_approved ? 'Yes' : 'No'} />
            <InfoRow label="Registered" value={fmt(user.created_at)} />
            <InfoRow label="Email Verified" value={fmt(user.email_verified_at)} />
            <InfoRow label="Last Login" value={fmt(user.last_login_at)} />
            <InfoRow label="Reviewed At" value={fmt(user.reviewed_at)} />
            {user.rejection_reason && <InfoRow label="Rejection Reason" value={user.rejection_reason} />}
          </dl>
        </div>

        {/* Assessments — metadata only */}
        <div className="bg-white rounded-xl border border-[#DBE4E7] p-6">
          <h2 className="text-sm font-bold text-[#2B3437] mb-4 uppercase tracking-widest">
            Assessments ({user.assessment_count})
          </h2>
          <p className="text-xs text-[#737C7F] mb-3 italic">Metadata only — assessment content is private.</p>
          {user.assessments.length === 0 ? (
            <p className="text-sm text-[#737C7F]">No assessments.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F4F6]">
                  <th className="text-left py-2 text-xs text-[#737C7F] font-bold uppercase">Protocol</th>
                  <th className="text-left py-2 text-xs text-[#737C7F] font-bold uppercase">Asset Class</th>
                  <th className="text-left py-2 text-xs text-[#737C7F] font-bold uppercase">Status</th>
                  <th className="text-left py-2 text-xs text-[#737C7F] font-bold uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F6]">
                {user.assessments.map(a => (
                  <tr key={a.id}>
                    <td className="py-2 text-[#2B3437] font-medium">{a.protocol_name}</td>
                    <td className="py-2 text-[#737C7F]">{a.asset_class}</td>
                    <td className="py-2">
                      <span className="text-xs bg-[#F1F4F6] text-[#737C7F] px-2 py-0.5 rounded">{a.status}</span>
                    </td>
                    <td className="py-2 text-[#737C7F]">{fmt(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Login history */}
        <div className="bg-white rounded-xl border border-[#DBE4E7] p-6">
          <h2 className="text-sm font-bold text-[#2B3437] mb-4 uppercase tracking-widest">Recent Logins</h2>
          {user.recent_logins.length === 0 ? (
            <p className="text-sm text-[#737C7F]">No login history.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F4F6]">
                  <th className="text-left py-2 text-xs text-[#737C7F] font-bold uppercase">Time</th>
                  <th className="text-left py-2 text-xs text-[#737C7F] font-bold uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F6]">
                {user.recent_logins.map(lg => (
                  <tr key={lg.id}>
                    <td className="py-2 text-[#2B3437]">{fmt(lg.timestamp)}</td>
                    <td className="py-2 text-[#737C7F]">{lg.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={
            confirm === 'delete' ? 'Delete User' :
            confirm === 'suspend' ? 'Suspend User' :
            confirm === 'make-admin' ? 'Grant Admin Access' :
            confirm === 'reset-password' ? 'Reset Password' :
            confirm === 'approve' ? 'Approve User' : 'Unsuspend User'
          }
          message={
            confirm === 'delete' ? 'Soft-delete this user? They will lose all access.' :
            confirm === 'suspend' ? 'Suspend this user? They cannot log in while suspended.' :
            confirm === 'make-admin' ? `Grant admin access to ${user.email}? This allows full admin console access.` :
            confirm === 'reset-password' ? `Send a password reset email to ${user.email}?` :
            confirm === 'approve' ? `Approve ${user.email} and send activation email?` :
            'Restore this user\'s access?'
          }
          confirmLabel={
            confirm === 'delete' ? 'Delete' : confirm === 'suspend' ? 'Suspend' :
            confirm === 'make-admin' ? 'Grant Access' : confirm === 'reset-password' ? 'Send Email' :
            confirm === 'approve' ? 'Approve' : 'Unsuspend'
          }
          danger={confirm === 'delete' || confirm === 'suspend'}
          onConfirm={execConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#2B3437] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
