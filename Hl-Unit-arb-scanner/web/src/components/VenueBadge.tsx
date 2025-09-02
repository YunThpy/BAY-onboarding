
const COLORS: Record<string, string> = {
  hyperliquid: 'bg-cyan-500/20 text-cyan-300',
  jupiter: 'bg-emerald-500/20 text-emerald-300',
  binance: 'bg-yellow-500/20 text-yellow-300',
  bybit: 'bg-orange-500/20 text-orange-300',
  gate: 'bg-pink-500/20 text-pink-300',
  bitget: 'bg-teal-500/20 text-teal-300',
  backpack: 'bg-fuchsia-500/20 text-fuchsia-300',
};
export default function VenueBadge({ v }: { v: string }) {
  return <span className={`text-xs px-2.5 py-1 rounded-full ${COLORS[v] || 'bg-slate-700 text-slate-100'}`}>{v}</span>;
}
