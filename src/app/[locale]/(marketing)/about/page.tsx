import { Link } from '@/i18n/routing'
import { Leaf } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20 bg-cream-50">
      <div className="page-container max-w-4xl">
        <p className="eyebrow mb-4">À propos</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-midnight mb-6 leading-tight">
          Nous croyons que chaque jardin<br />
          <span className="text-gradient">mérite d&apos;être visualisé avant d&apos;être planté.</span>
        </h1>
        <p className="text-lg text-midnight/55 leading-relaxed mb-6 max-w-2xl">
          Verdia est né d&apos;un constat simple : les paysagistes perdent des clients non pas à cause
          de la qualité de leur travail, mais parce que leurs clients n&apos;arrivaient pas à se projeter
          sur un plan papier ou un devis. Le jardin fini restait abstrait jusqu&apos;au premier coup de pelle.
        </p>
        <p className="text-lg text-midnight/55 leading-relaxed mb-12 max-w-2xl">
          Nous avons construit Verdia pour combler ce fossé. Aujourd&apos;hui, des paysagistes et
          architectes paysagistes utilisent Verdia pour transformer une simple photo de jardin
          en rendu photoréaliste en 60 secondes — et signer plus vite.
        </p>

        <div className="card-light rounded-3xl p-8 mb-16 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className="w-16 h-16 rounded-full shrink-0 bg-sage-200"
            style={{
              backgroundImage: 'url(/grid-1.jpeg)',
              backgroundSize: '500% 200%',
              backgroundPosition: '0% 100%',
            }}
          />
          <div>
            <p className="font-display font-semibold text-midnight text-lg">Antoine R.</p>
            <p className="text-sm text-sage-600 font-medium mb-2">Fondateur de Verdia</p>
            <p className="text-sm text-midnight/50 leading-relaxed max-w-lg">
              &ldquo;Je réponds personnellement à chaque demande. Verdia est encore une petite équipe —
              c&apos;est ce qui nous permet d&apos;aller vite et de rester à l&apos;écoute des paysagistes
              qui l&apos;utilisent tous les jours.&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-midnight/40 mb-10">
          <Leaf className="w-4 h-4 text-sage-500" fill="currentColor" />
          Conçu en France · Conforme RGPD
        </div>

        <div className="flex gap-4">
          <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm transition-all">
            Nous contacter
          </Link>
          <Link href="/pricing" className="px-5 py-2.5 rounded-xl border border-midnight/[0.12] text-midnight/70 hover:text-midnight hover:border-midnight/[0.25] text-sm transition-all">
            Voir les tarifs
          </Link>
        </div>
      </div>
    </div>
  )
}
