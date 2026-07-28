'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Promo {
  label: string
  plan: string
  originalPrice: number
  discountedPrice: number
  code: string
  endDate: string
}

const DISMISS_KEY = 'verdia-promo-dismissed'

// Single source of truth for whether a promo is live is activePromo() in src/lib/pricing.ts —
// this just renders whatever /api/pricing already decided. Dismissing hides it for the
// session only (not forever): someone dismissing it on day 1 of the promo shouldn't lose it
// if they come back on day 20, still well within the window.
export function PromoBanner({ ctaHref }: { ctaHref: string }) {
  const [promo, setPromo] = useState<Promo | null>(null)
  const [dismissed, setDismissed] = useState(true) // starts hidden until we know both promo + dismissal state
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
    fetch('/api/pricing')
      .then(r => r.json())
      .then(d => setPromo(d.promo ?? null))
      .catch(() => {})
  }, [])

  if (!promo || dismissed) return null

  // timeZone: 'UTC' is intentional — this is a calendar date ("valid through Aug 31"), not a
  // real moment in time. Without it, toLocaleDateString uses the viewer's local timezone, so a
  // date stored as UTC midnight can display as the day before or after depending where the
  // visitor is (a real bug caught while testing this).
  const endDateLabel = promo.endDate
    ? new Date(promo.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
    : null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="relative bg-midnight text-offwhite">
      <div className="page-container flex items-center justify-center gap-2 sm:gap-3 py-2.5 pr-8 text-[13px] sm:text-sm flex-wrap text-center">
        <Sparkles className="w-4 h-4 text-sage-300 shrink-0" strokeWidth={2} />
        <span className="font-semibold">{promo.label}</span>
        <span className="text-offwhite/50 hidden sm:inline">·</span>
        <span>
          <span className="line-through text-offwhite/40 mr-1">{promo.originalPrice}€</span>
          <span className="font-bold text-sage-300">{promo.discountedPrice}€/mois</span> la 1ère année
        </span>
        <span className="text-offwhite/50 hidden sm:inline">·</span>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 font-mono text-xs transition-colors"
          aria-label="Copier le code promo"
        >
          {copied ? <Check className="w-3 h-3 text-sage-300" /> : <Copy className="w-3 h-3 text-offwhite/60" />}
          {promo.code}
        </button>
        {endDateLabel && <span className="text-offwhite/40 text-xs hidden md:inline">jusqu&apos;au {endDateLabel}</span>}
        {/* Plain <a>, not next/link — this component renders inside both the marketing site
            (locale-prefixed routes, e.g. /fr/pricing) and the app shell (/app/* explicitly
            bypasses locale routing in middleware.ts), so no single Link helper is correct for
            both contexts. A full navigation for one promo CTA is a fine trade-off. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href={ctaHref}
          className="ml-1 inline-flex items-center px-3 py-1 rounded-lg bg-sage-500 hover:bg-sage-400 text-midnight font-semibold text-xs transition-colors"
        >
          En profiter
        </a>
      </div>
      <button
        onClick={dismiss}
        aria-label="Masquer"
        className={cn(
          'absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-offwhite/40 hover:text-offwhite hover:bg-white/10 transition-colors',
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
