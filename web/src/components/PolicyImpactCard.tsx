import type { PolicyImpact } from '../types/intelligence';

function ArrowDown() {
  return (
    <div className="flex justify-center my-1.5">
      <span className="material-symbols-outlined text-[18px] text-ed-text-faint">arrow_downward</span>
    </div>
  );
}

interface Props {
  eventTitle: string;
  impact: PolicyImpact;
}

export default function PolicyImpactCard({ eventTitle, impact }: Props) {
  return (
    <div className="border-l-2 border-ed-type-policy bg-ed-warn-bg mt-3">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-ed-warn-text">trending_up</span>
          <span className="text-ed-eyebrow uppercase text-ed-warn-text">Policy → Market Impact</span>
        </div>
        <span className="text-ed-meta text-ed-warn-text opacity-60">AI-generated · verify against source</span>
      </div>

      <div className="px-4 pb-4 pt-1 space-y-0">
        {/* Layer 1 — Policy event */}
        <div className="px-3 py-2.5 bg-ed-surface-sunken border-l border-ed-hairline">
          <span className="block text-ed-eyebrow uppercase text-ed-warn-text mb-1">① Policy event</span>
          <p className="text-ed-body font-medium leading-snug text-ed-text-primary">{eventTitle}</p>
        </div>

        <ArrowDown />

        {/* Layer 2 — Benefited sectors */}
        <div className="px-3 py-2.5 bg-ed-success-bg border-l border-ed-hairline">
          <span className="block text-ed-eyebrow uppercase text-ed-success-text mb-1.5">② Benefited sectors</span>
          <ul className="space-y-1">
            {impact.benefited_sectors.map((s, i) => (
              <li key={i} className="text-ed-body leading-snug flex gap-1.5 text-ed-success-text">
                <span className="shrink-0 font-bold mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <ArrowDown />

        {/* Layer 3 — Affected entity types */}
        <div className="px-3 py-2.5 bg-ed-surface-sunken border-l border-ed-hairline">
          <span className="block text-ed-eyebrow uppercase text-ed-text-muted mb-1.5">③ Affected entity types</span>
          <ul className="space-y-1">
            {impact.affected_entities.map((e, i) => (
              <li key={i} className="text-ed-body leading-snug flex gap-1.5 text-ed-text-secondary">
                <span className="shrink-0 font-bold mt-0.5 text-ed-text-muted">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>

        <ArrowDown />

        {/* Layer 4 — Capital flow */}
        <div className="px-3 py-2.5 bg-ed-info-bg border-l border-ed-hairline">
          <span className="block text-ed-eyebrow uppercase text-ed-info-text mb-1.5">④ Expected capital flow</span>
          <p className="text-ed-body font-medium leading-snug text-ed-info-text">
            {impact.capital_flow.from}
            <span className="mx-1.5 font-bold">→</span>
            {impact.capital_flow.to}
          </p>
          {(impact.capital_flow.estimated_scale || impact.capital_flow.timeframe) && (
            <p className="text-ed-meta text-ed-info-text opacity-60 mt-1.5">
              {impact.capital_flow.estimated_scale && `Est. scale: ${impact.capital_flow.estimated_scale}`}
              {impact.capital_flow.estimated_scale && impact.capital_flow.timeframe && ' · '}
              {impact.capital_flow.timeframe && impact.capital_flow.timeframe}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
