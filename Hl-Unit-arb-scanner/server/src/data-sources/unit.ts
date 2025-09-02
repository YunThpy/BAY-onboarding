
import axios from 'axios';
import { CONFIG } from '../config';
import type { Chain } from '../types';

export async function probeUnitDepositable(asset: string, srcChain: Exclude<Chain, 'hyperliquid'>) {
  const url = `${CONFIG.UNIT_BASE_URL}/gen/${srcChain}/hyperliquid/${asset}/${CONFIG.HL_ADDR_FOR_PROBING}`;
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.status === 200;
  } catch (e: any) {
    if (e?.response?.status === 400) return false;
    return false;
  }
}
