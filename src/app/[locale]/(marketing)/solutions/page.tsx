import { Link } from '@/i18n/routing'
import { ArrowRight, Building2, Users, Store, Factory } from 'lucide-react'

const SOLUTIONS = [
  {
    icon: Building2,
    title: 'Dealerships',
    href: '/solutions/dealerships',
    desc: 'Single-location dealers need fast, consistent photos without a photographer. CarGlow gives you showroom quality from a phone, every time.',
    stats: ['+40% listing views', '4× faster sale', '€0.48/photo'],
  },
  {
    icon: Users,
    title: 'Dealer Groups',
    href: '/solutions/dealer-groups',
    desc: 'Multi-site operations need brand consistency across every location. Central management, local control, zero training.',
    stats: ['One brand standard', 'Unlimited locations', 'Central reporting'],
  },
  {
    icon: Store,
    title: 'Marketplaces',
    href: '/solutions/marketplaces',
    desc: 'Uplift photo quality across millions of listings without touching seller workflows. API-first, scales to any volume.',
    stats: ['150+ integrations', '10M+ photos/mo', 'API-first'],
  },
  {
    icon: Factory,
    title: 'OEMs',
    href: '/solutions/oems',
    desc: 'Enforce photography standards globally, across every dealer. One platform, every country, every make.',
    stats: ['94% compliance', 'Global rollout', 'Brand guidelines'],
  },
]

export default function SolutionsPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="eyebrow mb-3">Solutions</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-offwhite mb-5">
          Built for every part of<br />
          <span className="text-gradient">automotive commerce.</span>
        </h1>
        <p className="text-lg text-offwhite/50">
          Whether you're a single dealer or a global OEM, CarGlow adapts to your workflow, volume, and brand requirements.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {SOLUTIONS.map((sol) => (
          <Link key={sol.title} href={sol.href}
            className="group card-noise rounded-3xl p-8 hover:border-glow-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:border-glow-500/30 transition-all">
              <sol.icon className="w-5 h-5 text-offwhite/60 group-hover:text-glow-400 transition-colors" />
            </div>
            <h2 className="text-xl font-display font-semibold text-offwhite mb-2 group-hover:text-glow-300 transition-colors">{sol.title}</h2>
            <p className="text-sm text-offwhite/50 leading-relaxed mb-5">{sol.desc}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {sol.stats.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-offwhite/50">{s}</span>
              ))}
            </div>
            <span className="text-sm font-medium text-offwhite/40 group-hover:text-glow-400 flex items-center gap-1 transition-colors">
              Learn more <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
