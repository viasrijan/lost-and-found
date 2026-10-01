import { useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { Bell, CloudOff, PackageCheck, Plus, SearchX, X } from 'lucide-react'
import { useDB } from '../lib/DBContext'
import { useSearch } from '../lib/SearchContext'
import FilterRail, { DEFAULT_FILTERS, type Filters } from '../components/FilterRail'
import ItemCard from '../components/ItemCard'

const POPULAR = ['Phones & Tablets', 'Laptops', 'Wallets & Purses', 'Keys', 'Audio & Headphones', 'Bags, Backpacks & Luggage']

export default function Home() {
  const { items, alerts, setAlerts, syncNote, dismissSyncNote } = useDB()
  const { q, setQ } = useSearch()
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS)
  const resultsRef = useRef<HTMLDivElement>(null)

  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

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
    if (q.trim()) {
      const res = fuse.search(q.trim())
      const ids = new Set(res.map(r => r.item.id))
      list = list.filter(i => ids.has(i.id))
    }
    list.sort((a, b) => f.sort === 'newest'
      ? +new Date(b.createdAt) - +new Date(a.createdAt)
      : +new Date(a.createdAt) - +new Date(b.createdAt))
    return list
  }, [items, f, fuse, q])

  const counts = useMemo(() => ({
    lost: items.filter(i => i.type === 'lost' && i.status === 'active').length,
    found: items.filter(i => i.type === 'found' && i.status === 'active').length
  }), [items])

  const saveAlert = () => {
    const label = q.trim() || `${f.category || 'Anything'} in ${f.city || f.country || 'anywhere'}`
    if (!alerts.includes(label)) setAlerts([...alerts, label])
  }

  const browseItems = () => {
    setF(DEFAULT_FILTERS)
    setQ('')
    scrollToResults()
  }

  const pickCategory = (c: string) => {
    setF({ ...DEFAULT_FILTERS, category: c })
    setQ('')
    scrollToResults()
  }

  const resetAll = () => {
    setF(DEFAULT_FILTERS)
    setQ('')
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

      <div className="rounded-[20px] border border-white/[0.08] bg-[#134E4A] mb-6">
        <div className="p-6 sm:p-9">
          <h1 className="text-white font-extrabold tracking-tight text-[28px] sm:text-[36px] leading-[1.1]">
            Lost or Found something? Let us help you.
          </h1>
          <p className="text-white/70 text-[15px] mt-2 max-w-[560px]">Post in under a minute. Message safely. Prove ownership with one question.</p>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <a href="/post" className="inline-flex items-center justify-center gap-2 bg-white text-[#062E2B] font-semibold rounded-[12px] px-4 h-11 text-[14px] transition-all hover:bg-teal-50 active:scale-[0.98]"><Plus size={16} strokeWidth={2.8} /> Post a listing</a>
            <button onClick={browseItems} className="btn-ghost text-[14px]"><PackageCheck size={15} /> Browse items</button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-5">
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/40 mr-1">Popular</span>
            {POPULAR.map(c => (
              <button key={c} onClick={() => pickCategory(c)} className="chip !bg-white/[0.1] hover:!bg-white/[0.18] !text-white">{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div ref={resultsRef} className="grid lg:grid-cols-[280px_1fr] gap-5 items-start scroll-mt-24">
        <FilterRail f={f} setF={setF} counts={counts} />
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-white/50">
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
              {f.category ? ` in ${f.category}` : ''}{q ? ` for “${q}”` : ''}
            </p>
            {(f.category || f.country || f.city || f.color || f.type !== 'all' || f.hasPhoto || q) && (
              <button onClick={resetAll} className="text-[13px] font-semibold text-white/45 hover:text-white underline underline-offset-4">Clear all</button>
            )}
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
