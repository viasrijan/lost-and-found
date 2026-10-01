import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Check, LogOut, Plus, Trash2, User, X } from 'lucide-react'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../lib/supabase'
import { updateCloudClaim, updateCloudItemStatus } from '../lib/cloud'
import ItemCard from '../components/ItemCard'

const SYNC_MSG = 'Saved on this device only — run supabase/migrations/002_policies.sql in the Supabase SQL editor to enable cloud sync.'

export default function Profile() {
  const { user, signOut, deleteAccount } = useAuth()
  const { items, setItems, claims, setClaims, convos, setConvos, msgs, setMsgs, flagSyncIssue } = useDB()
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-16 text-center">
        <User size={40} className="mx-auto text-white/25" />
        <h1 className="text-white font-extrabold text-[22px] mt-2">Your profile</h1>
        <p className="text-white/55 text-[14px] mt-1">Sign in to see your listings and claims.</p>
        <Link to="/login" className="btn-primary mt-4 text-[14px]">Sign in</Link>
      </div>
    )
  }

  const cloudWrite = !!supabase && !user.id.startsWith('demo_')
  const mine = items.filter(i => i.ownerId === user.id)
  const myClaims = claims.filter(c => c.claimantId === user.id)
  const incoming = claims.filter(c => items.some(i => i.id === c.itemId && i.ownerId === user.id))

  const decide = (id: string, ok: boolean) => {
    const claim = claims.find(c => c.id === id)
    if (!claim) return
    const code = ok ? String(Math.floor(100000 + Math.random() * 900000)) : undefined
    setClaims(claims.map(c => c.id === id ? { ...c, status: ok ? 'accepted' as const : 'rejected' as const } : c))
    if (ok) {
      setItems(items.map(i => i.id === claim.itemId ? { ...i, status: 'claimed' as const, handoffCode: code } : i))
    }
    if (cloudWrite && !id.startsWith('claim_')) {
      updateCloudClaim(id, ok ? 'accepted' : 'rejected').catch(() => flagSyncIssue(SYNC_MSG))
      if (ok && !claim.itemId.startsWith('item_') && !claim.itemId.startsWith('seed_')) {
        updateCloudItemStatus(claim.itemId, 'claimed', code).catch(() => flagSyncIssue(SYNC_MSG))
      }
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <div className="card p-5 flex items-center gap-4">
        <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border border-white/15" />
        <div>
          <h1 className="text-white font-extrabold text-[20px] leading-tight">{user.name}</h1>
          <p className="text-[13px] text-white/50">{mine.length} listing(s) · {myClaims.length} claim(s)</p>
        </div>
        <button onClick={() => { void signOut() }} className="btn-ghost ml-auto !h-10 text-[14px]"><LogOut size={15} /> Sign out</button>
      </div>

      {incoming.length > 0 && (
        <div className="mt-6">
          <h2 className="text-white font-bold text-[17px] mb-2.5 inline-flex items-center gap-2"><BadgeCheck size={18} /> Incoming claims to review</h2>
          <div className="space-y-2.5">
            {incoming.map(c => {
              const it = items.find(i => i.id === c.itemId)
              return (
                <div key={c.id} className="card p-4">
                  <p className="text-white text-[14px]"><b>{c.claimantName}</b> claims <b>{it?.title}</b> — “{c.answer}”</p>
                  <p className="text-[12.5px] text-white/45 mt-1">Status: <b className="text-white/75">{c.status}</b>{it?.handoffCode && c.status === 'accepted' ? ` · Hand-off code: ${it.handoffCode} (share only in person)` : ''}</p>
                  {c.status === 'pending' && (
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => decide(c.id, true)} className="btn-primary !h-9 !px-4 text-[13px]"><Check size={14} /> Accept + issue code</button>
                      <button onClick={() => decide(c.id, false)} className="btn-ghost !h-9 !px-4 text-[13px]"><X size={14} /> Reject</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-white font-bold text-[17px]">My listings</h2>
          <Link to="/post" className="btn-primary !h-9 !px-4 text-[13px]"><Plus size={14} strokeWidth={2.6} /> New</Link>
        </div>
        {mine.length === 0 ? <div className="card p-8 text-center text-[14px] text-white/50">Nothing posted yet.</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map((it, i) => <ItemCard key={it.id} item={it} index={i} />)}
          </div>
        )}
      </div>

      {myClaims.length > 0 && (
        <div className="mt-6">
          <h2 className="text-white font-bold text-[17px] mb-2.5">My claims</h2>
          <div className="space-y-2.5">
            {myClaims.map(c => (
              <div key={c.id} className="card p-4 text-white text-[14px]">
                <b>{items.find(i => i.id === c.itemId)?.title}</b> — <b>{c.status}</b>
                <span className="block text-[13px] text-white/50">“{c.answer}”</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5 mt-6 !border-red-500/25">
        <h2 className="text-white font-bold text-[16px] inline-flex items-center gap-2"><Trash2 size={17} className="text-red-400" /> Danger zone</h2>
        <p className="text-[13.5px] text-white/50 mt-1.5 leading-relaxed">
          Delete your account, listings, messages and claims on every device.
          {cloudWrite ? ' This also wipes your cloud data.' : ' You are in demo mode, so this clears this browser.'} Fully erasing the Google login itself is done in Supabase → Authentication → Users.
        </p>
        <button
          onClick={() => {
            if (!window.confirm('Delete your account and everything you posted? This cannot be undone.')) return
            setBusy(true)
            if (user) {
              const uid = user.id
              const myItemIds = new Set(items.filter(i => i.ownerId === uid).map(i => i.id))
              const doomed = new Set(convos.filter(c => c.aId === uid || c.bId === uid).map(c => c.id))
              setItems(items.filter(i => i.ownerId !== uid))
              setClaims(claims.filter(c => c.claimantId !== uid && !myItemIds.has(c.itemId)))
              setConvos(convos.filter(c => !(c.aId === uid || c.bId === uid)))
              setMsgs(msgs.filter(m => !doomed.has(m.convoId)))
            }
            deleteAccount().then(() => nav('/')).catch(() => nav('/'))
          }}
          disabled={busy}
          className="mt-3 inline-flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200 font-semibold rounded-[12px] px-4 h-11 text-[14px] transition disabled:opacity-50"
        >
          <Trash2 size={15} /> {busy ? 'Deleting…' : 'Delete my account'}
        </button>
      </div>
    </div>
  )
}
