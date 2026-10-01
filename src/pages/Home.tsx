import { useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { useDB } from '../lib/DBContext'
import FilterRail, { DEFAULT_FILTERS, type Filters } from '../components/FilterRail'
import ItemCard from '../components/ItemCard'

export default function Home({ searchFocusKey }: { searchFocusKey: number }) {
  const { items, alerts, setAlerts } = useDB()
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS)
  const searchRef = useRef<HTMLInputElement>(null)

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
      <div className="card p-5 sm:p-7 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0E6B61]/[0.08] via-transparent to-amber-200/40 pointer-events-none" />
        <div className="relative">
          <h1 className="font-extrabold tracking-tight text-[26px] sm:text-[34px] leading-tight">Lost something? Found something?<br />Let&apos;s reunite it.</h1>
          <p className="text-black/60 text-[15px] mt-2 max-w-[620px]">A calm, elegant portal to report, browse and verify lost &amp; found items worldwide — with safe messaging and proof-based claims. No phone numbers in public. Ever.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <input
              key={searchFocusKey}
              ref={searchRef}
              autoFocus={searchFocusKey > 0}
              value={f.q}
              onChange={e => setF({ ...f, q: e.target.value })}
              placeholder="Try “black wallet New York” or “AirPods”…  ( press / )"
              className="input sm:max-w-[460px]"
            />
            <div className="flex gap-2.5">
              <button onClick={saveAlert} className="btn-ghost text-[14px] whitespace-nowrap">🔔 Notify me</button>
              <a href="/post" className="btn-primary text-[14px] whitespace-nowrap">+ Report item</a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">
        <FilterRail f={f} setF={setF} counts={counts} />
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-black/60">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>
          </div>
          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-[40px]">🧭</p>
              <h2 className="font-bold text-[18px] mt-2">No matches yet</h2>
              <p className="text-black/60 text-[14px] mt-1">Try widening filters — or create an alert and we&apos;ll highlight new matches.</p>
              <div className="flex justify-center gap-2.5 mt-4">
                <button onClick={saveAlert} className="btn-ghost text-[14px]">🔔 Create alert</button>
                <a href="/post" className="btn-primary text-[14px]">+ Post item</a>
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
