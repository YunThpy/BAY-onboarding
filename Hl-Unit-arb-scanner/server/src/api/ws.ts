
import { Server } from 'ws';
import { CONFIG } from '../config';
import { getQuotes } from '../core/pricing';
import { crossVenueOpps } from '../core/arbitrage';

export function createWsServer(httpServer: any) {
  const wss = new Server({ server: httpServer, path: '/ws' });
  wss.on('connection', (ws) => {
    let alive = true;
    ws.on('pong', () => (alive = true));

    const tick = async () => {
      try {
        const bases = ['BTC','ETH','SOL'];
        const sizeUsd = CONFIG.SIZE_USD;
        const out: any[] = [];
        for (const base of bases) {
          const approxPx = base === 'BTC' ? 65000 : base === 'ETH' ? 3000 : 150;
          const sizeBase = Math.max(0.001, sizeUsd / approxPx);
          const quotes = await getQuotes(base, CONFIG.QUOTE, sizeBase);
          const best = crossVenueOpps(base, CONFIG.QUOTE, quotes)[0];
          if (best) out.push(best);
        }
        ws.send(JSON.stringify({ type: 'opps', data: out, ts: Date.now() }));
      } catch {}
    };

    const iv = setInterval(tick, 2500);
    tick();

    const pingIv = setInterval(() => { if (!alive) return ws.terminate(); alive = false; ws.ping(); }, 15000);
    ws.on('close', () => { clearInterval(iv); clearInterval(pingIv); });
  });
  return wss;
}
