import { useRef, useState, useCallback } from 'react';
import type { IntelligenceItem, IntelligenceRegion } from '../../types/intelligence';
import { REGION_META } from '../../types/intelligence';

const EVENT_TYPE_LABELS: Record<string, string> = {
  regulation:     'Policy',
  institutional:  'Institution',
  project:        'Project',
  research:       'Research',
  data_milestone: 'Data',
};

function RegionChip({ region }: { region: IntelligenceRegion }) {
  const label = REGION_META[region]?.label.split(' ')[0] ?? region.toUpperCase();
  return (
    <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 bg-ed-canvas/75 text-ed-text-secondary">
      {label}
    </span>
  );
}

function NarrativeCard({ item }: { item: IntelligenceItem }) {
  const [imgErrored, setImgErrored] = useState(false);
  const isSignificant = item.significance === 'major' || item.significance === 'landmark';

  function handleClick() {
    if (item.source_url) window.open(item.source_url, '_blank', 'noopener,noreferrer');
  }

  return (
    <article
      onClick={handleClick}
      className={[
        'w-[380px] flex-shrink-0 snap-start border border-ed-hairline flex flex-col overflow-hidden bg-ed-canvas',
        item.source_url ? 'cursor-pointer hover:border-ed-text-muted transition-colors' : '',
      ].join(' ')}
    >
      {/* Image area */}
      <div className="relative h-[200px] overflow-hidden bg-ed-surface-sunken">
        {!imgErrored && item.image_url && (
          <img
            src={item.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgErrored(true)}
          />
        )}
        {imgErrored && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest text-ed-text-muted">
              {EVENT_TYPE_LABELS[item.event_type ?? 'regulation'] ?? item.event_type}
            </span>
          </div>
        )}
        {/* Bottom fade into card content */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ed-canvas to-transparent" />
        {/* Top chips */}
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <RegionChip region={item.region} />
          {isSignificant && (
            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 bg-ed-incident text-white font-medium">
              {item.significance === 'landmark' ? 'Landmark' : 'Major'}
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 border-t border-ed-hairline flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-ed-meta text-ed-text-muted flex-wrap">
          <time className="tabular-nums">{item.event_date}</time>
          <span className="text-ed-hairline">·</span>
          <span className="uppercase tracking-wider text-[10px]">
            {EVENT_TYPE_LABELS[item.event_type ?? 'regulation'] ?? item.event_type}
          </span>
        </div>
        <h3 className="text-ed-block-h3 text-ed-text-primary leading-snug line-clamp-3 flex-1">
          {item.title}
        </h3>
      </div>
    </article>
  );
}

export function NarrativeCarousel({ items }: { items: IntelligenceItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  // 380px card + 24px gap
  const STEP = 404;

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / STEP);
    setCurrentIdx(Math.min(idx, items.length - 1));
  }, [items.length]);

  function scrollCards(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * STEP, behavior: 'smooth' });
  }

  const atStart = currentIdx === 0;
  const atEnd   = currentIdx >= items.length - 1;

  const btnBase =
    'w-8 h-8 flex items-center justify-center border border-ed-hairline ' +
    'text-ed-meta text-ed-text-secondary transition-colors leading-none select-none';
  const btnActive  = 'hover:text-ed-ink hover:border-ed-text-muted cursor-pointer';
  const btnDisabled = 'opacity-30 cursor-not-allowed';

  if (items.length === 0) {
    return (
      <p className="text-ed-body text-ed-text-muted py-16 text-center">
        No items match the current filters.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Scrollable carousel track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(item => (
          <NarrativeCard key={item.id} item={item} />
        ))}
      </div>

      {/* Nav controls — right-aligned below track */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => !atStart && scrollCards(-1)}
          disabled={atStart}
          className={`${btnBase} ${atStart ? btnDisabled : btnActive}`}
          aria-label="Previous"
        >
          ←
        </button>
        <span className="text-ed-meta tabular-nums text-ed-text-muted min-w-[5ch] text-center">
          {currentIdx + 1} of {items.length}
        </span>
        <button
          onClick={() => !atEnd && scrollCards(1)}
          disabled={atEnd}
          className={`${btnBase} ${atEnd ? btnDisabled : btnActive}`}
          aria-label="Next"
        >
          →
        </button>
      </div>
    </div>
  );
}
