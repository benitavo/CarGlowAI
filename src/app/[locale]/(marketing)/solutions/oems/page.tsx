import { Link } from '@/i18n/routing'; import { Check } from 'lucide-react'
export default function OEMsPage() {
  return (
    <div className="pt-32 pb-20 page-container max-w-4xl">
      <p className="eyebrow mb-4">For OEMs</p>
      <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-bold text-offwhite mb-5 leading-tight">
        Global brand standards.<br /><span className="text-gradient">Zero training required.</span>
      </h1>
      <p className="text-lg text-offwhite/50 max-w-xl mb-10">Enforce your vehicle photography guidelines across thousands of dealers worldwide. CarGlow applies your brand standards automatically — no photographer training, no compliance chasing.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {['Brand guideline automation','Multi-country configurations','Custom background per model line','Compliance reporting','SSO + enterprise auth','Custom SLA & support'].map(f => (
          <div key={f} className="flex items-center gap-3 text-sm text-offwhite/70"><Check className="w-4 h-4 text-glow-500 shrink-0"/>{f}</div>
        ))}
      </div>
      <Link href="/book-a-demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-glow-500 text-midnight font-semibold text-sm">Book enterprise demo →</Link>
    </div>
  )
}
