import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { Profile } from '../../lib/types'

interface AuthCtx {
  user: Profile | null
  loading: boolean
  cloud: boolean
  signInWithGoogle: () => Promise<void>
  signInDemo: (name: string) => void
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)
const LS_USER = 'lf_user_v1'

function avatarFor(name: string): string {
  const initials = name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'LF'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' rx='48' fill='#0E6B61'/><text x='48' y='60' font-family='Inter,sans-serif' font-size='34' font-weight='700' fill='white' text-anchor='middle'>${initials}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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
        setUser({
          id: u.id,
          name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Member',
          avatar: (u.user_metadata?.avatar_url as string) || avatarFor(u.email || 'M')
        })
      }
      setLoading(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      if (u) {
        setUser({
          id: u.id,
          name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Member',
          avatar: (u.user_metadata?.avatar_url as string) || avatarFor(u.email || 'M')
        })
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

  return (
    <Ctx.Provider value={{ user, loading, cloud: isSupabaseConfigured, signInWithGoogle, signInDemo, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside provider')
  return v
}
