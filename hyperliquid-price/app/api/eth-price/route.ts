// import { NextResponse } from "next/server";

// export async function GET() {
//   const mode = process.env.NEXT_PUBLIC_HL_MODE || "MAINNET";
//   const symbol = process.env.NEXT_PUBLIC_SYMBOL || "UETH";

//   const endpoint =
//     mode === "TESTNET" ? process.env.HL_API_TESTNET : process.env.HL_API_MAINNET;

//   // 1) spotMeta: tokens + universe 가져오기
//   const metaRes = await fetch(endpoint!, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ type: "spotMeta" }),
//   });
//   const metaText = await metaRes.text();

//   try {
//     const meta = JSON.parse(metaText);
//     const tokens = meta?.tokens ?? [];
//     const universe = meta?.universe ?? [];

//     // 토큰 찾기 (예: UETH)
//     const token = tokens.find((t: any) => t.name === symbol);
//     if (!token) {
//       return NextResponse.json(
//         { price: null, error: `Token ${symbol} not found`, mode, symbol },
//         { status: 404 },
//       );
//     }

//     // ── 방법 A: tokenDetails로 markPx 바로 가져오기 (가장 단순/안전)
//     const tdRes = await fetch(endpoint!, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ type: "tokenDetails", tokenId: token.tokenId }),
//     });
//     const tdText = await tdRes.text();
//     try {
//       const td = JSON.parse(tdText);
//       const priceStr = td?.markPx ?? td?.midPx ?? null;
//       const price = priceStr !== null ? Number(priceStr) : null;
//       return NextResponse.json({ price, mode, symbol });
//     } catch {
//       // tokenDetails 실패 시 B로 폴백
//     }

//     // ── 방법 B: spotMetaAndAssetCtxs로 universe index 기반 컨텍스트 참조
//     const macRes = await fetch(endpoint!, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ type: "spotMetaAndAssetCtxs" }),
//     });
//     const macText = await macRes.text();
//     try {
//       const [meta2, ctxs] = JSON.parse(macText);
//       const uni = meta2?.universe ?? universe;

//       // UETH가 포함된 페어(@index) 찾기: u.tokens.includes(token.index)
//       const pair = uni.find((u: any) => Array.isArray(u.tokens) && u.tokens.includes(token.index));

//       let price: number | null = null;
//       if (pair && Array.isArray(ctxs) && ctxs[pair.index]) {
//         const ctx = ctxs[pair.index];
//         const pxStr = ctx?.markPx ?? ctx?.midPx ?? null;
//         price = pxStr !== null ? Number(pxStr) : null;
//       }

//       return NextResponse.json({ price, mode, symbol });
//     } catch {
//       // 전부 실패 시 에러 반환
//       return NextResponse.json(
//         { price: null, error: "Failed to parse asset contexts", mode, symbol },
//         { status: 500 },
//       );
//     }
//   } catch {
//     return NextResponse.json(
//       { price: null, error: metaText, mode, symbol },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";

// 콘솔 로그를 "한 번만" 찍기 위한 플래그 (dev 리로드에도 유지)
declare global {
  // eslint-disable-next-line no-var
  var __HL_ONE_SHOT_LOGGED__: boolean | undefined;
}

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

    // ===== DEBUG: 콘솔 복붙용 목록(한 번만 출력) =====
    if (!globalThis.__HL_ONE_SHOT_LOGGED__) {
      try {
        // 1) universe name만 줄 단위로(@1, @2, PURR/USDC ...)
        console.log(
          "=== universe names (copy/paste) ===\n" +
            (universe as any[]).map((u) => String(u.name)).join("\n")
        );

        // 2) @index => [BASE / QUOTE] (토큰 이름까지 해석해서 보기 좋게)
        const byIdx = new Map<number, any>();
        for (const t of tokens as any[]) byIdx.set(t.index, t);

        console.log(
          "=== @index => [BASE / QUOTE] (copy/paste) ===\n" +
            (universe as any[])
              .map((u: any) => {
                const [baseIdx, quoteIdx] = u.tokens || [];
                const base = byIdx.get(baseIdx)?.name ?? baseIdx;
                const quote = byIdx.get(quoteIdx)?.name ?? quoteIdx;
                return `${u.name}\t[${base} / ${quote}]`;
              })
              .join("\n")
        );

        // 3) UETH 포함 페어만 보고 싶을 때
        const ueth = (tokens as any[]).find((t) => t.name === "UETH");
        if (ueth) {
          const list = (universe as any[])
            .filter((u: any) => Array.isArray(u.tokens) && u.tokens.includes(ueth.index))
            .map((u: any) => {
              const [baseIdx, quoteIdx] = u.tokens || [];
              const base = byIdx.get(baseIdx)?.name ?? baseIdx;
              const quote = byIdx.get(quoteIdx)?.name ?? quoteIdx;
              return `${u.name}\t[${base} / ${quote}]`;
            })
            .join("\n");

          console.log("=== UETH 포함 페어만 (copy/paste) ===\n" + list);
        }
      } catch (e) {
        console.error("DEBUG log failed:", e);
      }
      globalThis.__HL_ONE_SHOT_LOGGED__ = true; // 다시 찍고 싶으면 서버 재시작
    }
    // ===== DEBUG 끝 =====

    // 토큰 찾기 (예: UETH)
    const token = (tokens as any[]).find((t: any) => t.name === symbol);
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
      const pair = (uni as any[]).find(
        (u: any) => Array.isArray(u.tokens) && u.tokens.includes(token.index)
      );

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
