// Meta Conversions API (CAPI) — raw sender. Server-only, no consent check here; callers
// must gate on consent themselves (see ./server.ts, the only place this should be called from).
import { createHash } from 'crypto'

const GRAPH_VERSION = 'v21.0'
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN

function hashForMatching(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface CapiUserData {
  email?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbp?: string // _fbp cookie, improves event match quality
  fbc?: string // _fbc cookie, links the event back to the ad click that drove it
}

export interface SendCapiEventArgs {
  eventName: string
  eventId?: string // dedup key if the same event is also sent client-side via the pixel
  eventSourceUrl?: string
  user: CapiUserData
  customData?: Record<string, unknown>
}

// Fire-and-forget: never throws, never awaited by callers, never blocks the request it's
// attached to. No-ops silently if Meta isn't configured (both env vars are optional).
export function sendMetaCapiEvent(args: SendCapiEventArgs): void {
  if (!PIXEL_ID || !ACCESS_TOKEN) return

  const userData: Record<string, unknown> = {}
  if (args.user.email) userData.em = [hashForMatching(args.user.email)]
  if (args.user.clientIpAddress) userData.client_ip_address = args.user.clientIpAddress
  if (args.user.clientUserAgent) userData.client_user_agent = args.user.clientUserAgent
  if (args.user.fbp) userData.fbp = args.user.fbp
  if (args.user.fbc) userData.fbc = args.user.fbc

  const payload = {
    data: [{
      event_name: args.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: args.eventId,
      event_source_url: args.eventSourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: args.customData,
    }],
  }

  fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => {
    console.error('[meta-capi] failed to send event:', err)
  })
}
