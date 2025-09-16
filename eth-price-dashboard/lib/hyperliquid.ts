// lib/hyperliquid.ts
"use client";

import { encodeAbiParameters, concatHex } from "viem";

/** ====== Config / Helpers ====== **/

// Hyperliquid CoreWriter (고정)
export const CORE_WRITER = "0x3333333333333333333333333333333333333333" as const;

// sendRawAction 최소 ABI
export const CORE_WRITER_ABI = [
  {
    type: "function",
    name: "sendRawAction",
    stateMutability: "nonpayable",
    inputs: [{ name: "data", type: "bytes" }],
    outputs: [],
  },
] as const;

// /info URL 선택 (env 우선, 기본값 포함)
export function pickHLInfoUrl() {
  const mode = (process.env.NEXT_PUBLIC_HL_MODE ?? "TESTNET").trim().toUpperCase();
  const mainnet = (process.env.HL_API_MAINNET ?? "https://api.hyperliquid.xyz/info").trim();
  const testnet = (process.env.HL_API_TESTNET ?? "https://api.hyperliquid-testnet.xyz/info").trim();
  return mode === "MAINNET" ? mainnet : testnet;
}

// ETH → UETH, BTC → UBTC 등 스팟 토큰 명시적 매핑
function canon(token: string) {
  const t = token.toUpperCase();
  if (t === "ETH") return "UETH";
  if (t === "BTC") return "UBTC";
  return t;
}
function canonPair(pair: string) {
  const [base, quote] = pair.split("/");
  return `${canon(base)}/${canon(quote)}`;
}

// 숫자 → 1e8 스케일 정수(BigInt)
export const to1e8 = (v: number) => BigInt(Math.round(v * 1e8));

/** ====== Info helpers ====== **/

// UETH/USDC 페어의 asset id = 10000 + pair.index
export async function getHLSpotAssetId(pair: string = "UETH/USDC"): Promise<number> {
  const url = pickHLInfoUrl();
  const canonP = canonPair(pair);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "spotMeta" }),
  });
  const data = await res.json();

  const tokens = data?.tokens as { name: string; index: number }[] | undefined;
  const universe = data?.universe as number[][] | undefined;
  if (!tokens || !universe) throw new Error("Invalid spotMeta");

  const [base, quote] = canonP.split("/");
  const baseIdx = tokens.find((t) => t.name === base)?.index;
  const quoteIdx = tokens.find((t) => t.name === quote)?.index;
  if (baseIdx == null || quoteIdx == null) throw new Error("Token not found");
  const pairIndex = universe.findIndex((p) => p[0] === baseIdx && p[1] === quoteIdx);
  if (pairIndex < 0) throw new Error("Pair not found");
  return 10000 + pairIndex;
}

// 현물 호가창 베스트 매도호가(ask) 가져오기
export async function getHLBestAsk(pair: string = "UETH/USDC"): Promise<number> {
  const url = pickHLInfoUrl();
  const canonP = canonPair(pair);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "l2Book", coin: canonP }),
  });
  const data = await res.json();
  const asks = data?.levels?.asks ?? data?.levels?.a ?? [];
  const best = asks[0]?.px ?? asks[0]?.[0];
  if (!best) throw new Error("No best ask");
  return Number(best);
}

/** ====== Action encoding ====== **/

// Limit 주문(ActionId=1) raw 데이터 (IOC=3)
export function buildLimitOrderData(params: {
  asset: number;            // 10000 + pair.index
  isBuy: boolean;           // true
  limitPx_1e8: bigint;      // 가격 * 1e8
  sz_1e8: bigint;           // 수량(ETH) * 1e8
  reduceOnly?: boolean;     // 기본 false
  tif?: number;             // 1=Alo, 2=Gtc, 3=Ioc
  cloid?: bigint;           // 기본 0n
}) {
  const {
    asset,
    isBuy,
    limitPx_1e8,
    sz_1e8,
    reduceOnly = false,
    tif = 3,
    cloid = 0n,
  } = params;

  const payload = encodeAbiParameters(
    [
      { type: "uint32" },  // asset
      { type: "bool" },    // isBuy
      { type: "uint64" },  // limitPx
      { type: "uint64" },  // sz
      { type: "bool" },    // reduceOnly
      { type: "uint8" },   // tif
      { type: "uint128" }, // cloid
    ],
    [asset, isBuy, limitPx_1e8, sz_1e8, reduceOnly, tif, cloid]
  );

  const header = "0x01000001"; // [version=1][actionId=1]
  return concatHex([header, payload]);
}
