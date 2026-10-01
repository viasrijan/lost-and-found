import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Login() {
  const { user, signInWithGoogle, signInDemo } = useAuth()
  const [name, setName] = useState('')
  const nav = useNavigate()

  if (user) {
    nav('/')
    return null
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-14">
      <div className="card p-7 text-center">
        <p className="text-[44px]">🧳</p>
        <h1 className="font-extrabold tracking-tight text-[24px] mt-2">Welcome to Lost &amp; Found</h1>
        <p className="text-black/60 text-[14.5px] mt-1.5">Sign in to post items, message holders, and manage claims. Your contact details are never shown publicly.</p>

        {isSupabaseConfigured ? (
          <button onClick={() => { void signInWithGoogle() }} className="btn-primary w-full mt-5">
            <span className="w-5 h-5 rounded-full bg-white text-[#0E6B61] grid place-items-center font-extrabold text-[13px]">G</span>
            Continue with Google
          </button>
        ) : (
          <>
            <div className="mt-5 text-left">
              <label className="text-[13px] font-bold">Display name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Srijan" className="input mt-1.5" />
            </div>
            <button onClick={() => { signInDemo(name || 'Guest Explorer'); nav('/') }} className="btn-primary w-full mt-3">Continue →</button>
            <p className="text-[12.5px] text-black/50 mt-3 bg-black/[0.04] rounded-[10px] px-3 py-2">
              Demo mode: cloud auth isn&apos;t configured yet. Add <code>VITE_SUPABASE_URL</code> + <code>VITE_SUPABASE_ANON_KEY</code> in Vercel to enable real Google sign-in — the button swaps automatically.
            </p>
          </>
        )}

        <p className="text-[12px] text-black/45 mt-4">By continuing you agree to meet in public places and never share OTPs or full ID numbers.</p>
      </div>
    </div>
  )
}
