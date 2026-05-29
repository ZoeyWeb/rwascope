export type TokenizedCategory = 'stock' | 'gold' | 'silver' | 'etf' | 'tbill';

export interface TokenizedCategorySummary {
  category: TokenizedCategory;
  cmc_category_id: string;
  cmc_category_name: string;
  num_tokens: number | null;
  market_cap_usd: number | null;
  avg_price_change_24h: number | null;
  fetched_at: string;
}

export interface TokenizedAsset {
  id: string;
  symbol: string;
  name: string;
  category: TokenizedCategory;
  cmc_rank: number | null;
  price_usd: number | null;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  percent_change_1h: number | null;
  percent_change_24h: number | null;
  percent_change_7d: number | null;
  network: string | null;
  last_updated: string | null;
}

export interface MarketSnapshot {
  summary: TokenizedCategorySummary[];
  assets: TokenizedAsset[];
  coverage_note: string;
  last_fetched: string | null;
}
