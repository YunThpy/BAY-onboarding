import { NextResponse } from "next/server";

export async function GET() {
  const mode = process.env.NEXT_PUBLIC_HL_MODE || "MAINNET";
  const symbol = process.env.NEXT_PUBLIC_SYMBOL || "UETH";

  const endpoint =
    mode === "TESTNET" ? process.env.HL_API_TESTNET : process.env.HL_API_MAINNET;

  // 1) spotMeta: tokens + universe 가져오기
  const metaRes = await fetch(endpoint!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "spotMeta" }),
  });
  const metaText = await metaRes.text();

  try {
    const meta = JSON.parse(metaText);
    const tokens = meta?.tokens ?? [];
    const universe = meta?.universe ?? [];

    // 토큰 찾기 (예: UETH)
    const token = tokens.find((t: any) => t.name === symbol);
    if (!token) {
      return NextResponse.json(
        { price: null, error: `Token ${symbol} not found`, mode, symbol },
        { status: 404 },
      );
    }

    // ── 방법 A: tokenDetails로 markPx 바로 가져오기 (가장 단순/안전)
    const tdRes = await fetch(endpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "tokenDetails", tokenId: token.tokenId }),
    });
    const tdText = await tdRes.text();
    try {
      const td = JSON.parse(tdText);
      const priceStr = td?.markPx ?? td?.midPx ?? null;
      const price = priceStr !== null ? Number(priceStr) : null;
      return NextResponse.json({ price, mode, symbol });
    } catch {
      // tokenDetails 실패 시 B로 폴백
    }

    // ── 방법 B: spotMetaAndAssetCtxs로 universe index 기반 컨텍스트 참조
    const macRes = await fetch(endpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "spotMetaAndAssetCtxs" }),
    });
    const macText = await macRes.text();
    try {
      const [meta2, ctxs] = JSON.parse(macText);
      const uni = meta2?.universe ?? universe;

      // UETH가 포함된 페어(@index) 찾기: u.tokens.includes(token.index)
      const pair = uni.find((u: any) => Array.isArray(u.tokens) && u.tokens.includes(token.index));

      let price: number | null = null;
      if (pair && Array.isArray(ctxs) && ctxs[pair.index]) {
        const ctx = ctxs[pair.index];
        const pxStr = ctx?.markPx ?? ctx?.midPx ?? null;
        price = pxStr !== null ? Number(pxStr) : null;
      }

      return NextResponse.json({ price, mode, symbol });
    } catch {
      // 전부 실패 시 에러 반환
      return NextResponse.json(
        { price: null, error: "Failed to parse asset contexts", mode, symbol },
        { status: 500 },
      );
    }
  } catch {
    return NextResponse.json(
      { price: null, error: metaText, mode, symbol },
      { status: 500 },
    );
  }
}
