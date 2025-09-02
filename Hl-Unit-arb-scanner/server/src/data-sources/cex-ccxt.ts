
import ccxt from 'ccxt';
import pLimit from 'p-limit';
import { CONFIG } from '../config';
import type { Quote } from '../types';
import { impactPx } from '../utils/book';

export class CexBookFetcher {
  exchanges: Record<string, ccxt.Exchange> = {};
  limit = pLimit(CONFIG.CCXT_CONCURRENCY);

  constructor() {
    for (const id of CONFIG.CEXS) {
      const Ex = (ccxt as any)[id];
      if (!Ex) continue;
      this.exchanges[id] = new Ex({ enableRateLimit: true, timeout: CONFIG.CCXT_REST_TIMEOUT_MS });
    }
  }

  async fetch(symbol: string, sizeBase: number): Promise<Quote[]> {
    const tasks = Object.entries(this.exchanges).map(([id, ex]) => this.limit(async () => {
      try {
        const ob = await ex.fetchOrderBook(symbol, 50);
        const asks = ob.asks as [number, number][];
        const bids = ob.bids as [number, number][];
        const buyPx = impactPx(asks, 'BUY', sizeBase);
        const sellPx = impactPx(bids, 'SELL', sizeBase);
        const now = Date.now();
        const res: Quote[] = [];
        if (buyPx) res.push({ venue: id as any, symbol, price: buyPx, sizeBase, ts: now, latencyMs: ob['timestamp'] ? now - ob['timestamp'] : undefined, side: 'BUY' });
        if (sellPx) res.push({ venue: id as any, symbol, price: sellPx, sizeBase, ts: now, latencyMs: ob['timestamp'] ? now - ob['timestamp'] : undefined, side: 'SELL' });
        return res;
      } catch { return []; }
    }));
    const all = await Promise.all(tasks);
    return all.flat();
  }
}

export const CEX = new CexBookFetcher();
