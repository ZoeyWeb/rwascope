import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import reservesData from '../../../public/data/reserves/reserves.json';

type Stablecoin = (typeof reservesData.stablecoins)[number];
type Snapshot = Stablecoin['snapshots'][number];

const PALETTE = [
  '#5E5C75', '#2E7D32', '#e09d2b', '#9e3f4e',
  '#4A90D9', '#737C7F', '#2B3437',
];

const CATEGORY_LABELS: Record<string, string> = {
  cash_and_equivalents:         'Cash & Equivalents',
  short_duration_us_treasuries: 'Short-Duration US Treasuries',
  us_treasuries:                'US Treasuries',
  cash_and_bank_deposits:       'Cash & Bank Deposits',
  secured_loans:                'Secured Loans',
  corporate_bonds:              'Corporate Bonds',
  precious_metals:              'Precious Metals',
  other:                        'Other',
  short_term_us_treasuries:     'Short-Term US Treasuries',
  bank_demand_deposits:         'Bank Demand Deposits',
};

function fmtBn(usd: number) {
  if (usd >= 1e9) return '$' + (usd / 1e9).toFixed(1) + 'B';
  if (usd >= 1e6) return '$' + (usd / 1e6).toFixed(0) + 'M';
  return '$' + usd.toLocaleString();
}

export default function ReserveMonitor() {
  const [selected, setSelected] = useState(reservesData.stablecoins[0].slug);
  const coin = reservesData.stablecoins.find(c => c.slug === selected)!;
  const latest: Snapshot = coin.snapshots[coin.snapshots.length - 1];

  const areaData = coin.snapshots.map(s => {
    const row: Record<string, string | number> = { date: s.asof_date };
    for (const r of s.reserves) row[r.category] = r.pct;
    return row;
  });

  const pieData = latest.reserves.map((r, i) => ({
    name: CATEGORY_LABELS[r.category] ?? r.category,
    value: r.pct,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="min-h-screen bg-[#F1F4F6]">
      {/* Header */}
      <div className="bg-white border-b border-[#DBE4E7]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5E5C75] mb-2">
            Market
          </div>
          <h1 className="font-headline text-3xl font-bold text-[#2B3437]">
            Stablecoin Reserve Monitor
          </h1>
          <p className="mt-2 text-sm text-[#737C7F] max-w-2xl">
            Reserve composition and supply trends for major stablecoins, sourced from
            third-party attestations and issuer disclosures.
          </p>
        </div>
      </div>

      {/* Stablecoin selector */}
      <div className="bg-white border-b border-[#DBE4E7]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2">
          {reservesData.stablecoins.map(c => (
            <button
              key={c.slug}
              onClick={() => setSelected(c.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                selected === c.slug
                  ? 'bg-[#2B3437] text-white'
                  : 'bg-[#F1F4F6] text-[#737C7F] hover:bg-[#DBE4E7]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Issuer" value={coin.issuer} />
          <StatCard label="Total Supply" value={fmtBn(latest.total_supply_usd)} />
          <StatCard label="As of" value={latest.asof_date} />
          <StatCard label="Attested by" value={coin.attester} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reserve composition pie */}
          <div className="bg-white border border-[#DBE4E7] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-[#2B3437] mb-4">
              Reserve composition — {latest.asof_date}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${value}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-[#2B3437]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Reserve trend area chart */}
          <div className="bg-white border border-[#DBE4E7] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-[#2B3437] mb-4">
              Reserve composition trend (%)
            </h2>
            {areaData.length < 2 ? (
              <div className="flex items-center justify-center h-[220px] text-xs text-[#737C7F]">
                Insufficient snapshots for trend view
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DBE4E7" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#737C7F' }}
                    tickFormatter={v => v.slice(0, 7)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#737C7F' }}
                    tickFormatter={v => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`]}
                    contentStyle={{ fontSize: 12, borderColor: '#DBE4E7' }}
                  />
                  {coin.reserve_categories.map((cat, i) => (
                    <Area
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      stackId="1"
                      stroke={PALETTE[i % PALETTE.length]}
                      fill={PALETTE[i % PALETTE.length]}
                      fillOpacity={0.6}
                      name={CATEGORY_LABELS[cat] ?? cat}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Snapshot table */}
        <div className="bg-white border border-[#DBE4E7] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBE4E7]">
            <h2 className="text-sm font-semibold text-[#2B3437]">Historical snapshots</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F1F4F6]">
                <tr>
                  <th className="text-left px-5 py-3 text-[#737C7F] font-medium">Date</th>
                  <th className="text-right px-5 py-3 text-[#737C7F] font-medium">Total Supply</th>
                  {coin.reserve_categories.map(cat => (
                    <th key={cat} className="text-right px-3 py-3 text-[#737C7F] font-medium whitespace-nowrap">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </th>
                  ))}
                  <th className="text-center px-5 py-3 text-[#737C7F] font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {[...coin.snapshots].reverse().map((s, i) => (
                  <tr key={s.asof_date} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F1F4F6]/40'}>
                    <td className="px-5 py-3 text-[#2B3437] font-medium">{s.asof_date}</td>
                    <td className="px-5 py-3 text-right text-[#2B3437]">{fmtBn(s.total_supply_usd)}</td>
                    {coin.reserve_categories.map(cat => {
                      const r = s.reserves.find(x => x.category === cat);
                      return (
                        <td key={cat} className="px-3 py-3 text-right text-[#737C7F]">
                          {r ? `${r.pct}%` : '—'}
                        </td>
                      );
                    })}
                    <td className="px-5 py-3 text-center">
                      <a
                        href={s.attestation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5E5C75] hover:text-[#2B3437] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-[#737C7F] text-center">
          Data sourced from issuer attestations and public filings. Percentages may not sum to 100% due to rounding.
          Last updated {reservesData.updated_at}.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#DBE4E7] rounded-lg px-4 py-3">
      <div className="text-xs text-[#737C7F] mb-1">{label}</div>
      <div className="text-sm font-semibold text-[#2B3437] truncate">{value}</div>
    </div>
  );
}
