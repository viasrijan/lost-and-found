import { Link } from 'react-router-dom'
import { Bell, BellOff, X } from 'lucide-react'
import { useDB } from '../lib/DBContext'

export default function Alerts() {
  const { alerts, setAlerts, items } = useDB()

  const matchCount = (q: string) => {
    const s = q.toLowerCase()
    return items.filter(i => `${i.title} ${i.description} ${i.category} ${i.city} ${i.country}`.toLowerCase().includes(s.split(' in ')[0])).length
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-white font-extrabold tracking-tight text-[24px] inline-flex items-center gap-2"><Bell size={22} /> Alerts</h1>
      <p className="text-white/50 text-[14px]">Saved from Browse → “Notify me”. New matches are highlighted when you return.</p>
      <div className="space-y-2.5 mt-4">
        {alerts.length === 0 && (
          <div className="card p-8 text-center">
            <BellOff size={36} className="mx-auto text-white/25" />
            <p className="text-white font-bold mt-2">No alerts yet</p>
            <Link to="/" className="btn-primary mt-3 text-[14px]">Browse items</Link>
          </div>
        )}
        {alerts.map(a => (
          <div key={a} className="card p-4 flex items-center gap-3">
            <Bell size={20} className="text-teal-300/80 shrink-0" />
            <div className="flex-1">
              <p className="text-white font-bold text-[14.5px]">{a}</p>
              <p className="text-[13px] text-white/50">{matchCount(a)} current match(es)</p>
            </div>
            <button onClick={() => setAlerts(alerts.filter(x => x !== a))} className="inline-flex items-center gap-1 text-[13px] font-semibold text-white/45 hover:text-red-400"><X size={14} /> Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
