import { Link } from '@/i18n/routing'; import { Check } from 'lucide-react'
export default function MarketplacesPage() {
  return (
    <div className="pt-32 pb-20 page-container max-w-4xl">
      <p className="eyebrow mb-4">For Marketplaces</p>
      <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-bold text-offwhite mb-5 leading-tight">
        Uplift every listing.<br /><span className="text-gradient">At any scale.</span>
      </h1>
      <p className="text-lg text-offwhite/50 max-w-xl mb-10">API-first. Async batch. Webhook-driven. Integrate CarGlow into your ingestion pipeline and every photo on your platform improves — automatically.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {['REST API with async batch','Webhook event callbacks','Sub-100ms response SLA','Custom model fine-tuning','Volume pricing','White-label endpoints'].map(f => (
          <div key={f} className="flex items-center gap-3 text-sm text-offwhite/70"><Check className="w-4 h-4 text-glow-500 shrink-0"/>{f}</div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/docs" className="px-6 py-3 rounded-2xl bg-glow-500 text-midnight font-semibold text-sm">API docs →</Link>
        <Link href="/book-a-demo" className="px-6 py-3 rounded-2xl border border-white/[0.12] text-offwhite/70 text-sm">Talk to sales</Link>
      </div>
    </div>
  )
}
