interface DownloadCardProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  size: string;
  external?: boolean;
}

export default function DownloadCard({
  eyebrow,
  title,
  description,
  href,
  size,
  external = false,
}: DownloadCardProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      download={!external ? true : undefined}
      className="group flex flex-col px-8 py-ed-section-sm hover:bg-ed-surface-cool transition-colors border-r border-ed-hairline last:border-r-0 cursor-pointer"
    >
      <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
        {eyebrow}
      </div>
      <h3 className="text-ed-block-h3 text-ed-ink mt-3">{title}</h3>
      <p className="text-ed-body text-ed-text-secondary mt-2 flex-1">{description}</p>
      <div className="flex items-center justify-between mt-ed-section-sm">
        <span className="text-ed-meta text-ed-text-faint">{size}</span>
        <span className="material-symbols-outlined text-[20px] text-ed-text-muted group-hover:text-ed-ink transition-colors">
          {external ? 'open_in_new' : 'download'}
        </span>
      </div>
    </a>
  );
}
