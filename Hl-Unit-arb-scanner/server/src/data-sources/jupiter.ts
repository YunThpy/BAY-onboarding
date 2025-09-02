
import axios from 'axios';
import { CONFIG } from '../config';
import type { Quote } from '../types';

export const MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};
const DECIMALS: Record<string, number> = { SOL: 9, USDC: 6 };

export async function jupQuote(base: string, quote: string, amountBase: number): Promise<Quote | undefined> {
  const inMint = MINTS[base];
  const outMint = MINTS[quote];
  if (!inMint || !outMint) return undefined;
  const inDec = DECIMALS[base] ?? 9;
  const inAmount = BigInt(Math.floor(amountBase * 10 ** inDec));
  const url = `${CONFIG.JUP_BASE_URL}/v6/quote?inputMint=${inMint}&outputMint=${outMint}&amount=${inAmount}&slippageBps=${CONFIG.JUP_SLIPPAGE_BPS}`;
  const t0 = Date.now();
  const { data } = await axios.get(url, { timeout: 4000 });
  const t1 = Date.now();
  const best = data?.data?.[0];
  if (!best) return undefined;
  const outAmount = Number(best.outAmount) / 10 ** (DECIMALS[quote] ?? 6);
  const px = outAmount / amountBase;
  return { venue: 'jupiter', symbol: `${base}/${quote}`, price: px, sizeBase: amountBase, ts: Date.now(), latencyMs: t1 - t0, raw: best, side: 'SELL' };
}
