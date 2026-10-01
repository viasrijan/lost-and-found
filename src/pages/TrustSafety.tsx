import { Camera, EyeOff, HelpCircle, MapPin, QrCode, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const RULES: { icon: LucideIcon; text: React.ReactNode }[] = [
  { icon: EyeOff, text: <><b>No public contact details.</b> All first contact happens in per-item message threads. Requests from strangers need approval.</> },
  { icon: HelpCircle, text: <><b>Proof before hand-off.</b> Every listing needs a private proof question. Accept a claim only when the answer is precise.</> },
  { icon: MapPin, text: <><b>Meet in public.</b> Police station lobbies, mall info desks, campus security — daylight, CCTV, bring a friend.</> },
  { icon: QrCode, text: <><b>6-digit hand-off code.</b> Accepting a claim issues a code. Share it only in person; entering it marks the item returned.</> },
  { icon: Users, text: <><b>Never share</b> OTPs, full ID/passport numbers, bank links, or advance “courier fees”. Report anything suspicious from the inbox.</> },
  { icon: Camera, text: <><b>Photos:</b> blur serial numbers, QR codes, and addresses before uploading. Max 4 photos, 4MB each.</> }
]

export default function TrustSafety() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-white font-extrabold tracking-tight text-[26px] inline-flex items-center gap-2.5"><ShieldCheck size={28} className="text-teal-300/90" /> Trust &amp; Safety</h1>
      <div className="card p-6 mt-4 space-y-4">
        {RULES.map((r, i) => (
          <p key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-white/70">
            <r.icon size={18} className="shrink-0 mt-0.5 text-teal-300/80" /> <span>{r.text}</span>
          </p>
        ))}
        <p className="text-white/40 text-[13.5px] pt-1">Listings auto-archive after 90 days. Abuse leads to blocks.</p>
      </div>
    </div>
  )
}
