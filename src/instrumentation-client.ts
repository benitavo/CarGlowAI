// Next.js auto-loads this file in the browser before the app hydrates (App Router
// convention, no import needed anywhere) — PostHog's recommended entrypoint for the
// Next.js SDK. See https://posthog.com/docs/libraries/next-js
//
// The actual posthog-js import + init lives in '@/lib/analytics/client' behind a dynamic
// import gated on NODE_ENV === 'production', so the SDK's bundle is never fetched at all
// outside production. This file just triggers that load as early as possible; every
// other analytics call in the app awaits the same cached promise, so init runs once.
import { ensurePosthogLoaded } from '@/lib/analytics/client'

ensurePosthogLoaded()
