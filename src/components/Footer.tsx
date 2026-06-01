'use client'

import { useTranslations } from 'next-intl'
import { Zap } from 'lucide-react'
import { Link } from '@/i18n/routing'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="bg-midnight border-t border-white/[0.06]">
      {/* CTA band */}
      <div className="border-b border-white/[0.06]">
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
            <Link href="/book-a-demo"
              className="px-5 py-2.5 rounded-xl border border-white/[0.12] text-sm font-medium text-offwhite/80 hover:text-offwhite hover:bg-white/[0.04] transition-all">
              {t('ctaSecondary')}
            </Link>
            <Link href="/signup"
              className="px-5 py-2.5 rounded-xl bg-glow-500 hover:bg-glow-400 text-sm font-semibold text-midnight shadow-glow-sm hover:shadow-glow-md transition-all">
              {t('ctaButton')} →
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container py-12">
        <div className="flex flex-col md:flex-row gap-12 md:gap-8 justify-between">
          {/* Brand */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-glow-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-midnight" fill="currentColor" />
              </div>
              <span className="font-display font-bold text-offwhite">
                Car<span className="text-glow-500">Glow</span>
                <span className="text-offwhite/40 font-normal text-sm ml-1">AI</span>
              </span>
            </Link>
            <p className="text-xs text-offwhite/40 leading-relaxed max-w-[200px]">
              {t('tagline')}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-offwhite/30 mb-4">Product</h4>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/features" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Pricing</Link></li>
                <li><a href="https://status.carglowai.com" target="_blank" rel="noopener noreferrer" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-offwhite/30 mb-4">Company</h4>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/about" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">About</Link></li>
                <li><Link href="/contact" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-offwhite/30 mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/legal/terms" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Terms</Link></li>
                <li><Link href="/legal/privacy" className="text-sm text-offwhite/50 hover:text-offwhite/90 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-offwhite/30">
            © {new Date().getFullYear()} CarGlow AI, Inc. {t('copyright')}
          </p>
          <p className="text-xs text-offwhite/20">
            🇪🇺 {t('builtInEurope')}
          </p>
        </div>
      </div>
    </footer>
  )
}
