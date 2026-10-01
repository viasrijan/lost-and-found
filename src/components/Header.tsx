import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Compass, LogIn, MessageCircle, Plus, Search, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { useSearch } from '../lib/SearchContext'

export default function Header({ onSearchFocus }: { onSearchFocus?: () => void }) {
  const { user, signOut } = useAuth()
  const { q, setQ } = useSearch()
  const nav = useNavigate()
  const loc = useLocation()

  const type = (v: string) => {
    setQ(v)
    if (loc.pathname !== '/') nav('/')
  }

  void onSearchFocus

  const searchBox = (id: string, auto = false) => (
    <div className="relative w-full">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      <input
        id={id}
        autoFocus={auto}
        value={q}
        onChange={e => type(e.target.value)}
        placeholder="Search items, categories, places…"
        className="input !pl-10 !pr-9 !h-10 !text-[14px]"
      />
      {q && (
        <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white">
          <X size={15} />
        </button>
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0E0E12]/85 border-b border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="h-[64px] flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#14B8A6] to-[#0F766E] grid place-items-center shadow-card">
              <Search size={19} strokeWidth={2.6} className="text-[#052E2B]" />
            </span>
            <span className="font-extrabold tracking-tight text-[17px] text-white">Lost &amp; Found</span>
          </Link>

          <div className="hidden md:block flex-1 max-w-[420px] ml-4">{searchBox('site-search')}</div>

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
        <div className="md:hidden pb-3">{searchBox('site-search-m')}</div>
      </div>
    </header>
  )
}
