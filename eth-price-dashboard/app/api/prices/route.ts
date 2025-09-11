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
  (process.env.NEXT_PUBLIC_MODE === "TESTNET"
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
        (async () => {
          if (!oneInchKey) return null;
          // 1) price API (간단)
          try {
            const { data } = await http.get(
              "https://api.1inch.dev/price/v1.1/1/ETH",
              { headers: { Authorization: `Bearer ${oneInchKey}` } }
            );
            return asNum(data?.price);
          } catch {
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
            } catch {
              return null;
            }
          }
        })(),

        // Hyperliquid — l2Book → metaAndAssetCtxs(markPx) → allMids 순 폴백
        (async () => {
          // 1) l2Book: 최우선 매도호가 사용
          try {
            const { data } = await http.post(
              HL_INFO,
              { type: "l2Book", coin: "ETH/USDC" },
              { headers: { "content-type": "application/json" } }
            );
            const askPx =
              data?.levels?.asks?.[0]?.px ?? data?.levels?.a?.[0]?.[0] ?? null;
            if (askPx != null) return asNum(askPx);
          } catch {
            // 무시하고 폴백 진행
          }
          // 2) metaAndAssetCtxs: markPx 사용
          try {
            const { data } = await http.post(
              HL_INFO,
              { type: "metaAndAssetCtxs" },
              { headers: { "content-type": "application/json" } }
            );
            const eth = data?.assetCtxs?.find((a: any) => a?.name === "ETH");
            if (eth?.markPx != null) return asNum(eth.markPx);
          } catch {
            // ignore
          }
          // 3) allMids: ETH mid 사용 (있을 때)
          try {
            const { data } = await http.post(
              HL_INFO,
              { type: "allMids" },
              { headers: { "content-type": "application/json" } }
            );
            const mid = data?.mids?.ETH ?? data?.mids?.["ETH/USDC"];
            if (mid != null) return asNum(mid);
          } catch {
            // ignore
          }
          return null;
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
