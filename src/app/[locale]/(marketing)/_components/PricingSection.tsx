import { Check } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { getPricingConfig } from '@/lib/pricing'
import { PricingViewedTracker } from './PricingViewedTracker'

interface MarketingPlan {
  name: string
  price: string
  per: string
  sub: string
  badge?: string
  features: string[]
  cta: string
  href: string
  highlight: boolean
}

const PLAN_META: Record<string, { name: string; badge?: string; highlight: boolean; href: string; cta: string; extraFeatures: string[] }> = {
  FREE:      { name: 'Découverte', highlight: false, href: '/signup', cta: 'Commencer gratuitement', extraFeatures: ['Tous les styles disponibles', 'Téléchargement HD'] },
  ESSENTIAL: { name: 'Essentiel',  badge: 'Le plus populaire', highlight: true, href: '/signup?plan=essential', cta: "Démarrer l'essai", extraFeatures: ['Tous les styles', 'Téléchargement HD', 'Support prioritaire'] },
  PRO:       { name: 'Pro',        highlight: false, href: '/signup?plan=pro', cta: "Démarrer l'essai", extraFeatures: ['Tous les styles', 'Export haute résolution', 'Support dédié'] },
  BUSINESS:  { name: 'Business',   highlight: false, href: '/signup?plan=business', cta: "Démarrer l'essai", extraFeatures: ['Tous les styles', 'Export haute résolution', 'Support dédié prioritaire'] },
}

// Numbers come straight from PricingConfig via a direct data-access call (no client-side
// fetch waterfall) — never hardcode credits or prices here.
async function getPlans(): Promise<MarketingPlan[]> {
  const config = await getPricingConfig()
  const raw = [
    { id: 'FREE', price: 0, credits: config.freeCredits },
    { id: 'ESSENTIAL', price: config.essentialPrice, credits: config.essentialCredits },
    { id: 'PRO', price: config.proPrice, credits: config.proCredits },
    { id: 'BUSINESS', price: config.businessPrice, credits: config.businessCredits },
  ]
  return raw.map(p => {
    const meta = PLAN_META[p.id]
    const creditsLabel = `${p.credits.toLocaleString()} crédit${p.credits === 1 ? '' : 's'} / mois`
    return {
      name: meta.name,
      price: p.price > 0 ? `€${p.price}` : 'Gratuit',
      per: p.price > 0 ? '/mois' : '',
      sub: creditsLabel,
      badge: meta.badge,
      features: [creditsLabel, ...meta.extraFeatures],
      cta: meta.cta,
      href: meta.href,
      highlight: meta.highlight,
    }
  })
}

export async function PricingSection() {
  const plans = await getPlans()
  return (
    <section id="tarifs" className="section-pad bg-cream-50">
      <PricingViewedTracker />
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="eyebrow mb-3">Tarifs</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Commencez gratuitement,<br /><span className="text-gradient">évoluez à votre rythme.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {plans.map(plan => (
            <div key={plan.name} className={cn(
              'relative rounded-3xl p-8 flex flex-col border transition-all',
              plan.highlight ? 'bg-midnight border-sage-500/30 shadow-sage-md' : 'bg-white border-midnight/[0.07] shadow-card hover:shadow-card-hover',
            )}>
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-sage-500 text-white text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <div className="mb-5">
                <h3 className={cn('font-display font-semibold mb-1', plan.highlight ? 'text-offwhite' : 'text-midnight')}>{plan.name}</h3>
                <p className={cn('text-xs', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{plan.sub}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={cn('text-4xl font-display font-bold', plan.highlight ? 'text-offwhite' : 'text-midnight')}>{plan.price}</span>
                {plan.per && <span className={cn('text-sm', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{plan.per}</span>}
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className={cn('flex items-start gap-2.5 text-sm', plan.highlight ? 'text-offwhite/65' : 'text-midnight/60')}>
                    <Check className={cn('w-4 h-4 mt-0.5 shrink-0', plan.highlight ? 'text-sage-400' : 'text-sage-500')} />{f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={cn(
                'text-center py-3 rounded-2xl text-sm font-semibold transition-all',
                plan.highlight ? 'bg-sage-500 hover:bg-sage-600 text-white shadow-sage-sm' : 'border border-midnight/[0.12] hover:border-sage-400 text-midnight/70 hover:text-sage-600',
              )}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
