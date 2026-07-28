'use client'

import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPS = [
  {
    title: 'Affinez un rendu par instruction',
    body: 'Pas besoin de tout régénérer pour un ajustement : décrivez la modification en une phrase et l\'IA l\'applique directement sur le rendu existant.',
  },
  {
    title: 'Transformez un rendu en vidéo',
    body: 'Exportez un avant/après au format Reel, Story, paysage ou carré — prêt à publier sur vos réseaux, sans montage.',
  },
  {
    title: 'La photo originale reste toujours disponible',
    body: 'Chaque rendu conserve la photo de départ, pour comparer ou régénérer avec un autre style à tout moment.',
  },
]

export default function TipCarousel() {
  const [idx, setIdx] = useState(0)
  const tip = TIPS[idx]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-sage-500/15 text-sage-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-widest uppercase text-offwhite/40">Tip of the day</div>
          <div className="text-[13px] font-medium">{tip.title}</div>
        </div>
      </div>
      <p className="text-[13px] text-offwhite/60 leading-relaxed">{tip.body}</p>
      <div className="flex items-center gap-1 mt-4">
        {TIPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={cn('h-1 rounded-full transition-all', i === idx ? 'w-8 bg-sage-500' : 'w-1.5 bg-white/[0.12]')}
          />
        ))}
      </div>
    </div>
  )
}
