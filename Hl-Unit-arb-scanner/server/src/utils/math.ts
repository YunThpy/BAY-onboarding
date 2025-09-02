
export const round = (x: number, d = 6) => Math.round(x * 10 ** d) / 10 ** d;
export const bps = (from: number, to: number) => ((to / from) - 1) * 1e4;
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
