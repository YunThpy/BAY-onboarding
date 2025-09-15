export async function fetchETHPrice() {
  const endpoint =
    process.env.NEXT_PUBLIC_HL_MODE === "TESTNET"
      ? process.env.HL_API_TESTNET
      : process.env.HL_API_MAINNET;

  const res = await fetch(endpoint!, {
    method: "POST",
    body: JSON.stringify({
      type: "spotMeta",
    }),
  });

  const data = await res.json();
  const eth = data.universe.find((c: any) => c.name === "ETH");
  return eth?.markPx || null;
}
