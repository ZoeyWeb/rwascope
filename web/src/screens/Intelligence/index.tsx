import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { Eyebrow } from '../../components/Eyebrow';
import { FilterPill } from '../../components/FilterPill';
import { RegionActivityChart } from '../../components/RegionActivityChart';
import { intelligenceApi } from '../../api/client';
import { inferTier } from '../../utils/inferTier';
import { usePagination } from '../../hooks/usePagination';
import { NarrativeCarousel } from './NarrativeCarousel';

// ── Constants ────────────────────────────────────────────────────────────────

const REGION_ORDER: IntelligenceRegion[] = ['us', 'hk', 'eu', 'sg', 'uae', 'global'];

const ALL_REGIONS: Array<IntelligenceRegion | 'all'> = ['all', 'us', 'eu', 'hk', 'sg', 'uae', 'global'];
const ALL_EVENT_TYPES: Array<IntelligenceEventType | 'all'> = [
  'all', 'regulation', 'institutional', 'project', 'research', 'data_milestone',
];

const STATIC_FORWARD_ITEMS = [
  'HKMA: Stablecoin ordinance implementation rules expected Q3 2026 — technical standards under consultation',
  'SEC: Tokenized money market fund registration guidance expected Q2–Q3 2026',
  'MiCA: Full regulatory technical standards applicability from 30 July 2026',
];

function extractHighlightRegion(text: string): string {
  if (/\bHKMA\b|\bSFC\b|\bHKEx\b|\bHK\b/i.test(text)) return 'HK';
  if (/\bSEC\b|\bCFTC\b|\bUS\b/i.test(text)) return 'US';
  if (/\bMiCA\b|\bESMA\b|\bEU\b/i.test(text)) return 'EU';
  if (/\bMAS\b|\bSG\b/i.test(text)) return 'SG';
  if (/\bVARA\b|\bUAE\b/i.test(text)) return 'UAE';
  return 'GLOBAL';
}

// ── SectionDivider ────────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="my-ed-section">
      <div className="h-px bg-ed-hairline" />
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────

function HeroSection({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation('intelligence');
  return (
    <section className="pt-ed-section-md md:pt-ed-hero pb-ed-section-md md:pb-ed-hero">
      <Eyebrow className="mb-8">{t('hero.eyebrow')}</Eyebrow>
      <h1 className="text-4xl md:text-ed-page-h1 text-ed-text-primary mb-10">
        {t('hero.h1')}
      </h1>
      <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mb-12">
        {t('hero.lede')}
      </p>
      <div className="flex items-center gap-6 text-ed-meta text-ed-text-muted flex-wrap">
        <span>{t('hero.updatedWeekly')}</span>
        {isAdmin && (
          <>
            <span className="text-ed-hairline">·</span>
            <Link
              to="/intelligence/admin"
              className="text-ed-text-primary hover:text-ed-ink-hover underline underline-offset-4 decoration-ed-hairline hover:decoration-ed-ink transition-colors"
            >
              {t('hero.adminLink')}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ── WeeklyBriefSection ────────────────────────────────────────────────────────

function WeeklyBriefSection({ brief }: { brief: IntelligenceWeeklyBrief }) {
  const { t } = useTranslation('intelligence');
  return (
    <section className="py-4 relative w-screen left-1/2 -translate-x-1/2 bg-ed-surface-cool">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <Eyebrow>{t('weeklyBrief.eyebrow')}</Eyebrow>
          <div className="flex items-center gap-4">
            <div className="text-ed-meta text-ed-text-muted">
              {brief.period_start} → {brief.period_end}
            </div>
            <a
              href="/feeds/weekly-brief.xml"
              className="text-ed-meta text-ed-text-secondary border border-ed-hairline px-3 py-1 hover:border-ed-ink hover:text-ed-ink transition-colors uppercase tracking-[0.1em]"
            >
              {t('weeklyBrief.rssSubscribe')}
            </a>
          </div>
        </div>
        <h2 className="text-2xl md:text-ed-section-h2 text-ed-text-primary mb-8 max-w-[900px]">
          {brief.headline}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {brief.highlights.slice(0, 3).map((h, i) => (
            <div
              key={i}
              className={[
                'py-5',
                i > 0 ? 'border-t border-ed-hairline md:border-t-0 md:border-l md:pl-8' : '',
                i === 0 ? 'md:pr-8' : '',
                i === 1 ? 'lg:pr-8' : '',
              ].join(' ')}
            >
              <p className="text-ed-eyebrow text-ed-text-muted mb-2">
                {extractHighlightRegion(h)}
              </p>
              <p className="text-ed-body text-ed-text-secondary">
                {h}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-right">
          <span className="text-ed-meta text-ed-text-faint">
            {t('weeklyBrief.aiNote')}
          </span>
        </div>
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
  const { t } = useTranslation('intelligence');
  const forward = forwardItems.length > 0
    ? forwardItems.map(i => i.title)
    : STATIC_FORWARD_ITEMS;

  return (
    <section className="py-ed-section-md relative w-screen left-1/2 -translate-x-1/2 bg-ed-surface-cool">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-ed-hairline">
          {/* Left: This Week's Highlights */}
          <div className="md:pr-16">
            <h3 className="text-ed-block-h3 text-ed-text-primary mb-10">
              {t('editorialGrid.highlights.heading')}
            </h3>
            {highlights.length === 0 ? (
              <p className="text-ed-body text-ed-text-muted">{t('editorialGrid.highlights.emptyState')}</p>
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
              {t('editorialGrid.forwardView.heading', { range: 'Q2–Q3 2026' })}
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
              {t('editorialGrid.forwardView.footer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── EditorNoteSection ─────────────────────────────────────────────────────────

function EditorNoteSection({ note }: { note: EditorNote }) {
  const { t } = useTranslation('intelligence');
  return (
    <section className="max-w-[900px] py-ed-section-sm">
      <Eyebrow className="mb-8">{t('editorNote.eyebrow')}</Eyebrow>
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

// ── ItemCard ──────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  isExpanded,
  onToggle,
  compact = false,
}: {
  item: IntelligenceItem;
  isExpanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation('intelligence');
  const thumbSrc = item.image_url ?? null;

  return (
    <article className="group cursor-pointer" onClick={onToggle}>
      {/* Main row: left content + right thumbnail (compact/news mode only) */}
      <div className={compact ? 'flex gap-5 items-start' : ''}>
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-3 mb-2 text-ed-meta text-ed-text-muted flex-wrap">
            <time className="tabular-nums">{item.event_date}</time>
            <span className="text-ed-hairline">·</span>
            <span className="uppercase tracking-wider">{item.region.toUpperCase()}</span>
            <span className="text-ed-hairline">·</span>
            <span className="uppercase tracking-wider">
              {t(`eventTypes.${item.event_type ?? 'regulation'}` as const, { defaultValue: item.event_type ?? '' })}
            </span>
            {!compact && (item.significance === 'landmark' || item.significance === 'major') && (
              <>
                <span className="text-ed-hairline">·</span>
                <span className="text-ed-incident uppercase tracking-wider font-medium">
                  {item.significance === 'landmark' ? t('significance.landmark') : t('significance.major')}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-ed-text-primary leading-snug group-hover:text-ed-ink-hover transition-colors max-w-[900px] ${
            compact ? 'text-ed-item-h4 mb-1.5' : 'text-ed-block-h3 mb-3'
          }`}>
            {item.title}
          </h3>

          {/* Summary — truncated when collapsed */}
          <p className={`max-w-[900px] ${
            compact
              ? 'text-ed-body text-ed-text-muted'
              : 'text-ed-body text-ed-text-secondary leading-relaxed'
          } ${isExpanded ? '' : 'truncate'}`}>
            {item.policy_summary}
          </p>
        </div>

        {/* Thumbnail — compact/news mode only */}
        {compact && thumbSrc && (
          <div className="shrink-0 w-[180px] h-[120px] border border-ed-hairline overflow-hidden">
            <img
              src={thumbSrc}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={e => {
                const el = e.currentTarget.parentElement as HTMLDivElement;
                el.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Expanded content — grid rows trick for smooth animation */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-hidden">
          <div className="mt-6 space-y-6 max-w-[900px]">
            {item.key_changes && item.key_changes.length > 0 && (
              <div>
                <Eyebrow className="mb-4">{t('card.keyChanges')}</Eyebrow>
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
                <Eyebrow className="mb-4">{t('card.policyMarket')}</Eyebrow>
                <p className="text-ed-body text-ed-text-secondary leading-relaxed mb-3">
                  {item.market_impact.capital_flow as string}
                </p>
                {item.market_impact.hk_relevance && (
                  <p className="pl-6 border-l border-ed-hairline text-ed-body text-ed-text-secondary leading-relaxed italic">
                    {t('card.hkPrefix')}{item.market_impact.hk_relevance as string}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-ed-text-faint tracking-wide">
                  {t('card.aiGenerated')}
                </p>
              </div>
            )}

            {item.timeline_significance && (
              <p className="pl-6 border-l border-ed-hairline text-ed-body text-ed-text-muted leading-relaxed italic">
                {item.timeline_significance}
              </p>
            )}

            <div className="pt-4 border-t border-ed-hairline-faint flex items-center justify-end gap-6 flex-wrap">
              {!compact && (
                <>
                  <Link
                    to="/projects"
                    className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {t('card.relatedProjects')}
                  </Link>
                  {item.market_impact?.hk_relevance && (
                    <Link
                      to="/intelligence/hk"
                      className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      {t('card.hkObservationLink')}
                    </Link>
                  )}
                </>
              )}
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {t('card.sourceLink')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── NewsSection ───────────────────────────────────────────────────────────────

function NewsSection({ items }: { items: IntelligenceItem[] }) {
  const { t } = useTranslation('intelligence');
  const { visible, loadMore, canLoadMore } = usePagination(items, 20);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <section className="py-ed-section-md">
      <div className="mb-10">
        <div className="mb-4">
          <Eyebrow>{t('news.heading')}</Eyebrow>
        </div>
        <h2 className="text-2xl md:text-ed-section-h2 text-ed-text-primary mb-3">{t('news.heading')}</h2>
        <p className="text-xl md:text-ed-section-h2-light text-ed-text-muted">{t('news.subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-ed-body text-ed-text-muted py-8">{t('news.emptyState')}</p>
      ) : (
        <>
          <ul className="divide-y divide-ed-hairline-faint">
            {visible.map(item => (
              <li key={item.id} className="py-5 first:pt-0">
                <ItemCard
                  item={item}
                  isExpanded={expandedIds.has(item.id)}
                  onToggle={() => toggleExpanded(item.id)}
                  compact
                />
              </li>
            ))}
          </ul>

          {canLoadMore && (
            <div className="flex justify-center pt-8 mt-4 border-t border-ed-hairline-faint">
              <button
                onClick={loadMore}
                className="text-ed-meta uppercase tracking-wider text-ed-text-secondary hover:text-ed-ink transition-colors"
              >
                {t('news.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </section>
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
}: {
  items: IntelligenceItem[];
  totalAll: number;
  activity: Record<string, number>;
  activeEventType: IntelligenceEventType | 'all';
  onSetEventType: (t: IntelligenceEventType | 'all') => void;
  activeRegion: IntelligenceRegion | 'all';
  onSetRegion: (r: IntelligenceRegion | 'all') => void;
}) {
  const { t } = useTranslation('intelligence');
  return (
    <section className="py-ed-section-lg relative w-screen left-1/2 -translate-x-1/2 bg-ed-surface-sunken">
      <div className="max-w-[1400px] mx-auto px-8">
        {/* Section header */}
        <div className="mb-8">
          <Eyebrow className="mb-4">{t('narrative.eyebrow')}</Eyebrow>
          <p className="text-xl md:text-ed-section-h2-light text-ed-text-muted">
            {t('narrative.subtitle')}
          </p>
        </div>

        {/* Region activity strip */}
        <RegionActivityChart
          variant="strip"
          data={REGION_ORDER
            .filter(r => (activity[r] ?? 0) > 0)
            .map(r => ({ region: r, count: activity[r] ?? 0 }))}
          activeRegion={activeRegion}
          onRegionClick={r => onSetRegion(r as IntelligenceRegion | 'all')}
        />

        {/* Filters */}
        <div className="my-8 space-y-4 border-y border-ed-hairline py-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Eyebrow className="w-16 shrink-0">{t('narrative.filterTypeLabel')}</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENT_TYPES.map(evtType => (
                <FilterPill key={evtType} active={activeEventType === evtType} onClick={() => onSetEventType(evtType)}>
                  {t(`eventTypes.${evtType}` as const)}
                </FilterPill>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Eyebrow className="w-16 shrink-0">{t('narrative.filterRegionLabel')}</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {ALL_REGIONS.map(r => (
                <FilterPill key={r} active={activeRegion === r} onClick={() => onSetRegion(r)}>
                  {r === 'all' ? t('narrative.filterAll') : r.toUpperCase()}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="flex justify-end mb-4 text-ed-meta text-ed-text-muted">
          <span>{t('narrative.count', { filtered: items.length, total: totalAll })}</span>
        </div>

        {/* Horizontal carousel */}
        <NarrativeCarousel items={items} />
      </div>
    </section>
  );
}

// ── SubscribeSection ──────────────────────────────────────────────────────────

function SubscribeSection() {
  const { t } = useTranslation('intelligence');
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
        ? t('subscribe.successAlreadySubscribed')
        : t('subscribe.successNew'));
      setStatus('success');
    } catch {
      setMsg(t('subscribe.errorGeneric'));
      setStatus('error');
    }
  }

  return (
    <section className="max-w-[600px] py-ed-hero">
      <h2 className="text-ed-block-h3 text-ed-text-primary mb-4">
        {t('subscribe.heading')}
      </h2>
      <p className="text-ed-body text-ed-text-secondary mb-8">
        {t('subscribe.body')}
      </p>

      {status === 'success' ? (
        <p className="text-ed-body text-ed-text-secondary">{msg}</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex gap-3 border-b border-ed-ink pb-3">
            <input
              type="email"
              required
              placeholder={t('subscribe.placeholder')}
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
              {status === 'loading' ? t('subscribe.submitLoading') : t('subscribe.submitIdle')}
            </button>
          </form>
          {status === 'error' && (
            <p className="text-ed-meta text-ed-incident mt-3">{msg}</p>
          )}
          <p className="text-ed-meta text-ed-text-faint mt-4">{t('subscribe.spamNote')}</p>
        </>
      )}
    </section>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface PageData {
  meta: IntelligenceMeta;
  weekly_brief: IntelligenceWeeklyBrief | null;
  intelligence_items: IntelligenceItem[];
  milestone_items: IntelligenceItem[];
  dashboard: DashboardData | null;
}

export default function IntelligenceHome() {
  const { user } = useAuth();
  const { t } = useTranslation('intelligence');
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeRegion, setActiveRegion] = useState<IntelligenceRegion | 'all'>('all');
  const [activeEventType, setActiveEventType] = useState<IntelligenceEventType | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [listRes, brief, dashboard, milestoneRes] = await Promise.all([
          intelligenceApi.list({ limit: 200 }),
          intelligenceApi.weekly().catch(() => null),
          intelligenceApi.dashboard().catch(() => null),
          intelligenceApi.list({ tier: 'milestone', limit: 50 }).catch(() => null),
        ]);
        setData({
          meta: listRes.meta,
          weekly_brief: brief,
          intelligence_items: listRes.items,
          milestone_items: milestoneRes?.items ?? [],
          dashboard,
        });
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
            milestone_items: items.filter(i => (i.tier ?? inferTier(i)) === 'milestone'),
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
          setError(t('error.loadFailed'));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isRelevant = (i: IntelligenceItem) => i.rwa_relevant || (i.stablecoin_relevant ?? false);

  const milestones = useMemo(() => {
    if (!data) return [];
    return data.milestone_items
      .filter(i => isRelevant(i))
      .filter(i => !i.is_forward_view)
      .filter(i => activeRegion === 'all' || i.region === activeRegion)
      .filter(i => activeEventType === 'all' || (i.event_type ?? 'regulation') === activeEventType)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [data, activeRegion, activeEventType]);

  const totalMilestones = useMemo(() => {
    if (!data) return 0;
    return data.milestone_items
      .filter(i => isRelevant(i) && !i.is_forward_view).length;
  }, [data]);

  const milestoneActivity = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    return data.milestone_items
      .filter(i => isRelevant(i) && !i.is_forward_view)
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
    setExpandedIds(prev => new Set([...prev, id]));
    const el = itemRefs.current[id];
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } else if (timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleRegionSelect(r: IntelligenceRegion | 'all') {
    setActiveRegion(r);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-ed-meta text-ed-text-muted tracking-wider uppercase">{t('loading')}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12 text-center">
        <p className="text-ed-body text-ed-incident">{error ?? t('error.fallback')}</p>
      </div>
    );
  }

  const dash = data.dashboard;

  return (
    <div className="bg-ed-canvas min-h-screen overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-8">

        <HeroSection isAdmin={user?.is_admin ?? false} />

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
          />
        </div>

        <div className="border-t border-ed-hairline py-ed-section-sm text-center mt-ed-section">
          <p className="text-ed-meta text-ed-text-faint max-w-[800px] mx-auto leading-relaxed">
            {t('footer.disclaimer')}
          </p>
        </div>

      </div>
    </div>
  );
}
