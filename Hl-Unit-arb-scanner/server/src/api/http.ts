
import express from 'express';
import cors from 'cors';
import { CONFIG } from '../config';
import { buildUniverse } from '../core/universe';
import { getQuotes, bestByVenue } from '../core/pricing';
import { crossVenueOpps } from '../core/arbitrage';

export function createHttpServer() {
  const app = express();
  app.use(cors());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  let universeCache: any[] = [];
  let lastUniverseAt = 0;

  app.get('/assets', async (_req, res) => {
    const now = Date.now();
    if (now - lastUniverseAt > CONFIG.UNIVERSE_REFRESH_SEC * 1000 || universeCache.length === 0) {
      universeCache = await buildUniverse();
      lastUniverseAt = now;
    }
    res.json(universeCache);
  });

  app.get('/opps', async (req, res) => {
    const base = (req.query.base as string) || 'SOL';
    const sizeUsd = parseFloat((req.query.sizeUsd as string) || `${CONFIG.SIZE_USD}`);
    const approxPx = base === 'BTC' ? 65000 : base === 'ETH' ? 3000 : 150;
    const sizeBase = Math.max(0.001, sizeUsd / approxPx);

    const quotes = await getQuotes(base, CONFIG.QUOTE, sizeBase);
    const opps = crossVenueOpps(base, CONFIG.QUOTE, quotes);
    res.json({ quotes, byVenue: bestByVenue(quotes), opps });
  });

  return app;
}
