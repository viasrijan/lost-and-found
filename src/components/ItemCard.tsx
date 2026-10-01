import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
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
      <Link to={`/item/${item.id}`} className="card overflow-hidden block hover:shadow-pop hover:-translate-y-[2px] transition-all duration-200">
        <div className={`h-[150px] relative grid place-items-center ${lost ? 'bg-gradient-to-br from-amber-100 via-orange-50 to-white' : 'bg-gradient-to-br from-emerald-100 via-teal-50 to-white'}`}>
          {item.images[0] ? (
            <img src={item.images[0]} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-[44px] select-none" aria-hidden>{lost ? '🔎' : '🎒'}</span>
          )}
          <span className={`absolute top-3 left-3 text-[12px] font-bold px-2.5 h-7 inline-flex items-center rounded-full ${lost ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white'}`}>
            {lost ? 'LOST' : 'FOUND'}
          </span>
          {item.status !== 'active' && (
            <span className="absolute top-3 right-3 text-[12px] font-bold px-2.5 h-7 inline-flex items-center rounded-full bg-black/70 text-white uppercase">{item.status}</span>
          )}
        </div>
        <div className="p-4">
          <p className="text-[12px] font-semibold text-[#0E6B61] uppercase tracking-wide">{item.category}</p>
          <h3 className="font-bold text-[16px] leading-snug mt-0.5 line-clamp-2">{item.title}</h3>
          <p className="text-[13.5px] text-black/60 mt-1 line-clamp-2">{item.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[item.city, item.color].filter(Boolean).map(t => (
              <span key={t} className="text-[12px] font-medium bg-black/[0.05] rounded-full px-2.5 py-1">{t}</span>
            ))}
            {item.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[12px] font-medium bg-black/[0.05] rounded-full px-2.5 py-1">{t}</span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/[0.06]">
            <span className="text-[13px] text-black/55 font-medium">{item.city}, {item.country} · {timeAgo(item.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
