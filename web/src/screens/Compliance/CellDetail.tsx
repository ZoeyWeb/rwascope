import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ComplianceMatrix, ComplianceCell } from '../../types/compliance';
import { SIGNAL_META, getCell, getJurisdiction, getIssue, buildCellCitation } from '../../utils/compliance';
import { useComplianceSignals } from '../../hooks/useComplianceSignals';

function SignalBadge({ signal }: { signal: ComplianceCell['status_signal'] }) {
  const { signals } = useComplianceSignals();
  const meta = signals[signal];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

export default function CellDetail() {
  const { t } = useTranslation('complianceMap');
  const { signals } = useComplianceSignals();
  const { jurisdiction, issue } = useParams<{ jurisdiction: string; issue: string }>();
  const [matrix, setMatrix] = useState<ComplianceMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [citationCopied, setCitationCopied] = useState(false);

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
        <span className="text-[#737C7F] text-sm">{t('cell.loading')}</span>
      </div>
    );
  }

  if (!matrix || !jurisdiction || !issue) {
    return <Navigate to="/compliance" replace />;
  }

  const cell = getCell(matrix, jurisdiction, issue);
  const j = getJurisdiction(matrix, jurisdiction);
  const iss = getIssue(matrix, issue);

  if (!cell || !j || !iss) {
    return <Navigate to="/compliance" replace />;
  }

  const isPlaceholder = cell.status_signal === 'placeholder';

  // Sibling issues for sidebar navigation
  const siblingIssues = matrix.issues.filter((i) => i.code !== issue);

  const citation = buildCellCitation(cell);

  function handleCopyCitation() {
    navigator.clipboard.writeText(citation).then(() => {
      setCitationCopied(true);
      setTimeout(() => setCitationCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-5 flex items-center gap-1 flex-wrap">
        <Link to="/compliance" className="hover:text-[#2B3437] transition-colors">
          {t('cell.breadcrumb')}
        </Link>
        <span>›</span>
        <span className="text-[#2B3437] font-medium">{j.name}</span>
        <span>›</span>
        <span className="text-[#2B3437] font-medium">{iss.title}</span>
      </nav>

      <div className="flex gap-8 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title block */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold bg-[#EAEFF1] text-[#2B3437] px-1.5 py-0.5 rounded">
                  {j.code}
                </span>
                <span className="text-xs text-[#737C7F]">{j.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-[#2B3437] font-headline">{iss.title}</h1>
              <p className="text-sm text-[#737C7F] mt-1">{iss.description}</p>
            </div>
            <SignalBadge signal={cell.status_signal} />
          </div>

          {isPlaceholder ? (
            /* Placeholder state */
            <div className="bg-[#f3f4f6] border border-[#d1d5db] rounded-lg p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-[#9ca3af] mb-3 block">
                hourglass_empty
              </span>
              <h2 className="text-base font-semibold text-[#2B3437] mb-2">
                {t('cell.placeholder.heading')}
              </h2>
              <p className="text-sm text-[#737C7F] max-w-md mx-auto">
                {t('cell.placeholder.body')}
              </p>
              <Link
                to="/compliance"
                className="inline-block mt-4 text-xs text-[#5E5C75] hover:underline"
              >
                {t('cell.placeholder.backLink')}
              </Link>
            </div>
          ) : (
            /* Populated cell */
            <div className="space-y-8">
              {/* Summary */}
              <section>
                <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                  {t('cell.sections.summary')}
                </h2>
                <p className="text-sm text-[#2B3437] leading-relaxed">{cell.summary}</p>
                {cell.last_reviewed && (
                  <p className="text-xs text-[#9ca3af] mt-2">
                    {t('cell.lastReviewed', { date: cell.last_reviewed })}
                  </p>
                )}
              </section>

              {/* Key Requirements */}
              {cell.key_requirements.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                    {t('cell.sections.keyRequirements')}
                  </h2>
                  <ul className="space-y-2">
                    {cell.key_requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#2B3437]">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: SIGNAL_META[cell.status_signal].dot }}
                        />
                        {req}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Exemptions */}
              {cell.exemptions.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                    {t('cell.sections.exemptions')}
                  </h2>
                  <ul className="space-y-2">
                    {cell.exemptions.map((ex, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#586064]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Practitioner Notes */}
              {cell.practitioner_notes && (
                <section>
                  <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                    {t('cell.sections.practitionerNotes')}
                  </h2>
                  <div className="bg-[#fef3c7] border border-[#fcd34d] rounded-lg p-4">
                    <p className="text-sm text-[#92400e] leading-relaxed">
                      {cell.practitioner_notes}
                    </p>
                  </div>
                </section>
              )}

              {/* References */}
              {cell.references.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                    {t('cell.sections.references')}
                  </h2>
                  <div className="space-y-3">
                    {cell.references.map((ref, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-white border border-[#DBE4E7] rounded"
                      >
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAEFF1] text-[#586064] flex-shrink-0 mt-0.5">
                          {t(`cell.refTypes.${ref.type}`, { defaultValue: ref.type })}
                        </span>
                        <div className="min-w-0">
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#5E5C75] hover:underline break-words"
                          >
                            {ref.title}
                          </a>
                          {ref.date && (
                            <span className="text-xs text-[#9ca3af] ml-2">{ref.date}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Citation */}
              <section>
                <h2 className="text-sm font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
                  {t('cell.sections.citeThisCell')}
                </h2>
                <div className="bg-[#f8f9fa] border border-[#DBE4E7] rounded p-3 flex items-start gap-3">
                  <code className="text-xs text-[#586064] leading-relaxed flex-1 break-all">
                    {citation}
                  </code>
                  <button
                    onClick={handleCopyCitation}
                    className="text-xs text-[#5E5C75] hover:underline flex-shrink-0 mt-0.5"
                  >
                    {citationCopied ? t('cell.citation.copied') : t('cell.citation.copy')}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block space-y-6">
          {/* Jurisdiction card */}
          <div className="bg-white border border-[#DBE4E7] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
              {j.name}
            </h3>
            {j.regulators.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-[#9ca3af] uppercase mb-1.5">{t('cell.sidebar.regulators')}</p>
                {j.regulators.map((r, i) => (
                  <p key={i} className="text-xs text-[#586064] mb-0.5">{r}</p>
                ))}
              </div>
            )}
            {j.primary_legislation.length > 0 && (
              <div>
                <p className="text-[10px] text-[#9ca3af] uppercase mb-1.5">{t('cell.sidebar.primaryLegislation')}</p>
                {j.primary_legislation.map((leg, i) => (
                  <p key={i} className="text-xs text-[#586064] mb-0.5">{leg}</p>
                ))}
              </div>
            )}
          </div>

          {/* Other issues in this jurisdiction */}
          <div className="bg-white border border-[#DBE4E7] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#2B3437] uppercase tracking-wide mb-3">
              {t('cell.sidebar.otherIssues', { jurisdictionCode: j.code })}
            </h3>
            <div className="space-y-1">
              {siblingIssues.map((si) => {
                const sibCell = getCell(matrix, jurisdiction, si.code);
                const sig = sibCell?.status_signal ?? 'placeholder';
                const meta = signals[sig];
                return (
                  <Link
                    key={si.code}
                    to={`/compliance/${jurisdiction}/${si.code}`}
                    className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-[#EAEFF1] transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: meta.dot }}
                    />
                    <span className="text-xs text-[#586064]">{si.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Back link */}
          <Link
            to="/compliance"
            className="flex items-center gap-1 text-xs text-[#5E5C75] hover:underline"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t('cell.sidebar.backToMatrix')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
