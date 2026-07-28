import { Link } from '@/i18n/routing'
import { ArrowRight, CalendarClock, Users, Sparkles } from 'lucide-react'

export default function BookADemoPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-2xl mx-auto text-center">
        <p className="eyebrow mb-4">Réserver une démo</p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4 leading-[1.1]">
          Voyez Verdia en action.<br /><span className="text-gradient">30 minutes, sans engagement.</span>
        </h1>
        <p className="text-offwhite/50 mb-12 max-w-xl mx-auto">
          Vous gérez plusieurs sites, une agence, ou souhaitez un accompagnement dédié ? Décrivez-nous
          votre besoin et notre équipe vous recontacte sous 24h pour organiser un appel et traiter
          quelques-unes de vos propres photos en direct.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-12 text-left">
          {[
            { icon: CalendarClock, text: '24h pour être recontacté' },
            { icon: Users,         text: 'Accompagnement dédié multi-sites' },
            { icon: Sparkles,      text: 'Démo sur vos propres photos' },
          ].map((item) => (
            <div key={item.text} className="card-noise rounded-2xl border border-white/[0.06] p-5 flex flex-col items-start gap-3">
              <item.icon className="w-5 h-5 text-sage-400" strokeWidth={1.75} />
              <p className="text-sm text-offwhite/70">{item.text}</p>
            </div>
          ))}
        </div>

        <Link
          href="/contact?type=enterprise"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sage-500 hover:bg-sage-600 text-midnight text-sm font-semibold shadow-sage-sm transition-all"
        >
          Décrire mon besoin <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
