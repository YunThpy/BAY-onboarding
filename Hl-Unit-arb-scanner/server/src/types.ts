
export type Chain = 'bitcoin' | 'ethereum' | 'solana' | 'hyperliquid';

export type HlToken = {
  index: number;
  name: string;
  tokenId: string;
  szDecimals: number;
  weiDecimals: number;
};

export type SpotPair = { index: number; name: string; base: number; quote: number; };

export type UniverseAsset = {
  hlToken: HlToken;
  baseSymbol: string;
  isUnitDepositable: boolean;
  pairs: SpotPair[];
};

export type Venue = 'hyperliquid' | 'jupiter' | 'binance' | 'bybit' | 'gate' | 'bitget' | 'backpack';

export type Quote = {
  venue: Venue;
  symbol: string;
  price: number;
  sizeBase?: number;
  ts: number;
  latencyMs?: number;
  side?: 'BUY' | 'SELL';
  raw?: any;
};

export type Opportunity = {
  base: string;
  quote: string;
  buy: Quote;
  sell: Quote;
  grossBps: number;
  netBps: number;
};
