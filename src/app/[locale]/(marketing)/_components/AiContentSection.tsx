'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeftRight, Handshake, Share2, Link2, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrackedLink } from './TrackedLink'

const FEATURES = [
  {
    icon: ArrowLeftRight,
    title: 'Avant / Après instantané',
    desc: "Transformez une simple photo en une visualisation réaliste du futur jardin.",
  },
  {
    icon: Handshake,
    title: 'Convainquez plus facilement',
    desc: 'Les clients se projettent immédiatement grâce à des rendus photoréalistes.',
  },
  {
    icon: Share2,
    title: 'Contenu pour les réseaux sociaux',
    desc: 'Générez facilement des publications attractives pour attirer de nouveaux clients.',
  },
  {
    icon: Link2,
    title: '100 % intégré à Verdia',
    desc: "Passez d'une photo à un devis puis à un rendu IA sans changer d'outil.",
  },
]

// Same reveal-on-scroll shape as the lazy-mounted video/Calendly embeds elsewhere on this
// page — IntersectionObserver flips one boolean once, no scroll listener, no re-triggering.
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { rootMargin: '-80px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ref, visible }
}

export function AiContentSection() {
  const { ref: sectionRef, visible } = useRevealOnScroll<HTMLDivElement>()

  return (
    <section className="section-pad bg-white">
      <div
        ref={sectionRef}
        className={cn(
          'page-container transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        )}
      >
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left: copy + feature cards */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-200 text-sage-600 text-xs font-bold uppercase tracking-wider mb-5">
              ✨ Nouveau
            </div>

            <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.9rem,3.8vw,2.9rem)', lineHeight: 1.12 }}>
              Impressionnez vos clients{' '}
              <span className="text-gradient">avant même le début des travaux</span>
            </h2>

            <p className="text-midnight/50 text-[15px] leading-relaxed mb-10 max-w-xl">
              Créez des rendus IA avant / après en quelques secondes pour aider vos clients à
              se projeter et transformez-les en contenus prêts à publier sur Instagram, Facebook
              ou LinkedIn.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={cn(
                    'group card-light rounded-2xl p-5 transition-all duration-500 ease-out',
                    'hover:border-sage-300 hover:shadow-card-hover hover:-translate-y-1',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                  )}
                  style={{ transitionDelay: visible ? `${i * 90}ms` : '0ms' }}
                >
                  <div className="w-11 h-11 rounded-xl bg-sage-50 border border-sage-200/60 flex items-center justify-center mb-4 transition-colors group-hover:bg-sage-100">
                    <f.icon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display font-semibold text-midnight text-[15px] mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-midnight/50 text-[13.5px] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: before/after showcase */}
          <div
            className={cn(
              'relative rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card transition-all duration-700 ease-out',
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]',
            )}
            style={{ transitionDelay: visible ? '150ms' : '0ms' }}
          >
            <Image
              src="/marketing/social-before-after.jpg"
              alt="Jardin avant/après transformé par le rendu IA Verdia"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Centered CTA */}
      <div className="page-container mt-16 lg:mt-20">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-display font-bold text-midnight mb-6" style={{ fontSize: 'clamp(1.5rem,2.8vw,2.1rem)' }}>
            Votre prochain chantier commence par une image.
          </h3>
          <TrackedLink href="/signup" ctaId="ai_content_section" label="Créer mon premier rendu" location="ai_content_section"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
            Créer mon premier rendu
            <ArrowRight className="w-5 h-5" />
          </TrackedLink>
        </div>
      </div>
    </section>
  )
}
