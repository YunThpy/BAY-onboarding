// app/api/prices/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

// axios 인스턴스 (공통 타임아웃)
const http = axios.create({ timeout: 6000 });

// 숫자 캐스팅 헬퍼
const asNum = (v: any) => (v == null ? null : Number(v));

// Hyperliquid INFO 엔드포인트 자동 선택 (TESTNET/MAINNET)
// 필요하면 .env에 HL_INFO_URL 로 강제 오버라이드 가능
const HL_INFO =
  process.env.HL_INFO_URL?.trim() ||
  (process.env.NEXT_PUBLIC_MODE === "TESTNET" ||
  process.env.NEXT_PUBLIC_HL_MODE === "TESTNET"
    ? "https://api.hyperliquid-testnet.xyz/info"
    : "https://api.hyperliquid.xyz/info");

export async function GET() {
  try {
    const oneInchKey = process.env.ONEINCH_API_KEY;

    const [binance, bybit, gate, bitget, oneinch, hyperliquid] =
      await Promise.all([
        // Binance spot
        http
          .get("https://data-api.binance.vision/api/v3/ticker/price", {
            params: { symbol: "ETHUSDT" },
          })
          .then((r) => asNum(r.data?.price))
          .catch(() => null),

        // Bybit v5 spot
        http
          .get("https://api.bybit.com/v5/market/tickers", {
            params: { category: "spot", symbol: "ETHUSDT" },
          })
          .then((r) => asNum(r.data?.result?.list?.[0]?.lastPrice))
          .catch(() => null),

        // Gate.io spot
        http
          .get("https://api.gateio.ws/api/v4/spot/tickers", {
            params: { currency_pair: "ETH_USDT" },
          })
          .then((r) => asNum(r.data?.[0]?.last))
          .catch(() => null),

        // Bitget spot
        http
          .get("https://api.bitget.com/api/spot/v1/market/ticker", {
            params: { symbol: "ETHUSDT_SPBL" },
          })
          .then((r) => asNum(r.data?.data?.close))
          .catch(() => null),

        // 1inch — 키가 있으면 우선 price API 사용, 실패 시 quote로 폴백
        // 1inch — 키가 있으면 우선 price API 사용, 실패 시 quote로 폴백
        (async () => {
          if (!oneInchKey) return null;

          // 1) price API (간단)
          try {
            const { data } = await http.get(
              "https://api.1inch.dev/price/v1.1/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
              { headers: { Authorization: `Bearer ${oneInchKey}` } }
            );
            return asNum(data?.price);
          } catch (err: any) {
            console.error(
              "1inch price API error:",
              err.response?.data || err.message
            );
            // throw err;  // 테스트 중엔 던져서 확인 가능, 운영에선 주석 처리 권장
          }

          // 2) quote API 폴백 (USDC→ETH, 100 USDC 기준 내재 가격)
          try {
            const params = {
              src: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
              dst: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
              amount: String(100 * 1e6),
            };
            const { data } = await http.get(
              "https://api.1inch.dev/swap/v6.0/1/quote",
              { headers: { Authorization: `Bearer ${oneInchKey}` }, params }
            );
            const toDecimals = data?.toToken?.decimals ?? 18;
            const toAmount = Number(data?.toAmount) / 10 ** toDecimals;
            return toAmount ? 100 / toAmount : null;
          } catch (err: any) {
            console.error(
              "1inch quote API error:",
              err.response?.data || err.message
            );
            return null;
          }
      })(),


        // 🔥 Hyperliquid — UETH spot (정식 로직: tokenDetails → spotMetaAndAssetCtxs 폴백)
        (async () => {
          try {
            // 환경변수에서 심볼(UETH 권장) 읽기
            const symbol =
              process.env.NEXT_PUBLIC_SYMBOL?.trim() || "UETH";

            // 1) spotMeta: tokens에서 대상 토큰 찾기 (index/tokenId 확보)
            const metaRes = await http.post(
              HL_INFO,
              { type: "spotMeta" },
              { headers: { "Content-Type": "application/json" } }
            );
            const tokens = metaRes.data?.tokens ?? [];
            const universe = metaRes.data?.universe ?? [];
            const token = tokens.find((t: any) => t?.name === symbol);
            if (!token) return null;

            // 2-A) 단건: tokenDetails(tokenId)로 바로 가격 (가장 안전/단순)
            try {
              const tdRes = await http.post(
                HL_INFO,
                { type: "tokenDetails", tokenId: token.tokenId },
                { headers: { "Content-Type": "application/json" } }
              );
              const priceStr = tdRes.data?.markPx ?? tdRes.data?.midPx ?? null;
              if (priceStr != null) return asNum(priceStr);
            } catch {
              // 무시하고 폴백 진행
            }

            // 2-B) 배치: spotMetaAndAssetCtxs → [meta, ctxs]
            try {
              const macRes = await http.post(
                HL_INFO,
                { type: "spotMetaAndAssetCtxs" },
                { headers: { "Content-Type": "application/json" } }
              );
              const meta2 = Array.isArray(macRes.data) ? macRes.data[0] : null;
              const ctxs = Array.isArray(macRes.data) ? macRes.data[1] : null;
              const uni = meta2?.universe ?? universe;

              // UETH 토큰 index를 포함하는 페어 찾기 (u.tokens.includes(index))
              const pair = uni?.find(
                (u: any) => Array.isArray(u?.tokens) && u.tokens.includes(token.index)
              );
              if (!pair || !Array.isArray(ctxs) || !ctxs[pair.index]) return null;

              const ctx = ctxs[pair.index];
              const pxStr = ctx?.markPx ?? ctx?.midPx ?? null;
              return pxStr != null ? asNum(pxStr) : null;
            } catch {
              return null;
            }
          } catch {
            return null;
          }
        })(),
      ]);

    return NextResponse.json({
      binance,
      bybit,
      gate,
      bitget,
      oneinch,
      hyperliquid,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 200 } // 부분 실패 허용
    );
  }
}
