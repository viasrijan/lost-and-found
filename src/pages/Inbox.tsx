import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import { sendMsgHelper } from '../lib/store'
import { nowIso, timeAgo, uid } from '../lib/types'

export default function Inbox() {
  const { user } = useAuth()
  const { items, convos, setConvos, msgs, setMsgs } = useDB()
  const [params, setParams] = useSearchParams()
  const activeId = params.get('c') || ''
  const [tab, setTab] = useState<'all' | 'requests'>('all')
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const mine = useMemo(() => {
    if (!user) return []
    return convos.filter(c => c.aId === user.id || c.bId === user.id)
      .sort((a, b) => +new Date(b.lastMsgAt) - +new Date(a.lastMsgAt))
  }, [convos, user])

  const requests = mine.filter(c => c.status === 'request')
  const threads = mine.filter(c => c.status !== 'request')
  const list = tab === 'requests' ? requests : threads
  const active = mine.find(c => c.id === activeId) || list[0]

  const threadMsgs = useMemo(() => {
    if (!active) return []
    return msgs.filter(m => m.convoId === active.id).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
  }, [msgs, active])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [threadMsgs.length, activeId])

  useEffect(() => {
    if (!active || !user) return
    const unread = msgs.some(m => m.convoId === active.id && m.senderId !== user.id && !m.readAt)
    if (unread) {
      setMsgs(prev => prev.map(m => (m.convoId === active.id && m.senderId !== user.id && !m.readAt) ? { ...m, readAt: nowIso() } : m))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, threadMsgs.length])

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-16 text-center">
        <p className="text-[44px]">💬</p>
        <h1 className="font-extrabold text-[24px] mt-2">Messages live here</h1>
        <p className="text-black/60 text-[15px] mt-1">Sign in to chat safely about an item — like Instagram DMs, but bound to each listing.</p>
        <Link to="/login" className="btn-primary mt-5 text-[14px]">Sign in to continue</Link>
      </div>
    )
  }

  const send = () => {
    const body = draft.trim()
    if (!body || !active) return
    setMsgs(sendMsgHelper(msgs, active.id, user.id, body))
    setConvos(convos.map(c => c.id === active.id ? { ...c, lastMsgAt: nowIso() } : c))
    setDraft('')
    setTyping(true)
    setTimeout(() => setTyping(false), 1200)
  }

  const onImage = (files: FileList | null) => {
    if (!files || !files[0] || !active) return
    const f = files[0]
    const r = new FileReader()
    r.onload = () => {
      setMsgs(prev => [...prev, { id: uid('msg'), convoId: active.id, senderId: user.id, body: '(photo)', image: String(r.result), createdAt: nowIso() }])
      setConvos(prev => prev.map(c => c.id === active.id ? { ...c, lastMsgAt: nowIso() } : c))
    }
    r.readAsDataURL(f)
  }

  const accept = (id: string) => {
    setConvos(convos.map(c => c.id === id ? { ...c, status: 'active' as const } : c))
  }

  const itemOf = (itemId: string) => items.find(i => i.id === itemId)

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-extrabold tracking-tight text-[24px]">Inbox</h1>
      <p className="text-black/55 text-[14px]">Threads are tied to listings. Strangers land in Requests first.</p>
      <div className="grid md:grid-cols-[320px_1fr] gap-4 mt-4 h-[calc(100dvh-260px)] min-h-[480px]">
        <div className="card overflow-hidden flex flex-col">
          <div className="flex gap-2 p-3 border-b border-black/[0.06]">
            <button onClick={() => setTab('all')} className={`chip ${tab === 'all' ? 'chip-active' : ''}`}>Chats ({threads.length})</button>
            <button onClick={() => setTab('requests')} className={`chip ${tab === 'requests' ? 'chip-active' : ''}`}>Requests ({requests.length})</button>
          </div>
          <div className="overflow-y-auto scroll-thin flex-1">
            {list.length === 0 && <p className="text-[13.5px] text-black/50 p-5">Nothing here yet. Open an item and tap <b>Message</b>.</p>}
            {list.map(c => {
              const it = itemOf(c.itemId)
              const last = [...msgs].reverse().find(m => m.convoId === c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => setParams({ c: c.id })}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-black/[0.03] transition border-b border-black/[0.05] ${active?.id === c.id ? 'bg-[#0E6B61]/[0.07]' : ''}`}
                >
                  <span className="w-11 h-11 rounded-full bg-black/[0.07] grid place-items-center text-[20px] shrink-0 overflow-hidden">
                    {it?.images[0] ? <img src={it.images[0]} alt="" className="w-full h-full object-cover" /> : '📦'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <b className="text-[14px] truncate">{it?.title || 'Listing'}</b>
                      {c.status === 'request' && <span className="text-[10px] font-bold bg-amber-300 text-amber-950 rounded-full px-2 py-0.5">NEW</span>}
                    </span>
                    <span className="block text-[13px] text-black/55 truncate">{last ? last.body : 'Say hello…'}</span>
                    <span className="block text-[11.5px] text-black/40 mt-0.5">{timeAgo(c.lastMsgAt)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col">
          {!active ? (
            <div className="m-auto text-center p-8">
              <p className="text-[40px]">✉️</p>
              <p className="font-bold">Pick a conversation</p>
              <p className="text-[13.5px] text-black/55">Or browse items and start one.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-black/[0.06] flex items-center gap-3">
                <span className="font-bold text-[15px] truncate">{itemOf(active.itemId)?.title}</span>
                {active.status === 'request' && (
                  <span className="ml-auto flex gap-2">
                    <button onClick={() => accept(active.id)} className="btn-primary !h-9 !px-3 text-[13px]">Accept</button>
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5 bg-black/[0.02]">
                {threadMsgs.length === 0 && (
                  <p className="text-center text-[13px] text-black/50 bg-white border border-black/[0.06] rounded-[12px] px-4 py-3">
                    👋 Introduce yourself and reference the <b>proof details</b>. Never share OTPs, full ID numbers, or payment links.
                  </p>
                )}
                {threadMsgs.map(m => {
                  const me = m.senderId === user.id
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${me ? 'bg-[#0E6B61] text-white rounded-br-[4px]' : 'bg-white border border-black/[0.07] rounded-bl-[4px]'}`}>
                        {m.image && <img src={m.image} alt="shared" className="rounded-[10px] max-w-[220px] mb-1.5" />}
                        <p>{m.body}</p>
                        <p className={`text-[11px] mt-1 ${me ? 'text-white/70' : 'text-black/40'}`}>{timeAgo(m.createdAt)}{me && m.readAt ? ' · Seen' : me ? ' · Sent' : ''}</p>
                      </div>
                    </motion.div>
                  )
                })}
                {typing && <p className="text-[12px] text-black/45 italic">typing…</p>}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-black/[0.06] flex items-center gap-2">
                <label className="btn-ghost !h-11 !px-3 text-[16px] cursor-pointer" title="Attach photo">📎<input type="file" accept="image/*" className="hidden" onChange={e => onImage(e.target.files)} /></label>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send() }}
                  placeholder="Message…"
                  className="input flex-1"
                />
                <button onClick={send} className="btn-primary !px-5 text-[14px]">Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
