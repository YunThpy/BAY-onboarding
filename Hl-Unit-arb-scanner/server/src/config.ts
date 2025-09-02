
import 'dotenv/config';

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  HL_INFO_URL: process.env.HL_INFO_URL || 'https://api.hyperliquid.xyz/info',
  HL_WS_URL: process.env.HL_WS_URL || 'wss://api.hyperliquid.xyz/ws',
  UNIT_BASE_URL: process.env.UNIT_BASE_URL || 'https://api.hyperunit.xyz',
  HL_ADDR_FOR_PROBING: process.env.HL_ADDR_FOR_PROBING || '0x0000000000000000000000000000000000000000',
  JUP_BASE_URL: process.env.JUP_BASE_URL || 'https://quote-api.jup.ag',
  JUP_SLIPPAGE_BPS: parseInt(process.env.JUP_SLIPPAGE_BPS || '20', 10),
  CEXS: (process.env.CEXS || 'binance,bybit,gate,bitget').split(',').map(s => s.trim()),
  CCXT_REST_TIMEOUT_MS: parseInt(process.env.CCXT_REST_TIMEOUT_MS || '3500', 10),
  CCXT_CONCURRENCY: parseInt(process.env.CCXT_CONCURRENCY || '4', 10),
  TAKER_FEES_BPS: {
    hyperliquid: parseFloat(process.env.FEE_HL_TAKER_BPS || '5'),
    jupiter: parseFloat(process.env.FEE_JUPITER_TAKER_BPS || '5'),
    binance: parseFloat(process.env.FEE_BINANCE_TAKER_BPS || '10'),
    bybit: parseFloat(process.env.FEE_BYBIT_TAKER_BPS || '10'),
    gate: parseFloat(process.env.FEE_GATE_TAKER_BPS || '20'),
    bitget: parseFloat(process.env.FEE_BITGET_TAKER_BPS || '10'),
    backpack: parseFloat(process.env.FEE_BACKPACK_TAKER_BPS || '10'),
  } as Record<string, number>,
  QUOTE: process.env.QUOTE || 'USDC',
  SIZE_USD: parseFloat(process.env.SIZE_USD || '10000'),
  UNIVERSE_REFRESH_SEC: parseInt(process.env.UNIVERSE_REFRESH_SEC || '600', 10),
};
