import { useEffect, useState } from 'react';
import { marketApi } from '../api/client';
import type { MarketSnapshot } from '../types/market';

export function useMarketSnapshot() {
  const [data, setData] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    marketApi.tokenizedSnapshot()
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}
