
export const fmtBps = (x: number) => `${x.toFixed(2)} bps`;
export const fmtPx = (x: number) => (x < 1 ? x.toFixed(6) : x.toFixed(4));
