import Image from 'next/image'
import { GARDEN_STYLES } from '@/lib/gardenStyles'

const AUDIENCE: Record<string, string> = {
  'gazon-fleurs':   'Le classique — la majorité des demandes',
  'mediterraneen':  'Exposition plein sud, envie de vacances, arrosage limité',
  'contemporain':   'Maison moderne, client qui veut « propre et net »',
  'naturel':        'Sensibilité écologique, entretien réduit',
  'zen':            'Petit espace, recherche de calme',
  'potager':        'Familles, demande en forte croissance',
}

export function StyleCardsGrid() {
  return (
    <div className="not-prose grid sm:grid-cols-2 gap-3 my-6">
      {GARDEN_STYLES.map((style) => (
        <div key={style.slug} className="rounded-2xl border border-midnight/[0.08] bg-cream-50 p-4 flex gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-midnight/[0.06]">
            <Image src={style.image} alt={style.name} fill className="object-cover" sizes="64px" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-midnight text-[15px] mb-1">{style.name}</h3>
            <p className="text-[13.5px] text-midnight/60 leading-relaxed mb-2">{style.desc}</p>
            <p className="text-[12px] text-sage-700 font-medium">{AUDIENCE[style.slug]}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
