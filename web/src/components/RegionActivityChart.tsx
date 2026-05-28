interface RegionDatum {
  region: string;
  count: number;
}

interface RegionActivityChartProps {
  data: RegionDatum[];
  variant: 'inline' | 'strip';
  activeRegion?: string;
  onRegionClick?: (r: string) => void;
  maxCount?: number;
}

export function RegionActivityChart({
  data,
  variant,
  activeRegion,
  onRegionClick,
  maxCount,
}: RegionActivityChartProps) {
  if (data.length === 0) return null;

  const max = maxCount ?? Math.max(...data.map(d => d.count), 1);
  const isInteractive = !!onRegionClick;

  if (variant === 'inline') {
    return (
      <ul className="space-y-5">
        {data.map(({ region, count }) => {
          const pct = Math.round((count / max) * 100);
          const isActive = activeRegion === region;
          const handleClick = isInteractive
            ? () => onRegionClick!(isActive ? 'all' : region)
            : undefined;
          return (
            <li key={region}>
              <button
                type="button"
                onClick={handleClick}
                disabled={!isInteractive}
                className="w-full grid grid-cols-[64px_1fr_48px] items-center gap-6"
              >
                <span className={`text-ed-meta uppercase tracking-wider text-left transition-colors ${
                  isActive ? 'text-ed-ink font-medium' : 'text-ed-text-muted'
                }`}>
                  {region.toUpperCase()}
                </span>
                <div className="h-[2px] bg-ed-hairline relative">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                      isActive ? 'bg-ed-ink' : 'bg-ed-ink opacity-40'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-ed-meta tabular-nums text-right transition-colors ${
                  isActive ? 'text-ed-ink font-medium' : 'text-ed-text-secondary'
                }`}>
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  // variant === 'strip'
  return (
    <div className="flex items-end gap-8 flex-wrap border-b border-ed-hairline pb-6 mb-10">
      {data.map(({ region, count }) => {
        const pct = Math.round((count / max) * 100);
        const isActive = activeRegion === region;
        const handleClick = isInteractive
          ? () => onRegionClick!(isActive ? 'all' : region)
          : undefined;
        return (
          <button
            key={region}
            type="button"
            onClick={handleClick}
            disabled={!isInteractive}
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
            <span className={`text-ed-meta uppercase tracking-wider transition-colors ${
              isActive ? 'text-ed-ink font-medium' : 'text-ed-text-muted'
            }`}>
              {region.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
