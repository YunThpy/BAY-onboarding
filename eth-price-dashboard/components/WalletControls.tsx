"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useChainId, useSwitchChain, useConnect } from "wagmi";
import type { Address } from "viem";
import { hyperEvm } from "@/lib/wagmi";

function shortAddr(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function WalletControls() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected, status } = useAccount();
  const chainId = useChainId();
  const { switchChain, status: switchStatus, error: switchError } = useSwitchChain();
  const { connectors, connect } = useConnect();

  // 잔액 (연결되면 자동 조회)
  const { data: balance } = useBalance({
    address: address as Address | undefined,
    chainId, // 현재 체인 기준
    query: { enabled: isConnected },
  });

  // WalletConnect 커넥터(있으면 programmatic connect에 사용)
  const wcConnector = useMemo(
    () => connectors.find((c) => c.id.toLowerCase().includes("walletconnect")),
    [connectors]
  );

  if (!mounted) return null;

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-gray-500">Status: <b>{status}</b></div>

      {isConnected ? (
        <>
          <div className="text-sm">
            Account: <b>{shortAddr(address)}</b>
          </div>
          <div className="text-sm">
            Chain: <b>{chainId}</b>{chainId !== hyperEvm.id ? " (not HyperEVM)" : " (HyperEVM ✅)"}
          </div>
          <div className="text-sm">
            Balance: <b>{balance ? `${balance.formatted} ${balance.symbol}` : "…"}</b>
          </div>

          {chainId !== hyperEvm.id && (
            <button
              onClick={() => switchChain?.({ chainId: hyperEvm.id })}
              disabled={switchStatus === "pending"}
              className="px-3 py-2 rounded bg-black text-white text-sm"
            >
              {switchStatus === "pending" ? "Switching..." : "Switch to HyperEVM"}
            </button>
          )}
          {switchError && (
            <div className="text-xs text-red-600">
              {String(switchError?.message || switchError)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-sm">지갑이 연결되어 있지 않습니다.</div>
          {/* 필요시 프로그래매틱 연결 (RainbowKit 버튼 대신/병행) */}
          {wcConnector && (
            <button
              onClick={() => connect({ connector: wcConnector })}
              className="px-3 py-2 rounded bg-black text-white text-sm"
            >
              Connect with WalletConnect
            </button>
          )}
          {/* 보통은 상단의 RainbowKit <ConnectButton />을 사용하면 충분 */}
        </>
      )}
    </div>
  );
}
