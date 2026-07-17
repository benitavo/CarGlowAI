// Server-side analytics (API routes, Stripe webhooks, NextAuth callbacks). Node-only —
// never import this from a client component. Disabled outside production so dev/preview
// traffic never pollutes real analytics.
import { PostHog } from 'posthog-node'
import type { AnalyticsEventName, ServerTrackPayload } from './events'

const isProd = process.env.NODE_ENV === 'production'
const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

let client: PostHog | null = null

function getClient(): PostHog | null {
  if (!isProd || !apiKey) return null
  if (!client) {
    client = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Serverless functions can freeze right after the response is sent, so the default
      // batching (flush every 20 events / 10s) risks losing events. Sending immediately
      // trades a little network efficiency for reliability — capture() itself still
      // returns immediately, the request just fires in the background.
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

// Fire-and-forget: never throws, never awaited by callers, never blocks the request.
export function trackServerEvent<E extends AnalyticsEventName>(
  event: E,
  properties: ServerTrackPayload<E>,
): void {
  const ph = getClient()
  if (!ph) return

  const { userId, email, plan, remainingCredits, workspaceId, ...rest } = properties as ServerTrackPayload<E> &
    Record<string, unknown>

  try {
    ph.capture({
      distinctId: userId,
      event,
      properties: { userId, email, plan, remainingCredits, workspaceId, ...rest, $set: { email, plan } },
    })
  } catch {
    // Analytics must never break the request it's attached to.
  }
}

export function captureServerException(error: unknown, userId?: string): void {
  const ph = getClient()
  if (!ph) return
  try {
    ph.captureException(error, userId)
  } catch {
    // no-op
  }
}

// Call from long-running scripts (crons, one-off scripts) before the process exits so
// queued events flush. Not needed in request handlers — flushAt: 1 already sends
// immediately on every capture().
export async function shutdownServerAnalytics(): Promise<void> {
  if (client) await client._shutdown()
}
