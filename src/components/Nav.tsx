'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

export function Nav() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-midnight/90 backdrop-blur-xl border-b border-white/[0.06] py-3'
          : 'bg-transparent py-5'
      )}
    >
      <nav className="page-container flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-glow-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
            <Zap className="w-4 h-4 text-midnight" fill="currentColor" />
          </div>
          <span className="font-display font-700 text-[1.15rem] tracking-tight text-offwhite">
            Car<span className="text-glow-500">Glow</span>
            <span className="text-offwhite-400 font-400 text-sm ml-1">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1">
          <li>
            <Link href="/features" className="px-3 py-2 text-sm font-medium text-offwhite/70 hover:text-offwhite rounded-lg hover:bg-white/[0.04] transition-all">
              Features
            </Link>
          </li>
          <li>
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-offwhite/70 hover:text-offwhite rounded-lg hover:bg-white/[0.04] transition-all">
              {t('pricing')}
            </Link>
          </li>
          <li>
            <Link href="/about" className="px-3 py-2 text-sm font-medium text-offwhite/70 hover:text-offwhite rounded-lg hover:bg-white/[0.04] transition-all">
              {t('about')}
            </Link>
          </li>
        </ul>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/signin"
            className="px-4 py-2 text-sm font-medium text-offwhite/70 hover:text-offwhite rounded-xl border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.04] transition-all"
          >
            {t('signIn')}
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-semibold text-midnight bg-glow-500 hover:bg-glow-400 rounded-xl shadow-glow-sm hover:shadow-glow-md transition-all"
          >
            {t('startFree')}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-lg text-offwhite/70 hover:text-offwhite hover:bg-white/[0.04]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-midnight-800/98 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="page-container py-6 flex flex-col gap-2">
            <Link href="/features" onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-offwhite/70 hover:text-offwhite hover:bg-white/[0.04]">
              Features
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-offwhite/70 hover:text-offwhite hover:bg-white/[0.04]">
              {t('pricing')}
            </Link>
            <Link href="/about" onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-offwhite/70 hover:text-offwhite hover:bg-white/[0.04]">
              {t('about')}
            </Link>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-3">
              <Link href="/signin" onClick={() => setMobileOpen(false)}
                className="text-center py-3 rounded-xl border border-white/[0.1] text-sm font-medium text-offwhite/70">
                {t('signIn')}
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="text-center py-3 rounded-xl bg-glow-500 text-sm font-semibold text-midnight">
                {t('startFree')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
