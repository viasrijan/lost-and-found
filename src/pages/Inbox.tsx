import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Inbox as InboxIcon, MailOpen, MessageCircle, Paperclip, Send } from 'lucide-react'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import { sendMsgHelper } from '../lib/store'
import { supabase } from '../lib/supabase'
import { insertCloudMessage, markCloudRead, updateCloudConvo, uploadDataUrl } from '../lib/cloud'
import { nowIso, timeAgo, uid } from '../lib/types'

export default function Inbox() {
  const { user } = useAuth()
  const { items, convos, setConvos, msgs, setMsgs, flagSyncIssue } = useDB()
  const [params, setParams] = useSearchParams()
  const activeId = params.get('c') || ''
  const [tab, setTab] = useState<'all' | 'requests'>('all')
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const flaggedRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const cloudWrite = !!supabase && !!user && !user.id.startsWith('demo_')

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
      if (cloudWrite && !active.id.startsWith('convo_')) {
        markCloudRead(active.id, user.id).catch(() => undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, threadMsgs.length])

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-16 text-center">
        <MessageCircle size={44} className="mx-auto text-white/25" />
        <h1 className="text-white font-extrabold text-[24px] mt-3">Messages live here</h1>
        <p className="text-white/55 text-[15px] mt-1">Sign in to chat safely about an item — like Instagram DMs, but bound to each listing.</p>
        <Link to="/login" className="btn-primary mt-5 text-[14px]">Sign in to continue</Link>
      </div>
    )
  }

  const flagOnce = () => {
    if (!flaggedRef.current) {
      flaggedRef.current = true
      flagSyncIssue('Message saved on this device only — run supabase/migrations/002_policies.sql in the Supabase SQL editor to enable cloud sync.')
    }
  }

  const persistCloudMsg = async (convoId: string, body: string, image?: string, localId?: string) => {
    if (!cloudWrite || convoId.startsWith('convo_')) return
    try {
      const created = await insertCloudMessage(convoId, user.id, body, image)
      if (localId) setMsgs(prev => prev.map(m => m.id === localId ? { ...m, id: created.id } : m))
    } catch {
      flagOnce()
    }
  }

  const send = () => {
    const body = draft.trim()
    if (!body || !active) return
    const tempId = uid('msg')
    setMsgs([...msgs, { id: tempId, convoId: active.id, senderId: user.id, body, createdAt: nowIso() }])
    setConvos(convos.map(c => c.id === active.id ? { ...c, lastMsgAt: nowIso() } : c))
    setDraft('')
    setTyping(true)
    setTimeout(() => setTyping(false), 1200)
    void persistCloudMsg(active.id, body, undefined, tempId)
  }

  const onImage = (files: FileList | null) => {
    if (!files || !files[0] || !active) return
    const f = files[0]
    const r = new FileReader()
    r.onload = () => {
      const dataUrl = String(r.result)
      const run = async () => {
        let url = dataUrl
        if (cloudWrite && !active.id.startsWith('convo_')) {
          url = (await uploadDataUrl(dataUrl, user.id)) ?? dataUrl
        }
        const tempId = uid('msg')
        setMsgs(prev => [...prev, { id: tempId, convoId: active.id, senderId: user.id, body: '(photo)', image: url, createdAt: nowIso() }])
        setConvos(prev => prev.map(c => c.id === active.id ? { ...c, lastMsgAt: nowIso() } : c))
        void persistCloudMsg(active.id, '(photo)', url, tempId)
      }
      void run()
    }
    r.readAsDataURL(f)
  }

  const accept = (id: string) => {
    setConvos(convos.map(c => c.id === id ? { ...c, status: 'active' as const } : c))
    if (cloudWrite && !id.startsWith('convo_')) {
      updateCloudConvo(id, 'active').catch(() => flagOnce())
    }
  }

  const itemOf = (itemId: string) => items.find(i => i.id === itemId)

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-white font-extrabold tracking-tight text-[24px] inline-flex items-center gap-2"><InboxIcon size={22} /> Inbox</h1>
      <p className="text-white/50 text-[14px]">Threads are tied to listings. Strangers land in Requests first.</p>
      <div className="grid md:grid-cols-[320px_1fr] gap-4 mt-4 h-[calc(100dvh-260px)] min-h-[480px]">
        <div className="card overflow-hidden flex flex-col">
          <div className="flex gap-2 p-3 border-b border-white/[0.07]">
            <button onClick={() => setTab('all')} className={`chip ${tab === 'all' ? 'chip-active' : ''}`}><MessageCircle size={13} /> Chats ({threads.length})</button>
            <button onClick={() => setTab('requests')} className={`chip ${tab === 'requests' ? 'chip-active' : ''}`}><MailOpen size={13} /> Requests ({requests.length})</button>
          </div>
          <div className="overflow-y-auto scroll-thin flex-1">
            {list.length === 0 && <p className="text-[13.5px] text-white/40 p-5">Nothing here yet. Open an item and tap <b>Message</b>.</p>}
            {list.map(c => {
              const it = itemOf(c.itemId)
              const last = [...msgs].reverse().find(m => m.convoId === c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => setParams({ c: c.id })}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/[0.04] transition border-b border-white/[0.05] ${active?.id === c.id ? 'bg-[#14B8A6]/[0.1]' : ''}`}
                >
                  <span className="w-11 h-11 rounded-full bg-white/[0.07] grid place-items-center text-[20px] shrink-0 overflow-hidden">
                    {it?.images[0] ? <img src={it.images[0]} alt="" className="w-full h-full object-cover" /> : '📦'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <b className="text-white text-[14px] truncate">{it?.title || 'Listing'}</b>
                      {c.status === 'request' && <span className="text-[10px] font-bold bg-amber-300 text-amber-950 rounded-full px-2 py-0.5">NEW</span>}
                    </span>
                    <span className="block text-[13px] text-white/50 truncate">{last ? last.body : 'Say hello…'}</span>
                    <span className="block text-[11.5px] text-white/30 mt-0.5">{timeAgo(c.lastMsgAt)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col">
          {!active ? (
            <div className="m-auto text-center p-8">
              <MailOpen size={40} className="mx-auto text-white/25" />
              <p className="text-white font-bold mt-2">Pick a conversation</p>
              <p className="text-[13.5px] text-white/50">Or browse items and start one.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-3">
                <span className="text-white font-bold text-[15px] truncate">{itemOf(active.itemId)?.title}</span>
                {active.status === 'request' && (
                  <span className="ml-auto flex gap-2">
                    <button onClick={() => accept(active.id)} className="btn-primary !h-9 !px-3 text-[13px]">Accept</button>
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5 bg-black/20">
                {threadMsgs.length === 0 && (
                  <p className="text-center text-[13px] text-white/50 bg-white/[0.04] border border-white/[0.08] rounded-[12px] px-4 py-3">
                    👋 Introduce yourself and reference the <b className="text-white/80">proof details</b>. Never share OTPs, full ID numbers, or payment links.
                  </p>
                )}
                {threadMsgs.map(m => {
                  const me = m.senderId === user.id
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${me ? 'bg-[#0F766E] text-white rounded-br-[4px]' : 'bg-white/[0.07] border border-white/[0.08] text-white/90 rounded-bl-[4px]'}`}>
                        {m.image && <img src={m.image} alt="shared" className="rounded-[10px] max-w-[220px] mb-1.5" />}
                        <p>{m.body}</p>
                        <p className={`text-[11px] mt-1 ${me ? 'text-white/60' : 'text-white/35'}`}>{timeAgo(m.createdAt)}{me && m.readAt ? ' · Seen' : me ? ' · Sent' : ''}</p>
                      </div>
                    </motion.div>
                  )
                })}
                {typing && <p className="text-[12px] text-white/40 italic">typing…</p>}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-white/[0.07] flex items-center gap-2">
                <label className="btn-ghost !h-11 !px-3 cursor-pointer" title="Attach photo"><Paperclip size={16} /><input type="file" accept="image/*" className="hidden" onChange={e => onImage(e.target.files)} /></label>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send() }}
                  placeholder="Message…"
                  className="input flex-1"
                />
                <button onClick={send} className="btn-primary !px-5 text-[14px]"><Send size={15} /> Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
