'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import RouteLink from 'next/link'

export function Nav() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated' && !!session?.user
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef  = useRef<HTMLElement>(null)
  const mobileOpenRef = useRef(mobileOpen)
  mobileOpenRef.current = mobileOpen

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Publishes the header's real rendered height as a CSS variable so any page can reserve
  // exactly that much space with `padding-top: var(--nav-height)` — no more guessing a
  // pixel value per breakpoint that drifts out of sync the next time the header's own
  // size changes (responsive logo, scroll-state padding, font load, browser zoom, ...).
  // Skipped while the mobile dropdown is open: it's a sibling that grows the header's own
  // box, not part of the "always-visible bar" height content below it should clear.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const publish = () => {
      if (mobileOpenRef.current) return
      document.documentElement.style.setProperty('--nav-height', `${el.getBoundingClientRect().height}px`)
    }

    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    window.addEventListener('resize', publish)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', publish)
    }
  }, [])

  // Mobile menu toggling changes the header's own height (dropdown is a sibling inside
  // it) — re-publish right when it closes back to the "bar only" height.
  useEffect(() => {
    if (mobileOpen || !headerRef.current) return
    document.documentElement.style.setProperty('--nav-height', `${headerRef.current.getBoundingClientRect().height}px`)
  }, [mobileOpen])

  return (
    <header ref={headerRef} className={cn(
      // Fully opaque — no backdrop-blur, no partial transparency. A fixed header re-blurring
      // or showing through content scrolling underneath it is both a real perf cost on
      // mobile Safari and a correctness risk (content must never show through the header).
      'fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-white border-b border-midnight/[0.07]',
      scrolled ? 'shadow-sm py-2' : 'py-3'
    )}>
      <nav className="page-container flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo%20verdia%20without%20background.png"
            alt="Verdia"
            width={500}
            height={500}
            className="h-10 sm:h-16 lg:h-24 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Comment ça marche', href: '/#comment-ca-marche' },
            { label: 'Tarifs',            href: '/#tarifs' },
            { label: 'Guide',             href: '/guide' },
            { label: 'Blog',              href: '/blog' },
            { label: 'À propos',          href: '/about' },
          ].map(item => (
            <li key={item.href}>
              <Link href={item.href}
                className="px-3 py-2 text-sm font-medium text-midnight/60 hover:text-midnight rounded-lg hover:bg-midnight/[0.04] transition-all">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <RouteLink href="/app"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sage-500 hover:bg-sage-600 rounded-xl shadow-sage-sm transition-all">
              <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
              Mon espace
            </RouteLink>
          ) : (
            <>
              <RouteLink href="/signin"
                className="px-4 py-2 text-sm font-medium text-midnight/60 hover:text-midnight rounded-xl border border-midnight/[0.12] hover:border-midnight/[0.25] hover:bg-midnight/[0.04] transition-all">
                Connexion
              </RouteLink>
              <RouteLink href="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-sage-500 hover:bg-sage-600 rounded-xl shadow-sage-sm transition-all">
                Essai gratuit
              </RouteLink>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-3 -mr-3 rounded-lg text-midnight/60 hover:text-midnight hover:bg-midnight/[0.04]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-midnight/[0.07]">
          <div className="page-container py-6 flex flex-col gap-2">
            {[
              { label: 'Comment ça marche', href: '/#comment-ca-marche' },
              { label: 'Tarifs',            href: '/#tarifs' },
              { label: 'Guide',             href: '/guide' },
              { label: 'Blog',              href: '/blog' },
              { label: 'À propos',          href: '/about' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-midnight/60 hover:text-midnight hover:bg-midnight/[0.04]">
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-midnight/[0.07] flex flex-col gap-3">
              {isAuthenticated ? (
                <RouteLink href="/app" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sage-500 text-sm font-semibold text-white">
                  <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
                  Mon espace
                </RouteLink>
              ) : (
                <>
                  <RouteLink href="/signin" onClick={() => setMobileOpen(false)}
                    className="text-center py-3 rounded-xl border border-midnight/[0.12] text-sm font-medium text-midnight/70">
                    Connexion
                  </RouteLink>
                  <RouteLink href="/signup" onClick={() => setMobileOpen(false)}
                    className="text-center py-3 rounded-xl bg-sage-500 text-sm font-semibold text-white">
                    Essai gratuit
                  </RouteLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
