import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

type TickerItem = {
  slug: string;
  name: string;
  short_name: string;
  logo: string;
  tvl: number;
  tvl_fmt: string;
  change_1d: number;
  asset_class: string;
  url: string;
};

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-[13px] font-medium tabular-nums text-white/40">—</span>;
  }
  const up = value > 0;
  return (
    <span className={`text-[13px] font-medium tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? '↑' : '↓'}{Math.abs(value).toFixed(2)}%
    </span>
  );
}

function LogoImg({ src, alt, assetClass }: { src: string; alt: string; assetClass: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 flex-shrink-0">
        {assetClass.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={24}
      height={24}
      className="w-6 h-6 rounded-full flex-shrink-0 object-contain bg-white/5"
      onError={() => setFailed(true)}
    />
  );
}

function TickerCell({ item, idPrefix }: { item: TickerItem; idPrefix: string }) {
  return (
    <Link
      to={item.url}
      key={`${idPrefix}-${item.slug}`}
      className="flex items-center gap-2.5 px-6 h-full border-r border-white/10 hover:bg-white/5 transition-colors flex-shrink-0"
      tabIndex={-1}
    >
      <LogoImg src={item.logo} alt={item.short_name} assetClass={item.asset_class} />
      <span className="font-mono font-bold text-[15px] text-white tracking-tight whitespace-nowrap">
        {item.short_name}
      </span>
      <span className="text-[14px] text-white/70 font-medium whitespace-nowrap">
        {item.tvl_fmt}
      </span>
      <Delta value={item.change_1d} />
    </Link>
  );
}

function SkeletonCell() {
  return (
    <div className="flex items-center gap-2.5 px-6 h-full border-r border-white/10 flex-shrink-0">
      <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 animate-pulse" />
      <div className="w-10 h-3.5 bg-white/10 rounded animate-pulse" />
      <div className="w-16 h-3.5 bg-white/10 rounded animate-pulse" />
      <div className="w-12 h-3 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

export default function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/ticker/top`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { items: TickerItem[] }) => {
        setItems(data.items);
        setLoading(false);
        requestAnimationFrame(() => setVisible(true));
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="w-full h-16 bg-[#0F0F1A] border-t border-b border-white/5 overflow-hidden">
      {loading ? (
        <div className="flex items-center h-full">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCell key={i} />)}
        </div>
      ) : (
        <div
          className="group flex items-center h-full"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms' }}
        >
          {/* Render items twice for seamless loop; translateX(-50%) aligns back to start */}
          <div className="ticker-track flex items-center h-full group-hover:[animation-play-state:paused]">
            {items.map(item => <TickerCell key={item.slug} item={item} idPrefix="a" />)}
            {items.map(item => <TickerCell key={`b-${item.slug}`} item={item} idPrefix="b" />)}
          </div>
        </div>
      )}
    </div>
  );
}
