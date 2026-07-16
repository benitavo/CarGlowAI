'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Leaf } from 'lucide-react'
import { Link } from '@/i18n/routing'
import RouteLink from 'next/link'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="bg-midnight border-t border-offwhite/[0.06]">
      {/* CTA band */}
      <div className="border-b border-offwhite/[0.06]">
        <div className="page-container py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-lg font-display font-semibold text-offwhite">
              {t('ctaTitle')}
            </p>
            <p className="text-sm text-offwhite/50 mt-1">
              {t('ctaBody')}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/#rendez-vous"
              className="px-5 py-2.5 rounded-xl border border-offwhite/[0.12] text-sm font-medium text-offwhite/70 hover:text-offwhite hover:bg-offwhite/[0.05] transition-all">
              {t('ctaSecondary')}
            </Link>
            <RouteLink href="/signup"
              className="px-5 py-2.5 rounded-xl bg-glow-500 hover:bg-glow-400 text-sm font-semibold text-midnight shadow-glow-sm hover:shadow-glow-md transition-all">
              {t('ctaButton')} →
            </RouteLink>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container py-12">
        <div className="flex flex-col md:flex-row gap-12 md:gap-8 justify-between">
          {/* Brand */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-7 h-7 rounded-lg bg-sage-500 flex items-center justify-center shrink-0">
                <Leaf className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
              <span className="font-display font-bold text-offwhite text-lg">
                Ver<span className="text-sage-400">dia</span>
              </span>
            </Link>
            <p className="text-xs text-offwhite/40 leading-relaxed max-w-[200px]">
              {t('tagline')}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-offwhite/30 mb-4">Produit</h4>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/#comment-ca-marche" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Comment ça marche</Link></li>
                <li><Link href="/#tarifs" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-offwhite/30 mb-4">Entreprise</h4>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/about" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-offwhite/30 mb-4">Légal</h4>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/legal/terms" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Conditions</Link></li>
                <li><Link href="/legal/privacy" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-offwhite/[0.06]">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-offwhite/30">
            © {new Date().getFullYear()} Verdia. {t('copyright')}
          </p>
          <p className="text-xs text-offwhite/20">
            🇫🇷 {t('builtInEurope')}
          </p>
        </div>
      </div>
    </footer>
  )
}
