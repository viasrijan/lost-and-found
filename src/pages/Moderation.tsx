import { useDB } from '../lib/DBContext'
import { timeAgo } from '../lib/types'

export default function Moderation() {
  const { items, setItems, claims } = useDB()

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-extrabold tracking-tight text-[24px]">Moderation</h1>
      <p className="text-black/55 text-[14px]">Demo admin queue. In production this is role-gated (Supabase `profiles.is_admin`) with reports + audit log.</p>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <div className="card p-4"><p className="text-[12px] font-bold text-black/50">ACTIVE</p><p className="font-extrabold text-[22px]">{items.filter(i => i.status === 'active').length}</p></div>
        <div className="card p-4"><p className="text-[12px] font-bold text-black/50">CLAIMED / RETURNED</p><p className="font-extrabold text-[22px]">{items.filter(i => i.status !== 'active').length}</p></div>
        <div className="card p-4"><p className="text-[12px] font-bold text-black/50">CLAIMS</p><p className="font-extrabold text-[22px]">{claims.length}</p></div>
      </div>
      <div className="space-y-2.5 mt-4">
        {items.map(it => (
          <div key={it.id} className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <p className="font-bold text-[14.5px]">{it.title}</p>
              <p className="text-[12.5px] text-black/55">{it.category} · {it.city}, {it.country} · {timeAgo(it.createdAt)} · <b>{it.status}</b></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setItems(items.map(x => x.id === it.id ? { ...x, status: 'archived' as const } : x))} className="btn-ghost !h-9 !px-3 text-[13px]">Archive</button>
              <button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="btn-ghost !h-9 !px-3 text-[13px] hover:!border-red-400 hover:text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
