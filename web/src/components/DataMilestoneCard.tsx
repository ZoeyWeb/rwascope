import type { IntelligenceItem } from '../types/intelligence';
import { REGION_META } from '../types/intelligence';

interface DataDriver {
  name: string;
  change: string;
}

interface Props {
  item: IntelligenceItem;
  drivers?: DataDriver[];
}

export default function DataMilestoneCard({ item, drivers }: Props) {
  // Keep REGION_META import alive for region label — colour no longer used
  const regionLabel = REGION_META[item.region].label.split(' ')[0];

  return (
    <div className="bg-ed-info-bg border-l-2 border-ed-type-research p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[15px] text-ed-type-research">bar_chart</span>
        <span className="text-ed-eyebrow uppercase text-ed-type-research">Data Milestone</span>
        <span className="ml-auto bg-ed-chip-bg text-ed-chip-text text-[11px] uppercase tracking-wide px-2 py-0.5">
          {regionLabel}
        </span>
      </div>

      <p className="text-ed-block-h3 text-ed-text-primary mb-2">{item.title}</p>

      {item.policy_summary && (
        <p className="text-ed-body text-ed-text-secondary leading-relaxed mb-3">{item.policy_summary}</p>
      )}

      {drivers && drivers.length > 0 && (
        <div className="mt-2">
          <span className="block text-ed-eyebrow uppercase text-ed-type-research mb-1.5">Primary drivers</span>
          <ul className="space-y-1">
            {drivers.map((d, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-ed-body text-ed-text-secondary">{d.name}</span>
                <span className="text-ed-body text-ed-type-research font-medium">{d.change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-ed-divider flex items-center gap-2 flex-wrap">
        <span className="text-ed-meta tabular-nums text-ed-text-muted font-mono">{item.event_date}</span>
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors"
          >
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            {item.source_name || 'Source'}
          </a>
        )}
      </div>

      <p className="text-ed-meta text-ed-text-faint mt-2">Factual data record · no platform attribution</p>
    </div>
  );
}
