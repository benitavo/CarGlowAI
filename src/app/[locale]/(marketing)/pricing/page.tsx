'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import RouteLink from 'next/link'
import { Check, Minus, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'decouverte',
    name: 'Découverte',
    monthlyPrice: 0,
    yearlyPrice: 0,
    rendus: '1 rendu offert',
    desc: 'Pour tester Verdia sur un premier projet, sans engagement.',
    cta: 'Commencer gratuitement',
    href: '/signup',
    highlight: false,
  },
  {
    id: 'essentiel',
    name: 'Essentiel',
    monthlyPrice: 29,
    yearlyPrice: 24,
    rendus: '20 rendus / mois',
    badge: 'Le plus populaire',
    desc: 'Pour les paysagistes indépendants qui présentent régulièrement des projets.',
    cta: "Démarrer l'essai",
    href: '/signup?plan=essentiel',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 89,
    yearlyPrice: 74,
    rendus: 'Rendus illimités',
    desc: 'Pour les agences et équipes qui présentent des projets au quotidien.',
    cta: "Démarrer l'essai",
    href: '/signup?plan=pro',
    highlight: false,
  },
]

type CellValue = boolean | string

const COMPARISON_ROWS: { category: string; rows: { feature: string; decouverte: CellValue; essentiel: CellValue; pro: CellValue }[] }[] = [
  {
    category: 'Génération de rendus',
    rows: [
      { feature: 'Rendus inclus',              decouverte: '1',    essentiel: '20 / mois', pro: 'Illimités' },
      { feature: 'Génération d\'images IA',     decouverte: true,   essentiel: true,        pro: true },
      { feature: 'Génération de vidéos',        decouverte: false,  essentiel: true,        pro: true },
      { feature: 'Résolution d\'export',        decouverte: 'HD',   essentiel: 'HD',        pro: '4K' },
    ],
  },
  {
    category: 'Personnalisation',
    rows: [
      { feature: 'Tous les styles paysagers',   decouverte: true,   essentiel: true,  pro: true },
      { feature: 'Description libre du rendu',  decouverte: true,   essentiel: true,  pro: true },
      { feature: 'Styles personnalisés sur mesure', decouverte: false, essentiel: false, pro: true },
    ],
  },
  {
    category: 'Confidentialité & données',
    rows: [
      { feature: 'Traitement conforme RGPD',    decouverte: true,   essentiel: true,  pro: true },
      { feature: 'Hébergement des données en UE', decouverte: true, essentiel: true,  pro: true },
    ],
  },
  {
    category: 'Compte & support',
    rows: [
      { feature: 'Utilisateurs',                decouverte: '1',    essentiel: '3',   pro: 'Illimités' },
      { feature: 'Support prioritaire',         decouverte: false,  essentiel: true,  pro: true },
      { feature: 'Accompagnement dédié',        decouverte: false,  essentiel: false, pro: true },
    ],
  },
]

function CellIcon({ value, planId }: { value: CellValue; planId: string }) {
  if (value === true)  return <Check className="w-5 h-5 text-sage-500 mx-auto" />
  if (value === false) return <Minus className="w-4 h-4 text-midnight/20 mx-auto" />
  return (
    <span className={cn('text-sm font-semibold', planId === 'essentiel' ? 'text-sage-600' : 'text-midnight/70')}>
      {value}
    </span>
  )
}

const PRICING_FAQS = [
  { q: 'Qu\'est-ce qu\'un rendu ?', a: 'Un rendu correspond à une génération d\'image ou de vidéo à partir d\'une photo de jardin. Chaque génération compte comme un rendu, quel que soit le style choisi.' },
  { q: 'Les rendus non utilisés sont-ils reportés ?', a: 'Oui. Sur les forfaits mensuels, les rendus non utilisés sont reportés jusqu\'à 60 jours. Sur les forfaits annuels, ils sont reportés indéfiniment.' },
  { q: 'Que contient l\'offre Découverte ?', a: 'Votre premier rendu est entièrement offert, sans carte bancaire, avec accès à tous les styles disponibles.' },
  { q: 'Puis-je changer de forfait à tout moment ?', a: 'Oui. La mise à niveau est immédiate (au prorata), la rétrogradation prend effet à la fin de la période de facturation en cours. Aucun frais de résiliation.' },
  { q: 'Proposez-vous des tarifs pour les grandes équipes ?', a: 'Oui — contactez notre équipe pour un tarif sur mesure au-delà de 50 rendus par mois ou pour des groupes multi-sites.' },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="pt-32 pb-20 bg-cream-50">
      {/* Header */}
      <div className="page-container text-center max-w-3xl mx-auto mb-16">
        <p className="eyebrow mb-3">Tarifs</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-midnight mb-5">
          Commencez gratuitement,<br /><span className="text-gradient">évoluez à votre rythme.</span>
        </h1>
        <p className="text-lg text-midnight/50 mb-8">
          Pas de frais cachés. Un rendu = une génération. Les rendus non utilisés sont reportés.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-midnight/[0.08]">
          <button
            onClick={() => setYearly(false)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all', !yearly ? 'bg-sage-500 text-white' : 'text-midnight/45 hover:text-midnight/70')}>
            Mensuel
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2', yearly ? 'bg-sage-500 text-white' : 'text-midnight/45 hover:text-midnight/70')}>
            Annuel
            <span className="px-1.5 py-0.5 rounded-md bg-sage-100 text-sage-600 text-[10px] font-bold">2 mois offerts</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="page-container mb-20">
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
          {PLANS.map((plan) => (
            <div key={plan.id} className={cn(
              'relative rounded-3xl p-8 flex flex-col border transition-all',
              plan.highlight ? 'bg-midnight border-sage-500/30 shadow-sage-md' : 'bg-white border-midnight/[0.07] shadow-card',
            )}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-sage-500 text-white text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6">
                <h2 className={cn('font-display font-bold text-xl mb-1', plan.highlight ? 'text-offwhite' : 'text-midnight')}>{plan.name}</h2>
                <p className={cn('text-xs mb-4', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{plan.desc}</p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={cn('text-[2.75rem] font-display font-bold leading-none', plan.highlight ? 'text-offwhite' : 'text-midnight')}>
                    €{yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && <span className={cn('text-sm', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>/mois</span>}
                </div>
                {yearly && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-sage-500 font-medium">
                    €{plan.yearlyPrice * 12}/an · économisez €{(plan.monthlyPrice - plan.yearlyPrice) * 12}
                  </p>
                )}
                <p className={cn('text-xs mt-1', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{plan.rendus}</p>
              </div>

              <RouteLink href={plan.href}
                className={cn(
                  'mb-8 text-center py-3 rounded-2xl text-sm font-semibold transition-all',
                  plan.highlight
                    ? 'bg-sage-500 hover:bg-sage-600 text-white shadow-sage-sm'
                    : 'border border-midnight/[0.12] hover:border-sage-400 text-midnight/70 hover:text-sage-600'
                )}>
                {plan.cta}
              </RouteLink>
            </div>
          ))}
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
                {PLANS.map((p) => (
                  <th key={p.id} className={cn('px-4 py-5 text-center', p.highlight && 'bg-sage-50')}>
                    <span className={cn('text-sm font-bold', p.highlight ? 'text-sage-600' : 'text-midnight/70')}>
                      {p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((category) => (
                <>
                  <tr key={category.category} className="border-t border-midnight/[0.06]">
                    <td colSpan={4} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-sage-600/80 bg-sage-50/50">
                      {category.category}
                    </td>
                  </tr>
                  {category.rows.map((row) => (
                    <tr key={row.feature} className="border-t border-midnight/[0.04] hover:bg-midnight/[0.015] transition-colors">
                      <td className="px-6 py-3.5 text-sm text-midnight/60">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center"><CellIcon value={row.decouverte} planId="decouverte" /></td>
                      <td className="px-4 py-3.5 text-center bg-sage-50/30"><CellIcon value={row.essentiel} planId="essentiel" /></td>
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
