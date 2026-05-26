import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { EnsembleData, EnsembleUseCase, EnsemblePhase } from '../../types/ensemble';
import {
  PHASE_META,
  PHASE_DOT,
  USE_CASE_STATUS_META,
  THEME_ACCENT,
} from '../../utils/ensemble';
import DisclaimerBanner from '../../components/DisclaimerBanner';

const DISCLAIMER =
  "This tracker compiles publicly available information from HKMA press releases and reported media. Participation details marked \"not publicly enumerated\" reflect HKMA's own disclosure practice — RWA-Index does not have access to non-public use case data.";

function PhaseBadge({ phase }: { phase: EnsemblePhase }) {
  const meta = PHASE_META[phase];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PHASE_DOT[phase] }} />
      {meta.label}
    </span>
  );
}

function UseCaseCard({
  uc,
  data,
  expanded,
  onToggle,
}: {
  uc: EnsembleUseCase;
  data: EnsembleData;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusMeta = USE_CASE_STATUS_META[uc.status] ?? USE_CASE_STATUS_META['not-publicly-detailed'];
  const theme = data.themes.find((t) => t.code === uc.theme);
  const accent = THEME_ACCENT[uc.theme] ?? '#5E5C75';

  return (
    <div className="bg-white border border-[#DBE4E7] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-[#EAEFF1] transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Theme chip */}
            {theme && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: accent }}
                />
                <span className="text-[10px] font-medium text-[#737C7F] uppercase tracking-wide">
                  {theme.title}
                </span>
              </div>
            )}
            <h3 className="text-sm font-semibold text-[#2B3437]">{uc.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <PhaseBadge phase={uc.phase} />
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ background: statusMeta.bg, color: statusMeta.color }}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-sm text-[#737C7F] flex-shrink-0 mt-1">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#DBE4E7]">
          <div className="pt-3 space-y-3">
            {/* Description */}
            <p className="text-sm text-[#2B3437] leading-relaxed">{uc.description}</p>

            {/* Participation disclosure */}
            <div className="bg-[#f8f9fa] rounded p-3">
              <p className="text-xs font-medium text-[#737C7F] mb-1">Participation Disclosed</p>
              <p className="text-xs text-[#586064] leading-relaxed">
                {uc.participating_institutions_disclosed}
              </p>
            </div>

            {/* Linked institutions */}
            {uc.linked_institutions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#737C7F] mb-1.5">Linked Institutions</p>
                <div className="flex flex-wrap gap-2">
                  {uc.linked_institutions.map((slug) => {
                    const inst = data.institutions.find((i) => i.slug === slug);
                    return inst ? (
                      <Link
                        key={slug}
                        to={`/ensemble/institutions/${slug}`}
                        className="text-xs px-2 py-0.5 rounded bg-[#dbeafe] text-[#1e40af] hover:bg-[#bfdbfe] transition-colors"
                      >
                        {inst.shortName}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Sources */}
            {uc.sources.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#737C7F] mb-1">Sources</p>
                <div className="space-y-1">
                  {uc.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-[#5E5C75] hover:underline"
                    >
                      {src.title} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EnsembleUseCases() {
  const [data, setData] = useState<EnsembleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const themeFilter = searchParams.get('theme') ?? 'all';

  useEffect(() => {
    fetch('/data/ensemble/ensemble.json')
      .then((r) => r.json())
      .then((d: EnsembleData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#737C7F] text-sm">Loading use cases…</span>
      </div>
    );
  }
  if (!data) return null;

  const filteredUseCases = themeFilter === 'all'
    ? data.use_cases
    : data.use_cases.filter((uc) => uc.theme === themeFilter);

  function setThemeFilter(code: string) {
    if (code === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ theme: code });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <Link to="/ensemble" className="hover:text-[#2B3437] transition-colors">Ensemble</Link>
        <span>›</span>
        <span className="text-[#2B3437]">Use Cases</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#2B3437] font-headline mb-1">Use Case Database</h1>
      <p className="text-sm text-[#737C7F] mb-5">
        {data.use_cases.length} publicly disclosed use cases across {data.themes.length} themes.
      </p>

      <DisclaimerBanner text={DISCLAIMER} className="mb-5" />

      {/* Theme filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setThemeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            themeFilter === 'all'
              ? 'bg-[#2B3437] text-white border-[#2B3437]'
              : 'bg-white text-[#737C7F] border-[#DBE4E7] hover:border-[#5E5C75] hover:text-[#5E5C75]'
          }`}
        >
          All themes
        </button>
        {data.themes.map((theme) => {
          const accent = THEME_ACCENT[theme.code] ?? '#5E5C75';
          const isActive = themeFilter === theme.code;
          return (
            <button
              key={theme.code}
              onClick={() => setThemeFilter(theme.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                isActive
                  ? 'text-white border-transparent'
                  : 'bg-white text-[#737C7F] border-[#DBE4E7] hover:border-[#5E5C75] hover:text-[#5E5C75]'
              }`}
              style={isActive ? { background: accent, borderColor: accent } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isActive ? 'white' : accent }}
              />
              {theme.title}
            </button>
          );
        })}
      </div>

      {/* Use case count */}
      <p className="text-xs text-[#737C7F] mb-3">
        Showing {filteredUseCases.length} of {data.use_cases.length} use cases
      </p>

      {/* Use case cards */}
      <div className="space-y-3">
        {filteredUseCases.map((uc) => (
          <UseCaseCard
            key={uc.slug}
            uc={uc}
            data={data}
            expanded={expandedSlug === uc.slug}
            onToggle={() => setExpandedSlug(expandedSlug === uc.slug ? null : uc.slug)}
          />
        ))}
      </div>

      {filteredUseCases.length === 0 && (
        <p className="text-sm text-[#737C7F] py-12 text-center">
          No use cases match the selected theme.
        </p>
      )}
    </div>
  );
}
