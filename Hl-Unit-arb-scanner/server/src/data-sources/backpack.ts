
import WebSocket from 'ws';

export class BackpackFeed {
  private ws?: WebSocket;
  private subs = new Map<string, boolean>();
  private bids = new Map<string, [number, number][]>()
  private asks = new Map<string, [number, number][]>()

  constructor() { this.connect(); }

  private connect() {
    this.ws = new WebSocket('wss://ws.backpack.exchange');
    this.ws.on('open', () => { for (const s of this.subs.keys()) this.sub(s); });
    this.ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(buf.toString());
        if (msg?.stream?.startsWith('depth.')) {
          const sym = msg.stream.split('depth.200ms.')[1];
          const d = msg.data;
          const a = (d?.a || []).map(([p, q]: [string, string]) => [Number(p), Number(q)] as [number, number]);
          const b = (d?.b || []).map(([p, q]: [string, string]) => [Number(p), Number(q)] as [number, number]);
          this.asks.set(sym, a); this.bids.set(sym, b);
        }
      } catch {}
    });
  }

  private sub(symbolUnderscore: string) {
    this.ws?.send(JSON.stringify({ method: 'SUBSCRIBE', params: [`depth.200ms.${symbolUnderscore}`] }));
    this.subs.set(symbolUnderscore, true);
  }

  ensure(symbolUnderscore: string) { if (!this.subs.has(symbolUnderscore)) this.sub(symbolUnderscore); }

  snapshot(symbolUnderscore: string) {
    return { bids: this.bids.get(symbolUnderscore) || [], asks: this.asks.get(symbolUnderscore) || [] };
  }
}

export const BACKPACK = new BackpackFeed();
