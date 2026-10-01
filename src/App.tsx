import { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Compass, MessageCircle, Plus, Bell, ShieldCheck, Info } from 'lucide-react'
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
        if (window.location.pathname !== '/post') window.location.href = '/post'
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AuthProvider>
      <DBProvider>
        <div className="min-h-screen flex flex-col bg-[#0E0E12]">
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
              <Route path="*" element={<div className="max-w-[560px] mx-auto px-4 py-16 text-center"><h1 className="text-white font-extrabold text-[22px]">Page not found</h1><Link to="/" className="btn-primary mt-4 text-[14px]">Go home</Link></div>} />
            </Routes>
          </main>
          <footer className="border-t border-white/[0.08] bg-[#0E0E12]">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col items-center gap-4">
              <p className="text-white font-extrabold tracking-tight text-[16px]">Lost &amp; Found</p>
              <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] font-semibold text-white/55">
                <Link to="/" className="inline-flex items-center gap-1.5 hover:text-white transition"><Compass size={14} /> Browse</Link>
                <Link to="/post" className="inline-flex items-center gap-1.5 hover:text-white transition"><Plus size={14} /> Post</Link>
                <Link to="/inbox" className="inline-flex items-center gap-1.5 hover:text-white transition"><MessageCircle size={14} /> Inbox</Link>
                <Link to="/alerts" className="inline-flex items-center gap-1.5 hover:text-white transition"><Bell size={14} /> Alerts</Link>
                <Link to="/moderation" className="inline-flex items-center gap-1.5 hover:text-white transition"><ShieldCheck size={14} /> Moderation</Link>
                <Link to="/safety" className="inline-flex items-center gap-1.5 hover:text-white transition"><Info size={14} /> Trust &amp; Safety</Link>
              </nav>
              <p className="text-[12.5px] text-white/30">© {new Date().getFullYear()} Lost &amp; Found</p>
            </div>
          </footer>
        </div>
        <Analytics />
      </DBProvider>
    </AuthProvider>
  )
}
