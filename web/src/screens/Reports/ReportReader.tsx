import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import type { Report } from '../../types/reports';
import type { Issuer } from '../../types/licenses';
import type { Incident } from '../../types/incidents';
import type { Asset } from '../../types/assets';
import {
  aggregateLicensesData,
  aggregateIncidentsData,
  aggregateAssetsData,
  formatTvlM,
  buildCitations,
} from '../../utils/reports';
import { SARM_DIMENSION_KEYS } from '../../utils/sarm';
import { RARM_LAYER_KEYS, RARM_LAYER_META, ASSET_CATEGORY_LABELS } from '../../utils/rarm';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_COLORS: Record<string, string> = {
  green: '#2E7D32', yellow: '#e09d2b', red: '#9e3f4e', gray: '#737C7F',
};

const SARM_DIM_LABELS: Record<string, string> = {
  capital_adequacy: 'Capital', reserve_quality: 'Reserves', governance: 'Governance',
  technology: 'Technology', redemption: 'Redemption', disclosure: 'Disclosure',
};

function renderNarrative(text: string) {
  return text.split('\n\n').map((para, i) => {
    // **bold** standalone paragraph → heading
    if (/^\*\*(.+)\*\*$/.test(para.trim())) {
      const t = para.trim().replace(/^\*\*|\*\*$/g, '');
      return <h3 key={i} className="text-[#2B3437] font-semibold text-base mt-6 mb-2">{t}</h3>;
    }
    // [PREVIEW...] → italic gray
    if (para.trim().startsWith('[PREVIEW')) {
      return (
        <p key={i} className="text-[#737C7F] italic text-sm leading-relaxed my-2">
          {para.trim()}
        </p>
      );
    }
    // Inline **bold** within paragraph
    const parts = para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
      /^\*\*/.test(chunk)
        ? <strong key={j} className="text-[#2B3437] font-semibold">{chunk.replace(/\*\*/g, '')}</strong>
        : chunk
    );
    return (
      <p key={i} className="text-[#2B3437] text-sm leading-relaxed my-2">
        {parts}
      </p>
    );
  });
}

// ── Citation modal ────────────────────────────────────────────────────────────

function CitationModal({
  report, onClose,
}: { report: Report; onClose: () => void }) {
  const [active, setActive] = useState<'apa' | 'chicago' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);
  const citations = buildCitations(report.title, report.quarter, report.publishedAt, report.slug);

  const copy = () => {
    navigator.clipboard.writeText(citations[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg w-full max-w-xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Cite this report</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          {(['apa', 'chicago', 'bibtex'] as const).map(style => (
            <button
              key={style}
              onClick={() => setActive(style)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                active === style
                  ? 'border-[#5E5C75] bg-[#5E5C75]/20 text-white'
                  : 'border-[#2B3437] text-slate-400 hover:text-white hover:border-[#5E5C75]'
              }`}
            >
              {style.toUpperCase()}
            </button>
          ))}
        </div>
        <pre className="bg-[#0f0f1a] border border-[#2B3437] rounded p-4 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
          {citations[active]}
        </pre>
        <button
          onClick={copy}
          className="mt-3 flex items-center gap-2 text-sm bg-[#2B3437] hover:bg-[#3a4447] text-slate-300 hover:text-white px-4 py-2 rounded transition-colors"
        >
          <span className="material-symbols-outlined text-base">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ── Auto-section renderers ────────────────────────────────────────────────────

function AutoLicensesSection({ issuers, period }: { issuers: Issuer[]; period: string }) {
  const data = aggregateLicensesData(issuers);

  const statusData = Object.entries(data.byStatus).map(([k, v]) => ({
    name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: v,
  }));

  // SARM stacked-bar data: one bar per dimension, stacked signals
  const sarmData = SARM_DIMENSION_KEYS.map(dim => ({
    name: SARM_DIM_LABELS[dim] ?? dim,
    green: data.sarmSignalDistribution[dim]?.green ?? 0,
    yellow: data.sarmSignalDistribution[dim]?.yellow ?? 0,
    red: data.sarmSignalDistribution[dim]?.red ?? 0,
    gray: data.sarmSignalDistribution[dim]?.gray ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Total Applicants" value={data.totalApplicants} />
        {Object.entries(data.byStatus).map(([k, v]) => (
          <StatBox key={k} label={k.replace(/_/g, ' ')} value={v} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Applicants by status */}
        <ChartBox title="Applicants by Status">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3437" />
              <XAxis dataKey="name" tick={{ fill: '#737C7F', fontSize: 11 }} />
              <YAxis tick={{ fill: '#737C7F', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
                itemStyle={{ color: '#DBE4E7' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {statusData.map((_, i) => <Cell key={i} fill="#5E5C75" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* SARM signal distribution */}
        <ChartBox title="SARM Signal Distribution by Dimension">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sarmData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3437" />
              <XAxis dataKey="name" tick={{ fill: '#737C7F', fontSize: 10 }} />
              <YAxis tick={{ fill: '#737C7F', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
                itemStyle={{ color: '#DBE4E7' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#737C7F' }} />
              <Bar dataKey="green" stackId="a" fill={SIGNAL_COLORS.green} name="Satisfactory" />
              <Bar dataKey="yellow" stackId="a" fill={SIGNAL_COLORS.yellow} name="Partial" />
              <Bar dataKey="red" stackId="a" fill={SIGNAL_COLORS.red} name="Significant Gap" />
              <Bar dataKey="gray" stackId="a" fill={SIGNAL_COLORS.gray} name="Insufficient Data" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <p className="text-[#737C7F] text-xs">
        SARM signal assessments are based on publicly available disclosure only.
        Gray = insufficient public data; this is not a negative signal.
        Period: all issuers in the database as of {period}.
      </p>
    </div>
  );
}

function AutoAssetsSection({ assets, period }: { assets: Asset[]; period: string }) {
  const data = aggregateAssetsData(assets);

  const categoryData = Object.entries(data.byCategory).map(([cat, v]) => ({
    name: ASSET_CATEGORY_LABELS[cat] ?? cat,
    count: v.count,
    tvl: v.tvlUsd,
  }));

  const rarmData = Object.entries(data.byRARMAggregate)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
      fill: SIGNAL_COLORS[k] ?? '#737C7F',
    }));

  const layerData = RARM_LAYER_KEYS.map(key => ({
    name: RARM_LAYER_META[key].shortLabel,
    green: data.layerSignalDistribution[key]?.green ?? 0,
    yellow: data.layerSignalDistribution[key]?.yellow ?? 0,
    red: data.layerSignalDistribution[key]?.red ?? 0,
    gray: data.layerSignalDistribution[key]?.gray ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatBox label="Profiled Assets" value={data.totalAssets} />
        <StatBox label="Total TVL (est.)" value={formatTvlM(data.totalTvlUsd)} />
        <StatBox label="Categories" value={Object.keys(data.byCategory).length} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Assets by category + TVL */}
        <ChartBox title="TVL by Category (USD, est.)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 16, left: 60, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3437" />
              <XAxis type="number" tick={{ fill: '#737C7F', fontSize: 10 }}
                tickFormatter={v => v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(0)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#737C7F', fontSize: 10 }} width={60} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
                itemStyle={{ color: '#DBE4E7' }}
                formatter={(v) => formatTvlM(Number(v))}
              />
              <Bar dataKey="tvl" name="TVL" radius={[0, 3, 3, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill="#5E5C75" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* RARM aggregate donut */}
        <ChartBox title="RARM Aggregate Distribution">
          {rarmData.length === 0 ? (
            <p className="text-slate-500 text-sm p-4">No RARM data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={rarmData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {rarmData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#737C7F' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartBox>
      </div>

      {/* RARM layer signal distribution */}
      <ChartBox title="RARM Signal Distribution by Layer">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={layerData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2B3437" />
            <XAxis dataKey="name" tick={{ fill: '#737C7F', fontSize: 11 }} />
            <YAxis tick={{ fill: '#737C7F', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
              itemStyle={{ color: '#DBE4E7' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#737C7F' }} />
            <Bar dataKey="green" stackId="a" fill={SIGNAL_COLORS.green} name="Low Risk" />
            <Bar dataKey="yellow" stackId="a" fill={SIGNAL_COLORS.yellow} name="Moderate Risk" />
            <Bar dataKey="red" stackId="a" fill={SIGNAL_COLORS.red} name="Elevated Risk" />
            <Bar dataKey="gray" stackId="a" fill={SIGNAL_COLORS.gray} name="Insufficient Data" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <p className="text-[#737C7F] text-xs">
        All RARM signals are provisional pending review of non-public offering documents.
        Gray = insufficient public data. Period: all assets in the database as of {period}.
      </p>
    </div>
  );
}

function AutoIncidentsSection({
  incidents, periodStart, periodEnd,
}: { incidents: Incident[]; periodStart: string; periodEnd: string }) {
  const data = aggregateIncidentsData(incidents, periodStart, periodEnd);

  // All-time severity chart
  const severityData = ['critical', 'high', 'medium', 'low'].map(sev => ({
    name: sev.charAt(0).toUpperCase() + sev.slice(1),
    allTime: data.allTimeBySeverity[sev] ?? 0,
    inPeriod: data.bySeverity[sev] ?? 0,
  })).filter(d => d.allTime > 0);

  const sevColors: Record<string, string> = {
    critical: '#9e3f4e', high: '#e09d2b', medium: '#5E5C75', low: '#737C7F',
  };

  const typeData = Object.entries(data.allTimeByType).map(([k, v]) => ({
    name: k.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: v,
  })).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="In Q1 2026" value={data.totalInPeriod} />
        <StatBox label="All-Time Total" value={data.totalAllTime} />
        <StatBox label="HK-Related (all-time)" value={incidents.filter(i => i.scope === 'hk-related').length} />
        <StatBox
          label="Est. Losses (all-time)"
          value={data.totalEstimatedLossUsd > 0 ? formatTvlM(data.totalEstimatedLossUsd) : 'N/A'}
        />
      </div>

      {data.totalInPeriod === 0 && (
        <div className="border border-[#DBE4E7] rounded p-4 text-center bg-white">
          <span className="material-symbols-outlined text-[#5E5C75] text-2xl">check_circle</span>
          <p className="text-[#586064] text-sm mt-1">
            No incidents meeting inclusion thresholds were recorded in Q1 2026.
          </p>
          <p className="text-[#737C7F] text-xs mt-1">
            All-time distributions shown below for context.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <ChartBox title="All-Time Incidents by Severity">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={severityData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3437" />
              <XAxis dataKey="name" tick={{ fill: '#737C7F', fontSize: 11 }} />
              <YAxis tick={{ fill: '#737C7F', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
                itemStyle={{ color: '#DBE4E7' }}
              />
              <Bar dataKey="allTime" name="All-Time" radius={[3, 3, 0, 0]}>
                {severityData.map((d, i) => (
                  <Cell key={i} fill={sevColors[d.name.toLowerCase()] ?? '#5E5C75'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="All-Time Incidents by Type (Top 6)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} layout="vertical" margin={{ top: 4, right: 8, left: 80, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3437" />
              <XAxis type="number" tick={{ fill: '#737C7F', fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#737C7F', fontSize: 10 }} width={80} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid #2B3437', fontSize: 12 }}
                itemStyle={{ color: '#DBE4E7' }}
              />
              <Bar dataKey="value" name="Count" radius={[0, 3, 3, 0]}>
                {typeData.map((_, i) => <Cell key={i} fill="#5E5C75" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <p className="text-[#737C7F] text-xs">
        Incident database covers 2022–2025. HK-related incidents include any event with a Hong Kong market, regulatory, or exchange nexus.
        Global-reference incidents: loss ≥ USD 100M or multi-jurisdictional regulatory response.{' '}
        <Link to="/incidents/methodology" className="underline hover:text-[#2B3437]">Methodology →</Link>
      </p>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#DBE4E7] rounded p-3 bg-white">
      <div className="text-[#737C7F] text-xs capitalize">{label}</div>
      <div className="text-[#2B3437] font-semibold text-xl mt-0.5">{value}</div>
    </div>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#DBE4E7] rounded p-4 bg-white">
      <p className="text-[#737C7F] text-xs font-medium mb-3 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportReader() {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [showCiteModal, setShowCiteModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    Promise.all([
      fetch('/data/reports/reports.json').then(r => r.json()) as Promise<Report[]>,
      fetch('/data/licenses/issuers.json').then(r => r.json()) as Promise<Issuer[]>,
      fetch('/data/incidents/incidents.json').then(r => r.json()) as Promise<Incident[]>,
      fetch('/data/assets/assets.json').then(r => r.json()) as Promise<Asset[]>,
    ]).then(([reports, iss, inc, ass]) => {
      const found = reports.find(r => r.slug === slug) ?? null;
      setReport(found);
      setIssuers(iss);
      setIncidents(inc);
      setAssets(ass);
      if (found?.sections[0]) setActiveSection(found.sections[0].id);
    });
  }, [slug]);

  // Intersection observer for sticky TOC
  useEffect(() => {
    if (!report) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    for (const id of report.sections.map(s => s.id)) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [report]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const downloadPDF = async () => {
    if (!report) return;
    setPdfLoading(true);
    try {
      const { generateReportPDF } = await import('../../components/ReportPDF');
      await generateReportPDF(report, issuers, incidents, assets);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setPdfLoading(false);
    }
  };

  if (report === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-slate-500 text-sm">Loading…</div>
    );
  }
  if (report === null) {
    return <Navigate to="/reports" replace />;
  }

  const published = new Date(report.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      {showCiteModal && (
        <CitationModal report={report} onClose={() => setShowCiteModal(false)} />
      )}

      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        {/* PREVIEW banner */}
        {report.isPreview && (
          <div className="mb-6 bg-amber-900/25 border border-amber-700/50 rounded-lg p-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 shrink-0">construction</span>
            <span className="text-amber-200/90 text-sm">
              <strong>Preview edition.</strong> Auto-aggregated sections show live data from the current modules.
              Manual narrative sections contain placeholder text pending editorial completion.
            </span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="text-xs text-[#737C7F] mb-4 flex items-center gap-1">
          <Link to="/reports" className="hover:text-[#2B3437] transition-colors">Reports</Link>
          <span>›</span>
          <span className="text-[#2B3437]">{report.quarter}</span>
        </nav>

        <div className="flex gap-8">
          {/* ── Sticky TOC sidebar ──────────────────────────────────────── */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs text-[#737C7F] uppercase tracking-widest font-medium mb-3">Contents</p>
              {report.sections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                    activeSection === sec.id
                      ? 'text-white bg-[#2B3437]'
                      : 'text-[#586064] hover:text-[#2B3437]'
                  }`}
                >
                  {sec.title}
                </button>
              ))}

              <div className="mt-6 pt-4 border-t border-[#DBE4E7] space-y-2">
                <button
                  onClick={() => setShowCiteModal(true)}
                  className="w-full text-left text-xs text-[#737C7F] hover:text-[#2B3437] flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">format_quote</span>
                  Cite this report
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={pdfLoading}
                  className="w-full text-left text-xs text-[#737C7F] hover:text-[#2B3437] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  {pdfLoading ? 'Generating…' : 'Download PDF'}
                </button>
                <Link
                  to="/reports/methodology"
                  className="text-xs text-[#737C7F] hover:text-[#2B3437] flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">info</span>
                  Methodology
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Report header */}
            <div className="border-b border-[#DBE4E7] pb-6 mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-mono text-[#737C7F]">{report.quarter}</span>
                <StatusBadge status={report.status} />
                {report.pageCount && (
                  <span className="text-xs text-[#737C7F]">{report.pageCount} pp.</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#2B3437] font-headline leading-snug">{report.title}</h1>
              <p className="text-[#586064] text-sm mt-2 leading-relaxed">{report.abstract}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#737C7F]">
                <span>Published {published}</span>
                <span>·</span>
                <span>{report.authors.join(', ')}</span>
                <span>·</span>
                <span>Period: {report.periodStart} – {report.periodEnd}</span>
              </div>

              {/* Mobile action row */}
              <div className="mt-4 flex items-center gap-3 lg:hidden flex-wrap">
                <button
                  onClick={() => setShowCiteModal(true)}
                  className="flex items-center gap-1.5 text-sm text-[#586064] hover:text-[#2B3437] border border-[#DBE4E7] px-3 py-1.5 rounded transition-colors"
                >
                  <span className="material-symbols-outlined text-base">format_quote</span>
                  Cite
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 text-sm text-[#586064] hover:text-[#2B3437] border border-[#DBE4E7] px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  {pdfLoading ? 'Generating…' : 'PDF'}
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-12">
              {report.sections.map(sec => (
                <section key={sec.id} id={sec.id} className="scroll-mt-24">
                  <h2 className="text-lg font-bold text-[#2B3437] mb-4 flex items-center gap-2">
                    <SectionTypeIcon type={sec.type} />
                    {sec.title}
                  </h2>

                  {/* Narrative text */}
                  {sec.narrative && (
                    <div className="mb-4">{renderNarrative(sec.narrative)}</div>
                  )}

                  {/* Auto-aggregated content */}
                  {sec.type === 'auto-licenses' && (
                    <AutoLicensesSection issuers={issuers} period={report.lastUpdatedAt} />
                  )}
                  {sec.type === 'auto-assets' && (
                    <AutoAssetsSection assets={assets} period={report.lastUpdatedAt} />
                  )}
                  {sec.type === 'auto-incidents' && (
                    <AutoIncidentsSection
                      incidents={incidents}
                      periodStart={report.periodStart}
                      periodEnd={report.periodEnd}
                    />
                  )}
                  {sec.type === 'auto-market' && (
                    <AutoMarketSection />
                  )}

                  {/* Manual commentary (after auto content) */}
                  {sec.manualCommentary && (
                    <div className="mt-4 pt-4 border-t border-[#DBE4E7]">
                      <p className="text-xs text-[#737C7F] uppercase tracking-widest mb-2">Analyst Commentary</p>
                      {renderNarrative(sec.manualCommentary)}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Citations */}
            {report.citations.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#DBE4E7]">
                <h2 className="text-base font-semibold text-[#2B3437] mb-4">References</h2>
                <ol className="space-y-2">
                  {report.citations.map((c, i) => (
                    <li key={c.id} className="text-xs text-[#586064] flex gap-2">
                      <span className="text-[#737C7F] shrink-0">[{i + 1}]</span>
                      <span>
                        {c.text}
                        {c.url && (
                          <> {' '}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#5E5C75] hover:underline break-all"
                            >
                              {c.url}
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Changelog */}
            {report.changelog.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#DBE4E7]">
                <p className="text-xs text-[#737C7F] uppercase tracking-widest mb-2">Changelog</p>
                {report.changelog.map((e, i) => (
                  <p key={i} className="text-xs text-[#586064]">
                    <span className="font-mono text-[#737C7F]">{e.date}</span> — {e.note}
                  </p>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-8 pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
              This report is published for academic and research purposes only. It does not constitute investment advice,
              financial product disclosure, credit rating, or regulatory opinion. RWA-Index Research is not licensed as
              a credit rating agency. All SARM/RARM signal assessments are based solely on publicly available information.
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ── Small sub-components ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    preview:   { label: 'Preview',   cls: 'text-amber-400 bg-amber-900/30 border-amber-700/40' },
    published: { label: 'Published', cls: 'text-green-400 bg-green-900/30 border-green-700/40' },
    revised:   { label: 'Revised',   cls: 'text-blue-400 bg-blue-900/30 border-blue-700/40' },
  };
  const m = meta[status] ?? meta.preview;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${m.cls}`}>{m.label}</span>
  );
}

function SectionTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    'manual': 'edit_note',
    'auto-licenses': 'badge',
    'auto-incidents': 'warning',
    'auto-assets': 'account_balance',
    'auto-market': 'show_chart',
    'mixed': 'layers',
  };
  return (
    <span className="material-symbols-outlined text-[#5E5C75] text-base">
      {icons[type] ?? 'article'}
    </span>
  );
}

function AutoMarketSection() {
  return (
    <div className="border border-[#DBE4E7] rounded p-4 bg-white">
      <p className="text-[#586064] text-sm mb-3">
        Live protocol TVL data is served from the Protocol Directory.
      </p>
      <Link
        to="/market"
        className="inline-flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors"
      >
        <span className="material-symbols-outlined text-base">open_in_new</span>
        View Market Dashboard →
      </Link>
    </div>
  );
}
