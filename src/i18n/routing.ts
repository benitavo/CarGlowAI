import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  // Five supported locales
  locales: ['en', 'fr', 'de', 'es', 'pt'],
  defaultLocale: 'en',
  // 'as-needed' keeps EN at root (`/pricing`) and prefixes others (`/fr/pricing`)
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]

// Locale-aware Link, useRouter, etc. — drop-in replacements for next/link & next/navigation
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
