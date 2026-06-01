import { Link } from '@/i18n/routing'; import { ArrowRight, Check } from 'lucide-react'
export default function DealershipsPage() {
  return (
    <div className="pt-32 pb-20 page-container max-w-4xl">
      <p className="eyebrow mb-4">For Dealerships</p>
      <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-bold text-offwhite mb-5 leading-tight">
        Every car on your lot.<br /><span className="text-gradient">Showroom-ready in seconds.</span>
      </h1>
      <p className="text-lg text-offwhite/50 max-w-xl mb-10">CarGlow replaces your photographer. Upload from anywhere — no studio, no appointment, no editing skills. Your listings look professional from day one.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {['Professional photos from your phone','Background removed automatically','Studio lighting added in seconds','Plate masking for privacy','4K downloads, no watermark','Direct publish to 150+ marketplaces'].map(f => (
          <div key={f} className="flex items-center gap-3 text-sm text-offwhite/70"><Check className="w-4 h-4 text-glow-500 shrink-0"/>{f}</div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className="px-6 py-3 rounded-2xl bg-glow-500 text-midnight font-semibold text-sm">Start free trial →</Link>
        <Link href="/pricing" className="px-6 py-3 rounded-2xl border border-white/[0.12] text-offwhite/70 text-sm">View pricing</Link>
      </div>
    </div>
  )
}
