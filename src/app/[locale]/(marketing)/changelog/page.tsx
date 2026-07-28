import { Link } from '@/i18n/routing'
import { Sparkles, Wrench, Shield, Plus } from 'lucide-react'

const ENTRIES = [
  {
    date: '28 juillet 2026',
    tag: 'Nouveauté',
    title: 'Offre d\'été',
    items: [
      { icon: Sparkles, text: 'Le plan Essentiel passe à 19€/mois la première année (au lieu de 39€) jusqu\'au 31 août.' },
      { icon: Wrench,   text: 'Interface de facturation retravaillée : plans mis en avant, paiement sécurisé par Stripe plus visible.' },
    ],
  },
  {
    date: '24-25 juillet 2026',
    tag: 'Nouveauté',
    title: 'Kit marketing vidéo',
    items: [
      { icon: Sparkles, text: 'Transformez un rendu avant/après en courte vidéo prête à publier — format Reel, Story, paysage ou carré.' },
      { icon: Plus,     text: 'Nouvelle vue admin des inscriptions et de la consommation de crédits.' },
      { icon: Wrench,   text: 'Correction : la retouche et l\'import de photos HEIC, cassés depuis la migration du stockage.' },
    ],
  },
  {
    date: '21 juillet 2026',
    tag: 'Amélioration',
    title: 'Contenu prêt à publier',
    items: [
      { icon: Sparkles, text: 'Nouvelle section sur la page d\'accueil dédiée au contenu pour les réseaux sociaux.' },
      { icon: Plus,     text: 'Nouveau favicon et icône Verdia.' },
    ],
  },
  {
    date: '18-20 juillet 2026',
    tag: 'Amélioration',
    title: 'Confidentialité et performance',
    items: [
      { icon: Shield, text: 'Bannière de consentement aux cookies conforme RGPD/CNIL, activant Meta Pixel uniquement après accord.' },
      { icon: Plus,   text: 'Connexion possible avec Google, en plus de l\'e-mail.' },
      { icon: Wrench, text: 'Optimisations de vitesse de chargement sur mobile.' },
    ],
  },
  {
    date: '17 juillet 2026',
    tag: 'Nouveauté',
    title: 'Sécurité du compte',
    items: [
      { icon: Shield, text: 'Vérification de l\'adresse e-mail obligatoire à l\'inscription.' },
      { icon: Plus,   text: 'Ajout de la réinitialisation de mot de passe en cas d\'oubli.' },
    ],
  },
]

const TAG_STYLES: Record<string, string> = {
  Nouveauté: 'bg-sage-500/15 text-sage-300 border-sage-500/30',
  Amélioration: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
}

export default function ChangelogPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow mb-4">Journal des mises à jour</p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4 leading-[1.1]">
          Quoi de neuf chez <span className="text-gradient">Verdia.</span>
        </h1>
        <p className="text-offwhite/55 mb-14 text-[15px]">
          Les dernières améliorations apportées à la plateforme.
        </p>

        <div className="space-y-12 relative">
          {/* Vertical timeline */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-sage-500/30 via-white/[0.06] to-transparent" />

          {ENTRIES.map((e) => (
            <article key={e.title} className="relative pl-12">
              {/* Dot */}
              <div className="absolute left-2 top-2 w-3 h-3 rounded-full bg-sage-500 ring-4 ring-midnight shadow-sage-sm" />

              <div className="flex items-baseline gap-3 flex-wrap">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${TAG_STYLES[e.tag]}`}>
                  {e.tag}
                </span>
                <span className="text-xs text-offwhite/35 tabular-nums">{e.date}</span>
              </div>

              <h2 className="font-display font-bold text-2xl text-offwhite mt-2 mb-4">{e.title}</h2>

              <ul className="space-y-2.5">
                {e.items.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <li key={i} className="flex items-start gap-2.5 text-[15px] text-offwhite/75">
                      <Icon className="w-4 h-4 text-sage-400 mt-1 flex-shrink-0" strokeWidth={1.75} />
                      <span>{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-offwhite/45">
          Une idée à nous soumettre ? <Link href="/contact" className="text-sage-400 hover:text-sage-300">Dites-le-nous</Link>.
        </div>
      </div>
    </div>
  )
}
