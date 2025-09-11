# ETH Price Dashboard (CEX + 1inch + Hyperliquid)

Next.js + TypeScript + Tailwind + wagmi/RainbowKit

## What it does

- Shows ETH/USDT(USDC) price from **Binance, Bitget, Gate, Bybit**, **1inch** quote, and **Hyperliquid Spot**
- Wallet connect (Ethereum + HyperEVM)
- **Buy ETH on 1inch** (USDC -> ETH swap via 1inch API)
- **Buy ETH Spot on Hyperliquid** via **CoreWriter** (IOC order through HyperEVM system contract)
- **Deposit to CEX** card = on-chain transfer of ETH to your **exchange deposit address**

> ⚠️ Always test with *small* amounts. 1inch API requires an API key. Hyperliquid trade needs gas in HYPE and HyperEVM network added.

## Quickstart

```bash
pnpm i # or npm i / yarn
cp .env.example .env
# Fill ONEINCH_API_KEY and (after deploy) HL_BUYER_CONTRACT_ADDRESS
pnpm dev
```

Open http://localhost:3000

### Deploy the Hyperliquid buyer contract

1. Get a HyperEVM RPC and fund your deployer with a bit of HYPE (gas).
2. Set `PRIVATE_KEY` in `.env` (hex, no 0x) and optional `HYPER_EVM_RPC`.
3. Deploy:

```bash
pnpm hardhat run scripts/deploy-hl.ts --network hyperevm
```

4. Copy the printed address to `.env` as `HL_BUYER_CONTRACT_ADDRESS` and restart `pnpm dev`.

### 1inch

- Create an API key at https://portal.1inch.dev and put it in `.env` as `ONEINCH_API_KEY`.
- The app calls our server routes `/api/oneinch/quote` and `/api/oneinch/swap` to avoid CORS & to keep the key server-side.

### Notes

- **HL IOC order math**: we take best ask from orderbook and set `limitPx = ask * 1.01` (1% headroom), `sz = (USD amount / ask)`, both scaled by 1e8.
- **CEX deposit**: this is just a plain **ETH transfer** to whatever address you provide. Double-check chain and address.
- You can adjust refresh interval of price polling in `app/page.tsx`.

## Security checklist

- Never expose private keys client-side.
- Validate the deposit address carefully.
- Consider rate limiting and error masking on server routes.
- Add slippage controls and preview for the 1inch swap.
- For production, pin exact dependency versions and add e2e tests.
