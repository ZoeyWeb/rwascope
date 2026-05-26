import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { adminApi, type AssessmentStats } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#5E5C75', '#2E7D32', '#e09d2b', '#9e3f4e', '#737C7F', '#2B3437'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  checklist_generated: 'Checklist Generated',
  finalized: 'Finalized',
};

export default function AdminAssessmentStats() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    adminApi.assessmentStats(accessToken)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span>
    </div>
  );
  if (!stats) return <div className="p-8 text-[#9e3f4e]">Failed to load stats.</div>;

  const pieData = stats.by_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">Assessments</h1>
        <p className="text-sm text-[#737C7F] mt-1">
          Aggregate statistics only — no assessment content is shown here.
        </p>
      </div>

      {/* Total */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#DBE4E7] p-5">
          <div className="text-xs uppercase tracking-widest text-[#737C7F] font-bold mb-1">Total</div>
          <div className="text-3xl font-black text-[#2B3437]">{stats.total}</div>
        </div>
        {stats.by_status.map(s => (
          <div key={s.status} className="bg-white rounded-lg border border-[#DBE4E7] p-5">
            <div className="text-xs uppercase tracking-widest text-[#737C7F] font-bold mb-1">
              {STATUS_LABELS[s.status] || s.status}
            </div>
            <div className="text-3xl font-black text-[#2B3437]">{s.count}</div>
            <div className="text-xs text-[#737C7F] mt-1">
              {stats.total ? ((s.count / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By asset class */}
        <div className="bg-white rounded-xl border border-[#DBE4E7] p-5">
          <div className="text-sm font-bold text-[#2B3437] mb-4">By Asset Class</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.by_asset_class} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="asset_class" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {stats.by_asset_class.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-[#DBE4E7] p-5">
          <div className="text-sm font-bold text-[#2B3437] mb-4">Status Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily trend */}
      <div className="bg-white rounded-xl border border-[#DBE4E7] p-5">
        <div className="text-sm font-bold text-[#2B3437] mb-4">Assessment Creation Trend (30d)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.daily_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Assessments']} />
            <Line type="monotone" dataKey="count" stroke="#5E5C75" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-[#737C7F] italic">
        ⚠️ This view shows only aggregate counts. Individual assessment content (scores, rationale,
        due diligence notes) is private and only accessible to the user who created it.
      </p>
    </div>
  );
}
