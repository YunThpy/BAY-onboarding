
import WebSocket from 'ws';
import axios from 'axios';
import { CONFIG } from '../config';
import { HlToken, SpotPair } from '../types';
import { log } from '../utils/logger';

export async function fetchSpotMeta(): Promise<{ tokens: HlToken[]; universe: SpotPair[]; }> {
  const { data } = await axios.post(CONFIG.HL_INFO_URL, { type: 'spotMeta' }, { timeout: 6000 });
  const tokens: HlToken[] = data.tokens.map((t: any) => ({ index: t.index, name: t.name, tokenId: t.tokenId, szDecimals: t.szDecimals, weiDecimals: t.weiDecimals }));
  const universe: SpotPair[] = data.universe.map((u: any) => ({ index: u.index, name: u.name, base: u.tokens[0], quote: u.tokens[1] }));
  return { tokens, universe };
}

export class HlBookFeed {
  private ws?: WebSocket;
  private subs = new Map<string, boolean>();
  private bids = new Map<string, [number, number][]>();
  private asks = new Map<string, [number, number][]>();
  private ready = false;

  constructor() { this.connect(); }

  private connect() {
    this.ws = new WebSocket(CONFIG.HL_WS_URL);
    this.ws.on('open', () => {
      this.ready = true;
      for (const pair of this.subs.keys()) this.subscribe(pair);
    });
    this.ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(buf.toString());
        if (msg?.channel?.sub?.type === 'l2Book') {
          const pair = msg.channel.sub.coin as string;
          const { bids, asks } = msg.data as { bids: [number,number][], asks: [number,number][] };
          this.bids.set(pair, bids);
          this.asks.set(pair, asks);
        }
      } catch {}
    });
    this.ws.on('close', () => { this.ready = false; setTimeout(() => this.connect(), 1000); });
    this.ws.on('error', (e) => { log.error({ e }, 'HL ws error'); try { this.ws?.close(); } catch {} });
  }

  private subscribe(pair: string) {
    if (!this.ws || this.ws.readyState !== this.ws.OPEN) return;
    const sub = { method: 'subscribe', subscription: { type: 'l2Book', coin: pair } };
    this.ws.send(JSON.stringify(sub));
    this.subs.set(pair, true);
  }

  ensure(pair: string) { if (!this.subs.has(pair)) { this.subs.set(pair, true); if (this.ready) this.subscribe(pair); } }

  snapshot(pair: string) {
    return { bids: this.bids.get(pair) || [], asks: this.asks.get(pair) || [] };
  }
}

export const HL_FEED = new HlBookFeed();
