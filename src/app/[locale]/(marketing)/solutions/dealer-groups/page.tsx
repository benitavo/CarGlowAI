import { Link } from '@/i18n/routing'; import { ArrowRight, Check } from 'lucide-react'
export default function DealerGroupsPage() {
  return (
    <div className="pt-32 pb-20 page-container max-w-4xl">
      <p className="eyebrow mb-4">For Dealer Groups</p>
      <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-bold text-offwhite mb-5 leading-tight">
        One brand standard.<br /><span className="text-gradient">Across every location.</span>
      </h1>
      <p className="text-lg text-offwhite/50 max-w-xl mb-10">Multi-site operations need consistency. CarGlow enforces your photo brand guidelines automatically — every car, every lot, every time.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {['Central brand kit management','Per-location customisation','Multi-user seats + permissions','Advanced analytics dashboard','Consolidated billing','Dedicated account manager'].map(f => (
          <div key={f} className="flex items-center gap-3 text-sm text-offwhite/70"><Check className="w-4 h-4 text-glow-500 shrink-0"/>{f}</div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/book-a-demo" className="px-6 py-3 rounded-2xl bg-glow-500 text-midnight font-semibold text-sm">Book a demo →</Link>
        <Link href="/contact?type=enterprise" className="px-6 py-3 rounded-2xl border border-white/[0.12] text-offwhite/70 text-sm">Talk to sales</Link>
      </div>
    </div>
  )
}
