import Link from 'next/link'
import Image from 'next/image'
import { Quote } from 'lucide-react'
import { AuthVisualCarousel } from '@/components/AuthVisualCarousel'
import { TestimonialAvatar } from '@/components/TestimonialAvatar'
import { TESTIMONIALS } from '@/lib/testimonials'

// Picks the testimonial that isn't the homepage's default first one (Thomas B.) — a
// visitor who just scrolled the homepage and clicks through to sign up would otherwise
// see the exact same quote again immediately.
const authTestimonial = TESTIMONIALS[1]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 text-midnight flex">
      {/* ── Form column ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Logo */}
        <header className="px-6 lg:px-10 py-6 border-b border-midnight/[0.06]">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo%20verdia%20without%20background.png"
              alt="Verdia"
              width={500}
              height={500}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center px-6 lg:px-10 py-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 lg:px-10 py-6 border-t border-midnight/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-midnight/40">
          <div>© {new Date().getFullYear()} Verdia</div>
          <div className="flex items-center gap-4">
            <Link href="/legal/terms"   className="hover:text-midnight/70">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-midnight/70">Confidentialité</Link>
            <Link href="/contact" className="hover:text-midnight/70">Support</Link>
          </div>
        </footer>
      </div>

      {/* ── Visual column ───────────────────────────────────────────── */}
      <aside className="hidden lg:block lg:w-[44%] xl:w-[48%] relative overflow-hidden">
        {/* Scrolling background — real Verdia renders */}
        <AuthVisualCarousel />
        {/* Forest green overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-midnight/80 via-midnight/60 to-midnight/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-transparent to-transparent" />

        {/* Sage green glow orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-sage-500/20 blur-[90px]" />
        <div className="absolute bottom-1/3 -left-16 w-64 h-64 rounded-full bg-sage-600/15 blur-[80px]" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
          <div className="max-w-md">
            <div className="eyebrow-light mb-3">
              Visualisation de jardin par IA
            </div>
            <h2 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1] text-offwhite">
              Votre jardin de rêve{' '}
              <span className="text-gradient-green">en 60 secondes.</span>
            </h2>
            <p className="text-offwhite/60 mt-3 text-[15px] leading-relaxed">
              Photographiez votre jardin actuel. Notre IA le transforme en rendu photoréaliste
              de votre futur aménagement — aucune compétence technique requise.
            </p>
          </div>

          {/* Testimonial card */}
          <div className="glass rounded-2xl border border-offwhite/[0.10] p-5 max-w-md">
            <Quote className="w-5 h-5 text-sage-400 mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-offwhite/85 leading-relaxed">
              {authTestimonial.quote}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <TestimonialAvatar name={authTestimonial.name} className="w-9 h-9 shrink-0 ring-1 ring-white/15" />
              <div>
                <div className="text-sm font-medium text-offwhite">{authTestimonial.name}</div>
                <div className="text-xs text-offwhite/50">{authTestimonial.role} · {authTestimonial.location}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
