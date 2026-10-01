import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Check, Gift, ImagePlus, MapPin, ShieldCheck, Tag, X } from 'lucide-react'
import { useDB } from '../lib/DBContext'
import { useAuth } from '../features/auth/AuthContext'
import { CATEGORIES, CATEGORY_TAGS, COLORS } from '../lib/categories'
import { AREA_SUGGESTIONS, COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { ensureProfile, insertCloudImages, insertCloudItem, uploadDataUrl } from '../lib/cloud'
import { nowIso, uid, type ItemType } from '../lib/types'

const SYNC_MSG = 'Saved on this device only — run supabase/migrations/002_policies.sql in the Supabase SQL editor to enable cloud sync.'

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
  const { items, setItems, flagSyncIssue } = useDB()
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
  const [saving, setSaving] = useState(false)

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
  const cloudWrite = !!supabase && !!user && !user.id.startsWith('demo_')

  const submit = async () => {
    if (!user) { nav('/login'); return }
    if (!validStep1 || !validStep2) { setErr('Please complete the highlighted fields.'); return }
    if (!proof.trim()) { setErr('Add one private proof question so only the real owner can claim.'); return }
    setSaving(true)
    const tempId = uid('item')
    const payload = {
      type, title: title.trim(), description: desc.trim(), category, tags, color, brand: brand.trim(),
      dateEvent: date, country, city, area: area.trim(), reward: reward.trim() || undefined,
      ownerId: user.id, ownerName: user.name, proofQuestion: proof.trim(), images
    }
    setItems([{ ...payload, id: tempId, createdAt: nowIso(), status: 'active' as const }, ...items])
    if (cloudWrite) {
      try {
        await ensureProfile({ id: user.id, name: user.name, avatar: user.avatar }).catch(() => undefined)
        const created = await insertCloudItem(payload)
        const urls: string[] = []
        for (const d of images) {
          const uploaded = await uploadDataUrl(d, user.id)
          urls.push(uploaded ?? d)
        }
        if (urls.length > 0) {
          await insertCloudImages(created.id, urls).catch(() => undefined)
        }
        setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: created.id, images: urls.length > 0 ? urls : i.images } : i))
      } catch {
        flagSyncIssue(SYNC_MSG)
      }
    }
    setSaving(false)
    nav('/')
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-white font-extrabold tracking-tight text-[26px]">Post</h1>
      <p className="text-white/55 text-[14.5px] mt-1">Three quick steps. Precise tags = faster reunion. Visible on every device once published.</p>

      <div className="flex gap-2 mt-4">
        {[1, 2, 3].map(n => (
          <div key={n} className={`flex-1 h-1.5 rounded-full ${step >= n ? 'bg-[#14B8A6]' : 'bg-white/10'}`} />
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
              <label className="text-[13px] font-bold text-white/80">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input mt-1.5" placeholder="e.g. Black leather bifold wallet" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-white/80">Description * <span className="font-medium text-white/40">(no full serials / ID numbers)</span></label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} className="textarea mt-1.5" placeholder="Where exactly, what condition, what's inside…" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-white/80">Category *</label>
                <select value={category} onChange={e => { setCategory(e.target.value); setTags([]) }} className="select mt-1.5">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-bold text-white/80">Color</label>
                <select value={color} onChange={e => setColor(e.target.value)} className="select mt-1.5">
                  {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-white/80 inline-flex items-center gap-1.5"><Tag size={13} /> Tags <span className="font-medium text-white/40">(up to 6)</span></label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagOptions.map(t => (
                  <button key={t} onClick={() => toggleTag(t)} className={`chip ${tags.includes(t) ? 'chip-active' : ''}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-white/80">Brand / distinguishing mark <span className="font-medium text-white/40">(optional)</span></label>
              <input value={brand} onChange={e => setBrand(e.target.value)} className="input mt-1.5" placeholder="e.g. Apple, Nike, engraved…" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-white/80 inline-flex items-center gap-1.5"><Camera size={13} /> Photos <span className="font-medium text-white/40">(up to 4, blur serials first)</span></label>
              <label className="btn-ghost w-full mt-2 text-[14px] cursor-pointer"><ImagePlus size={16} /> Choose photos<input type="file" accept="image/*" multiple onChange={e => { void onFiles(e.target.files) }} className="hidden" /></label>
              {images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {images.map((s, i) => (
                    <span key={i} className="relative">
                      <img src={s} alt="" className="w-20 h-20 rounded-[10px] object-cover border border-white/10" />
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/10 border border-white/20 grid place-items-center hover:bg-red-500/80"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-bold text-white/80">Date {type === 'lost' ? 'lost' : 'found'} *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input mt-1.5" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-white/80">Country *</label>
                <select value={country} onChange={e => { setCountry(e.target.value); setCity((COUNTRIES[e.target.value] ?? ['Other city'])[0]) }} className="select mt-1.5">
                  {Object.keys(COUNTRIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-bold text-white/80">City *</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="select mt-1.5">
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-white/80 inline-flex items-center gap-1.5"><MapPin size={13} /> Area / landmark *</label>
              <input value={area} onChange={e => setArea(e.target.value)} className="input mt-1.5" placeholder="e.g. Central Station, north exit" list="areas" />
              <datalist id="areas">{AREA_SUGGESTIONS.map(a => <option key={a} value={a} />)}</datalist>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AREA_SUGGESTIONS.slice(0, 6).map(a => <button key={a} onClick={() => setArea(a)} className="chip !h-7 !text-[12px]">{a}</button>)}
              </div>
              <p className="text-[12.5px] text-white/40 mt-2">Public precision is ~area-level only. Exact meetup is arranged privately in chat.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-bold text-white/80 inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Private proof question *</label>
              <input value={proof} onChange={e => setProof(e.target.value)} className="input mt-1.5" placeholder="e.g. What initials are engraved inside?" />
              <p className="text-[12.5px] text-white/40 mt-1.5">Only the real owner can answer this. This is how we stop false claims.</p>
            </div>
            <div>
              <label className="text-[13px] font-bold text-white/80 inline-flex items-center gap-1.5"><Gift size={13} /> Reward <span className="font-medium text-white/40">(optional)</span></label>
              <input value={reward} onChange={e => setReward(e.target.value)} className="input mt-1.5" placeholder="e.g. $20 / coffee / none" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-[12px] p-4 text-[13.5px] leading-relaxed text-white/70">
              <p className="text-white font-bold mb-1">Review</p>
              <p><b>{type.toUpperCase()}</b> · {title || '—'} · {category} · {color}</p>
              <p className="text-white/50">{city}, {country} · {area} · {date}</p>
            </div>
          </div>
        )}

        {err && <p className="text-[13.5px] font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-[10px] px-3 py-2 mt-4">{err}</p>}

        <div className="flex gap-2.5 mt-5">
          {step > 1 && <button onClick={() => { setStep(step - 1); setErr('') }} className="btn-ghost text-[14px]"><ArrowLeft size={15} /> Back</button>}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !validStep1) { setErr('Title (4+ chars) and description (10+ chars) are required.'); return }
                if (step === 2 && !validStep2) { setErr('Date, country, city and area are required.'); return }
                setErr(''); setStep(step + 1)
              }}
              className="btn-primary flex-1 text-[14px]">Continue <ArrowRight size={15} /></button>
          ) : (
            <button onClick={() => { void submit() }} disabled={saving} className="btn-primary flex-1 text-[14px]"><Check size={16} /> {saving ? 'Publishing…' : 'Publish ✓'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
