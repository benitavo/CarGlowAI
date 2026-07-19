'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRICING_FAQS = [
  { q: 'Qu\'est-ce qu\'un crédit ?', a: 'Un crédit est consommé à chaque action IA : une génération d\'image coûte 1 crédit, une retouche 1 crédit, une génération de vidéo 15 crédits.' },
  { q: 'Les crédits mensuels non utilisés sont-ils reportés ?', a: 'Non. Les crédits inclus dans votre abonnement sont renouvelés chaque mois et n\'expirent pas d\'un mois sur l\'autre — mais ils ne se cumulent pas non plus. Les crédits achetés en pack, eux, n\'expirent jamais.' },
  { q: 'Que contient l\'offre Découverte ?', a: 'Un crédit gratuit chaque mois, sans carte bancaire, avec accès à tous les styles disponibles.' },
  { q: 'Puis-je changer de forfait à tout moment ?', a: 'Oui. La mise à niveau est immédiate, la rétrogradation prend effet à la fin de la période de facturation en cours. Aucun frais de résiliation.' },
  { q: 'Puis-je acheter des crédits supplémentaires ?', a: 'Oui — des packs de crédits ponctuels sont disponibles depuis votre compte, en plus de votre abonnement. Ils n\'expirent jamais.' },
  { q: 'Proposez-vous des tarifs pour les grandes équipes ?', a: 'Oui — contactez notre équipe pour un tarif sur mesure au-delà du forfait Business ou pour des groupes multi-sites.' },
]

export function PricingFaqAccordion() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="flex flex-col divide-y divide-midnight/[0.07]">
      {PRICING_FAQS.map((faq, i) => (
        <div key={i} className="py-5">
          <button
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
            aria-expanded={openFaq === i}
            aria-controls={`pricing-faq-panel-${i}`}
            className="w-full flex items-start justify-between gap-4 text-left"
          >
            <span className={cn('font-medium text-sm transition-colors', openFaq === i ? 'text-sage-600' : 'text-midnight/75')}>
              {faq.q}
            </span>
            {openFaq === i ? <ChevronUp className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" /> : <ChevronDown className="w-4 h-4 text-midnight/30 mt-0.5 shrink-0" />}
          </button>
          {openFaq === i && (
            <p id={`pricing-faq-panel-${i}`} className="mt-3 text-sm text-midnight/50 leading-relaxed">
              {faq.a}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
