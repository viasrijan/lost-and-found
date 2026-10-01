import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Compass, MessageCircle, Plus, Search, LogIn } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'

export default function Header({ onSearchFocus }: { onSearchFocus?: () => void }) {
  const { user, signOut } = useAuth()
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0E0E12]/85 border-b border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-[12px] bg-[#0F766E] grid place-items-center shadow-card">
            <Search size={19} strokeWidth={2.6} className="text-white" />
          </span>
          <span className="leading-none">
            <span className="block font-extrabold tracking-tight text-[17px] text-white">Lost &amp; Found</span>
            <span className="block text-[12px] text-white/45 font-medium">Reunite what matters</span>
          </span>
        </Link>

        <button
          onClick={onSearchFocus}
          className="hidden md:flex flex-1 max-w-[420px] ml-4 items-center gap-2 bg-white/[0.05] border border-white/10 rounded-[12px] px-3.5 h-10 text-[14px] text-white/40 hover:border-white/25 hover:text-white/60 transition"
        >
          <Search size={15} />
          <span>Search items, categories, places…</span>
          <kbd className="ml-auto text-[11px] bg-white/[0.08] text-white/60 rounded-md px-1.5 py-0.5 font-semibold">/</kbd>
        </button>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={({ isActive }) => `px-3 h-10 hidden sm:inline-flex items-center gap-1.5 text-[14px] font-semibold rounded-[10px] text-white/80 ${isActive ? 'bg-white/[0.08] text-white' : 'hover:bg-white/[0.05]'}`}>
            <Compass size={16} /> Browse
          </NavLink>
          <NavLink to="/inbox" className={({ isActive }) => `px-3 h-10 inline-flex items-center gap-1.5 text-[14px] font-semibold rounded-[10px] text-white/80 ${isActive ? 'bg-white/[0.08] text-white' : 'hover:bg-white/[0.05]'}`}>
            <MessageCircle size={16} /> Inbox
          </NavLink>
          <button onClick={() => nav('/post')} className="btn-primary !h-10 !px-4 text-[14px]"><Plus size={16} strokeWidth={2.6} /> Post</button>
          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <button onClick={() => nav('/profile')} title={user.name} className="w-10 h-10 rounded-full overflow-hidden border border-white/15 hover:border-white/40 transition">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </button>
              <button onClick={() => { void signOut() }} className="hidden sm:inline-flex text-[13px] font-semibold text-white/45 hover:text-white px-2">Sign out</button>
            </div>
          ) : (
            <button onClick={() => nav('/login')} className="btn-ghost !h-10 !px-4 text-[14px] ml-1"><LogIn size={15} /> Sign in</button>
          )}
        </nav>
      </div>
    </header>
  )
}
