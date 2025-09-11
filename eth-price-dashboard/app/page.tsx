"use client";

import useSWR from "swr";
import PriceCard from "@/components/PriceCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Home() {
  const { data } = useSWR("/api/prices", fetcher, { refreshInterval: 5000 });
  return (
    <main className="container py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ETH 가격 대시보드</h1>
        <div className="text-sm text-gray-400">CEX (Binance / Bitget / Gate / Bybit), 1inch, Hyperliquid</div>
      </header>

      <section className="grid-cards">
        <PriceCard title="Binance" price={data?.binance ?? null} exchangeKey="binance" />
        <PriceCard title="Bitget" price={data?.bitget ?? null} exchangeKey="bitget" />
        <PriceCard title="Gate" price={data?.gate ?? null} exchangeKey="gate" />
        <PriceCard title="Bybit" price={data?.bybit ?? null} exchangeKey="bybit" />
        <PriceCard title="1inch (ETH/USDC Quote)" price={data?.oneinch ?? null} exchangeKey="oneinch" />
        <PriceCard title="Hyperliquid (Spot)" price={data?.hyperliquid ?? null} exchangeKey="hyperliquid" />
      </section>
    </main>
  );
}
