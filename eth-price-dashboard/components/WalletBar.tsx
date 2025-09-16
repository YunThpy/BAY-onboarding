"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletBar() {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3 border-b">
      <div className="font-semibold">ETH Price Dashboard</div>
      <ConnectButton />
    </div>
  );
}
