import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  IntelligenceItem,
  IntelligenceRegion,
  NarrativeThread,
  NarrativeExpectedEvent,
} from '../../types/intelligence';
import { REGION_META } from '../../types/intelligence';
import { intelligenceApi } from '../../api/client';
import PolicyImpactCard from '../../components/PolicyImpactCard';
import NarrativeSubscribeButton from '../../components/NarrativeSubscribeButton';
import { Eyebrow } from '../../components/Eyebrow';

const TYPE_STRIPE_HEX: Record<string, string> = {
  regulation:     '#B45309',
  institutional:  '#6D28D9',
  project:        '#047857',
  research:       '#1D4ED8',
  data_milestone: '#475569',
  incident:       '#B91C1C',
};

function typeTextClass(t?: string): string {
  switch (t) {
    case 'regulation':     return 'text-ed-type-policy';
    case 'institutional':  return 'text-ed-type-institution';
    case 'project':        return 'text-ed-type-project';
    case 'research':       return 'text-ed-type-research';
    case 'data_milestone': return 'text-ed-type-data';
    case 'incident':       return 'text-ed-type-incident';
    default:               return 'text-ed-type-policy';
  }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  regulation:     'Policy',
  institutional:  'Institution',
  project:        'Project',
  research:       'Research',
  data_milestone: 'Data',
  incident:       'Incident',
};

function RegionChip({ region }: { region: IntelligenceRegion }) {
  return (
    <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 bg-ed-surface-sunken text-ed-chip-text">
      {REGION_META[region].label.split(' ')[0]}
    </span>
  );
}

function PastEventNode({
  item,
  expanded,
  onToggle,
}: {
  item: IntelligenceItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stripeHex = TYPE_STRIPE_HEX[item.event_type ?? 'regulation'] ?? '#B45309';
  const textCls = typeTextClass(item.event_type);

  return (
    <div className="relative border-b border-ed-hairline-faint hover:bg-ed-surface-cool transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: stripeHex }} />

      <button onClick={onToggle} className="w-full text-left pl-6 pr-10 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-ed-meta tabular-nums text-ed-text-muted font-mono">{item.event_date}</span>
          <RegionChip region={item.region} />
          <span className={`text-[11px] uppercase tracking-wide ${textCls}`}>
            {EVENT_TYPE_LABELS[item.event_type ?? 'regulation'] ?? 'Policy'}
          </span>
          <span
            className="ml-auto text-ed-text-faint material-symbols-outlined text-[18px] transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </div>
        <h3 className="text-ed-block-h3 text-ed-text-primary leading-snug">{item.title}</h3>
        {item.narrative_impact_note && (
          <p className="text-ed-body text-ed-accent mt-1 leading-relaxed italic">{item.narrative_impact_note}</p>
        )}
      </button>

      {expanded && (
        <div className="pl-6 pr-4 pb-5 pt-3 border-t border-ed-hairline-faint space-y-3">
          {item.policy_summary && (
            <p className="text-ed-body text-ed-text-secondary leading-relaxed">{item.policy_summary}</p>
          )}

          {item.policy_impact && (
            <PolicyImpactCard eventTitle={item.title} impact={item.policy_impact} />
          )}

          {!item.policy_impact && item.market_impact.capital_flow && (
            <div className="bg-ed-warn-bg border-l-2 border-ed-type-policy p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-ed-warn-text text-[14px]">trending_up</span>
                <span className="text-ed-eyebrow uppercase text-ed-warn-text">Policy → Market</span>
                <span className="ml-auto text-ed-meta text-ed-warn-text opacity-60">verify against source</span>
              </div>
              <p className="text-ed-body text-ed-text-secondary">{item.market_impact.capital_flow}</p>
            </div>
          )}

          {item.source_url && (
            <div className="pt-2 border-t border-ed-hairline-faint">
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                {item.source_name || 'Official source'}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpectedEventNode({ event }: { event: NarrativeExpectedEvent }) {
  return (
    <div className="relative border-b border-dashed border-ed-hairline pl-6 pr-4 py-4">
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ed-accent opacity-30" />
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-ed-meta font-mono text-ed-accent">{event.quarter}</span>
        <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 bg-ed-surface-sunken text-ed-accent">
          Expected
        </span>
      </div>
      <p className="text-ed-block-h3 text-ed-text-primary leading-snug">{event.description}</p>
      {event.impact && (
        <p className="text-ed-body text-ed-text-muted mt-1 leading-relaxed italic">{event.impact}</p>
      )}
    </div>
  );
}

export default function NarrativeTimelineView() {
  const { slug } = useParams<{ slug: string }>();

  const [narrative, setNarrative] = useState<NarrativeThread | null>(null);
  const [pastEvents, setPastEvents] = useState<IntelligenceItem[]>([]);
  const [expectedEvents, setExpectedEvents] = useState<NarrativeExpectedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    intelligenceApi.narrativeTimeline(slug)
      .then(res => {
        setNarrative(res.narrative);
        setPastEvents(res.past_events);
        setExpectedEvents(res.expected_events);
      })
      .catch(() => setError('Failed to load narrative.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-ed-accent">progress_activity</span>
      </div>
    );
  }

  if (error || !narrative || !slug) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-ed-type-incident text-ed-body">
        {error ?? 'Narrative not found.'}
      </div>
    );
  }

  return (
    <div className="bg-ed-canvas min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <nav className="flex items-center gap-1.5 text-ed-meta text-ed-text-muted mb-6">
          <Link to="/intelligence" className="hover:text-ed-text-primary transition-colors">Intelligence</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-ed-text-secondary">Narrative Timeline</span>
        </nav>

        <div className="space-y-ed-section">
          {/* Narrative header */}
          <div className="bg-ed-surface shadow-ed-card p-ed-block">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <Eyebrow className="mb-2">Active Narrative</Eyebrow>
                <h1 className="text-ed-section-h2 text-ed-text-primary mb-2">{narrative.name}</h1>
                {narrative.description && (
                  <p className="text-ed-body text-ed-text-secondary leading-relaxed">{narrative.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-ed-meta text-ed-text-muted">
                  <span>
                    <span className="font-medium text-ed-text-primary">{pastEvents.length}</span> events in timeline
                  </span>
                  {narrative.weekly_new_count > 0 && (
                    <span>
                      <span className="font-medium text-ed-accent">+{narrative.weekly_new_count}</span> this week
                    </span>
                  )}
                  {expectedEvents.length > 0 && (
                    <span>
                      <span className="font-medium text-ed-accent">{expectedEvents.length}</span> expected next
                    </span>
                  )}
                </div>
              </div>
              <NarrativeSubscribeButton narrativeSlug={slug} />
            </div>
          </div>

          {/* Timeline */}
          {pastEvents.length === 0 ? (
            <div className="text-center py-12 text-ed-body text-ed-text-muted">
              No events recorded for this narrative yet.
            </div>
          ) : (
            <div className="bg-ed-surface shadow-ed-card overflow-hidden">
              <div className="px-ed-block py-3 border-b border-ed-hairline-faint">
                <Eyebrow>Timeline · Oldest → Most Recent</Eyebrow>
              </div>
              <div>
                {pastEvents.map(item => (
                  <PastEventNode
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  />
                ))}
              </div>

              {expectedEvents.length > 0 && (
                <>
                  <div className="flex items-center gap-3 px-ed-block py-3 bg-ed-surface-sunken border-t border-b border-ed-hairline-faint">
                    <div className="h-px flex-1 bg-ed-hairline" />
                    <span className="text-ed-eyebrow uppercase text-ed-accent px-2">Expected Next</span>
                    <div className="h-px flex-1 bg-ed-hairline" />
                  </div>
                  <div>
                    {expectedEvents.map((ev, idx) => (
                      <ExpectedEventNode key={idx} event={ev} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Editorial disclaimer */}
          <div className="bg-ed-surface-sunken px-ed-block py-4">
            <p className="text-ed-meta text-ed-text-muted leading-relaxed">
              <span className="font-medium text-ed-text-secondary">Editorial note: </span>
              Narrative threads are editorially curated. "Expected next" events reflect public announcements
              and editorial analysis — not investment advice or platform predictions. Expected events are clearly
              labelled and may not materialise.
            </p>
          </div>

          <div className="pt-2 border-t border-ed-hairline">
            <Link
              to="/intelligence"
              className="inline-flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Back to Intelligence
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
