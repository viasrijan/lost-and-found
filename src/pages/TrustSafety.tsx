export default function TrustSafety() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-extrabold tracking-tight text-[26px]">Trust &amp; Safety</h1>
      <div className="card p-6 mt-4 space-y-4 text-[14.5px] leading-relaxed text-black/75">
        <p><b>1. No public contact details.</b> All first contact happens in per-item message threads. Requests from strangers need approval.</p>
        <p><b>2. Proof before hand-off.</b> Every listing needs a private proof question. Accept a claim only when the answer is precise.</p>
        <p><b>3. Meet in public.</b> Police station lobbies, mall info desks, campus security — daylight, CCTV, bring a friend.</p>
        <p><b>4. QR / 6-digit hand-off code.</b> Accepting a claim issues a code. Share it only in person; entering it marks the item returned.</p>
        <p><b>5. Never share</b> OTPs, full ID/passport numbers, bank links, or advance “courier fees”. Report anything suspicious from the inbox.</p>
        <p><b>6. Photos:</b> blur serial numbers, QR codes, and addresses before uploading. Max 4 photos, 4MB each.</p>
        <p className="text-black/55 text-[13.5px]">Listings auto-archive after 90 days. Abuse leads to blocks. Production adds human moderation + image screening.</p>
      </div>
    </div>
  )
}
