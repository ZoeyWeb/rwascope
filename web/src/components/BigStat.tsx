import type { ReactNode } from 'react';

export function BigStat({ value, label, valueColor }: { value: ReactNode; label: string; valueColor?: string }) {
  return (
    <div className="px-8 first:pl-0 last:pr-0 py-1">
      <div
        className="text-ed-section-h2 font-semibold text-ed-text-primary tabular-nums leading-none mb-1"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-ed-eyebrow text-ed-text-muted uppercase tracking-[0.18em] mt-2">
        {label}
      </div>
    </div>
  );
}

export function BigStatRibbon({ children, cols = 4 }: { children: ReactNode; cols?: 4 | 5 }) {
  const gridClass = cols === 5
    ? 'grid-cols-2 sm:grid-cols-5'
    : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 bg-ed-surface-cool border-y border-ed-hairline">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className={`grid ${gridClass} divide-x divide-ed-hairline`}>
          {children}
        </div>
      </div>
    </div>
  );
}
