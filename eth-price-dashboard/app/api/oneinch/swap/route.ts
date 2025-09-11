import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * Swap builder
 * Query: src, dst, amount
 * Returns tx payload for eth_sendTransaction
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const src = url.searchParams.get('src') || 'USDC';
  const dst = url.searchParams.get('dst') || 'ETH';
  const amount = url.searchParams.get('amount') || '100';
  const key = process.env.ONEINCH_API_KEY;
  if (!key) return NextResponse.json({ error: "ONEINCH_API_KEY missing" }, { status: 400 });

  const tokens: Record<string, string> = {
    // mainnet
    "ETH": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  };
  const fromToken = tokens[src] || src;
  const toToken = tokens[dst] || dst;
  const amountUnits = BigInt(Math.floor(Number(amount) * 1e6)); // assume USDC 6 decimals

  // 1inch swap endpoint to build tx
  const base = `https://api.1inch.dev/swap/v6.0/1/swap`;
  const headers = { Authorization: `Bearer ${key}` };
  // Note: The "from" address must be the user's wallet; tx data returned will target 1inch router
  // Here we require the client to pass "from" via header X-From or we reject; for demo fallback we can't sign server-side.
  const from = req.headers.get("x-from") || undefined; // optional
  const params: any = {
    src: fromToken,
    dst: toToken,
    amount: amountUnits.toString(),
    from: from, // if undefined, 1inch still returns tx with placeholder but better to pass
    slippage: 1.0,
    disableEstimate: true
  };
  const { data } = await axios.get(base, { headers, params });

  // Return the tx object that wallet can send
  return NextResponse.json({ tx: data.tx });
}
