import { useState } from 'react';

type CiteFormat = 'BibTeX' | 'APA' | 'Chicago';

interface CiteFormatTabsProps {
  bibtex: string;
  apa: string;
  chicago: string;
}

export default function CiteFormatTabs({ bibtex, apa, chicago }: CiteFormatTabsProps) {
  const [tab, setTab] = useState<CiteFormat>('BibTeX');
  const [copied, setCopied] = useState(false);

  const citations: Record<CiteFormat, string> = { BibTeX: bibtex, APA: apa, Chicago: chicago };

  const copy = () => {
    navigator.clipboard.writeText(citations[tab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-4 border border-ed-hairline">
      <div className="flex border-b border-ed-hairline">
        {(['BibTeX', 'APA', 'Chicago'] as CiteFormat[]).map(f => (
          <button
            key={f}
            onClick={() => { setTab(f); setCopied(false); }}
            className={`flex-1 py-2 text-ed-meta font-medium transition-colors ${
              tab === f
                ? 'bg-ed-ink text-white'
                : 'text-ed-text-muted hover:text-ed-ink hover:bg-ed-surface-cool'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <pre className="text-[11px] text-ed-text-secondary leading-relaxed whitespace-pre-wrap break-all bg-ed-surface-cool p-4 font-mono">
        {citations[tab]}
      </pre>
      <div className="flex justify-end px-4 py-2.5 border-t border-ed-hairline">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-ed-meta text-ed-text-muted hover:text-ed-ink transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[15px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  );
}
