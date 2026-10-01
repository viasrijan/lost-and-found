import { Archive, ShieldCheck, Trash2 } from 'lucide-react'
import { useDB } from '../lib/DBContext'
import { deleteCloudItem, updateCloudItemStatus } from '../lib/cloud'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/types'

export default function Moderation() {
  const { items, setItems, claims, flagSyncIssue } = useDB()

  const archive = (id: string) => {
    setItems(items.map(x => x.id === id ? { ...x, status: 'archived' as const } : x))
    if (supabase && !id.startsWith('item_') && !id.startsWith('seed_')) {
      updateCloudItemStatus(id, 'archived').catch(() => flagSyncIssue('Cloud update failed — run supabase/migrations/002_policies.sql in the Supabase SQL editor.'))
    }
  }

  const remove = (id: string) => {
    setItems(items.filter(x => x.id !== id))
    if (supabase && !id.startsWith('item_') && !id.startsWith('seed_')) {
      deleteCloudItem(id).catch(() => undefined)
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-white font-extrabold tracking-tight text-[24px] inline-flex items-center gap-2"><ShieldCheck size={24} /> Moderation</h1>
      <p className="text-white/50 text-[14px]">Review listings and claims. Hiding a post removes it everywhere, on every device.</p>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <div className="card p-4"><p className="text-[12px] font-bold text-white/40">ACTIVE</p><p className="text-white font-extrabold text-[22px]">{items.filter(i => i.status === 'active').length}</p></div>
        <div className="card p-4"><p className="text-[12px] font-bold text-white/40">CLAIMED / RETURNED</p><p className="text-white font-extrabold text-[22px]">{items.filter(i => i.status !== 'active').length}</p></div>
        <div className="card p-4"><p className="text-[12px] font-bold text-white/40">CLAIMS</p><p className="text-white font-extrabold text-[22px]">{claims.length}</p></div>
      </div>
      <div className="space-y-2.5 mt-4">
        {items.map(it => (
          <div key={it.id} className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <p className="text-white font-bold text-[14.5px]">{it.title}</p>
              <p className="text-[12.5px] text-white/50">{it.category} · {it.city}, {it.country} · {timeAgo(it.createdAt)} · <b className="text-white/75">{it.status}</b></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => archive(it.id)} className="btn-ghost !h-9 !px-3 text-[13px]"><Archive size={14} /> Archive</button>
              <button onClick={() => remove(it.id)} className="btn-ghost !h-9 !px-3 text-[13px] hover:!border-red-400/60 hover:text-red-400"><Trash2 size={14} /> Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
