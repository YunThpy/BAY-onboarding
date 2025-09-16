"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import type { Address } from "viem";
import { hyperEvm } from "@/lib/wagmi";

import PriceCard from "@/components/PriceCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function shortAddr(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function Home() {
  // (선택) AppKit 잔재 추적용 fetch 후킹 — 필요 없으면 삭제해도 됨
  useEffect(() => {
    const orig = window.fetch;
    window.fetch = (...args: any[]) => {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
      if (url?.includes("appkit/v1/config")) {
        console.trace("[TRACE] appkit config fetch:", url);
      }
      return (orig as any)(...args);
    };
    return () => {
      window.fetch = orig;
    };
  }, []);

  // 지갑 상태 / 네트워크 / 잔액
  const { address, isConnected, status } = useAccount();
  const chainId = useChainId();
  const { switchChain, status: switchStatus, error: switchError } = useSwitchChain();
  const { data: balance } = useBalance({
    address: (address as Address) || undefined,
    chainId,
    query: { enabled: isConnected },
  });

  const { data } = useSWR("/api/prices", fetcher, { refreshInterval: 5000 });

  return (
    <main className="container py-6 space-y-6">
      {/* 상단 바: 타이틀 + 지갑 연결 버튼 */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ETH 가격 대시보드</h1>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-gray-400">
            CEX (Binance / Bitget / Gate / Bybit), 1inch, Hyperliquid
          </span>
          <ConnectButton />
        </div>
      </header>

      {/* 연결 상태/네트워크/잔액 섹션 */}
      <section className="rounded-lg border p-4 space-y-2">
        <div className="text-sm text-gray-600">
          Status: <b>{status}</b>
        </div>

        {isConnected ? (
          <>
            <div className="text-sm">
              Account: <b>{shortAddr(address)}</b>
            </div>
            <div className="text-sm">
              Chain:{" "}
              <b>
                {chainId}
                {chainId === hyperEvm.id ? " (HyperEVM ✅)" : " (not HyperEVM)"}
              </b>
            </div>
            <div className="text-sm">
              Balance:{" "}
              <b>
                {balance ? `${balance.formatted} ${balance.symbol}` : "…"}
              </b>
            </div>

            {chainId !== hyperEvm.id && (
              <button
                onClick={() => switchChain?.({ chainId: hyperEvm.id })}
                disabled={switchStatus === "pending"}
                className="mt-2 inline-flex items-center rounded-md bg-black px-3 py-2 text-sm text-white"
              >
                {switchStatus === "pending"
                  ? "Switching..."
                  : "Switch to HyperEVM (998)"}
              </button>
            )}

            {switchError && (
              <div className="text-xs text-red-600">
                {String(switchError?.message || switchError)}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-600">
            지갑이 연결되어 있지 않습니다. 우측 상단의 <b>Connect</b> 버튼을 눌러 연결하세요.
          </div>
        )}
      </section>

      {/* 가격 카드 그리드 */}
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
