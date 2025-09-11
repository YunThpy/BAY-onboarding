import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * Quote endpoint
 * Query: src, dst, amount
 * For Hyperliquid helper: if hl=1, returns asset/limitPx/sz encoded numbers
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const src = url.searchParams.get('src') || 'USDC';
  const dst = url.searchParams.get('dst') || 'ETH';
  const amount = url.searchParams.get('amount') || '100';
  const hl = url.searchParams.get('hl');

  if (hl) {
    // Return HL params (asset, px, sz) for IOC buy
    const { data: book } = await axios.post('https://api.hyperliquid.xyz/info', { type: 'l2Book', coin: 'ETH/USDC' });
    const ask = Number(book?.levels?.asks?.[0]?.px || book?.levels?.a?.[0]?.[0]);
    const limitPx = Math.ceil(ask * 1.01 * 1e8); // add 1% headroom, scale 1e8
    // sz in units of ETH; amount is USD, divide by ask
    const szFloat = Number(amount) / ask;
    const sz = Math.floor(szFloat * 1e8); // scale 1e8
    // asset id lookup
    const { data: meta } = await axios.post('https://api.hyperliquid.xyz/info', { type: 'spotMeta' });
    const tokens = meta.tokens as { name: string, index: number }[];
    const uni = meta.universe as number[][];
    const baseIdx = tokens.find(t => t.name === 'ETH')?.index;
    const quoteIdx = tokens.find(t => t.name === 'USDC')?.index;
    const pairIndex = uni.findIndex(p => p[0] === baseIdx && p[1] === quoteIdx);
    const asset = 10000 + pairIndex;
    return NextResponse.json({ hl: { asset, limitPx, sz } });
  }

  const key = process.env.ONEINCH_API_KEY;
  if (!key) return NextResponse.json({ error: "ONEINCH_API_KEY missing" }, { status: 400 });

  // 1inch v6 classic swap quote (Ethereum chainId=1)
  const base = `https://api.1inch.dev/swap/v6.0/1/quote`;
  // Map symbols to addresses
  const tokens: Record<string, string> = {
    // mainnet
    "ETH": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  };
  const fromToken = tokens[src] || src;
  const toToken = tokens[dst] || dst;
  const amountUnits = BigInt(Math.floor(Number(amount) * 1e6)); // assume src is USDC with 6 decimals by default
  const headers = { Authorization: `Bearer ${key}` };
  const { data } = await axios.get(base, {
    headers,
    params: {
      src: fromToken,
      dst: toToken,
      amount: amountUnits.toString(),
    }
  });

  // implied price = input USD / output ETH
  const toDecimals = data.toToken.decimals ?? 18;
  const toAmount = Number(data.toAmount) / 10**toDecimals;
  const impliedPrice = Number(amount) / toAmount;

  return NextResponse.json({ data, impliedPrice });
}
