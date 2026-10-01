import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { Bell, CloudOff, Plus, Search, SearchX, X } from 'lucide-react'
import { useDB } from '../lib/DBContext'
import FilterRail, { DEFAULT_FILTERS, type Filters } from '../components/FilterRail'
import ItemCard from '../components/ItemCard'

export default function Home({ searchFocusKey }: { searchFocusKey: number }) {
  const { items, alerts, setAlerts, syncNote, dismissSyncNote } = useDB()
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS)

  const fuse = useMemo(() => new Fuse(items, {
    keys: ['title', 'description', 'tags', 'category', 'city', 'country'],
    threshold: 0.38
  }), [items])

  const filtered = useMemo(() => {
    let list = [...items]
    if (f.type !== 'all') list = list.filter(i => i.type === f.type)
    if (f.category) list = list.filter(i => i.category === f.category)
    if (f.color) list = list.filter(i => i.color === f.color)
    if (f.country) list = list.filter(i => i.country === f.country)
    if (f.city) list = list.filter(i => i.city === f.city)
    if (f.hasPhoto) list = list.filter(i => i.images.length > 0)
    if (f.q.trim()) {
      const res = fuse.search(f.q.trim())
      const ids = new Set(res.map(r => r.item.id))
      list = list.filter(i => ids.has(i.id))
    }
    list.sort((a, b) => f.sort === 'newest'
      ? +new Date(b.createdAt) - +new Date(a.createdAt)
      : +new Date(a.createdAt) - +new Date(b.createdAt))
    return list
  }, [items, f, fuse])

  const counts = useMemo(() => ({
    lost: items.filter(i => i.type === 'lost' && i.status === 'active').length,
    found: items.filter(i => i.type === 'found' && i.status === 'active').length
  }), [items])

  const saveAlert = () => {
    const q = f.q.trim() || `${f.category || 'Anything'} in ${f.city || f.country || 'anywhere'}`
    if (!alerts.includes(q)) setAlerts([...alerts, q])
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      {syncNote && (
        <div className="flex items-start gap-2.5 text-[13.5px] bg-amber-400/10 border border-amber-400/25 text-amber-200 rounded-[12px] px-4 py-3 mb-4">
          <CloudOff size={16} className="shrink-0 mt-0.5" />
          <p className="flex-1">{syncNote}</p>
          <button onClick={dismissSyncNote} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      <div className="card p-5 sm:p-7 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/[0.1] via-transparent to-amber-300/[0.05] pointer-events-none" />
        <div className="relative">
          <h1 className="text-white font-extrabold tracking-tight text-[26px] sm:text-[34px] leading-tight">Lost something? Found something?<br />Let&apos;s reunite it.</h1>
          <p className="text-white/55 text-[15px] mt-2 max-w-[620px]">A calm, elegant portal to report, browse and verify lost &amp; found items worldwide — with safe messaging and proof-based claims. No phone numbers in public. Ever.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <div className="relative sm:max-w-[460px] flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                key={searchFocusKey}
                autoFocus={searchFocusKey > 0}
                value={f.q}
                onChange={e => setF({ ...f, q: e.target.value })}
                placeholder="Try “black wallet New York” or “AirPods”…  ( press / )"
                className="input !pl-10"
              />
            </div>
            <div className="flex gap-2.5">
              <button onClick={saveAlert} className="btn-ghost text-[14px] whitespace-nowrap"><Bell size={15} /> Notify me</button>
              <a href="/post" className="btn-primary text-[14px] whitespace-nowrap"><Plus size={16} strokeWidth={2.6} /> Post</a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">
        <FilterRail f={f} setF={setF} counts={counts} />
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-white/50">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>
          </div>
          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <SearchX size={40} className="mx-auto text-white/25" />
              <h2 className="text-white font-bold text-[18px] mt-3">No matches yet</h2>
              <p className="text-white/50 text-[14px] mt-1">Try widening filters — or create an alert and we&apos;ll highlight new matches.</p>
              <div className="flex justify-center gap-2.5 mt-4">
                <button onClick={saveAlert} className="btn-ghost text-[14px]"><Bell size={15} /> Create alert</button>
                <a href="/post" className="btn-primary text-[14px]"><Plus size={16} strokeWidth={2.6} /> Post</a>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((it, idx) => <ItemCard key={it.id} item={it} index={idx} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
