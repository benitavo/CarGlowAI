import { Check, Sparkles, Wand2, Film, Share2 } from 'lucide-react'
import { GARDEN_STYLES } from '@/lib/gardenStyles'

const FEATURE_SECTIONS = [
  {
    id: 'generation',
    icon: Sparkles,
    title: 'Génération de rendu',
    desc:
      "Importez une photo du jardin, choisissez un style, et l'IA génère un rendu photoréaliste en environ 60 secondes. La structure existante — bâti, clôtures, terrasse, mobilier — est toujours respectée : seules les zones de végétation et de sol sont transformées.",
    details: GARDEN_STYLES.map((s) => `${s.emoji} ${s.name} — ${s.desc}`),
  },
  {
    id: 'retouche',
    icon: Wand2,
    title: 'Retouche par instruction',
    desc:
      "Pas besoin de tout régénérer pour un ajustement. Décrivez la modification en une phrase — \"ajoute une allée en gravier\", \"remplace la haie par des bambous\" — et l'IA applique la retouche directement sur le rendu existant.",
    details: [
      'Modifications ciblées sans repartir de zéro',
      'Conserve le reste du rendu à l\'identique',
      'Idéal pour affiner un rendu avant de le présenter à un client',
    ],
  },
  {
    id: 'video',
    icon: Film,
    title: 'Vidéo avant / après',
    desc:
      "Transformez un rendu en courte vidéo animée montrant la transition entre l'état actuel et le projet imaginé — un format qui marque davantage qu'une simple image fixe lors d'un rendez-vous client.",
    details: [
      'Animation fluide de l\'avant vers l\'après',
      'Génération automatique, sans montage',
      'Téléchargeable en HD',
    ],
  },
  {
    id: 'kit-marketing',
    icon: Share2,
    title: 'Kit marketing',
    desc:
      "Exportez vos rendus avant/après au format Reel, Story, paysage ou carré — prêts à publier sur Instagram, Facebook, LinkedIn ou TikTok pour attirer de nouveaux clients, sans compétence en montage vidéo.",
    details: [
      '4 formats adaptés à chaque réseau social',
      'Texte de fin et appel à l\'action personnalisables',
      'Prêt à publier en un clic',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="page-container text-center max-w-2xl mx-auto mb-20">
        <p className="eyebrow mb-3">Fonctionnalités</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-offwhite mb-5">
          Une photo. Un rendu.<br />
          <span className="text-gradient">Un client convaincu.</span>
        </h1>
        <p className="text-lg text-offwhite/50">
          Verdia transforme une photo de jardin en rendu photoréaliste, affine le résultat par
          instruction, puis le transforme en contenu prêt à publier — le tout sans quitter l&apos;outil.
        </p>
      </div>

      <div className="page-container">
        <div className="flex flex-col gap-24">
          {FEATURE_SECTIONS.map((feat, i) => (
            <div
              key={feat.id}
              id={feat.id}
              className={`grid lg:grid-cols-2 gap-16 items-center ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center mb-6">
                  <feat.icon className="w-5 h-5 text-sage-400" />
                </div>
                <h2 className="text-3xl font-display font-bold text-offwhite mb-4">{feat.title}</h2>
                <p className="text-offwhite/60 leading-relaxed mb-6">{feat.desc}</p>
                <ul className="flex flex-col gap-2.5">
                  {feat.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm text-offwhite/60">
                      <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Visual placeholder */}
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-sage-500/[0.08] to-midnight-600/50 border border-white/[0.06] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-offwhite/20">
                  <feat.icon className="w-12 h-12" />
                  <span className="text-sm font-medium">{feat.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
