import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ComplianceMatrix, ComplianceSignal } from '../../types/compliance';
import { SIGNAL_META, populatedCellCount } from '../../utils/compliance';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const ISSUES_ORDER = [
  'rwa_issuance',
  'stablecoin_issuance',
  'vasp_licensing',
  'cross_border',
  'retail_access',
];

const JURISDICTIONS_ORDER = ['HK', 'CN', 'SG', 'US', 'EU'];

type ViewMode = 'matrix' | 'list';

function SignalChip({ signal }: { signal: ComplianceSignal }) {
  const meta = SIGNAL_META[signal];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: meta.dot }}
      />
      {meta.label}
    </span>
  );
}

function MatrixCell({
  signal,
  jurisdiction,
  issue,
}: {
  signal: ComplianceSignal;
  jurisdiction: string;
  issue: string;
}) {
  const meta = SIGNAL_META[signal];
  const isPlaceholder = signal === 'placeholder';

  return (
    <Link
      to={`/compliance/${jurisdiction}/${issue}`}
      className="block w-full h-full min-h-[56px] rounded transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#5E5C75]"
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
      aria-label={`${jurisdiction} ${issue}: ${meta.label}`}
    >
      <div className="flex flex-col items-center justify-center h-full py-3 px-2 gap-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: meta.dot }}
        />
        {!isPlaceholder && (
          <span className="text-[10px] font-medium" style={{ color: meta.color }}>
            {meta.label}
          </span>
        )}
        {isPlaceholder && (
          <span className="text-[10px] text-[#9ca3af]">—</span>
        )}
      </div>
    </Link>
  );
}

export default function ComplianceMap() {
  const [matrix, setMatrix] = useState<ComplianceMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [filterSignal, setFilterSignal] = useState<ComplianceSignal | 'all'>('all');
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('all');

  useEffect(() => {
    fetch('/data/compliance/matrix.json')
      .then((r) => r.json())
      .then((data: ComplianceMatrix) => {
        setMatrix(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Loading compliance matrix…</span>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Failed to load compliance data.</span>
      </div>
    );
  }

  const populated = populatedCellCount(matrix);
  const total = matrix.jurisdictions.length * matrix.issues.length;

  // Build ordered jurisdiction/issue arrays for rendering
  const jurisdictions = JURISDICTIONS_ORDER
    .map((code) => matrix.jurisdictions.find((j) => j.code === code))
    .filter(Boolean) as typeof matrix.jurisdictions;

  const issues = ISSUES_ORDER
    .map((code) => matrix.issues.find((i) => i.code === code))
    .filter(Boolean) as typeof matrix.issues;

  // Filtered cells for list view
  const filteredCells = matrix.cells.filter((cell) => {
    if (filterSignal !== 'all' && cell.status_signal !== filterSignal) return false;
    if (filterJurisdiction !== 'all' && cell.jurisdiction !== filterJurisdiction) return false;
    return true;
  });

  // Signal counts for stats bar
  const signalCounts = matrix.cells.reduce(
    (acc, c) => {
      acc[c.status_signal] = (acc[c.status_signal] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-1">
          Cross-Border RWA Compliance Map
        </h1>
        <p className="text-sm text-[#737C7F] max-w-2xl">
          A jurisdiction-by-issue overview of the regulatory landscape for tokenized real-world
          assets and stablecoins across Hong Kong, Mainland China, Singapore, the United States,
          and the European Union.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            to="/compliance/methodology"
            className="text-xs text-[#5E5C75] hover:underline"
          >
            Methodology
          </Link>
          <span className="text-[#DBE4E7]">·</span>
          <span className="text-xs text-[#737C7F]">
            v{matrix.matrix_version} · compiled {matrix.last_compiled}
          </span>
        </div>
      </div>

      <DisclaimerBanner text={matrix.disclaimer} />

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 my-5">
        <StatPill label="Cells populated" value={`${populated} / ${total}`} />
        {(['open', 'conditional', 'restricted'] as ComplianceSignal[]).map((sig) => (
          <StatPill
            key={sig}
            label={SIGNAL_META[sig].label}
            value={String(signalCounts[sig] || 0)}
            color={SIGNAL_META[sig].dot}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        {(['open', 'conditional', 'restricted', 'placeholder'] as ComplianceSignal[]).map((sig) => {
          const meta = SIGNAL_META[sig];
          return (
            <div key={sig} className="flex items-center gap-1.5 text-xs text-[#586064]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dot }} />
              <span>{meta.label}</span>
            </div>
          );
        })}
        <span className="text-xs text-[#9ca3af] ml-1">— = pending research</span>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex rounded border border-[#DBE4E7] overflow-hidden text-xs">
          {(['matrix', 'list'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-[#2B3437] text-white'
                  : 'bg-white text-[#586064] hover:bg-[#EAEFF1]'
              }`}
            >
              {mode === 'matrix' ? 'Matrix' : 'List'}
            </button>
          ))}
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={filterJurisdiction}
              onChange={(e) => setFilterJurisdiction(e.target.value)}
              className="border border-[#DBE4E7] rounded px-2 py-1 text-[#2B3437] bg-white"
            >
              <option value="all">All jurisdictions</option>
              {matrix.jurisdictions.map((j) => (
                <option key={j.code} value={j.code}>{j.name}</option>
              ))}
            </select>
            <select
              value={filterSignal}
              onChange={(e) => setFilterSignal(e.target.value as ComplianceSignal | 'all')}
              className="border border-[#DBE4E7] rounded px-2 py-1 text-[#2B3437] bg-white"
            >
              <option value="all">All signals</option>
              {(['open', 'conditional', 'restricted', 'placeholder'] as ComplianceSignal[]).map(
                (sig) => (
                  <option key={sig} value={sig}>{SIGNAL_META[sig].label}</option>
                )
              )}
            </select>
          </div>
        )}
      </div>

      {/* MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="py-2 pr-4 text-left text-xs font-medium text-[#737C7F] w-44">
                  Issue ↓ / Jurisdiction →
                </th>
                {jurisdictions.map((j) => (
                  <th
                    key={j.code}
                    className="py-2 px-2 text-center text-xs font-semibold text-[#2B3437] w-28"
                  >
                    {j.code}
                    <div className="text-[10px] font-normal text-[#737C7F] whitespace-nowrap">
                      {j.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBE4E7]">
              {issues.map((issue) => (
                <tr key={issue.code}>
                  <td className="py-2 pr-4 align-top">
                    <div className="text-xs font-medium text-[#2B3437]">{issue.title}</div>
                    <div className="text-[10px] text-[#9ca3af] mt-0.5 leading-tight max-w-[160px]">
                      {issue.description}
                    </div>
                  </td>
                  {jurisdictions.map((j) => {
                    const cell = matrix.cells.find(
                      (c) => c.jurisdiction === j.code && c.issue === issue.code
                    );
                    const signal: ComplianceSignal = cell?.status_signal ?? 'placeholder';
                    return (
                      <td key={j.code} className="py-2 px-2 align-top">
                        <MatrixCell
                          signal={signal}
                          jurisdiction={j.code}
                          issue={issue.code}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredCells.length === 0 && (
            <p className="text-sm text-[#737C7F] py-8 text-center">No cells match the selected filters.</p>
          )}
          {filteredCells.map((cell) => {
            const j = matrix.jurisdictions.find((x) => x.code === cell.jurisdiction);
            const issue = matrix.issues.find((x) => x.code === cell.issue);
            return (
              <Link
                key={`${cell.jurisdiction}-${cell.issue}`}
                to={`/compliance/${cell.jurisdiction}/${cell.issue}`}
                className="flex items-start gap-4 p-4 bg-white border border-[#DBE4E7] rounded hover:border-[#5E5C75] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#2B3437] bg-[#EAEFF1] px-1.5 py-0.5 rounded">
                      {cell.jurisdiction}
                    </span>
                    <span className="text-xs text-[#737C7F]">{j?.name}</span>
                    <span className="text-[#DBE4E7]">·</span>
                    <span className="text-xs font-medium text-[#2B3437]">{issue?.title}</span>
                  </div>
                  <p className="text-xs text-[#586064] line-clamp-2">
                    {cell.status_signal === 'placeholder'
                      ? 'Research pending — click to view placeholder.'
                      : cell.summary}
                  </p>
                  {cell.last_reviewed && (
                    <span className="text-[10px] text-[#9ca3af] mt-1 block">
                      Reviewed {cell.last_reviewed}
                    </span>
                  )}
                </div>
                <SignalChip signal={cell.status_signal} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom disclaimer */}
      <div className="mt-10 pt-6 border-t border-[#DBE4E7] text-xs text-[#737C7F] leading-relaxed">
        This matrix is for educational and research purposes only. It does not constitute legal
        advice. Cells marked "Pending" have not yet been researched; they navigate to a placeholder
        page. Practitioners should obtain qualified legal advice in each jurisdiction.{' '}
        <Link to="/compliance/methodology" className="text-[#5E5C75] hover:underline">
          Full methodology →
        </Link>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#DBE4E7] rounded px-3 py-1.5">
      {color && (
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      )}
      <span className="text-xs text-[#737C7F]">{label}</span>
      <span className="text-xs font-semibold text-[#2B3437]">{value}</span>
    </div>
  );
}
