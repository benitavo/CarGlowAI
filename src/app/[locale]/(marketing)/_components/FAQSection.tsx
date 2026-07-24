'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQS = [
  { q: 'Comment fonctionne la génération de rendu ?', a: "Vous téléchargez une photo du jardin, choisissez un style parmi nos 6 options, et notre IA transforme la photo en rendu photoréaliste en environ 60 secondes. L'IA conserve la structure existante et transforme uniquement les zones végétales." },
  { q: 'Quelle qualité de photo est nécessaire ?', a: "Une photo prise avec un smartphone récent est largement suffisante. Photographiez en pleine lumière naturelle depuis un angle montrant l'ensemble du jardin." },
  { q: 'Puis-je utiliser les rendus dans mes devis ?', a: "Oui, absolument. Les rendus sont téléchargeables en haute résolution et librement utilisables dans vos documents commerciaux, présentations, réseaux sociaux ou site web." },
  { q: 'Puis-je publier ces vidéos sur mes réseaux ?', a: 'TODO' },
  { q: 'Le rendu modifie-t-il les structures existantes ?', a: "Non. L'IA respecte strictement le bâti existant : murs, clôtures, terrasse, mobilier, bâtiments. Seules les zones de végétation et de sol sont transformées." },
  { q: 'Mon premier rendu est vraiment gratuit ?', a: "Oui, sans aucune condition. Créez votre compte, téléchargez votre photo, choisissez votre style et générez votre premier rendu — sans carte bancaire, sans engagement." },
]

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="section-pad bg-cream-50">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Questions <span className="text-gradient">fréquentes.</span>
          </h2>
        </div>
        <div className="flex flex-col divide-y divide-midnight/[0.07]">
          {FAQS.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="w-full flex items-start justify-between gap-4 text-left">
                <span className={cn('font-medium text-base transition-colors', open === i ? 'text-sage-600' : 'text-midnight/75 hover:text-midnight')}>
                  {faq.q}
                </span>
                {open === i ? <ChevronUp className="w-5 h-5 text-sage-500 mt-0.5 shrink-0" /> : <ChevronDown className="w-5 h-5 text-midnight/30 mt-0.5 shrink-0" />}
              </button>
              {open === i && (
                <p id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-trigger-${i}`} className="mt-3 text-sm text-midnight/50 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
