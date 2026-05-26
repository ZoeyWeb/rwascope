import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import glossaryData from '../../../public/data/glossary/glossary.json';

type Term = (typeof glossaryData.terms)[number];

export default function Glossary() {
  const [query, setQuery] = useState('');
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const terms = [...glossaryData.terms].sort((a, b) =>
      a.term.localeCompare(b.term),
    );
    if (!q) return terms;
    return terms.filter(
      t =>
        t.term.toLowerCase().includes(q) ||
        t.short.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q),
    );
  }, [query]);

  const letters = useMemo(
    () => [...new Set(filtered.map(t => t.term[0].toUpperCase()))].sort(),
    [filtered],
  );

  function toggle(slug: string) {
    setOpenSlug(prev => (prev === slug ? null : slug));
  }

  return (
    <div className="min-h-screen bg-[#F1F4F6]">
      {/* Header */}
      <div className="bg-white border-b border-[#DBE4E7]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5E5C75] mb-2">
            Framework
          </div>
          <h1 className="font-headline text-3xl font-bold text-[#2B3437]">
            Glossary
          </h1>
          <p className="mt-2 text-sm text-[#737C7F]">
            Key terms used across RARM, SARM, and the RWAscope platform.
          </p>

          <div className="mt-6 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737C7F] text-[18px] select-none">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search terms…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F1F4F6] border border-[#DBE4E7] rounded-lg text-[#2B3437] placeholder-[#737C7F] focus:outline-none focus:border-[#5E5C75] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Term list */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {filtered.length === 0 && (
          <p className="text-sm text-[#737C7F] py-8 text-center">
            No terms match &ldquo;{query}&rdquo;
          </p>
        )}

        {letters.map(letter => {
          const group = filtered.filter(t => t.term[0].toUpperCase() === letter);
          return (
            <div key={letter} className="mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-[#5E5C75] mb-3 pb-1 border-b border-[#DBE4E7]">
                {letter}
              </div>
              <div className="space-y-1">
                {group.map(term => (
                  <TermRow
                    key={term.slug}
                    term={term}
                    open={openSlug === term.slug}
                    onToggle={() => toggle(term.slug)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <p className="mt-12 text-xs text-[#737C7F] text-center">
          {glossaryData.terms.length} terms · last updated {glossaryData.updated_at}
        </p>
      </div>
    </div>
  );
}

function TermRow({
  term,
  open,
  onToggle,
}: {
  term: Term;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      id={term.slug}
      className="bg-white border border-[#DBE4E7] rounded-lg overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-[#EAEFF1] transition-colors"
      >
        <div className="min-w-0">
          <span className="text-sm font-semibold text-[#2B3437]">{term.term}</span>
          {!open && (
            <span className="ml-3 text-sm text-[#737C7F]">— {term.short}</span>
          )}
        </div>
        <span className="material-symbols-outlined text-[18px] text-[#737C7F] shrink-0 mt-0.5 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#F1F4F6]">
          <p className="mt-4 text-sm text-[#2B3437] leading-relaxed">
            {term.definition}
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-xs">
            {term.rarm_layers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[#737C7F]">RARM layers:</span>
                <div className="flex flex-wrap gap-1">
                  {term.rarm_layers.map(l => (
                    <span
                      key={l}
                      className="px-2 py-0.5 rounded-full bg-[#5E5C75]/10 text-[#5E5C75] font-medium capitalize"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {term.related_terms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[#737C7F]">See also:</span>
                <div className="flex flex-wrap gap-1">
                  {term.related_terms.map(slug => (
                    <button
                      key={slug}
                      onClick={e => {
                        e.stopPropagation();
                        const el = document.getElementById(slug);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="px-2 py-0.5 rounded-full bg-[#F1F4F6] text-[#5E5C75] hover:bg-[#DBE4E7] transition-colors font-medium"
                    >
                      {slug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {term.see_also_module && (
              <Link
                to={term.see_also_module.path}
                className="flex items-center gap-1 text-[#5E5C75] hover:text-[#2B3437] transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                {term.see_also_module.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
