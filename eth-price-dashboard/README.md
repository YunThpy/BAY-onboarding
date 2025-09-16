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



ENV 가이드라인

1. 1inch API Key
ONEINCH_API_KEY=your_1inch_api_key


발급 위치: 1inch Developer Portal

무료 tier도 제공 → API 호출 제한(QPS)이 있지만 테스트엔 충분

발급받은 문자열 그대로 넣으면 됨 (예: abcd1234efgh5678)

👉 이 키가 없으면 1inch 가격조회 / 스왑 기능이 동작하지 않음.
👉 키는 절대 깃허브에 커밋 금지 (.env에만 작성).



2. Hyperliquid HLBuyer 컨트랙트 주소

NEXT_PUBLIC_HL_BUYER_CONTRACT=0x1234abcd5678ef... (실제 배포 주소)


HLBuyer.sol을 Hardhat으로 HyperEVM에 배포하면 로그에 컨트랙트 주소가 출력됨

npx hardhat run scripts/deploy-hl.ts --network hyperevm


그때 나온 주소를 .env에 반영

아직 배포 전이면:

NEXT_PUBLIC_HL_BUYER_CONTRACT=0x0000000000000000000000000000000000000000


로 둬도 앱은 뜨지만, Hyperliquid 매수 버튼은 작동 안 함

## 🔑 Reown (Web3Modal AppKit) Project ID 설정

AppKit(Web3Modal)을 사용하려면 **Reown Cloud**에서 발급받은 `Project ID`가 필요합니다.  
임의 문자열을 넣으면 403 Forbidden 에러가 발생하므로 반드시 정식 발급 절차를 거쳐야 합니다.

### 발급 절차
1. [Reown Cloud](https://cloud.reown.com) 접속 및 로그인 (GitHub, Google, Email 계정 지원)
2. **Create Project** 클릭 → 프로젝트 이름/설명 입력
3. 생성된 프로젝트 상세 페이지에서 **Project ID** 확인
   - 32자리 랜덤 해시 문자열 형태 (예: `2f91d3e8c2c74c9a9f9b2ef9a8c...`)
4. 로컬 환경 변수 파일에 추가:
   ```env
   NEXT_PUBLIC_PROJECT_ID=여기에_발급받은_ProjectID
