import { Link } from 'react-router-dom'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import ItemCard from '../components/ItemCard'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { items, setItems, claims, setClaims } = useDB()

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-16 text-center">
        <h1 className="font-extrabold text-[22px]">Your profile</h1>
        <p className="text-black/60 text-[14px] mt-1">Sign in to see your listings and claims.</p>
        <Link to="/login" className="btn-primary mt-4 text-[14px]">Sign in</Link>
      </div>
    )
  }

  const mine = items.filter(i => i.ownerId === user.id)
  const myClaims = claims.filter(c => c.claimantId === user.id)
  const incoming = claims.filter(c => items.some(i => i.id === c.itemId && i.ownerId === user.id))

  const decide = (id: string, ok: boolean) => {
    const claim = claims.find(c => c.id === id)
    if (!claim) return
    setClaims(claims.map(c => c.id === id ? { ...c, status: ok ? 'accepted' as const : 'rejected' as const } : c))
    if (ok) {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      setItems(items.map(i => i.id === claim.itemId ? { ...i, status: 'claimed' as const, handoffCode: code } : i))
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      <div className="card p-5 flex items-center gap-4">
        <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border border-black/10" />
        <div>
          <h1 className="font-extrabold text-[20px] leading-tight">{user.name}</h1>
          <p className="text-[13px] text-black/55">{mine.length} listing(s) · {myClaims.length} claim(s)</p>
        </div>
        <button onClick={() => { void signOut() }} className="btn-ghost ml-auto !h-10 text-[14px]">Sign out</button>
      </div>

      {incoming.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-[17px] mb-2.5">Incoming claims to review</h2>
          <div className="space-y-2.5">
            {incoming.map(c => {
              const it = items.find(i => i.id === c.itemId)
              return (
                <div key={c.id} className="card p-4">
                  <p className="text-[14px]"><b>{c.claimantName}</b> claims <b>{it?.title}</b> — “{c.answer}”</p>
                  <p className="text-[12.5px] text-black/50 mt-1">Status: <b>{c.status}</b>{it?.handoffCode && c.status === 'accepted' ? ` · Hand-off code: ${it.handoffCode} (share only in person)` : ''}</p>
                  {c.status === 'pending' && (
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => decide(c.id, true)} className="btn-primary !h-9 !px-4 text-[13px]">Accept + issue code</button>
                      <button onClick={() => decide(c.id, false)} className="btn-ghost !h-9 !px-4 text-[13px]">Reject</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-bold text-[17px]">My listings</h2>
          <Link to="/post" className="btn-primary !h-9 !px-4 text-[13px]">+ New</Link>
        </div>
        {mine.length === 0 ? <div className="card p-8 text-center text-[14px] text-black/55">Nothing posted yet.</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map((it, i) => <ItemCard key={it.id} item={it} index={i} />)}
          </div>
        )}
      </div>

      {myClaims.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-[17px] mb-2.5">My claims</h2>
          <div className="space-y-2.5">
            {myClaims.map(c => (
              <div key={c.id} className="card p-4 text-[14px]">
                <b>{items.find(i => i.id === c.itemId)?.title}</b> — <b>{c.status}</b>
                <span className="block text-[13px] text-black/55">“{c.answer}”</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
