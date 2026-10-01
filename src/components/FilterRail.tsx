import { CATEGORIES, COLORS } from '../lib/categories'
import { COUNTRIES } from '../lib/countries'

export interface Filters {
  q: string
  type: 'all' | 'lost' | 'found'
  category: string
  color: string
  country: string
  city: string
  hasPhoto: boolean
  sort: 'newest' | 'oldest'
}

export const DEFAULT_FILTERS: Filters = {
  q: '', type: 'all', category: '', color: '', country: '', city: '', hasPhoto: false, sort: 'newest'
}

export default function FilterRail({ f, setF, counts }: { f: Filters; setF: (v: Filters) => void; counts: { lost: number; found: number } }) {
  const cities = f.country ? (COUNTRIES[f.country] ?? []) : []
  return (
    <aside className="card p-5 space-y-5 lg:sticky lg:top-[84px] h-fit">
      <div>
        <p className="text-[12px] font-bold uppercase tracking-widest text-black/45 mb-2">Type</p>
        <div className="flex gap-2">
          {(['all', 'lost', 'found'] as const).map(t => (
            <button key={t} onClick={() => setF({ ...f, type: t })} className={`chip ${f.type === t ? 'chip-active' : ''}`}>
              {t === 'all' ? `All` : t === 'lost' ? `Lost (${counts.lost})` : `Found (${counts.found})`}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12px] font-bold uppercase tracking-widest text-black/45 mb-2">Category</p>
        <select className="select" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-black/45 mb-2">Color</p>
          <select className="select" value={f.color} onChange={e => setF({ ...f, color: e.target.value })}>
            <option value="">Any</option>
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-black/45 mb-2">Sort</p>
          <select className="select" value={f.sort} onChange={e => setF({ ...f, sort: e.target.value as Filters['sort'] })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      <div>
        <p className="text-[12px] font-bold uppercase tracking-widest text-black/45 mb-2">Location</p>
        <select className="select mb-2" value={f.country} onChange={e => setF({ ...f, country: e.target.value, city: '' })}>
          <option value="">Worldwide</option>
          {Object.keys(COUNTRIES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={f.city} disabled={!f.country} onChange={e => setF({ ...f, city: e.target.value })}>
          <option value="">{f.country ? 'All cities' : 'Pick a country first'}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2.5 text-[14px] font-semibold cursor-pointer">
        <input type="checkbox" checked={f.hasPhoto} onChange={e => setF({ ...f, hasPhoto: e.target.checked })} className="w-4 h-4 accent-[#0E6B61]" />
        With photo only
      </label>
      <button onClick={() => setF(DEFAULT_FILTERS)} className="text-[13px] font-semibold text-black/50 hover:text-black underline underline-offset-4">Reset all filters</button>
    </aside>
  )
}
