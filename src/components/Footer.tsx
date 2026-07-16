'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
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
            <Link href="/contact"
              className="px-5 py-2.5 rounded-xl border border-offwhite/[0.12] text-sm font-medium text-offwhite/70 hover:text-offwhite hover:bg-offwhite/[0.05] transition-all">
              {t('ctaSecondary')}
            </Link>
            <RouteLink href="/signup"
              className="px-5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-sm font-semibold text-white shadow-sage-sm hover:shadow-sage-md transition-all">
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
            <Link href="/" className="inline-flex mb-4">
              <Image
                src="/logo%20verdia%20without%20background.png"
                alt="Verdia"
                width={140}
                height={42}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
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
