import { useState, useRef, useEffect } from 'react';
import type { Incident } from '../types/incident';

type CiteFormat = 'BibTeX' | 'APA' | 'Chicago';

function buildBibTeX(inc: Incident): string {
  const key = inc.incident_id.replace(/-/g, '');
  const { short_title, first_published_year } = inc.citation_meta;
  return `@misc{rwascope${key},
  author    = {{RWAscope Research}},
  title     = {{${short_title}: Postmortem Analysis (${inc.incident_id})}},
  year      = {${first_published_year}},
  publisher = {HKUST RWAscope},
  url       = {https://rwa-index.com${inc.permalink}},
  note      = {Incident date: ${inc.incident_date}}
}`;
}

function buildAPA(inc: Incident): string {
  const { short_title, first_published_year } = inc.citation_meta;
  return `RWAscope Research. (${first_published_year}). ${short_title}: Postmortem analysis (${inc.incident_id}). HKUST RWAscope. https://rwa-index.com${inc.permalink}`;
}

function buildChicago(inc: Incident): string {
  const { short_title, first_published_year } = inc.citation_meta;
  return `RWAscope Research. "${short_title}: Postmortem Analysis (${inc.incident_id})." HKUST RWAscope, ${first_published_year}. https://rwa-index.com${inc.permalink}.`;
}

export default function CiteButton({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CiteFormat>('BibTeX');
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const citations: Record<CiteFormat, string> = {
    BibTeX:  buildBibTeX(incident),
    APA:     buildAPA(incident),
    Chicago: buildChicago(incident),
  };

  const copy = () => {
    navigator.clipboard.writeText(citations[tab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors font-medium"
      >
        <span className="material-symbols-outlined text-[15px]">format_quote</span>
        Cite
        <span className="material-symbols-outlined text-[13px] opacity-60">expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-ed-surface border border-ed-hairline shadow-ed-card z-50 p-4 space-y-3">
          {/* Format tabs */}
          <div className="flex gap-0 border border-ed-hairline">
            {(['BibTeX', 'APA', 'Chicago'] as CiteFormat[]).map(f => (
              <button
                key={f}
                onClick={() => { setTab(f); setCopied(false); }}
                className={`flex-1 py-1.5 text-ed-meta font-medium transition-colors ${
                  tab === f
                    ? 'bg-ed-ink text-white'
                    : 'text-ed-text-muted hover:text-ed-ink hover:bg-ed-surface-cool'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Citation text */}
          <pre className="text-[11px] text-ed-text-secondary leading-relaxed whitespace-pre-wrap break-all bg-ed-surface-cool border border-ed-hairline p-3 font-mono">
            {citations[tab]}
          </pre>

          {/* Copy button */}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[15px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      )}
    </div>
  );
}
