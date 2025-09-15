"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("MAINNET");
  const [symbol, setSymbol] = useState<string>("UETH");

  useEffect(() => {
    async function loadPrice() {
      try {
        const res = await fetch("/api/eth-price");
        const data = await res.json();
        setMode(data.mode);
        setSymbol(data.symbol);
        if (data?.price) {
          setPrice(Number(data.price));
          setError(null);
        } else {
          setPrice(null);
          setError(`No ${data.symbol} price found on ${data.mode}`);
        }
      } catch (err) {
        setError("Failed to fetch price");
      }
    }
    loadPrice();
    const interval = setInterval(loadPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="p-8 rounded-2xl shadow-xl bg-gray-800 text-center">
        <h1 className="text-3xl font-bold mb-4">
          Hyperliquid {mode} {symbol} Price
        </h1>
        {price !== null ? (
          <p className="text-5xl font-mono text-green-400">
            ${price.toFixed(2)}
          </p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <p className="text-gray-400">Loading...</p>
        )}
      </div>
    </main>
  );
}
