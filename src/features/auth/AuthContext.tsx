import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { ensureProfile } from '../../lib/cloud'
import { purgeUser } from '../../lib/store'
import type { Profile } from '../../lib/types'

interface AuthCtx {
  user: Profile | null
  loading: boolean
  cloud: boolean
  signInWithGoogle: () => Promise<void>
  signInDemo: (name: string) => void
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)
const LS_USER = 'lf_user_v1'

function avatarFor(name: string): string {
  const initials = name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'LF'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' rx='48' fill='#0F766E'/><text x='48' y='60' font-family='Inter,sans-serif' font-size='34' font-weight='700' fill='white' text-anchor='middle'>${initials}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function toProfile(u: { id: string; email?: string | null; user_metadata?: Record<string, any> }): Profile {
  const email = u.email || 'member'
  return {
    id: u.id,
    name: (u.user_metadata?.full_name as string) || email.split('@')[0] || 'Member',
    avatar: (u.user_metadata?.avatar_url as string) || avatarFor(email)
  }
}

function persistProfile(p: Profile) {
  // Fire-and-forget: lets cloud rows reference this user (FK). Fails silently
  // until supabase/migrations/002_policies.sql has been run once.
  ensureProfile(p).catch(() => undefined)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef<Profile | null>(null)
  userRef.current = user

  useEffect(() => {
    const sb = supabase
    if (!isSupabaseConfigured || !sb) {
      try {
        const raw = localStorage.getItem(LS_USER)
        if (raw) setUser(JSON.parse(raw))
      } catch { /* noop */ }
      setLoading(false)
      return
    }
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) {
        const p = toProfile(u)
        setUser(p)
        persistProfile(p)
      }
      setLoading(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      if (u) {
        const p = toProfile(u)
        setUser(p)
        persistProfile(p)
      } else setUser(null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const signInWithGoogle = async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const signInDemo = (name: string) => {
    const clean = name.trim() || 'Guest Explorer'
    const p: Profile = { id: `demo_${clean.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, name: clean, avatar: avatarFor(clean) }
    setUser(p)
    try { localStorage.setItem(LS_USER, JSON.stringify(p)) } catch { /* noop */ }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    try { localStorage.removeItem(LS_USER) } catch { /* noop */ }
  }

  const deleteAccount = async () => {
    const cur = userRef.current
    if (supabase && cur && !cur.id.startsWith('demo_')) {
      try {
        // Cascades to their listings, claims, threads and messages.
        // Requires supabase/migrations/003_account_delete.sql (run once).
        await supabase.from('profiles').delete().eq('id', cur.id)
      } catch { /* local purge below still runs */ }
    }
    purgeUser(cur?.id ?? '')
    setUser(null)
    try { localStorage.removeItem(LS_USER) } catch { /* noop */ }
  }

  return (
    <Ctx.Provider value={{ user, loading, cloud: isSupabaseConfigured, signInWithGoogle, signInDemo, signOut, deleteAccount }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside provider')
  return v
}
