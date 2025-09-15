"use client";

import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';

// Define HyperEVM chain (Hyperliquid)
export const hyperEvm = {
  id: 998,
  name: 'Hyperliquid',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid-testnet.xyz/evm'] },
    public: { http: ['https://rpc.hyperliquid-testnet.xyz/evm'] },
  },
} as const;

export const config = getDefaultConfig({
  appName: "ETH Price Dashboard",
  projectId: "eth-price-dashboard", // for WalletConnect v2 (RainbowKit internal)
  chains: [mainnet, hyperEvm],
  transports: {
    [mainnet.id]: http(),
    [hyperEvm.id]: http(hyperEvm.rpcUrls.default.http[0]),
  },
  ssr: true,
});
