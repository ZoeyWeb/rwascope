import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ComplianceMatrix, ComplianceSignal } from '../../types/compliance';
import { SIGNAL_META, populatedCellCount } from '../../utils/compliance';
import { useComplianceSignals } from '../../hooks/useComplianceSignals';
import { Eyebrow } from '../../components/Eyebrow';
import { BigStat, BigStatRibbon } from '../../components/BigStat';

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
  const { signals } = useComplianceSignals();
  const meta = signals[signal];
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
  const { signals } = useComplianceSignals();
  const meta = signals[signal];
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
  const { t } = useTranslation('complianceMap');
  const { signals } = useComplianceSignals();
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
        <span className="material-symbols-outlined animate-spin text-ed-text-muted text-ed-section-h2">
          progress_activity
        </span>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-ed-body text-ed-text-muted">{t('error.loadFailed')}</span>
      </div>
    );
  }

  const populated = populatedCellCount(matrix);
  const total = matrix.jurisdictions.length * matrix.issues.length;

  const jurisdictions = JURISDICTIONS_ORDER
    .map((code) => matrix.jurisdictions.find((j) => j.code === code))
    .filter(Boolean) as typeof matrix.jurisdictions;

  const issues = ISSUES_ORDER
    .map((code) => matrix.issues.find((i) => i.code === code))
    .filter(Boolean) as typeof matrix.issues;

  const filteredCells = matrix.cells.filter((cell) => {
    if (filterSignal !== 'all' && cell.status_signal !== filterSignal) return false;
    if (filterJurisdiction !== 'all' && cell.jurisdiction !== filterJurisdiction) return false;
    return true;
  });

  const signalCounts = matrix.cells.reduce(
    (acc, c) => {
      acc[c.status_signal] = (acc[c.status_signal] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-ed-section-md pb-ed-section-sm">
        <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
        <h1 className="text-4xl md:text-ed-hero-h1 text-ed-ink mt-ed-section-sm">
          {t('hero.h1')}
        </h1>
        <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
          {t('hero.lede')}
        </p>
      </section>

      {/* ── Stats ribbon ─────────────────────────────────────────────────── */}
      <BigStatRibbon>
        <BigStat value={`${populated} / ${total}`}         label={t('stats.cellsPopulated')} />
        <BigStat value={signalCounts['open']        ?? 0}  label={signals['open'].label}        valueColor="#2E7D32" />
        <BigStat value={signalCounts['conditional'] ?? 0}  label={signals['conditional'].label} valueColor="#e09d2b" />
        <BigStat value={signalCounts['restricted']  ?? 0}  label={signals['restricted'].label}  valueColor="#9e3f4e" />
        {(signalCounts['placeholder'] ?? 0) > 0 && (
          <BigStat value={signalCounts['placeholder']} label={signals['placeholder'].label} valueColor="#9ca3af" />
        )}
      </BigStatRibbon>

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="border-b border-ed-hairline mt-ed-section-sm">
        <div className="flex items-end justify-between">
          <div className="flex gap-12">
            <button
              onClick={() => setViewMode('matrix')}
              className={`pb-3 text-ed-item-h4 transition-colors ${
                viewMode === 'matrix'
                  ? 'text-ed-ink border-b-2 border-ed-ink -mb-px'
                  : 'text-ed-text-secondary hover:text-ed-ink'
              }`}
            >
              {t('tabs.matrix')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`pb-3 text-ed-item-h4 transition-colors ${
                viewMode === 'list'
                  ? 'text-ed-ink border-b-2 border-ed-ink -mb-px'
                  : 'text-ed-text-secondary hover:text-ed-ink'
              }`}
            >
              {t('tabs.list')}
            </button>
          </div>
          <Link
            to="/compliance/methodology"
            className="text-ed-meta text-ed-text-muted hover:text-ed-ink pb-3 transition-colors"
          >
            {t('tabs.methodologyLink')}
          </Link>
        </div>
      </div>

      {/* ── List filters (list mode only) ────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-3 pt-ed-section-sm">
          <select
            value={filterJurisdiction}
            onChange={(e) => setFilterJurisdiction(e.target.value)}
            className="border border-ed-hairline px-3 py-2 text-ed-meta bg-ed-surface focus:outline-none focus:ring-1 focus:ring-ed-ink/20"
          >
            <option value="all">{t('filters.allJurisdictions')}</option>
            {matrix.jurisdictions.map((j) => (
              <option key={j.code} value={j.code}>{t(`jurisdictions.${j.code}`)}</option>
            ))}
          </select>
          <select
            value={filterSignal}
            onChange={(e) => setFilterSignal(e.target.value as ComplianceSignal | 'all')}
            className="border border-ed-hairline px-3 py-2 text-ed-meta bg-ed-surface focus:outline-none focus:ring-1 focus:ring-ed-ink/20"
          >
            <option value="all">{t('filters.allSignals')}</option>
            {(['open', 'conditional', 'restricted', 'placeholder'] as ComplianceSignal[]).map(
              (sig) => (
                <option key={sig} value={sig}>{signals[sig].label}</option>
              )
            )}
          </select>
        </div>
      )}

      {/* ── Matrix view ──────────────────────────────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto pt-ed-section-sm">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="py-2 pr-4 text-left text-xs font-medium text-[#737C7F] w-44">
                  {t('matrixHeader')}
                </th>
                {jurisdictions.map((j) => (
                  <th
                    key={j.code}
                    className="py-2 px-2 text-center text-xs font-semibold text-[#2B3437] w-28"
                  >
                    {j.code}
                    <div className="text-[10px] font-normal text-[#737C7F] whitespace-nowrap">
                      {t(`jurisdictions.${j.code}`)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBE4E7]">
              {issues.map((issue) => (
                <tr key={issue.code}>
                  <td className="py-2 pr-4 align-top">
                    <div className="text-xs font-medium text-[#2B3437]">{t(`issues.${issue.code}`)}</div>
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

      {/* ── List view ────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-2 mt-4">
          {filteredCells.length === 0 && (
            <p className="text-ed-body text-ed-text-muted py-8 text-center">
              {t('list.noResults')}
            </p>
          )}
          {filteredCells.map((cell) => {
            const j = matrix.jurisdictions.find((x) => x.code === cell.jurisdiction);
            const issue = matrix.issues.find((x) => x.code === cell.issue);
            return (
              <Link
                key={`${cell.jurisdiction}-${cell.issue}`}
                to={`/compliance/${cell.jurisdiction}/${cell.issue}`}
                className="flex items-start gap-4 p-4 bg-ed-surface border border-ed-hairline hover:border-[#5E5C75] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-ed-eyebrow text-ed-ink bg-ed-surface-cool px-1.5 py-0.5">
                      {cell.jurisdiction}
                    </span>
                    <span className="text-ed-meta text-ed-text-muted">{j?.name}</span>
                    <span className="text-ed-hairline">·</span>
                    <span className="text-ed-meta text-ed-ink">{issue?.title}</span>
                  </div>
                  <p className="text-ed-meta text-ed-text-secondary line-clamp-2">
                    {cell.status_signal === 'placeholder'
                      ? t('list.researchPending')
                      : cell.summary}
                  </p>
                  {cell.last_reviewed && (
                    <span className="text-ed-meta text-ed-text-faint mt-1 block">
                      {t('list.reviewed', { date: cell.last_reviewed })}
                    </span>
                  )}
                </div>
                <SignalChip signal={cell.status_signal} />
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Footer: legend + disclaimer + meta ──────────────────────────── */}
      <section className="border-t border-ed-hairline mt-ed-section-md pt-ed-section-sm pb-ed-section-md space-y-ed-section-sm">

        {/* Legend */}
        <div>
          <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted mb-3">
            {t('legend.heading')}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-ed-meta text-ed-text-secondary">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#2E7D32' }} />
              {signals['open'].label}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#e09d2b' }} />
              {signals['conditional'].label}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#9e3f4e' }} />
              {signals['restricted'].label}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#9ca3af' }} />
              {signals['placeholder'].label}
            </span>
            <span className="text-ed-text-muted">{t('legend.pendingResearch')}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-ed-meta text-ed-text-secondary max-w-[860px]">
          {matrix.disclaimer}
        </p>

        {/* Meta */}
        <div className="text-ed-meta text-ed-text-muted">
          {t('meta.versionLine', { version: matrix.matrix_version, date: matrix.last_compiled })}
        </div>

      </section>

    </div>
  );
}
