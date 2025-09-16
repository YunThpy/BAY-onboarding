"use client";
// 👇 추가
import {
  CORE_WRITER,
  CORE_WRITER_ABI,
  buildLimitOrderData,
  getHLSpotAssetId,
  getHLBestAsk,
  to1e8,
} from "@/lib/hyperliquid";
import type { Address } from "viem";

import React, { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { hyperEvm } from "@/lib/wagmi";

type Props = {
  title: string;
  price?: number | null;
  exchangeKey: "binance" | "bybit" | "gate" | "bitget" | "oneinch" | "hyperliquid";
};

export default function PriceCard({ title, price, exchangeKey }: Props) {
  const [depositToken, setDepositToken] = useState<"ETH" | "USDC">("ETH");
  const [depositAddr, setDepositAddr] = useState("");
  const [depositAmt, setDepositAmt] = useState("0.01");
  const [buyAmt, setBuyAmt] = useState("50"); // USD or USDC
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, data: txHash } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  async function handleDeposit() {
  if (!isConnected) throw new Error("Connect wallet first");
  if (!isAddress(depositAddr)) throw new Error("Invalid address");
  // Ensure on Ethereum mainnet
  if (chainId !== 1) await switchChainAsync?.({ chainId: 1 });
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No wallet provider");
  setLoading(true);
  try {
    if (depositToken === "ETH") {
      const amtWei = parseEther(depositAmt);
      const tx = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: depositAddr,
          value: "0x" + amtWei.toString(16)
        }]
      });
      console.log("ETH deposit tx", tx);
    } else {
      // USDC transfer
      const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
      const abi = [{
        "type": "function",
        "name": "transfer",
        "stateMutability": "nonpayable",
        "inputs": [
          {"name":"to","type":"address"},
          {"name":"amount","type":"uint256"}
        ],
        "outputs": [{"name":"","type":"bool"}]
      }];
      const amt = BigInt(Math.floor(Number(depositAmt) * 1e6)); // 6 decimals
      await writeContractAsync({
        address: USDC as `0x${string}`,
        abi,
        functionName: "transfer",
        args: [depositAddr as `0x${string}`, amt],
        chainId: 1,
      });
    }
  } finally {
    setLoading(false);
  }
}

async function handleBuyOn1inch() {

    if (!isConnected) throw new Error("Connect wallet first");
    if (chainId !== 1) await switchChainAsync?.({ chainId: 1 });
    setLoading(true);
    try {
      const res = await fetch(`/api/oneinch/swap?src=USDC&dst=ETH&amount=${buyAmt}`);
      if (!res.ok) throw new Error("1inch swap API error");
      const payload = await res.json();
      const provider = (window as any).ethereum;
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [payload.tx],
      });
      console.log("1inch swap tx", txHash);
    } finally {
      setLoading(false);
    }
  }

async function handleBuyOnHL() {
  if (!isConnected) throw new Error("Connect wallet first");
  if (chainId !== hyperEvm.id) await switchChainAsync?.({ chainId: hyperEvm.id });

  setLoading(true);
  try {
    // 1) UETH/USDC asset id
    const asset = await getHLSpotAssetId("UETH/USDC");

    // 2) 가격 소스: 카드의 price 우선, 없으면 HL best ask 조회
    const spotPrice = (typeof price === "number" && price > 0) ? price : await getHLBestAsk("UETH/USDC");

    // 3) 슬리피지/한도
    const slipBps = Number(process.env.NEXT_PUBLIC_HL_SLIPPAGE_BPS ?? 10); // 기본 0.10%
    const maxUsd   = Number(process.env.NEXT_PUBLIC_MAX_SWAP_USD ?? 100);

    const amtUsd = Number(buyAmt);
    if (!isFinite(amtUsd) || amtUsd <= 0) throw new Error("Invalid buy amount");
    if (amtUsd > maxUsd) throw new Error(`주문 금액이 한도(${maxUsd} USD)를 초과합니다`);

    // 4) limitPx, 사이즈 계산(1e8)
    const limitPxUsd = spotPrice * (1 + slipBps / 10_000);
    const sizeEth    = amtUsd / spotPrice;

    const limitPx_1e8 = to1e8(limitPxUsd);
    const sz_1e8      = to1e8(sizeEth);

    // 5) 액션 바이트 생성 (IOC=3)
    const data = buildLimitOrderData({
      asset,
      isBuy: true,
      limitPx_1e8,
      sz_1e8,
      tif: 3,
    });

    // 6) 내 지갑(EOA) → CoreWriter 호출
    await writeContractAsync({
      address: CORE_WRITER as Address,
      abi: CORE_WRITER_ABI,
      functionName: "sendRawAction",
      args: [data],
      chainId: hyperEvm.id,
    });

    alert("IOC BUY 전송 완료 (체결 여부는 Hyperliquid 측 상태에 따름)");
  } finally {
    setLoading(false);
  }
}


  const action =
  
    exchangeKey === "oneinch"
      ? <button className="btn btn-primary w-full mt-3" onClick={handleBuyOn1inch} disabled={loading}>매수하기 (1inch)</button>
      : exchangeKey === "hyperliquid"
      ? <button className="btn btn-primary w-full mt-3" onClick={handleBuyOnHL} disabled={loading}>매수하기 (Hyperliquid)</button>
      : <div className="mt-3 space-y-2">
          <label className="label">토큰 선택</label>
          <select className="input" value={depositToken} onChange={(e)=>setDepositToken(e.target.value as "ETH" | "USDC")}>
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
          </select>
          <label className="label">입금 주소</label>
          <input className="input" placeholder="0x..." value={depositAddr} onChange={(e)=>setDepositAddr(e.target.value)} />
          <label className="label">입금 토큰</label>
          <label className="label">입금 수량</label>
          <input className="input" value={depositAmt} onChange={(e)=>setDepositAmt(e.target.value)} />
          <button className="btn btn-outline w-full" onClick={handleDeposit} disabled={loading}>입금하기</button>
        </div>;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-[var(--muted)]">{exchangeKey}</span>
      </div>
      <div className="text-3xl font-bold">{price ? price.toLocaleString() : "-" } <span className="text-[var(--muted)] text-base">USDT</span></div>
      { (exchangeKey === "oneinch" || exchangeKey === "hyperliquid") && (
        <div className="mt-3">
          <label className="label">매수 금액 (USDC, USD 기준)</label>
          <input className="input" value={buyAmt} onChange={(e)=>setBuyAmt(e.target.value)} />
        </div>
      )}
      {action}
    </div>
  )
}
