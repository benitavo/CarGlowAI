'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GridAvatar } from './GridAvatar'

const TESTIMONIALS = [
  { quote: "J'ai montré le rendu à mes clients avant même de calculer le devis. Ils ont dit oui sur le champ. C'est devenu mon outil de vente numéro un.", name: 'Thomas B.', role: 'Paysagiste', location: 'Lyon, 69', stars: 5, avatar: { col: 2, row: 0 } },
  { quote: "En 2 minutes, j'avais 6 versions différentes du futur jardin. Le client a choisi le style méditerranéen. Le chantier commence la semaine prochaine.", name: 'Sophie L.', role: 'Architecte paysagiste', location: 'Aix-en-Provence, 13', stars: 5, avatar: { col: 1, row: 0 } },
  { quote: "Mes clients n'arrivent plus à se projeter sur les plans papier. Avec Verdia, ils voient exactement ce que ça va donner. Le taux de signature a explosé.", name: 'Marc D.', role: 'Aménageur extérieur', location: 'Bordeaux, 33', stars: 5, avatar: { col: 4, row: 0 } },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setCurrent(c => (c + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(t)
  }, [current, paused])

  const t = TESTIMONIALS[current]

  return (
    <section className="section-pad bg-white">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Témoignages</p>
          <h2 className="font-display font-bold text-midnight" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Ils ont <span className="text-gradient">convaincu</span> leurs clients.
          </h2>
        </div>

        <div
          className="card-light rounded-3xl p-10 md:p-14 text-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-4 h-4 text-sage-500 fill-sage-500" />)}
          </div>
          <p className="text-lg md:text-xl text-midnight/70 leading-relaxed mb-8 max-w-xl mx-auto">&ldquo;{t.quote}&rdquo;</p>
          <div className="flex items-center justify-center gap-3">
            <GridAvatar col={t.avatar.col} row={t.avatar.row}
              className="w-10 h-10 rounded-full shrink-0 bg-sage-200" />
            <div className="text-left">
              <p className="text-sm font-semibold text-midnight">{t.name}</p>
              <p className="text-xs text-midnight/45">{t.role} · {t.location}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setCurrent(c => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            className="w-8 h-8 rounded-full border border-midnight/[0.10] flex items-center justify-center text-midnight/35 hover:text-midnight transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('h-1.5 rounded-full transition-all', i === current ? 'bg-sage-500 w-5' : 'bg-midnight/15 w-1.5')} />
            ))}
          </div>
          <button onClick={() => setCurrent(c => (c + 1) % TESTIMONIALS.length)}
            className="w-8 h-8 rounded-full border border-midnight/[0.10] flex items-center justify-center text-midnight/35 hover:text-midnight transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
