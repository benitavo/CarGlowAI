// Consent-gated entry point for server-side Meta conversion tracking. This is the only
// place in the app that should call sendMetaCapiEvent — every call site (signup, purchase
// webhooks, ...) goes through here so the consent check can never be forgotten.
import { cookies } from 'next/headers'
import { CONSENT_COOKIE_NAME, parseConsentCookie } from '@/lib/consent'
import { sendMetaCapiEvent, type CapiUserData } from './capi'

export async function isMarketingConsentGranted(): Promise<boolean> {
  const store = await cookies()
  const stored = parseConsentCookie(store.get(CONSENT_COOKIE_NAME)?.value)
  return stored?.categories.marketing === true
}

// Fire-and-forget, never throws, never blocks the caller's response.
export async function trackMetaConversion(args: {
  eventName: string
  eventId?: string
  eventSourceUrl?: string
  user: CapiUserData
  customData?: Record<string, unknown>
}): Promise<void> {
  if (!(await isMarketingConsentGranted())) return
  sendMetaCapiEvent(args)
}
