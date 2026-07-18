'use client'

// Client-side Meta Pixel + Conversions API dispatch, deduplicated via a shared event ID —
// Meta's documented browser+server overlap pattern (send the same event from both the
// pixel and the CAPI, tagged with the same event_id, so Meta merges them into one).
// Never fires — pixel or server — unless marketing consent has been granted. Reads the
// consent cookie directly (same one src/lib/consent.ts / ConsentProvider manage) instead
// of going through React context, so this stays a plain function callable from anywhere
// (form submit handlers, effects), not just inside a component tree.
import { CONSENT_COOKIE_NAME, parseConsentCookie } from './consent'

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export interface TrackEventOptions {
  eventId?: string
  value?: number
  currency?: string
  email?: string
  eventSourceUrl?: string
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function marketingConsentGranted(): boolean {
  const stored = parseConsentCookie(readCookie(CONSENT_COOKIE_NAME))
  return stored?.categories.marketing === true
}

export function trackEvent(eventName: string, opts: TrackEventOptions = {}): void {
  if (!marketingConsentGranted()) return

  const eventId = opts.eventId ?? crypto.randomUUID()
  const eventSourceUrl = opts.eventSourceUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined)

  // Browser side. fbq may not be loaded yet (script still fetching, or consent was just
  // granted this tick and <MetaPixel> hasn't initialized) — silently skip in that case,
  // the server-side CAPI call below still carries the event through either way.
  if (typeof window !== 'undefined' && window.fbq) {
    const params: Record<string, unknown> = {}
    if (opts.value !== undefined) params.value = opts.value
    if (opts.currency) params.currency = opts.currency
    window.fbq('track', eventName, params, { eventID: eventId })
  }

  // Server side, same eventId — Meta dedupes the two into a single event.
  fetch('/api/meta-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      eventId,
      value: opts.value,
      currency: opts.currency,
      email: opts.email,
      eventSourceUrl,
    }),
    // These calls often fire right before a redirect (post-signup, post-checkout) —
    // keepalive lets the request survive the navigation instead of being cancelled.
    keepalive: true,
  }).catch(() => {
    // Tracking must never surface an error to the user.
  })
}
