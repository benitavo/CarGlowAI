import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  // Five supported locales
  locales: ['fr', 'en', 'de', 'es', 'pt'],
  defaultLocale: 'fr',
  // 'as-needed' keeps FR at root (`/pricing`) and prefixes others (`/en/pricing`)
  localePrefix: 'as-needed',
  // Site content (Nav, Hero, About, Pricing, etc.) is hardcoded French, not yet
  // driven by translation keys — only Footer uses next-intl's t(). Until the rest
  // of the site is translated, browser-language auto-redirect (e.g. an English
  // browser silently landing on /en) produces a broken mixed-language page.
  // Always serve French at "/" regardless of browser language.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]

// Locale-aware Link, useRouter, etc. — drop-in replacements for next/link & next/navigation
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
