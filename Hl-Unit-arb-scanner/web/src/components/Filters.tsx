
export default function Filters() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <input placeholder="심볼 검색 (예: SOL)" className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500" />
      <select className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
        <option>모든 기회</option>
        <option>수익 > 10 bps</option>
        <option>수익 > 25 bps</option>
      </select>
    </div>
  );
}
