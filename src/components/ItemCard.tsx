import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, MapPin, PackageSearch, PackageCheck, Sparkles } from 'lucide-react'
import type { Item } from '../lib/types'
import { timeAgo } from '../lib/types'

export default function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  const lost = item.type === 'lost'
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/item/${item.id}`} className="card overflow-hidden block hover:-translate-y-[2px] hover:border-white/20 transition-all duration-200">
        <div className="h-[150px] relative grid place-items-center bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent overflow-hidden">
          {item.images[0] ? (
            <img src={item.images[0]} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : lost ? (
            <PackageSearch size={44} className="text-amber-300/70" />
          ) : (
            <PackageCheck size={44} className="text-teal-300/70" />
          )}
          <span className={`absolute top-3 left-3 text-[12px] font-bold px-2.5 h-7 inline-flex items-center rounded-full ${lost ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-emerald-950'}`}>
            {lost ? 'LOST' : 'FOUND'}
          </span>
          <span className="absolute top-3 right-3 flex gap-1.5">
            {item.sample && (
              <span className="text-[11px] font-bold px-2.5 h-7 inline-flex items-center gap-1 rounded-full bg-white/10 text-white/80 backdrop-blur border border-white/15">
                <Sparkles size={11} /> SAMPLE
              </span>
            )}
            {item.status !== 'active' && (
              <span className="text-[11px] font-bold px-2.5 h-7 inline-flex items-center rounded-full bg-black/70 text-white uppercase border border-white/15">{item.status}</span>
            )}
          </span>
        </div>
        <div className="p-4">
          <p className="text-[12px] font-semibold text-teal-300/90 uppercase tracking-wide">{item.category}</p>
          <h3 className="font-bold text-white text-[16px] leading-snug mt-0.5 line-clamp-2">{item.title}</h3>
          <p className="text-[13.5px] text-white/55 mt-1 line-clamp-2">{item.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[item.city, item.color].filter(Boolean).map(t => (
              <span key={t} className="text-[12px] font-medium text-white/70 bg-white/[0.06] rounded-full px-2.5 py-1">{t}</span>
            ))}
            {item.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[12px] font-medium text-white/70 bg-white/[0.06] rounded-full px-2.5 py-1">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.07] text-[12.5px] text-white/45 font-medium">
            <span className="inline-flex items-center gap-1 truncate"><MapPin size={13} /> {item.city}, {item.country}</span>
            <span className="inline-flex items-center gap-1 shrink-0 ml-auto"><Clock size={13} /> {timeAgo(item.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
