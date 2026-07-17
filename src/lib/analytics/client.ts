'use client'

// Client-side analytics (marketing pages, editor UI). Browser-only — never import this
// from a server component or API route (use '@/lib/analytics/server' there instead).
//
// posthog-js is loaded via a dynamic import gated behind the production check, not a
// static top-level import, so its ~70kB bundle is never fetched at all outside
// production (dev/preview) and doesn't inflate the shared JS bundle for everyone.
import type { PostHog } from 'posthog-js'
import { ANALYTICS_EVENTS, type AnalyticsEventName, type ClientTrackPayload } from './events'

export const analyticsEnabled =
  process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY

let posthogPromise: Promise<PostHog> | null = null

function loadPosthog(): Promise<PostHog> | null {
  if (!analyticsEnabled) return null
  if (!posthogPromise) {
    posthogPromise = import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: false, // manual pageview tracking, see PostHogPageview component
          capture_pageleave: true,
          autocapture: true,
          session_recording: {
            maskAllInputs: true, // never record raw keystrokes (passwords, card fields, etc.)
          },
        })
      }
      return posthog
    })
  }
  return posthogPromise
}

// Called once from instrumentation-client.ts to kick off the (production-only, dynamically
// imported) load as early as possible — every other function in this file awaits the same
// cached promise, so init only ever runs once regardless of load order.
export function ensurePosthogLoaded(): void {
  loadPosthog()
}

export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  properties: ClientTrackPayload<E>,
): void {
  loadPosthog()?.then(ph => ph.capture(event, properties))
}

export function capturePageview(url: string): void {
  loadPosthog()?.then(ph => ph.capture('$pageview', { $current_url: url }))
}

export function captureClientException(error: unknown): void {
  loadPosthog()?.then(ph => ph.captureException(error))
}

// Call once per session after login/signup (and whenever plan/credits change) so the
// PostHog person profile and feature-flag targeting stay in sync with the real user.
export function identifyUser(
  userId: string,
  props: { email?: string | null; plan?: string; workspaceId?: string },
): void {
  loadPosthog()?.then(ph => ph.identify(userId, props))
}

export function resetAnalyticsIdentity(): void {
  loadPosthog()?.then(ph => ph.reset())
}

export { ANALYTICS_EVENTS }
