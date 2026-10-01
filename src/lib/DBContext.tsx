import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocalDB, type DB } from './store'
import { supabase } from './supabase'
import { useAuth } from '../features/auth/AuthContext'
import {
  fetchCloudClaims,
  fetchCloudItems,
  fetchConvoMessages,
  fetchMyConvos,
  markCloudRead,
  rowToMessage
} from './cloud'

interface DBWithSync extends DB {
  syncNote: string
  dismissSyncNote: () => void
  flagSyncIssue: (msg: string) => void
  refreshCloud: () => void
}

const Ctx = createContext<DBWithSync | null>(null)

function mergeById<T extends { id: string }>(primary: T[], secondary: T[]): T[] {
  const seen = new Set(primary.map(p => p.id))
  return [...primary, ...secondary.filter(s => !seen.has(s.id))]
}

export function DBProvider({ children }: { children: ReactNode }) {
  const db = useLocalDB()
  const { user } = useAuth()
  const [syncNote, setSyncNote] = useState('')
  const loadedRef = useRef(false)

  const refreshCloud = () => {
    loadedRef.current = false
    void pullItems()
  }

  const pullItems = async () => {
    if (!supabase || loadedRef.current) return
    loadedRef.current = true
    try {
      const cloud = await fetchCloudItems()
      db.setItems(prev => mergeById(
        cloud,
        prev.filter(p => p.sample || !cloud.some(c => c.id === p.id))
      ))
    } catch {
      // offline / RLS: local cache keeps working
    }
  }

  // Public items: same on every device. Cloud wins, local samples + pending posts stay.
  useEffect(() => {
    void pullItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // My claims + threads when signed in (cloud account, not demo).
  useEffect(() => {
    if (!supabase || !user || user.id.startsWith('demo_')) return
    let cancelled = false
    ;(async () => {
      try {
        const myItemIds = db.items.filter(i => i.ownerId === user.id).map(i => i.id)
        const claims = await fetchCloudClaims(user.id, myItemIds)
        if (!cancelled && claims.length > 0) {
          db.setClaims(prev => mergeById(claims, prev))
        }
        const convos = await fetchMyConvos(user.id)
        if (!cancelled && convos.length > 0) {
          db.setConvos(prev => mergeById(convos, prev))
          const known = new Set(db.msgs.map(m => m.id))
          const fresh = await fetchConvoMessages(convos.map(c => c.id))
          const unseen = fresh.filter(m => !known.has(m.id))
          if (!cancelled && unseen.length > 0) db.setMsgs(prev => [...prev, ...unseen])
        }
      } catch {
        // stays local
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Realtime: new messages in my threads appear instantly on every device.
  useEffect(() => {
    if (!supabase || !user || user.id.startsWith('demo_')) return
    const sb = supabase
    const mine = new Set(db.convos.filter(c => c.aId === user.id || c.bId === user.id).map(c => c.id))
    if (mine.size === 0) return
    const ch = sb.channel(`msgs-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const row = payload.new as Record<string, any>
        if (!row || !mine.has(String(row.convo_id))) return
        const msg = rowToMessage(row)
        db.setMsgs(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
        db.setConvos(prev => prev.map(c => c.id === msg.convoId ? { ...c, lastMsgAt: msg.createdAt } : c))
        if (msg.senderId !== user.id) void markCloudRead(msg.convoId, user.id)
      })
      .subscribe()
    return () => { void sb.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, db.convos.length])

  return (
    <Ctx.Provider value={{ ...db, syncNote, dismissSyncNote: () => setSyncNote(''), flagSyncIssue: (m: string) => setSyncNote(m), refreshCloud }}>
      {children}
    </Ctx.Provider>
  )
}

export function useDB(): DBWithSync {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDB outside provider')
  return v
}
