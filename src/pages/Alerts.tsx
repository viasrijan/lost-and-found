import { Link } from 'react-router-dom'
import { useDB } from '../lib/DBContext'

export default function Alerts() {
  const { alerts, setAlerts, items } = useDB()

  const matchCount = (q: string) => {
    const s = q.toLowerCase()
    return items.filter(i => `${i.title} ${i.description} ${i.category} ${i.city} ${i.country}`.toLowerCase().includes(s.split(' in ')[0])).length
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-extrabold tracking-tight text-[24px]">Alerts</h1>
      <p className="text-black/55 text-[14px]">Saved from Browse → “Notify me”. New matches are highlighted when you return.</p>
      <div className="space-y-2.5 mt-4">
        {alerts.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-[36px]">🔔</p>
            <p className="font-bold mt-1">No alerts yet</p>
            <Link to="/" className="btn-primary mt-3 text-[14px]">Browse items</Link>
          </div>
        )}
        {alerts.map(a => (
          <div key={a} className="card p-4 flex items-center gap-3">
            <span className="text-[20px]">🔔</span>
            <div className="flex-1">
              <p className="font-bold text-[14.5px]">{a}</p>
              <p className="text-[13px] text-black/55">{matchCount(a)} current match(es)</p>
            </div>
            <button onClick={() => setAlerts(alerts.filter(x => x !== a))} className="text-[13px] font-semibold text-black/50 hover:text-red-600">Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
