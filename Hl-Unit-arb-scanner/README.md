
# HL Unit Arb Scanner (MVP)

Universe = **Hyperliquid Unit로 입출금 가능한 자산**. Venue: Hyperliquid(Spot), Jupiter/Orca, CEX(Binance, Bybit, Gate, Bitget).

## Quickstart

### 1) Server
```bash
cd server
cp .env.example .env
# .env 에 HL_ADDR_FOR_PROBING 값을 너의 HL 주소로 설정
npm i   # 또는 yarn / pnpm i
npm run dev
```

### 2) Web
```bash
cd ../web
npm i   # 또는 yarn / pnpm i
npm run dev
# http://localhost:3000
```

## API
- `GET /health` → `{ ok: true }`
- `GET /assets` → Unit 입금 가능 + HL에 USDC 페어 존재하는 자산 목록
- `GET /opps?base=SOL&sizeUsd=10000` → quotes/byVenue/opps

## Notes
- HL WS 스냅샷이 비어 있을 수 있으니 최초 5~10초는 대기하세요.
- Jupiter 토큰 mint/decimals는 최소 셋만 포함(SOL/USDC). 프로덕션에서 토큰리스트로 확장 권장.
- ccxt REST는 레이트리밋이 있으니 동시성은 환경변수로 제어.
