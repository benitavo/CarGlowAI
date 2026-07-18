// Consent model & cookie (de)serialization. Pure/isomorphic — no `window`/`document`
// access here, so this file is safe to import from both client components (the consent
// provider) and server code (API routes gating the Meta Conversions API).
//
// Only "necessary" and "marketing" are real categories today. "analytics" is modeled
// now so a future category can be added without a breaking shape change, but nothing
// reads or sets it yet — don't wire a UI toggle for it until it actually gates something.

export type ConsentCategory = 'necessary' | 'marketing' | 'analytics'

export interface ConsentCategories {
  necessary: true
  marketing: boolean
  analytics: boolean
}

export interface StoredConsent {
  version: string
  decidedAt: string // ISO timestamp — kept as proof of consent (CNIL requirement)
  categories: ConsentCategories
}

// Bump this if the cookie policy meaningfully changes — a version mismatch is treated
// exactly like "no consent on file" and the banner re-asks.
export const CONSENT_VERSION = 'v1'
export const CONSENT_COOKIE_NAME = 'verdia_consent'

// CNIL mandates re-asking at least every 6 months.
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 * 6

export const DEFAULT_CATEGORIES: ConsentCategories = {
  necessary: true,
  marketing: false,
  analytics: false,
}

export function serializeConsent(categories: Pick<ConsentCategories, 'marketing' | 'analytics'>): string {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    categories: { necessary: true, ...categories },
  }
  return JSON.stringify(stored)
}

export function parseConsentCookie(raw: string | undefined | null): StoredConsent | null {
  if (!raw) return null
  let parsed: StoredConsent
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (parsed?.version !== CONSENT_VERSION) return null
  if (!parsed.decidedAt || !parsed.categories) return null
  const decidedAtMs = new Date(parsed.decidedAt).getTime()
  if (Number.isNaN(decidedAtMs)) return null
  const ageSeconds = (Date.now() - decidedAtMs) / 1000
  if (ageSeconds > CONSENT_MAX_AGE_SECONDS) return null
  return parsed
}
