import { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './features/auth/AuthContext'
import { DBProvider } from './lib/DBContext'
import Header from './components/Header'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import Post from './pages/Post'
import Inbox from './pages/Inbox'
import Login from './pages/Login'
import Alerts from './pages/Alerts'
import Profile from './pages/Profile'
import Moderation from './pages/Moderation'
import TrustSafety from './pages/TrustSafety'

export default function App() {
  const [focusKey, setFocusKey] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setFocusKey(k => k + 1)
        setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder*="Try"]')?.focus(), 50)
      }
      if (e.key.toLowerCase() === 'n' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        window.location.hash = ''
        if (window.location.pathname !== '/post') window.location.href = '/post'
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AuthProvider>
      <DBProvider>
        <div className="min-h-screen flex flex-col">
          <Header onSearchFocus={() => { setFocusKey(k => k + 1); setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder*="Try"]')?.focus(), 50) }} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home searchFocusKey={focusKey} />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/post" element={<Post />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/login" element={<Login />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="/safety" element={<TrustSafety />} />
              <Route path="*" element={<div className="max-w-[560px] mx-auto px-4 py-16 text-center"><h1 className="font-extrabold text-[22px]">Page not found</h1><Link to="/" className="btn-primary mt-4 text-[14px]">Go home</Link></div>} />
            </Routes>
          </main>
          <footer className="border-t border-black/[0.07] bg-white/70">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center gap-3">
              <p className="font-extrabold tracking-tight">Lost &amp; Found</p>
              <nav className="flex gap-4 text-[13.5px] font-semibold text-black/60">
                <Link to="/alerts" className="hover:text-black">Alerts</Link>
                <Link to="/moderation" className="hover:text-black">Moderation</Link>
                <Link to="/safety" className="hover:text-black">Trust &amp; Safety</Link>
              </nav>
              <p className="sm:ml-auto text-[12.5px] text-black/45">Meet in public · Proof before hand-off · © {new Date().getFullYear()}</p>
            </div>
          </footer>
        </div>
        <Analytics />
      </DBProvider>
    </AuthProvider>
  )
}
