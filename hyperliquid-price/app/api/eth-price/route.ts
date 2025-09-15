import { NextResponse } from "next/server";

export async function GET() {
  const mode = process.env.NEXT_PUBLIC_HL_MODE || "MAINNET";
  const symbol = process.env.NEXT_PUBLIC_SYMBOL || "UETH";

  const endpoint =
    mode === "TESTNET"
      ? process.env.HL_API_TESTNET
      : process.env.HL_API_MAINNET;

  const res = await fetch(endpoint!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "spotMeta",
    }),
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);

    // ✅ tokens 배열에서 내가 찾고자 하는 심볼(UETH 등)을 확인
    const token = data.tokens.find((t: any) => t.name === symbol);

    // ✅ universe 배열에서 해당 token.index를 가진 마켓(@index)을 찾음
    const target = token
      ? data.universe.find((c: any) => c.name === `@${token.index}`)
      : null;

    return NextResponse.json({
      price: target?.markPx || null,
      mode,
      symbol,
    });
  } catch (err) {
    console.error("API parsing error:", text);
    return NextResponse.json(
      { price: null, error: text, mode, symbol },
      { status: 500 },
    );
  }
}
