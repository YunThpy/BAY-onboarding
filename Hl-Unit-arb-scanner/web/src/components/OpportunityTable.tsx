
import VenueBadge from './VenueBadge';
import { fmtBps, fmtPx } from '../lib/format';
import type { Opportunity } from '../lib/types';

export default function OpportunityTable({ rows }: { rows: Opportunity[] }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80">
          <tr className="text-slate-400">
            <th className="text-left px-4 py-3">자산</th>
            <th className="text-left px-4 py-3">매수</th>
            <th className="text-left px-4 py-3">매도</th>
            <th className="text-right px-4 py-3">그로스</th>
            <th className="text-right px-4 py-3">넷</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-800/80 hover:bg-slate-900/70">
              <td className="px-4 py-3 font-medium">{r.base}/{r.quote}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <VenueBadge v={r.buy.venue} />
                  <span className="tabular-nums">{fmtPx(r.buy.price)}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <VenueBadge v={r.sell.venue} />
                  <span className="tabular-nums">{fmtPx(r.sell.price)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-slate-300">{fmtBps(r.grossBps)}</td>
              <td className={`px-4 py-3 text-right font-semibold ${r.netBps>0?'text-emerald-400':'text-slate-400'}`}>{fmtBps(r.netBps)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
