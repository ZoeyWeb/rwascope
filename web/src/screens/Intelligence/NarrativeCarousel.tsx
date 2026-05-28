import { useRef, useState } from 'react';
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

  function scrollCards(dir: 1 | -1) {
    // 380px card + 24px gap
    scrollRef.current?.scrollBy({ left: dir * 404, behavior: 'smooth' });
  }

  if (items.length === 0) {
    return (
      <p className="text-ed-body text-ed-text-muted py-16 text-center">
        No items match the current filters.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Arrow navigation */}
      <div className="absolute -top-10 right-0 flex gap-2 z-10">
        <button
          onClick={() => scrollCards(-1)}
          className="border border-ed-hairline px-3 py-1.5 text-ed-meta text-ed-text-secondary hover:text-ed-ink hover:border-ed-text-muted transition-colors leading-none"
          aria-label="Previous"
        >
          ←
        </button>
        <button
          onClick={() => scrollCards(1)}
          className="border border-ed-hairline px-3 py-1.5 text-ed-meta text-ed-text-secondary hover:text-ed-ink hover:border-ed-text-muted transition-colors leading-none"
          aria-label="Next"
        >
          →
        </button>
      </div>

      {/* Scrollable carousel track */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(item => (
          <NarrativeCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
