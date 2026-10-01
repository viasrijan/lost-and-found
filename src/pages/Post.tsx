import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import { CATEGORIES, CATEGORY_TAGS, COLORS } from '../lib/categories'
import { AREA_SUGGESTIONS, COUNTRIES } from '../lib/countries'
import { addItemHelper } from '../lib/store'
import type { ItemType } from '../lib/types'

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = rej
    r.readAsDataURL(f)
  })
}

export default function Post() {
  const { user } = useAuth()
  const { items, setItems } = useDB()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [type, setType] = useState<ItemType>('found')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState(CATEGORIES[5])
  const [tags, setTags] = useState<string[]>([])
  const [color, setColor] = useState('Black')
  const [brand, setBrand] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [country, setCountry] = useState('United States')
  const [city, setCity] = useState('New York')
  const [area, setArea] = useState('Downtown')
  const [reward, setReward] = useState('')
  const [proof, setProof] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [err, setErr] = useState('')

  const tagOptions = useMemo(() => CATEGORY_TAGS[category] ?? CATEGORY_TAGS['Other'], [category])
  const cities = useMemo(() => COUNTRIES[country] ?? ['Other city'], [country])

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].slice(0, 6))

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0, 4)
    const urls: string[] = []
    for (const f of arr) {
      if (f.size > 4 * 1024 * 1024) { setErr('Each photo must be under 4MB.'); continue }
      urls.push(await fileToDataUrl(f))
    }
    setImages(prev => [...prev, ...urls].slice(0, 4))
  }

  const validStep1 = title.trim().length >= 4 && desc.trim().length >= 10 && category
  const validStep2 = Boolean(date && country && city && area.trim())

  const submit = () => {
    if (!user) { nav('/login'); return }
    if (!validStep1 || !validStep2) { setErr('Please complete the highlighted fields.'); return }
    if (!proof.trim()) { setErr('Add one private proof question so only the real owner can claim.'); return }
    setItems(addItemHelper(items, {
      type, title: title.trim(), description: desc.trim(), category, tags, color, brand: brand.trim(),
      dateEvent: date, country, city, area: area.trim(), reward: reward.trim() || undefined,
      ownerId: user.id, ownerName: user.name, proofQuestion: proof.trim(), images
    }))
    nav('/')
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-extrabold tracking-tight text-[26px]">Report an item</h1>
      <p className="text-black/60 text-[14.5px] mt-1">Three quick steps. Precise tags = faster reunion.</p>

      <div className="flex gap-2 mt-4">
        {[1, 2, 3].map(n => (
          <div key={n} className={`flex-1 h-1.5 rounded-full ${step >= n ? 'bg-[#0E6B61]' : 'bg-black/10'}`} />
        ))}
      </div>

      <div className="card p-5 sm:p-6 mt-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['lost', 'found'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} className={`chip !h-10 !px-5 !text-[14px] font-bold ${type === t ? 'chip-active' : ''}`}>{t === 'lost' ? '🔎 I lost it' : '🎒 I found it'}</button>
              ))}
            </div>
            <div>
              <label className="text-[13px] font-bold">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input mt-1.5" placeholder="e.g. Black leather bifold wallet" />
            </div>
            <div>
              <label className="text-[13px] font-bold">Description * <span className="font-medium text-black/50">(no full serials / ID numbers)</span></label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} className="textarea mt-1.5" placeholder="Where exactly, what condition, what's inside…" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold">Category *</label>
                <select value={category} onChange={e => { setCategory(e.target.value); setTags([]) }} className="select mt-1.5">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-bold">Color</label>
                <select value={color} onChange={e => setColor(e.target.value)} className="select mt-1.5">
                  {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold">Tags <span className="font-medium text-black/50">(up to 6)</span></label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagOptions.map(t => (
                  <button key={t} onClick={() => toggleTag(t)} className={`chip ${tags.includes(t) ? 'chip-active' : ''}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold">Brand / distinguishing mark <span className="font-medium text-black/50">(optional)</span></label>
              <input value={brand} onChange={e => setBrand(e.target.value)} className="input mt-1.5" placeholder="e.g. Apple, Nike, engraved…" />
            </div>
            <div>
              <label className="text-[13px] font-bold">Photos <span className="font-medium text-black/50">(up to 4, blur serials first)</span></label>
              <input type="file" accept="image/*" multiple onChange={e => { void onFiles(e.target.files) }} className="mt-1.5 text-[14px]" />
              {images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {images.map((s, i) => <img key={i} src={s} alt="" className="w-20 h-20 rounded-[10px] object-cover border border-black/10" />)}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-bold">Date {type === 'lost' ? 'lost' : 'found'} *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input mt-1.5" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold">Country *</label>
                <select value={country} onChange={e => { setCountry(e.target.value); setCity((COUNTRIES[e.target.value] ?? ['Other city'])[0]) }} className="select mt-1.5">
                  {Object.keys(COUNTRIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-bold">City *</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="select mt-1.5">
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold">Area / landmark *</label>
              <input value={area} onChange={e => setArea(e.target.value)} className="input mt-1.5" placeholder="e.g. Central Station, north exit" list="areas" />
              <datalist id="areas">{AREA_SUGGESTIONS.map(a => <option key={a} value={a} />)}</datalist>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AREA_SUGGESTIONS.slice(0, 6).map(a => <button key={a} onClick={() => setArea(a)} className="chip !h-7 !text-[12px]">{a}</button>)}
              </div>
              <p className="text-[12.5px] text-black/50 mt-2">Public precision is ~area-level only. Exact meetup is arranged privately in chat.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-bold">Private proof question *</label>
              <input value={proof} onChange={e => setProof(e.target.value)} className="input mt-1.5" placeholder="e.g. What initials are engraved inside?" />
              <p className="text-[12.5px] text-black/50 mt-1.5">Only the real owner can answer this. This is how we stop false claims.</p>
            </div>
            <div>
              <label className="text-[13px] font-bold">Reward <span className="font-medium text-black/50">(optional)</span></label>
              <input value={reward} onChange={e => setReward(e.target.value)} className="input mt-1.5" placeholder="e.g. $20 / coffee / none" />
            </div>
            <div className="bg-black/[0.04] rounded-[12px] p-4 text-[13.5px] leading-relaxed">
              <p className="font-bold mb-1">Review</p>
              <p><b>{type.toUpperCase()}</b> · {title || '—'} · {category} · {color}</p>
              <p className="text-black/60">{city}, {country} · {area} · {date}</p>
            </div>
          </div>
        )}

        {err && <p className="text-[13.5px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2 mt-4">{err}</p>}

        <div className="flex gap-2.5 mt-5">
          {step > 1 && <button onClick={() => { setStep(step - 1); setErr('') }} className="btn-ghost text-[14px]">← Back</button>}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !validStep1) { setErr('Title (4+ chars) and description (10+ chars) are required.'); return }
                if (step === 2 && !validStep2) { setErr('Date, country, city and area are required.'); return }
                setErr(''); setStep(step + 1)
              }}
              className="btn-primary flex-1 text-[14px]">Continue →</button>
          ) : (
            <button onClick={submit} className="btn-primary flex-1 text-[14px]">Publish {type} report ✓</button>
          )}
        </div>
      </div>
    </div>
  )
}
