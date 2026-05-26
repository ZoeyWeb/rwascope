import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type {
  IntelligenceItem,
  IntelligenceMeta,
  IntelligenceWeeklyBrief,
  IntelligenceRegion,
  IntelligenceEventType,
  NarrativeThread,
  EditorNote,
  DashboardData,
} from '../../types/intelligence';
import { REGION_META } from '../../types/intelligence';
import PolicyImpactCard from '../../components/PolicyImpactCard';
import { intelligenceApi } from '../../api/client';
import { inferTier } from '../../utils/inferTier';

// ── Constants ────────────────────────────────────────────────────────────────

const REGION_ORDER: IntelligenceRegion[] = ['us', 'hk', 'eu', 'sg', 'uae', 'global'];

const ALL_REGIONS: Array<IntelligenceRegion | 'all'> = ['all', 'us', 'eu', 'hk', 'sg', 'uae', 'global'];
const ALL_EVENT_TYPES: Array<IntelligenceEventType | 'all'> = [
  'all', 'regulation', 'institutional', 'project', 'research', 'data_milestone',
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  all: 'All', regulation: 'Policy', institutional: 'Institution',
  project: 'Project', research: 'Research', data_milestone: 'Data',
};

const STATIC_FORWARD_ITEMS = [
  'HKMA: Stablecoin ordinance implementation rules expected Q3 2026 — technical standards under consultation',
  'SEC: Tokenized money market fund registration guidance expected Q2–Q3 2026',
  'MiCA: Full regulatory technical standards applicability from 30 July 2026',
];

// ── SectionDivider ────────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="my-ed-section">
      <div className="h-px bg-ed-hairline" />
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────

function HeroSection({ totalItems, isAdmin }: { totalItems: number; isAdmin: boolean }) {
  return (
    <section className="pt-ed-hero pb-ed-hero">
      <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-8">
        Regulatory · Institutional · Market Signals
      </div>
      <h1 className="text-ed-page-h1 text-ed-text-primary mb-10">
        Intelligence
      </h1>
      <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mb-12">
        A weekly read on real-world asset regulation, institutional moves,
        and structural signals across global markets.
      </p>
      <div className="flex items-center gap-6 text-ed-meta text-ed-text-muted flex-wrap">
        <span>{totalItems} milestones</span>
        <span className="text-ed-hairline">·</span>
        <span>Updated weekly</span>
        {isAdmin && (
          <>
            <span className="text-ed-hairline">·</span>
            <Link
              to="/intelligence/admin"
              className="text-ed-text-primary hover:text-ed-ink-hover underline underline-offset-4 decoration-ed-hairline hover:decoration-ed-ink transition-colors"
            >
              Review queue
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ── WeeklyBriefSection ────────────────────────────────────────────────────────

function WeeklyBriefSection({ brief }: { brief: IntelligenceWeeklyBrief }) {
  return (
    <section className="py-ed-section-md">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div className="text-ed-eyebrow uppercase text-ed-text-muted">
          Weekly Brief
        </div>
        <div className="text-ed-meta text-ed-text-muted">
          {brief.period_start} → {brief.period_end}
        </div>
      </div>
      <h2 className="text-ed-section-h2 text-ed-text-primary mb-10 max-w-[900px]">
        {brief.headline}
      </h2>
      <div className="space-y-8 max-w-[900px]">
        {brief.highlights.slice(0, 3).map((h, i) => (
          <div key={i} className="pl-6 border-l border-ed-hairline">
            <p className="text-ed-body-lg text-ed-text-secondary leading-loose">
              {h}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-right">
        <span className="text-[11px] text-ed-text-faint tracking-wide">
          AI summary · verify against source
        </span>
      </div>
    </section>
  );
}

// ── EditorialGrid1: Highlights | Forward View ─────────────────────────────────

function EditorialGrid1({
  highlights,
  forwardItems,
  onScrollToItem,
}: {
  highlights: IntelligenceItem[];
  forwardItems: IntelligenceItem[];
  onScrollToItem: (id: string) => void;
}) {
  const forward = forwardItems.length > 0
    ? forwardItems.map(i => i.title)
    : STATIC_FORWARD_ITEMS;

  return (
    <section className="py-ed-section-md relative w-screen left-1/2 -translate-x-1/2 bg-ed-surface-cool">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-ed-hairline">
          {/* Left: This Week's Highlights */}
          <div className="md:pr-16">
            <h3 className="text-ed-block-h3 text-ed-text-primary mb-10">
              This Week's Highlights
            </h3>
            {highlights.length === 0 ? (
              <p className="text-ed-body text-ed-text-muted">No landmark or major events in the past 7 days.</p>
            ) : (
              <ul className="divide-y divide-ed-hairline-faint">
                {highlights.slice(0, 5).map(item => (
                  <li key={item.id} className="py-6 first:pt-0 last:pb-0">
                    <button
                      onClick={() => onScrollToItem(item.id)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2 text-ed-meta text-ed-text-muted">
                        <span>{item.event_date}</span>
                        <span className="text-ed-hairline">·</span>
                        <span className="uppercase tracking-wider">{item.region.toUpperCase()}</span>
                      </div>
                      <h3 className="text-ed-item-h4 text-ed-text-primary leading-snug group-hover:text-ed-ink-hover transition-colors">
                        {item.title}
                      </h3>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right: Forward View */}
          <div className="md:pl-16 mt-16 md:mt-0">
            <h3 className="text-ed-block-h3 text-ed-text-primary mb-10">
              Forward View · Expected Q2–Q3 2026
            </h3>
            <ul className="space-y-6">
              {forward.map((text, i) => (
                <li key={i} className="pl-6 border-l border-ed-hairline">
                  <p className="text-ed-body text-ed-text-secondary leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-ed-meta text-ed-text-faint">
              Based on public announcements · Updated monthly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── EditorialGrid2: Active Narratives | Region Activity ───────────────────────

function EditorialGrid2({
  narratives,
  activity,
  activeNarrative,
  activeRegion,
  onSelectNarrative,
  onSelectRegion,
}: {
  narratives: NarrativeThread[];
  activity: Record<string, number>;
  activeNarrative: string | null;
  activeRegion: IntelligenceRegion | 'all';
  onSelectNarrative: (slug: string | null) => void;
  onSelectRegion: (r: IntelligenceRegion | 'all') => void;
}) {
  const max = Math.max(...Object.values(activity), 1);

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-ed-hairline">
        {/* Left: Active Narratives */}
        <div className="md:pr-16">
          <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-10">
            Active Narratives
          </div>
          {narratives.length === 0 ? (
            <p className="text-ed-body text-ed-text-muted">No active narratives yet.</p>
          ) : (
            <ul className="divide-y divide-ed-hairline-faint">
              {narratives.map(n => (
                <li key={n.slug} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between group">
                    <button
                      onClick={() => onSelectNarrative(activeNarrative === n.slug ? null : n.slug)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className={`text-ed-item-h4 transition-colors ${
                        activeNarrative === n.slug
                          ? 'text-ed-ink'
                          : 'text-ed-text-primary group-hover:text-ed-ink-hover'
                      }`}>
                        {n.name}
                      </span>
                      {n.weekly_new_count > 0 && (
                        <span className="ml-2 text-ed-meta text-ed-text-muted">
                          +{n.weekly_new_count}
                        </span>
                      )}
                    </button>
                    <Link
                      to={`/intelligence/narrative/${n.slug}`}
                      className="shrink-0 text-ed-meta text-ed-text-faint hover:text-ed-text-secondary transition-colors ml-4"
                    >
                      Timeline →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Region Activity */}
        <div className="md:pl-16 mt-16 md:mt-0">
          <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-10">
            Region Activity · 30 Days
          </div>
          {Object.keys(activity).length === 0 ? (
            <p className="text-ed-body text-ed-text-muted">No events in the past 30 days.</p>
          ) : (
            <ul className="space-y-5">
              {REGION_ORDER.filter(r => (activity[r] ?? 0) > 0).map(r => {
                const count = activity[r] ?? 0;
                const pct = Math.round((count / max) * 100);
                const isActive = activeRegion === r;
                return (
                  <li key={r}>
                    <button
                      onClick={() => onSelectRegion(isActive ? 'all' : r)}
                      className="w-full grid grid-cols-[64px_1fr_48px] items-center gap-6"
                    >
                      <span className={`text-ed-meta uppercase tracking-wider text-left transition-colors ${
                        isActive ? 'text-ed-ink font-medium' : 'text-ed-text-muted'
                      }`}>
                        {r.toUpperCase()}
                      </span>
                      <div className="h-[2px] bg-ed-hairline relative">
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                            isActive ? 'bg-ed-ink' : 'bg-ed-ink opacity-40'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-ed-meta text-right transition-colors ${
                        isActive ? 'text-ed-ink font-medium' : 'text-ed-text-secondary'
                      }`}>
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ── EditorNoteSection ─────────────────────────────────────────────────────────

function EditorNoteSection({ note }: { note: EditorNote }) {
  return (
    <section className="max-w-[900px] py-ed-section-sm">
      <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-8">
        Editor's Note
      </div>
      <blockquote className="pl-8 border-l border-ed-hairline">
        <p className="text-ed-body-lg text-ed-text-secondary leading-loose italic">
          {note.content}
        </p>
        <footer className="mt-6 text-ed-meta text-ed-text-muted not-italic">
          — {note.author}{note.week_label ? `, ${note.week_label}` : ''}
        </footer>
      </blockquote>
    </section>
  );
}

// ── NewsSection ───────────────────────────────────────────────────────────────

function NewsSection({ items }: { items: IntelligenceItem[] }) {
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  return (
    <section className="py-ed-section-md">
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">News</div>
          <span className="text-ed-meta text-ed-text-muted">{items.length} items</span>
        </div>
        <h2 className="text-ed-section-h2 text-ed-text-primary mb-3">Latest News</h2>
        <p className="text-ed-section-h2-light text-ed-text-muted">Recent regulatory and institutional events.</p>
      </div>

      {items.length === 0 ? (
        <p className="text-ed-body text-ed-text-muted py-8">No recent news items.</p>
      ) : (
        <>
          <ul className="divide-y divide-ed-hairline-faint">
            {items.slice(0, visibleCount).map(item => (
              <li key={item.id} className="py-5 first:pt-0">
                <div className="flex items-center gap-3 mb-1.5 text-ed-meta text-ed-text-muted flex-wrap">
                  <time className="tabular-nums">{item.event_date}</time>
                  <span className="text-ed-hairline">·</span>
                  <span className="uppercase tracking-wider">{item.region.toUpperCase()}</span>
                  <span className="text-ed-hairline">·</span>
                  <span className="uppercase tracking-wider">
                    {EVENT_TYPE_LABELS[item.event_type ?? 'regulation'] ?? item.event_type}
                  </span>
                </div>
                <h3 className="text-ed-item-h4 text-ed-text-primary mb-1.5 max-w-[900px]">
                  {item.title}
                </h3>
                <p className="text-ed-body text-ed-text-muted truncate max-w-[900px]">
                  {item.policy_summary}
                </p>
              </li>
            ))}
          </ul>

          {items.length > visibleCount && (
            <div className="flex justify-center pt-8 mt-4 border-t border-ed-hairline-faint">
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="text-ed-meta uppercase tracking-wider text-ed-text-secondary hover:text-ed-ink transition-colors"
              >
                Load {Math.min(PAGE_SIZE, items.length - visibleCount)} more →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── TimelineSection ───────────────────────────────────────────────────────────

function TimelineSection({
  items,
  totalAll,
  activeEventType,
  onSetEventType,
  activeRegion,
  onSetRegion,
  expandedId,
  onToggleExpanded,
  itemRefs,
}: {
  items: IntelligenceItem[];
  totalAll: number;
  activeEventType: IntelligenceEventType | 'all';
  onSetEventType: (t: IntelligenceEventType | 'all') => void;
  activeRegion: IntelligenceRegion | 'all';
  onSetRegion: (r: IntelligenceRegion | 'all') => void;
  expandedId: string | null;
  onToggleExpanded: (id: string) => void;
  itemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [items]);
  const visibleItems = items.slice(0, visibleCount);

  return (
    <section>
      {/* Count + filter rows */}
      <div className="flex justify-end mb-4 text-ed-meta text-ed-text-muted">
        <span>{items.length} of {totalAll}</span>
      </div>
      <div className="mb-12 space-y-4 border-y border-ed-hairline py-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-ed-eyebrow uppercase text-ed-text-muted w-16 shrink-0">Type</span>
          <div className="flex flex-wrap gap-2">
            {ALL_EVENT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => onSetEventType(t)}
                className={`px-3 py-1 text-ed-meta uppercase tracking-wider transition-colors ${
                  activeEventType === t
                    ? 'bg-ed-ink text-white'
                    : 'text-ed-text-secondary hover:text-ed-ink'
                }`}
              >
                {EVENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-ed-eyebrow uppercase text-ed-text-muted w-16 shrink-0">Region</span>
          <div className="flex flex-wrap gap-2">
            {ALL_REGIONS.map(r => {
              const label = r === 'all' ? 'All' : r.toUpperCase();
              return (
                <button
                  key={r}
                  onClick={() => onSetRegion(r)}
                  className={`px-3 py-1 text-ed-meta uppercase tracking-wider transition-colors ${
                    activeRegion === r
                      ? 'bg-ed-ink text-white'
                      : 'text-ed-text-secondary hover:text-ed-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline list */}
      {items.length === 0 ? (
        <p className="text-ed-body text-ed-text-muted py-16 text-center">
          No items match the current filters.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-ed-hairline-faint">
            {visibleItems.map(item => (
              <li key={item.id} className="py-8 first:pt-0">
                <div ref={el => { itemRefs.current[item.id] = el; }}>
                  {/* Collapsed view — always visible */}
                  <article
                    className="group cursor-pointer"
                    onClick={() => onToggleExpanded(item.id)}
                  >
                    <div className="flex items-center gap-3 mb-3 text-ed-meta text-ed-text-muted flex-wrap">
                      <time className="tabular-nums">{item.event_date}</time>
                      <span className="text-ed-hairline">·</span>
                      <span className="uppercase tracking-wider">{item.region.toUpperCase()}</span>
                      <span className="text-ed-hairline">·</span>
                      <span className="uppercase tracking-wider">
                        {EVENT_TYPE_LABELS[item.event_type ?? 'regulation'] ?? item.event_type}
                      </span>
                      {(item.significance === 'landmark' || item.significance === 'major') && (
                        <>
                          <span className="text-ed-hairline">·</span>
                          <span className="text-ed-incident uppercase tracking-wider font-medium">
                            {item.significance === 'landmark' ? 'Landmark' : 'Major'}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-ed-block-h3 text-ed-text-primary mb-3 group-hover:text-ed-ink-hover transition-colors max-w-[900px]">
                      {item.title}
                    </h3>
                    <p className="text-ed-body text-ed-text-secondary leading-relaxed max-w-[900px]">
                      {item.policy_summary}
                    </p>
                  </article>

                  {/* Expanded content */}
                  {expandedId === item.id && (
                    <div className="mt-6 space-y-6 max-w-[900px]">
                      {item.key_changes.length > 0 && (
                        <div>
                          <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-4">Key Changes</p>
                          <ul className="space-y-3">
                            {item.key_changes.map((c, i) => (
                              <li key={i} className="pl-6 border-l border-ed-hairline text-ed-body text-ed-text-secondary leading-relaxed">
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.market_impact?.capital_flow && (
                        <div>
                          <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-4">Policy → Market</p>
                          <p className="text-ed-body text-ed-text-secondary leading-relaxed mb-3">
                            {item.market_impact.capital_flow}
                          </p>
                          {item.market_impact.hk_relevance && (
                            <p className="pl-6 border-l border-ed-hairline text-ed-body text-ed-text-secondary leading-relaxed italic">
                              HK: {item.market_impact.hk_relevance}
                            </p>
                          )}
                          <p className="mt-3 text-[11px] text-ed-text-faint tracking-wide">
                            AI-generated · verify against source
                          </p>
                        </div>
                      )}

                      {item.timeline_significance && (
                        <p className="pl-6 border-l border-ed-hairline text-ed-body text-ed-text-muted leading-relaxed italic">
                          {item.timeline_significance}
                        </p>
                      )}

                      <div className="pt-4 border-t border-ed-hairline-faint flex items-center gap-6 flex-wrap">
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            {item.source_name ?? 'Source'} ↗
                          </a>
                        )}
                        <Link
                          to="/projects"
                          className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          Related projects →
                        </Link>
                        {item.market_impact?.hk_relevance && (
                          <Link
                            to="/intelligence/hk"
                            className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            HK Observation →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {items.length > visibleCount && (
            <div className="flex justify-center pt-12 mt-8 border-t border-ed-hairline-faint">
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="text-ed-meta uppercase tracking-wider text-ed-text-secondary hover:text-ed-ink transition-colors"
              >
                Load {Math.min(PAGE_SIZE, items.length - visibleCount)} more →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── RegionActivityStrip ───────────────────────────────────────────────────────

function RegionActivityStrip({
  activity,
  activeRegion,
  onSelectRegion,
}: {
  activity: Record<string, number>;
  activeRegion: IntelligenceRegion | 'all';
  onSelectRegion: (r: IntelligenceRegion | 'all') => void;
}) {
  const active = REGION_ORDER.filter(r => (activity[r] ?? 0) > 0);
  const max = Math.max(...active.map(r => activity[r] ?? 0), 1);
  if (active.length === 0) return null;

  return (
    <div className="flex items-end gap-8 flex-wrap border-b border-ed-hairline pb-6 mb-10">
      {active.map(r => {
        const count = activity[r] ?? 0;
        const pct = Math.round((count / max) * 100);
        const isActive = activeRegion === r;
        return (
          <button
            key={r}
            onClick={() => onSelectRegion(isActive ? 'all' : r)}
            className="flex flex-col items-start gap-1.5 min-w-[40px]"
          >
            <span className={`text-ed-meta tabular-nums transition-colors ${
              isActive ? 'text-ed-ink font-medium' : 'text-ed-text-secondary'
            }`}>
              {count}
            </span>
            <div className="w-10 h-[2px] bg-ed-hairline relative">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                  isActive ? 'bg-ed-ink' : 'bg-ed-ink opacity-40'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-ed-eyebrow uppercase tracking-wider transition-colors ${
              isActive ? 'text-ed-ink font-medium' : 'text-ed-text-muted'
            }`}>
              {r.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── NarrativeSection ──────────────────────────────────────────────────────────

function NarrativeSection({
  items,
  totalAll,
  activity,
  activeEventType,
  onSetEventType,
  activeRegion,
  onSetRegion,
  expandedId,
  onToggleExpanded,
  itemRefs,
}: {
  items: IntelligenceItem[];
  totalAll: number;
  activity: Record<string, number>;
  activeEventType: IntelligenceEventType | 'all';
  onSetEventType: (t: IntelligenceEventType | 'all') => void;
  activeRegion: IntelligenceRegion | 'all';
  onSetRegion: (r: IntelligenceRegion | 'all') => void;
  expandedId: string | null;
  onToggleExpanded: (id: string) => void;
  itemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  return (
    <section className="py-ed-section-lg relative w-screen left-1/2 -translate-x-1/2 bg-ed-surface-sunken">
      <div className="max-w-[1200px] mx-auto px-8">
        {/* Section header */}
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-4">
              Narrative
            </div>
            <p className="text-ed-section-h2-light text-ed-text-muted">
              How RWA got here, where it's going.
            </p>
          </div>
          <span className="text-ed-meta text-ed-text-muted">
            {totalAll} milestones
          </span>
        </div>

        {/* Horizontal region strip */}
        <RegionActivityStrip
          activity={activity}
          activeRegion={activeRegion}
          onSelectRegion={onSetRegion}
        />

        {/* Timeline (filter row + event stream) */}
        <TimelineSection
          items={items}
          totalAll={totalAll}
          activeEventType={activeEventType}
          onSetEventType={onSetEventType}
          activeRegion={activeRegion}
          onSetRegion={onSetRegion}
          expandedId={expandedId}
          onToggleExpanded={onToggleExpanded}
          itemRefs={itemRefs}
        />
      </div>
    </section>
  );
}

// ── SubscribeSection ──────────────────────────────────────────────────────────

function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const { publicApi } = await import('../../api/client');
      const res = await publicApi.subscribeNewsletter(email.trim());
      setMsg(res.message === 'already_subscribed'
        ? 'This email is already subscribed.'
        : 'Subscribed. Check your inbox for a confirmation.');
      setStatus('success');
    } catch {
      setMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <section className="max-w-[600px] py-ed-hero">
      <h2 className="text-ed-block-h3 text-ed-text-primary mb-4">
        Weekly Brief in your inbox
      </h2>
      <p className="text-ed-body text-ed-text-secondary mb-8">
        One email every Monday. Regulatory moves, institutional adoption,
        and structural shifts across global RWA markets.
      </p>

      {status === 'success' ? (
        <p className="text-ed-body text-ed-text-secondary">{msg}</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex gap-3 border-b border-ed-ink pb-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status === 'loading'}
              className="flex-1 bg-transparent text-ed-body text-ed-text-primary placeholder:text-ed-text-faint focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="text-ed-meta uppercase tracking-wider text-ed-ink hover:text-ed-ink-hover transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe →'}
            </button>
          </form>
          {status === 'error' && (
            <p className="text-ed-meta text-ed-incident mt-3">{msg}</p>
          )}
          <p className="text-ed-meta text-ed-text-faint mt-4">No spam. Unsubscribe any time.</p>
        </>
      )}
    </section>
  );
}

// ── Legacy helper components (preserved, not referenced in main render) ────────

function HighlightsBlock({
  items,
  onScrollToItem,
}: {
  items: IntelligenceItem[];
  onScrollToItem: (id: string) => void;
}) {
  return (
    <div className="bg-ed-surface p-8">
      <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-5">This Week's Highlights</p>
      {items.length === 0 ? (
        <p className="text-ed-body text-ed-text-muted">No landmark or major events in the past 7 days.</p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onScrollToItem(item.id)}
              className="w-full text-left group -mx-2 px-2 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-ed-meta tabular-nums text-ed-text-muted shrink-0">
                  {item.event_date}
                </span>
                <span className="text-[11px] uppercase tracking-wide px-2 py-0.5">
                  {REGION_META[item.region].label.split(' ')[0]}
                </span>
              </div>
              <p className="text-sm font-medium text-ed-text-primary leading-snug line-clamp-2">
                {item.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ForwardViewBlock({ items }: { items: IntelligenceItem[] }) {
  const STATIC_ITEMS = [
    'HKMA: Stablecoin ordinance implementation rules expected Q3 2026',
    'SEC: Tokenized money market fund registration guidance expected Q2–Q3 2026',
    'MiCA: Full regulatory technical standards applicability from 30 July 2026',
  ];
  return (
    <div className="bg-ed-surface p-8">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={14} strokeWidth={1.5} className="text-ed-text-muted shrink-0" />
        <p className="text-ed-eyebrow uppercase text-ed-text-muted">Forward View · Expected Q2–Q3 2026</p>
      </div>
      <ul className="space-y-3">
        {(items.length > 0 ? items.map(i => i.title) : STATIC_ITEMS).map((text, i) => (
          <li key={i} className="text-ed-body text-ed-text-secondary leading-relaxed">
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NarrativesBlock({
  narratives,
  activeNarrative,
  onSelect,
}: {
  narratives: NarrativeThread[];
  activeNarrative: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div className="bg-ed-surface p-8">
      <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-5">Active Narratives</p>
      {narratives.length === 0 ? (
        <p className="text-ed-body text-ed-text-muted">No active narratives yet.</p>
      ) : (
        <div className="space-y-1">
          {narratives.map(n => (
            <div key={n.slug} className="flex items-center gap-2 -mx-2 px-2 py-2">
              <button
                onClick={() => onSelect(activeNarrative === n.slug ? null : n.slug)}
                className="flex-1 min-w-0 text-left"
              >
                <span className={`text-sm font-medium ${
                  activeNarrative === n.slug ? 'text-ed-ink' : 'text-ed-text-primary'
                }`}>
                  {n.name}
                </span>
              </button>
              <Link
                to={`/intelligence/narrative/${n.slug}`}
                className="shrink-0 text-ed-meta text-ed-text-muted whitespace-nowrap"
              >
                Timeline →
              </Link>
              <Bell size={12} strokeWidth={1.5} className="shrink-0 text-ed-text-faint" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegionActivityBlock({
  activity,
  activeRegion,
  onSelectRegion,
}: {
  activity: Record<string, number>;
  activeRegion: IntelligenceRegion | 'all';
  onSelectRegion: (r: IntelligenceRegion | 'all') => void;
}) {
  const max = Math.max(...Object.values(activity), 1);
  return (
    <div className="bg-ed-surface p-8">
      <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-5">Region Activity · 30 Days</p>
      <div className="space-y-3">
        {REGION_ORDER.filter(r => (activity[r] ?? 0) > 0).map(r => {
          const count = activity[r] ?? 0;
          const pct = Math.round((count / max) * 100);
          const isActive = activeRegion === r;
          return (
            <button
              key={r}
              onClick={() => onSelectRegion(isActive ? 'all' : r)}
              className="w-full flex items-center gap-3"
            >
              <span className={`text-ed-meta uppercase w-8 shrink-0 text-right ${isActive ? 'text-ed-ink font-semibold' : 'text-ed-text-muted'}`}>
                {REGION_META[r].label.split(' ')[0].slice(0, 3)}
              </span>
              <div className="flex-1 bg-ed-hairline h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isActive ? 'bg-ed-ink' : 'bg-ed-ink opacity-40'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-ed-meta w-5 shrink-0 text-right ${isActive ? 'text-ed-ink font-semibold' : 'text-ed-text-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditorNoteBlock({ note }: { note: EditorNote | null }) {
  if (!note) return null;
  return (
    <div className="bg-ed-surface border-l-2 border-ed-ink p-ed-block">
      <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">
        Editor's Note · {note.week_label}
      </p>
      {note.title && <h3 className="text-ed-block-h3 text-ed-text-primary mb-3">{note.title}</h3>}
      <p className="text-ed-body text-ed-text-secondary leading-relaxed">{note.content}</p>
      <span className="text-ed-meta text-ed-text-muted mt-4 block">— {note.author}</span>
    </div>
  );
}

function WeeklyBriefCard({ brief }: { brief: IntelligenceWeeklyBrief }) {
  return (
    <div className="bg-ed-surface p-ed-block">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <span className="text-ed-meta text-ed-text-muted tabular-nums">
          {brief.period_start} → {brief.period_end}
        </span>
        <div className="flex items-center gap-1.5 text-ed-meta text-ed-text-faint">
          <Sparkles size={12} strokeWidth={1.5} />
          AI summary · verify against source
        </div>
      </div>
      <h2 className="text-ed-section-h2 text-ed-text-primary mt-3 mb-6">{brief.headline}</h2>
      <div className="space-y-3">
        {brief.highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-ed-text-faint shrink-0" />
            <span className="text-ed-body text-ed-text-secondary leading-relaxed">{h}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// PolicyImpactCard retained for legacy TimelineCard below

// ── Main screen ───────────────────────────────────────────────────────────────

interface PageData {
  meta: IntelligenceMeta;
  weekly_brief: IntelligenceWeeklyBrief | null;
  intelligence_items: IntelligenceItem[];
  dashboard: DashboardData | null;
}

export default function IntelligenceHome() {
  const { user } = useAuth();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeRegion, setActiveRegion] = useState<IntelligenceRegion | 'all'>('all');
  const [activeEventType, setActiveEventType] = useState<IntelligenceEventType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [listRes, brief, dashboard] = await Promise.all([
          intelligenceApi.list({ limit: 200 }),
          intelligenceApi.weekly().catch(() => null),
          intelligenceApi.dashboard().catch(() => null),
        ]);
        setData({ meta: listRes.meta, weekly_brief: brief, intelligence_items: listRes.items, dashboard });
      } catch {
        // Backend unavailable — fall back to static JSON for local preview
        try {
          const res = await fetch('/data/intelligence/intelligence.json');
          if (!res.ok) throw new Error('static file missing');
          const json = await res.json() as {
            meta: IntelligenceMeta;
            weekly_brief: IntelligenceWeeklyBrief;
            intelligence_items: IntelligenceItem[];
          };
          const items = json.intelligence_items;
          // Derive a minimal dashboard from static items
          const regionActivity = items.reduce<Record<string, number>>((acc, i) => {
            acc[i.region] = (acc[i.region] ?? 0) + 1;
            return acc;
          }, {});
          const highlights = items
            .filter(i => i.significance === 'landmark' || i.significance === 'major')
            .slice(0, 5)
            .concat(items.slice(0, 5))
            .slice(0, 5);
          setData({
            meta: json.meta,
            weekly_brief: json.weekly_brief,
            intelligence_items: items,
            dashboard: {
              highlights,
              forward_view: items.filter(i => i.is_forward_view),
              narratives: [],
              region_activity: regionActivity as Record<IntelligenceRegion, number>,
              editor_note: null,
              recent_timeline: items.slice(0, 10),
            },
          });
        } catch {
          setError('Failed to load intelligence data.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isRelevant = (i: IntelligenceItem) => i.rwa_relevant || (i.stablecoin_relevant ?? false);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.intelligence_items
      .filter(i => isRelevant(i))
      .filter(i => !i.is_forward_view)
      .filter(i => activeRegion === 'all' || i.region === activeRegion)
      .filter(i => activeEventType === 'all' || (i.event_type ?? 'regulation') === activeEventType)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [data, activeRegion, activeEventType]);

  const milestones = useMemo(
    () => filtered.filter(i => (i.tier ?? inferTier(i)) === 'milestone'),
    [filtered],
  );

  const totalMilestones = useMemo(() => {
    if (!data) return 0;
    return data.intelligence_items
      .filter(i => isRelevant(i) && !i.is_forward_view)
      .filter(i => (i.tier ?? inferTier(i)) === 'milestone').length;
  }, [data]);

  const milestoneActivity = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    return data.intelligence_items
      .filter(i => isRelevant(i) && !i.is_forward_view && (i.tier ?? inferTier(i)) === 'milestone')
      .reduce<Record<string, number>>((acc, i) => {
        acc[i.region] = (acc[i.region] ?? 0) + 1;
        return acc;
      }, {});
  }, [data]);

  const allNews = useMemo(() => {
    if (!data) return [];
    return data.intelligence_items
      .filter(i => (i.tier ?? inferTier(i)) === 'news')
      .filter(i => i.rwa_relevant || (i.stablecoin_relevant ?? false))
      .filter(i => !i.is_forward_view)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [data]);

  function scrollToItem(id: string) {
    setExpandedId(id);
    const el = itemRefs.current[id];
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } else if (timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleRegionSelect(r: IntelligenceRegion | 'all') {
    setActiveRegion(r);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-ed-meta text-ed-text-muted tracking-wider uppercase">Loading…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12 text-center">
        <p className="text-ed-body text-ed-incident">{error ?? 'Failed to load.'}</p>
      </div>
    );
  }

  const dash = data.dashboard;

  return (
    <div className="bg-ed-canvas min-h-screen overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto px-8">

        <HeroSection
          totalItems={totalMilestones}
          isAdmin={user?.is_admin ?? false}
        />

        {data.weekly_brief && (
          <>
            <SectionDivider />
            <WeeklyBriefSection brief={data.weekly_brief} />
          </>
        )}

        {allNews.length > 0 && (
          <>
            <SectionDivider />
            <NewsSection items={allNews} />
          </>
        )}

        <SectionDivider />

        <EditorialGrid1
          highlights={dash?.highlights ?? []}
          forwardItems={dash?.forward_view ?? []}
          onScrollToItem={scrollToItem}
        />

        {dash?.editor_note && (
          <>
            <SectionDivider />
            <EditorNoteSection note={dash.editor_note} />
          </>
        )}

        <SectionDivider />

        <div ref={timelineRef}>
          <NarrativeSection
            items={milestones}
            totalAll={totalMilestones}
            activity={milestoneActivity}
            activeEventType={activeEventType}
            onSetEventType={setActiveEventType}
            activeRegion={activeRegion}
            onSetRegion={handleRegionSelect}
            expandedId={expandedId}
            onToggleExpanded={id => setExpandedId(expandedId === id ? null : id)}
            itemRefs={itemRefs}
          />
        </div>

        <div className="border-t border-ed-hairline py-ed-section-sm text-center mt-ed-section">
          <p className="text-ed-meta text-ed-text-faint max-w-[800px] mx-auto leading-relaxed">
            This tracker aggregates publicly available official regulatory announcements and editorial analysis.
            All content is informational only — not investment advice.
            AI-generated summaries are preliminary; always verify against the primary source.
          </p>
        </div>

      </div>
    </div>
  );
}
