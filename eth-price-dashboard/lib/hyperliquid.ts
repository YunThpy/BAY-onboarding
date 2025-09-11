import axios from "axios";

/**
 * Hyperliquid helpers
 * - getSpotMeta: obtain universe indexes so we can compute spot asset id
 * - getBestAsk: get current best ask for a spot pair
 */
const HL_INFO = "https://api.hyperliquid.xyz/info";

export async function getHLSpotAssetId(pair: string = "ETH/USDC"): Promise<number> {
  // Fetch spot metadata and find pair index; asset id = 10000 + index
  const { data } = await axios.post(HL_INFO, { type: "spotMeta" });
  const uni = data?.universe as number[][] | undefined;
  if (!uni) throw new Error("Invalid Hyperliquid spotMeta response");
  const tokens = data?.tokens as { name: string, index: number }[];
  const [base, quote] = pair.split("/");
  // Find indices for base and quote
  const baseIdx = tokens.find(t => t.name === base)?.index;
  const quoteIdx = tokens.find(t => t.name === quote)?.index;
  if (baseIdx == null || quoteIdx == null) throw new Error("Token not found in HL tokens list");
  // Universe stores pairs as [baseIndex, quoteIndex]; find the matching pair index
  const pairIndex = uni.findIndex(p => p[0] === baseIdx && p[1] === quoteIdx);
  if (pairIndex < 0) throw new Error("Pair not found in HL universe");
  return 10000 + pairIndex;
}

export async function getHLBestAsk(pair: string = "ETH/USDC"): Promise<number> {
  // Query orderbook snapshot (best ask) via info endpoint
  // Per docs, use ws for streaming; for simplicity, use 'l2Book' post request on info endpoint
  const { data } = await axios.post(HL_INFO, { type: "l2Book", coin: pair });
  const asks = data?.levels?.asks ?? data?.levels?.a ?? [];
  const best = asks[0]?.px || asks[0]?.[0];
  if (!best) throw new Error("No best ask found");
  return Number(best);
}
