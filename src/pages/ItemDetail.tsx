import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import { openOrGetConvo } from '../lib/store'
import { timeAgo, uid, nowIso } from '../lib/types'
import ItemCard from '../components/ItemCard'

export default function ItemDetail() {
  const { id } = useParams()
  const { items, setItems, convos, setConvos, claims, setClaims } = useDB()
  const { user } = useAuth()
  const nav = useNavigate()
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState('')

  const item = items.find(i => i.id === id)
  if (!item) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-16 text-center">
        <p className="text-[40px]">🕳️</p>
        <h1 className="font-bold text-[20px] mt-2">Item not found</h1>
        <Link to="/" className="btn-primary mt-4 text-[14px]">Back to browse</Link>
      </div>
    )
  }

  const related = items.filter(i => i.id !== item.id && (i.category === item.category || i.city === item.city)).slice(0, 3)
  const mine = user && item.ownerId === user.id

  const startChat = () => {
    if (!user) { nav('/login'); return }
    const { list, convo } = openOrGetConvo(convos, item.id, { id: user.id, name: user.name, avatar: user.avatar }, item.ownerId)
    setConvos(list.map(c => c.id === convo.id && c.status === 'request' ? { ...c, status: 'active' as const } : c))
    nav(`/inbox?c=${convo.id}`)
  }

  const submitClaim = () => {
    if (!user) { nav('/login'); return }
    if (!answer.trim()) { setDone('Please describe your proof first.'); return }
    setClaims([...claims, {
      id: uid('claim'), itemId: item.id, claimantId: user.id, claimantName: user.name,
      answer: answer.trim(), status: 'pending', createdAt: nowIso()
    }])
    setAnswer('')
    setDone('Claim sent. The holder will review your proof in the inbox.')
  }

  const markReturned = () => {
    setItems(items.map(i => i.id === item.id ? { ...i, status: 'returned' as const } : i))
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <Link to="/" className="text-[14px] font-semibold text-black/55 hover:text-black">← Back to results</Link>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 mt-3">
        <div className="card overflow-hidden h-fit">
          <div className="h-[300px] sm:h-[360px] bg-gradient-to-br from-black/[0.05] to-black/[0.02] grid place-items-center relative">
            {item.images[0] ? <img src={item.images[0]} alt={item.title} className="absolute inset-0 w-full h-full object-cover" /> : <span className="text-[72px]">{item.type === 'lost' ? '🔎' : '🎒'}</span>}
            <span className={`absolute top-4 left-4 text-[12px] font-bold px-3 h-8 inline-flex items-center rounded-full ${item.type === 'lost' ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white'}`}>{item.type.toUpperCase()}</span>
          </div>
          {item.images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {item.images.map((src, i) => <img key={i} src={src} alt="" className="w-20 h-20 rounded-[10px] object-cover border border-black/10" />)}
            </div>
          )}
          <div className="p-5">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6B61]">{item.category}</p>
            <h1 className="font-extrabold tracking-tight text-[24px] leading-tight mt-1">{item.title}</h1>
            <p className="text-[15px] text-black/70 mt-2 leading-relaxed">{item.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[item.color, item.brand].filter(Boolean).map(t => <span key={t} className="text-[12px] font-medium bg-black/[0.05] rounded-full px-2.5 py-1">{t}</span>)}
              {item.tags.map(t => <span key={t} className="text-[12px] font-medium bg-black/[0.05] rounded-full px-2.5 py-1">{t}</span>)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-[#0E6B61] text-white grid place-items-center font-bold">{item.ownerName.slice(0, 1)}</span>
              <div>
                <p className="font-bold text-[15px]">{item.ownerName}</p>
                <p className="text-[13px] text-black/55">{item.city}, {item.country} · {item.area} · {timeAgo(item.createdAt)}</p>
              </div>
              <span className="ml-auto text-[12px] font-bold uppercase bg-black/[0.06] rounded-full px-2.5 py-1">{item.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4 text-[13.5px]">
              <div className="bg-black/[0.04] rounded-[10px] p-3"><p className="text-black/50 font-semibold text-[12px]">DATE</p><p className="font-bold">{item.dateEvent}</p></div>
              <div className="bg-black/[0.04] rounded-[10px] p-3"><p className="text-black/50 font-semibold text-[12px]">LOCATION</p><p className="font-bold">{item.area}</p></div>
            </div>
            {item.reward && <p className="mt-3 text-[14px] bg-amber-100 border border-amber-300 rounded-[10px] px-3 py-2">🎁 Reward: <b>{item.reward}</b></p>}
            <div className="flex gap-2.5 mt-4">
              {!mine && <button onClick={startChat} className="btn-primary flex-1 text-[14px]">💬 Message {item.type === 'lost' ? 'owner' : 'finder'}</button>}
              {mine && item.status === 'active' && <button onClick={markReturned} className="btn-ghost flex-1 text-[14px]">✓ Mark returned</button>}
            </div>
            <p className="text-[12.5px] text-black/50 mt-3">Safety: exact contact details stay hidden. Chat here, agree on a public meetup, use the QR hand-off code.</p>
          </div>

          {!mine && item.status === 'active' && (
            <div className="card p-5">
              <h2 className="font-bold text-[16px]">Claim with proof</h2>
              <p className="text-[13.5px] text-black/60 mt-1">Holder asks: <b className="text-black">“{item.proofQuestion}”</b> — answer precisely. Never share full serials publicly.</p>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} className="textarea mt-3" placeholder="e.g. Engraved initials J.R. + blue silicone case…" />
              <button onClick={submitClaim} className="btn-primary w-full mt-2.5 text-[14px]">Submit claim</button>
              {done && <p className="text-[13px] font-semibold text-[#0E6B61] mt-2">{done}</p>}
            </div>
          )}
        </div>
      </motion.div>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-[17px] mb-3">Possibly related</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((r, i) => <ItemCard key={r.id} item={r} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
