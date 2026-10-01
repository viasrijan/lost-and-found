import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export default function Header({ onSearchFocus }: { onSearchFocus?: () => void }) {
  const { user, signOut } = useAuth()
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF9F7]/85 border-b border-black/[0.07]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-[12px] bg-[#0E6B61] grid place-items-center shadow-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block font-extrabold tracking-tight text-[17px]">Lost &amp; Found</span>
            <span className="block text-[12px] text-black/50 font-medium">Reunite what matters</span>
          </span>
        </Link>

        <button
          onClick={onSearchFocus}
          className="hidden md:flex flex-1 max-w-[420px] ml-4 items-center gap-2 bg-white border border-black/10 rounded-[12px] px-3.5 h-10 text-[14px] text-black/45 hover:border-black/20 transition"
        >
          <span className="text-[15px]">⌕</span> Search items, categories, places…
          <kbd className="ml-auto text-[11px] bg-black/[0.06] rounded-md px-1.5 py-0.5 font-semibold">/</kbd>
        </button>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={({ isActive }) => `px-3 h-10 hidden sm:inline-flex items-center text-[14px] font-semibold rounded-[10px] ${isActive ? 'bg-black/[0.06]' : 'hover:bg-black/[0.04]'}`}>Browse</NavLink>
          <NavLink to="/inbox" className={({ isActive }) => `px-3 h-10 inline-flex items-center text-[14px] font-semibold rounded-[10px] ${isActive ? 'bg-black/[0.06]' : 'hover:bg-black/[0.04]'}`}>Inbox</NavLink>
          <button onClick={() => nav('/post')} className="btn-primary !h-10 !px-4 text-[14px]">+ Post item</button>
          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <button onClick={() => nav('/profile')} title={user.name} className="w-10 h-10 rounded-full overflow-hidden border border-black/10 hover:border-black/25 transition">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </button>
              <button onClick={() => { void signOut() }} className="hidden sm:inline-flex text-[13px] font-semibold text-black/50 hover:text-black px-2">Sign out</button>
            </div>
          ) : (
            <button onClick={() => nav('/login')} className="btn-ghost !h-10 !px-4 text-[14px] ml-1">Sign in</button>
          )}
        </nav>
      </div>
    </header>
  )
}
