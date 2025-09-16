"use client";

import { http } from "wagmi";
import type { Chain } from "wagmi";
import { mainnet } from "wagmi/chains";
import {
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';

// ✅ WalletConnect Project ID (Reown/WC Cloud에서 복사한 진짜 해시)
//    .env.local: NEXT_PUBLIC_PROJECT_ID=0dea24632e5b271216aeac3b931d1002 (예시)
const projectId = (process.env.NEXT_PUBLIC_PROJECT_ID ?? "").trim();
if (!projectId) {
  // 개발 중 바로 알림
  // 콘솔에 찍히면 .env.local, 재시작 여부, 철자 확인
  // (필요하면 throw new Error(...) 로 강하게 막아도 됨)
  // eslint-disable-next-line no-console
  console.error("[wagmi] Missing NEXT_PUBLIC_PROJECT_ID");
}

// ✅ Hyperliquid HyperEVM (Testnet 예시)
//    필요하면 RPC를 .env로 빼세요: process.env.HYPER_EVM_RPC
export const hyperEvm = {
  id: 998,
  name: "Hyperliquid",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.HYPER_EVM_RPC?.trim() || "https://rpc.hyperliquid-testnet.xyz/evm"] },
    public:  { http: [process.env.HYPER_EVM_RPC?.trim() || "https://rpc.hyperliquid-testnet.xyz/evm"] },
  },
  // (선택) block explorers 등 추가 가능
} as const satisfies Chain;

// ✅ RainbowKit + wagmi 통합 설정 (AppKit 사용 안 함)
export const config = getDefaultConfig({
  appName: "ETH Price Dashboard",
  projectId,                                      // 🔥 하드코딩 제거
  chains: [mainnet, hyperEvm],
  transports: {
    [mainnet.id]: http(),
    [hyperEvm.id]: http(hyperEvm.rpcUrls.default.http[0]),
  },
  ssr: true,
});
