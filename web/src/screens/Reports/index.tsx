import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Report } from '../../types/reports';

export default function ReportsLibrary() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/reports/reports.json')
      .then(r => r.json())
      .then((data: Report[]) => {
        // Sort newest first
        const sorted = [...data].sort((a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        setReports(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2B3437] font-headline">Quarterly Reports</h1>
            <p className="text-[#737C7F] text-sm mt-1">
              Periodic research on Hong Kong's tokenized real-world asset ecosystem — data, regulation, and risk.
            </p>
          </div>
          <Link
            to="/reports/methodology"
            className="text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">info</span>
            Methodology
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 bg-amber-900/20 border border-amber-700/40 rounded p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5 shrink-0">warning</span>
          <p className="text-amber-900 text-xs leading-relaxed">
            Reports are published for academic and research purposes only. They do not constitute investment advice, credit ratings, or regulatory opinions. All data is sourced from public disclosures; no proprietary ratings methodology is employed. Preview reports contain placeholder sections pending editorial completion.
          </p>
        </div>
      </div>

      {/* Report cards */}
      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="text-slate-500 text-sm py-12 text-center">No reports published yet.</div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <ReportCard key={report.slug} report={report} />
          ))}
        </div>
      )}

      {/* Subscription CTA */}
      <div className="mt-10 border border-[#2B3437] rounded-lg p-6 text-center">
        <span className="material-symbols-outlined text-[#5E5C75] text-3xl">notifications_active</span>
        <h3 className="text-[#2B3437] font-semibold mt-2">Get notified when new reports are published</h3>
        <p className="text-[#737C7F] text-sm mt-1 mb-4">
          Quarterly research delivered to your inbox. No spam — one email per quarter.
        </p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 bg-[#2B3437] border border-[#3a4447] rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5E5C75]"
          />
          <button className="bg-[#5E5C75] hover:bg-[#4e4c63] text-white text-sm px-4 py-2 rounded transition-colors">
            Subscribe
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2">Subscription feature coming soon.</p>
      </div>
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: Report }) {
  const statusMeta: Record<string, { label: string; color: string }> = {
    preview:   { label: 'Preview',   color: 'text-amber-400 bg-amber-900/30 border-amber-700/40' },
    published: { label: 'Published', color: 'text-green-400 bg-green-900/30 border-green-700/40' },
    revised:   { label: 'Revised',   color: 'text-blue-400 bg-blue-900/30 border-blue-700/40' },
  };
  const s = statusMeta[report.status] ?? statusMeta.preview;

  const published = new Date(report.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="border border-[#2B3437] rounded-lg p-5 hover:border-[#5E5C75]/50 transition-colors bg-[#141424]/40">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-slate-500">{report.quarter}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${s.color}`}>
              {s.label}
            </span>
            {report.pageCount && (
              <span className="text-xs text-slate-600">{report.pageCount} pp.</span>
            )}
          </div>
          <h2 className="text-[#2B3437] font-semibold text-lg leading-snug">{report.title}</h2>
          <p className="text-[#586064] text-sm mt-1.5 leading-relaxed line-clamp-2">{report.abstract}</p>
          <p className="text-[#737C7F] text-xs mt-2">
            Published {published} · {report.authors.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/reports/${report.slug}`}
            className="flex items-center gap-1.5 bg-[#5E5C75] hover:bg-[#4e4c63] text-white text-sm px-4 py-2 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            Read
          </Link>
        </div>
      </div>

      {/* Section pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {report.sections.map(s => (
          <span key={s.id} className="text-xs px-2 py-0.5 rounded bg-[#2B3437] text-slate-400">
            {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}
