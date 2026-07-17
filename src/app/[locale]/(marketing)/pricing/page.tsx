'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import RouteLink from 'next/link'
import { Check, Minus, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiPlan {
  id: 'FREE' | 'ESSENTIAL' | 'PRO' | 'BUSINESS'
  label: string
  price: number
  credits: number
}

interface ApiFeature {
  key: string
  label: string
  creditCost: number
  enabled: boolean
}

const PLAN_META: Record<string, { desc: string; cta: string; href: string; badge?: string; highlight: boolean }> = {
  FREE:      { desc: 'Pour tester Verdia sur un premier projet, sans engagement.', cta: 'Commencer gratuitement', href: '/signup', highlight: false },
  ESSENTIAL: { desc: 'Pour les paysagistes indépendants qui présentent régulièrement des projets.', cta: "Démarrer l'essai", href: '/signup?plan=essential', badge: 'Le plus populaire', highlight: true },
  PRO:       { desc: 'Pour les agences et équipes qui présentent des projets au quotidien.', cta: "Démarrer l'essai", href: '/signup?plan=pro', highlight: false },
  BUSINESS:  { desc: 'Pour les groupes multi-sites avec des besoins de volume plus élevés.', cta: "Démarrer l'essai", href: '/signup?plan=business', highlight: false },
}

type CellValue = boolean | string

function CellIcon({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === true)  return <Check className="w-5 h-5 text-sage-500 mx-auto" />
  if (value === false) return <Minus className="w-4 h-4 text-midnight/20 mx-auto" />
  return (
    <span className={cn('text-sm font-semibold', highlight ? 'text-sage-600' : 'text-midnight/70')}>
      {value}
    </span>
  )
}

const PRICING_FAQS = [
  { q: 'Qu\'est-ce qu\'un crédit ?', a: 'Un crédit est consommé à chaque action IA : une génération d\'image coûte 1 crédit, une retouche 1 crédit, une génération de vidéo 15 crédits.' },
  { q: 'Les crédits mensuels non utilisés sont-ils reportés ?', a: 'Non. Les crédits inclus dans votre abonnement sont renouvelés chaque mois et n\'expirent pas d\'un mois sur l\'autre — mais ils ne se cumulent pas non plus. Les crédits achetés en pack, eux, n\'expirent jamais.' },
  { q: 'Que contient l\'offre Découverte ?', a: 'Un crédit gratuit, offert une seule fois à la création du compte, sans carte bancaire, avec accès à tous les styles disponibles.' },
  { q: 'Puis-je changer de forfait à tout moment ?', a: 'Oui. La mise à niveau est immédiate, la rétrogradation prend effet à la fin de la période de facturation en cours. Aucun frais de résiliation.' },
  { q: 'Puis-je acheter des crédits supplémentaires ?', a: 'Oui — des packs de crédits ponctuels sont disponibles depuis votre compte, en plus de votre abonnement. Ils n\'expirent jamais.' },
  { q: 'Proposez-vous des tarifs pour les grandes équipes ?', a: 'Oui — contactez notre équipe pour un tarif sur mesure au-delà du forfait Business ou pour des groupes multi-sites.' },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [plans, setPlans] = useState<ApiPlan[]>([])
  const [features, setFeatures] = useState<ApiFeature[]>([])

  useEffect(() => {
    fetch('/api/pricing')
      .then(r => r.json())
      .then(d => {
        setPlans(d.plans ?? [])
        setFeatures(d.features ?? [])
      })
      .catch(() => {})
  }, [])

  const costFor = (key: string) => features.find(f => f.key === key)?.creditCost

  return (
    <div className="pt-32 pb-20 bg-cream-50">
      {/* Header */}
      <div className="page-container text-center max-w-3xl mx-auto mb-16">
        <p className="eyebrow mb-3">Tarifs</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-midnight mb-5">
          Commencez gratuitement,<br /><span className="text-gradient">évoluez à votre rythme.</span>
        </h1>
        <p className="text-lg text-midnight/50 mb-8">
          Pas de frais cachés. Chaque action IA consomme des crédits, au tarif affiché ci-dessous.
        </p>
      </div>

      {/* Plan cards */}
      <div className="page-container mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-10">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.id]
            if (!meta) return null
            return (
              <div key={plan.id} className={cn(
                'relative rounded-3xl p-8 flex flex-col border transition-all',
                meta.highlight ? 'bg-midnight border-sage-500/30 shadow-sage-md' : 'bg-white border-midnight/[0.07] shadow-card',
              )}>
                {meta.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-sage-500 text-white text-xs font-bold whitespace-nowrap">
                    {meta.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h2 className={cn('font-display font-bold text-xl mb-1', meta.highlight ? 'text-offwhite' : 'text-midnight')}>{plan.label}</h2>
                  <p className={cn('text-xs mb-4', meta.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{meta.desc}</p>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className={cn('text-[2.75rem] font-display font-bold leading-none', meta.highlight ? 'text-offwhite' : 'text-midnight')}>
                      {plan.price > 0 ? `€${plan.price}` : 'Gratuit'}
                    </span>
                    {plan.price > 0 && <span className={cn('text-sm', meta.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>/mois</span>}
                  </div>
                  <p className={cn('text-xs mt-1', meta.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>
                    {plan.id === 'FREE'
                      ? `${plan.credits.toLocaleString()} crédit${plan.credits === 1 ? '' : 's'} offert${plan.credits === 1 ? '' : 's'}`
                      : `${plan.credits.toLocaleString()} crédits / mois`}
                  </p>
                </div>

                <RouteLink href={meta.href}
                  className={cn(
                    'mb-8 text-center py-3 rounded-2xl text-sm font-semibold transition-all',
                    meta.highlight
                      ? 'bg-sage-500 hover:bg-sage-600 text-white shadow-sage-sm'
                      : 'border border-midnight/[0.12] hover:border-sage-400 text-midnight/70 hover:text-sage-600'
                  )}>
                  {meta.cta}
                </RouteLink>
              </div>
            )
          })}
        </div>

        {/* Sur-mesure */}
        <div className="max-w-5xl mx-auto card-light rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs text-sage-600 uppercase tracking-widest font-semibold mb-1">Sur-mesure</p>
            <h3 className="text-xl font-display font-semibold text-midnight mb-1">Volume personnalisé · Multi-sites · Accompagnement dédié</h3>
            <p className="text-sm text-midnight/50">Pour les agences paysagistes et groupes multi-sites. Tarif sur mesure et accompagnement dédié.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/contact?type=enterprise" className="px-6 py-3 rounded-2xl border border-midnight/[0.12] text-sm font-medium text-midnight/70 hover:text-midnight hover:border-midnight/[0.25] transition-all">
              Contacter l&apos;équipe
            </Link>
            <Link href="/book-a-demo" className="px-6 py-3 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-semibold shadow-sage-sm transition-all">
              Réserver une démo <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Credit cost table */}
      <div className="page-container mb-20">
        <h2 className="text-2xl font-display font-bold text-midnight text-center mb-10">
          Coût en crédits par action
        </h2>
        <div className="max-w-2xl mx-auto rounded-3xl border border-midnight/[0.08] bg-white overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-midnight/[0.06]">
                <td className="px-6 py-4 text-sm text-midnight/70">Génération d&apos;image</td>
                <td className="px-6 py-4 text-right font-semibold text-midnight tabular-nums">{costFor('imageGeneration') ?? '—'} crédit</td>
              </tr>
              <tr className="border-b border-midnight/[0.06]">
                <td className="px-6 py-4 text-sm text-midnight/70">Retouche d&apos;image</td>
                <td className="px-6 py-4 text-right font-semibold text-midnight tabular-nums">{costFor('imageRetouch') ?? '—'} crédit</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-midnight/70">Génération de vidéo</td>
                <td className="px-6 py-4 text-right font-semibold text-midnight tabular-nums">{costFor('videoGeneration') ?? '—'} crédits</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison table */}
      <div className="page-container mb-20">
        <h2 className="text-2xl font-display font-bold text-midnight text-center mb-10">
          Comparatif complet des forfaits
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-midnight/[0.08] bg-white">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-midnight/[0.07]">
                <th className="text-left px-6 py-5 text-xs text-midnight/30 uppercase tracking-widest font-semibold w-[40%]">Fonctionnalité</th>
                {plans.map((p) => (
                  <th key={p.id} className={cn('px-4 py-5 text-center', PLAN_META[p.id]?.highlight && 'bg-sage-50')}>
                    <span className={cn('text-sm font-bold', PLAN_META[p.id]?.highlight ? 'text-sage-600' : 'text-midnight/70')}>
                      {p.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-midnight/[0.06]">
                <td colSpan={plans.length + 1} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-sage-600/80 bg-sage-50/50">
                  Génération de rendus
                </td>
              </tr>
              <tr className="border-t border-midnight/[0.04] hover:bg-midnight/[0.015] transition-colors">
                <td className="px-6 py-3.5 text-sm text-midnight/60">Crédits inclus</td>
                {plans.map(p => (
                  <td key={p.id} className={cn('px-4 py-3.5 text-center', PLAN_META[p.id]?.highlight && 'bg-sage-50/30')}>
                    <CellIcon
                      value={p.id === 'FREE' ? `${p.credits.toLocaleString()} (offert)` : `${p.credits.toLocaleString()} / mois`}
                      highlight={!!PLAN_META[p.id]?.highlight}
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-midnight/[0.04] hover:bg-midnight/[0.015] transition-colors">
                <td className="px-6 py-3.5 text-sm text-midnight/60">Génération d&apos;images IA</td>
                {plans.map(p => (
                  <td key={p.id} className={cn('px-4 py-3.5 text-center', PLAN_META[p.id]?.highlight && 'bg-sage-50/30')}>
                    <CellIcon value={true} highlight={!!PLAN_META[p.id]?.highlight} />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-midnight/[0.04] hover:bg-midnight/[0.015] transition-colors">
                <td className="px-6 py-3.5 text-sm text-midnight/60">Génération de vidéos</td>
                {plans.map(p => (
                  <td key={p.id} className={cn('px-4 py-3.5 text-center', PLAN_META[p.id]?.highlight && 'bg-sage-50/30')}>
                    <CellIcon value={p.id !== 'FREE'} highlight={!!PLAN_META[p.id]?.highlight} />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-midnight/[0.06]">
                <td colSpan={plans.length + 1} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-sage-600/80 bg-sage-50/50">
                  Compte &amp; support
                </td>
              </tr>
              <tr className="border-t border-midnight/[0.04] hover:bg-midnight/[0.015] transition-colors">
                <td className="px-6 py-3.5 text-sm text-midnight/60">Support prioritaire</td>
                {plans.map(p => (
                  <td key={p.id} className={cn('px-4 py-3.5 text-center', PLAN_META[p.id]?.highlight && 'bg-sage-50/30')}>
                    <CellIcon value={p.id !== 'FREE'} highlight={!!PLAN_META[p.id]?.highlight} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing FAQ */}
      <div className="page-container max-w-2xl">
        <h2 className="text-2xl font-display font-bold text-midnight text-center mb-10">Questions fréquentes sur les tarifs</h2>
        <div className="flex flex-col divide-y divide-midnight/[0.07]">
          {PRICING_FAQS.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <span className={cn('font-medium text-sm transition-colors', openFaq === i ? 'text-sage-600' : 'text-midnight/75')}>
                  {faq.q}
                </span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" /> : <ChevronDown className="w-4 h-4 text-midnight/30 mt-0.5 shrink-0" />}
              </button>
              {openFaq === i && <p className="mt-3 text-sm text-midnight/50 leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
