import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminApi, type OverviewStats } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#5E5C75', '#2E7D32', '#e09d2b', '#9e3f4e', '#737C7F'];

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#DBE4E7] p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#737C7F] font-bold mb-1">{label}</div>
          <div className="text-3xl font-black text-[#2B3437]">{value}</div>
          {sub && <div className="text-xs text-[#737C7F] mt-1">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#EAEFF1] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#5E5C75]" style={{ fontSize: 20 }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    adminApi.stats(accessToken)
      .then(setStats)
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span>
    </div>
  );

  if (error || !stats) return (
    <div className="p-8 text-[#9e3f4e]">{error || 'No data.'}</div>
  );

  const u = stats.users;

  const pieData = [
    { name: 'Active', value: u.active },
    { name: 'Pending Review', value: u.pending_review },
    { name: 'Pending Verify', value: u.pending_verification },
    { name: 'Suspended', value: u.suspended },
    { name: 'Rejected', value: u.rejected },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">Overview</h1>
        <p className="text-sm text-[#737C7F] mt-1">Platform statistics and activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users" value={u.total} sub={`${u.new_today} new today`} icon="group" />
        <StatCard label="Active Users" value={u.active} sub={`${u.active_last_7d} active last 7d`} icon="verified_user" />
        <StatCard label="Pending Review" value={u.pending_review} sub={`${u.pending_verification} pending verify`} icon="pending_actions" />
        <StatCard label="Total Assessments" value={stats.total_assessments} icon="assignment" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[#DBE4E7] p-5">
          <div className="text-sm font-bold text-[#2B3437] mb-4">Daily Registrations (30d)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.daily_registrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Registrations']} labelFormatter={l => `Date: ${l}`} />
              <Line type="monotone" dataKey="count" stroke="#5E5C75" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#DBE4E7] p-5">
          <div className="text-sm font-bold text-[#2B3437] mb-4">Daily Assessments Created (30d)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.daily_assessments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Assessments']} labelFormatter={l => `Date: ${l}`} />
              <Line type="monotone" dataKey="count" stroke="#2E7D32" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-[#DBE4E7] p-5">
          <div className="text-sm font-bold text-[#2B3437] mb-4">User Status Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#DBE4E7] p-5 col-span-2">
          <div className="text-sm font-bold text-[#2B3437] mb-4">User Status Breakdown</div>
          <div className="space-y-2">
            {[
              { label: 'Active', value: u.active, color: '#2E7D32' },
              { label: 'Pending Review', value: u.pending_review, color: '#e09d2b' },
              { label: 'Pending Verification', value: u.pending_verification, color: '#5E5C75' },
              { label: 'Suspended', value: u.suspended, color: '#9e3f4e' },
              { label: 'Rejected', value: u.rejected, color: '#737C7F' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: row.color }} />
                <div className="flex-1 text-sm text-[#2B3437]">{row.label}</div>
                <div className="text-sm font-bold text-[#2B3437]">{row.value}</div>
                <div className="w-32 h-1.5 bg-[#EAEFF1] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${u.total ? (row.value / u.total) * 100 : 0}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
