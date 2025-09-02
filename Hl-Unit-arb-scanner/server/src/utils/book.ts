
export function impactPx(levels: [number, number][], side: 'BUY' | 'SELL', sizeBase: number) {
  let remaining = sizeBase;
  let total = 0;
  for (const [px, qty] of levels) {
    const take = Math.min(remaining, qty);
    total += take * px;
    remaining -= take;
    if (remaining <= 0) break;
  }
  if (remaining > 0) return undefined;
  return total / sizeBase;
}
