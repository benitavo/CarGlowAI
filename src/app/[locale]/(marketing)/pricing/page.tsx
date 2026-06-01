'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Check, Minus, ArrowRight, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 24,
    photos: '100 photos/mo',
    desc: 'For individual dealers and small lots just getting started.',
    cta: 'Start free trial',
    href: '/signup?plan=starter',
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 79,
    yearlyPrice: 66,
    photos: '400 photos/mo',
    badge: 'Most popular',
    desc: 'For active dealerships that need speed, branding, and integrations.',
    cta: 'Start free trial',
    href: '/signup?plan=growth',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 199,
    yearlyPrice: 166,
    photos: 'Unlimited photos',
    desc: 'For dealer groups and marketplaces with high volume and custom needs.',
    cta: 'Start free trial',
    href: '/signup?plan=pro',
    highlight: false,
  },
]

type CellValue = boolean | string

const COMPARISON_ROWS: { category: string; rows: { feature: string; starter: CellValue; growth: CellValue; pro: CellValue }[] }[] = [
  {
    category: 'Photo processing',
    rows: [
      { feature: 'Monthly photo credits',     starter: '100',      growth: '400',       pro: 'Unlimited' },
      { feature: 'Background swap',           starter: true,       growth: true,        pro: true },
      { feature: 'Background library',        starter: '15 styles', growth: '15 styles', pro: '15 styles' },
      { feature: 'Output resolution',         starter: '2K',       growth: '4K',        pro: '4K' },
    ],
  },
  {
    category: 'Plate & brand',
    rows: [
      { feature: 'Automatic plate masking',   starter: true,       growth: true,        pro: true },
      { feature: 'Dealer plate frame',        starter: true,       growth: true,        pro: true },
      { feature: 'Logo watermark overlay',    starter: true,       growth: true,        pro: true },
      { feature: 'Brand kits',                starter: '1',        growth: '3',         pro: 'Unlimited' },
    ],
  },
  {
    category: 'Compliance & privacy',
    rows: [
      { feature: 'GDPR-compliant processing', starter: true,       growth: true,        pro: true },
      { feature: 'EU data residency',         starter: true,       growth: true,        pro: true },
      { feature: 'Data Processing Agreement', starter: false,      growth: true,        pro: true },
    ],
  },
  {
    category: 'Integrations',
    rows: [
      { feature: 'REST API access',           starter: false,      growth: true,        pro: true },
      { feature: 'Webhook support',           starter: false,      growth: true,        pro: true },
    ],
  },
  {
    category: 'Account & management',
    rows: [
      { feature: 'User seats',                starter: '1',        growth: '5',         pro: 'Unlimited' },
      { feature: 'Single sign-on (SSO)',       starter: false,      growth: false,       pro: true },
      { feature: 'Audit log',                 starter: false,      growth: false,       pro: true },
    ],
  },
  {
    category: 'Support',
    rows: [
      { feature: 'Email support',             starter: true,       growth: true,        pro: true },
      { feature: 'Priority support',          starter: false,      growth: true,        pro: true },
      { feature: 'Dedicated CSM',             starter: false,      growth: false,       pro: true },
      { feature: 'Uptime SLA (99.9%)',        starter: false,      growth: false,       pro: true },
    ],
  },
]

function CellIcon({ value, planId }: { value: CellValue; planId: string }) {
  if (value === true)  return <Check className="w-5 h-5 text-glow-500 mx-auto" />
  if (value === false) return <Minus className="w-4 h-4 text-white/20 mx-auto" />
  return (
    <span className={cn('text-sm font-semibold', planId === 'growth' ? 'text-glow-400' : 'text-offwhite/70')}>
      {value}
    </span>
  )
}

const PRICING_FAQS = [
  { q: 'What counts as one photo credit?', a: 'One credit = one processed image. Background swap, plate masking, and logo watermark are all applied in a single credit.' },
  { q: 'Do unused credits roll over?', a: 'Yes. On monthly plans, unused credits roll over for up to 60 days. On annual plans, they roll over indefinitely.' },
  { q: 'What\'s included in the free trial?', a: 'Your first 3 photos are free — no credit card required. Full feature access on the plan you select.' },
  { q: 'Can I change plans at any time?', a: 'Yes. Upgrade immediately (prorated), downgrade at the end of your billing period. No cancellation fees.' },
  { q: 'Do you offer volume discounts?', a: 'Yes — contact sales for custom pricing above 1,000 photos/mo or multi-location groups.' },
]

export default function PricingPage() {
  const t = useTranslations('pricing')
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="pt-24 pb-20">
      {/* Header */}
      <div className="page-container text-center max-w-3xl mx-auto mb-16">
        <p className="eyebrow mb-3">{t('eyebrow')}</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-offwhite mb-5">
          {t('headline1')}<br /><span className="text-gradient">{t('headline2')}</span>
        </h1>
        <p className="text-lg text-offwhite/50 mb-8">
          {t('subhead')}
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-4 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => setYearly(false)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all', !yearly ? 'bg-white/[0.08] text-offwhite' : 'text-offwhite/40 hover:text-offwhite/60')}>
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2', yearly ? 'bg-white/[0.08] text-offwhite' : 'text-offwhite/40 hover:text-offwhite/60')}>
            Yearly
            <span className="px-1.5 py-0.5 rounded-md bg-glow-500/20 text-glow-400 text-[10px] font-bold">2 months free</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="page-container mb-20">
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
          {PLANS.map((plan) => (
            <div key={plan.id} className={cn(
              'relative rounded-3xl p-8 flex flex-col',
              plan.highlight
                ? 'bg-gradient-to-b from-glow-500/[0.12] to-transparent border border-glow-500/40 shadow-glow-sm'
                : 'card-noise border border-white/[0.07]'
            )}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-glow-500 text-midnight text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6">
                <h2 className="font-display font-bold text-xl text-offwhite mb-1">{plan.name}</h2>
                <p className="text-xs text-offwhite/40 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-[2.75rem] font-display font-bold text-offwhite leading-none">
                    €{yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-offwhite/40">/mo</span>
                </div>
                {yearly && (
                  <p className="text-xs text-glow-400 font-medium">
                    €{plan.yearlyPrice * 12}/yr · saves €{(plan.monthlyPrice - plan.yearlyPrice) * 12}
                  </p>
                )}
                <p className="text-xs text-offwhite/40 mt-1">{plan.photos}</p>
              </div>

              <Link href={plan.href}
                className={cn(
                  'mb-8 text-center py-3 rounded-2xl text-sm font-semibold transition-all',
                  plan.highlight
                    ? 'bg-glow-500 hover:bg-glow-400 text-midnight shadow-glow-sm'
                    : 'border border-white/[0.12] hover:border-white/[0.25] text-offwhite/80 hover:text-offwhite'
                )}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="max-w-5xl mx-auto card-noise rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs text-offwhite/40 uppercase tracking-widest font-semibold mb-1">Enterprise</p>
            <h3 className="text-xl font-display font-semibold text-offwhite mb-1">Custom volume · Custom SLA · White-label</h3>
            <p className="text-sm text-offwhite/50">For dealer groups, OEMs, and marketplaces. Custom pricing, dedicated infrastructure, full white-label.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/contact?type=enterprise" className="px-6 py-3 rounded-2xl border border-white/[0.12] text-sm font-medium text-offwhite/80 hover:text-offwhite hover:border-white/[0.25] transition-all">
              Contact sales
            </Link>
            <Link href="/book-a-demo" className="px-6 py-3 rounded-2xl bg-glow-500 hover:bg-glow-400 text-midnight text-sm font-semibold shadow-glow-sm transition-all">
              Book a demo <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="page-container mb-20">
        <h2 className="text-2xl font-display font-bold text-offwhite text-center mb-10">
          Full feature comparison
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-white/[0.07]">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left px-6 py-5 text-xs text-offwhite/30 uppercase tracking-widest font-semibold w-[40%]">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className={cn('px-4 py-5 text-center', p.highlight && 'bg-glow-500/[0.05]')}>
                    <span className={cn('text-sm font-bold', p.highlight ? 'text-glow-400' : 'text-offwhite/70')}>
                      {p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((category) => (
                <>
                  <tr key={category.category} className="border-t border-white/[0.06]">
                    <td colSpan={4} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-glow-500/70 bg-white/[0.015]">
                      {category.category}
                    </td>
                  </tr>
                  {category.rows.map((row) => (
                    <tr key={row.feature} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5 text-sm text-offwhite/60">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center"><CellIcon value={row.starter} planId="starter" /></td>
                      <td className="px-4 py-3.5 text-center bg-glow-500/[0.03]"><CellIcon value={row.growth} planId="growth" /></td>
                      <td className="px-4 py-3.5 text-center"><CellIcon value={row.pro} planId="pro" /></td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing FAQ */}
      <div className="page-container max-w-2xl">
        <h2 className="text-2xl font-display font-bold text-offwhite text-center mb-10">Pricing FAQ</h2>
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {PRICING_FAQS.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <span className={cn('font-medium text-sm transition-colors', openFaq === i ? 'text-glow-400' : 'text-offwhite/70')}>
                  {faq.q}
                </span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-glow-400 mt-0.5 shrink-0" /> : <ChevronDown className="w-4 h-4 text-offwhite/30 mt-0.5 shrink-0" />}
              </button>
              {openFaq === i && <p className="mt-3 text-sm text-offwhite/50 leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
