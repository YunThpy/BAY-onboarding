
export default function Header({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">HL Unit Arb Scanner</h1>
      <div className={`text-sm px-3 py-1 rounded-full ${connected? 'bg-emerald-500/20 text-emerald-300':'bg-yellow-500/20 text-yellow-300'}`}>
        {connected ? '라이브 연결됨' : '연결 대기'}
      </div>
    </div>
  );
}
