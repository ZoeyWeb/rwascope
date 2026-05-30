import { useState } from 'react';

interface CopyableBlockProps {
  label: string;
  content: string;
  className?: string;
}

export default function CopyableBlock({ label, content, className = '' }: CopyableBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`border border-ed-hairline bg-ed-surface-cool ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ed-hairline">
        <span className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
          {label}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-ed-meta text-ed-text-muted hover:text-ed-ink transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span className="text-[11px]">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <p className="text-ed-body text-ed-text-secondary leading-relaxed p-4 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
