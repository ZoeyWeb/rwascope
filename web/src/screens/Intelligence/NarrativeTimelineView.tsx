import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  IntelligenceItem,
  IntelligenceRegion,
  IntelligenceEventType,
  NarrativeThread,
  NarrativeExpectedEvent,
} from '../../types/intelligence';
import { intelligenceApi } from '../../api/client';
import NarrativeSubscribeButton from '../../components/NarrativeSubscribeButton';
import { Eyebrow } from '../../components/Eyebrow';
import { FilterPill } from '../../components/FilterPill';
import { NarrativeCarousel } from './NarrativeCarousel';

const ALL_EVENT_TYPES: Array<IntelligenceEventType | 'all'> = [
  'all', 'regulation', 'institutional', 'project', 'research', 'data_milestone',
];
const ALL_REGIONS: Array<IntelligenceRegion | 'all'> = ['all', 'us', 'eu', 'hk', 'sg', 'uae', 'global'];
const EVENT_TYPE_LABELS: Record<string, string> = {
  all: 'All', regulation: 'Policy', institutional: 'Institution',
  project: 'Project', research: 'Research', data_milestone: 'Data',
};

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

  const [activeEventType, setActiveEventType] = useState<IntelligenceEventType | 'all'>('all');
  const [activeRegion, setActiveRegion] = useState<IntelligenceRegion | 'all'>('all');

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

  const filteredEvents = useMemo(() => {
    return pastEvents
      .filter(i => activeEventType === 'all' || (i.event_type ?? 'regulation') === activeEventType)
      .filter(i => activeRegion === 'all' || i.region === activeRegion);
  }, [pastEvents, activeEventType, activeRegion]);

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

          {/* Events carousel */}
          {pastEvents.length === 0 ? (
            <div className="text-center py-12 text-ed-body text-ed-text-muted">
              No events recorded for this narrative yet.
            </div>
          ) : (
            <div>
              {/* Filters */}
              <div className="mb-8 space-y-4 border-y border-ed-hairline py-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <Eyebrow className="w-16 shrink-0">Type</Eyebrow>
                  <div className="flex flex-wrap gap-2">
                    {ALL_EVENT_TYPES.map(t => (
                      <FilterPill key={t} active={activeEventType === t} onClick={() => setActiveEventType(t)}>
                        {EVENT_TYPE_LABELS[t]}
                      </FilterPill>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Eyebrow className="w-16 shrink-0">Region</Eyebrow>
                  <div className="flex flex-wrap gap-2">
                    {ALL_REGIONS.map(r => (
                      <FilterPill key={r} active={activeRegion === r} onClick={() => setActiveRegion(r)}>
                        {r === 'all' ? 'All' : r.toUpperCase()}
                      </FilterPill>
                    ))}
                  </div>
                </div>
              </div>
              <NarrativeCarousel items={filteredEvents} />

              {expectedEvents.length > 0 && (
                <div className="mt-8">
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
                </div>
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
