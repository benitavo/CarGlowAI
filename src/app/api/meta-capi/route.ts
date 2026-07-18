import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { CONSENT_COOKIE_NAME, parseConsentCookie } from '@/lib/consent'

// Bump periodically — Meta deprecates Graph API versions roughly two years after release.
// Overridable via env so a version bump never needs a code change.
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0'

function hashForMatching(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface MetaCapiBody {
  eventName: string
  eventId: string
  value?: number
  currency?: string
  email?: string
  eventSourceUrl?: string
}

// Consent-gated Meta Conversions API sender, called from the client's trackEvent()
// helper (src/lib/meta.ts) with the same event_id as the browser-side pixel call, so
// Meta merges the two into a single deduplicated event.
export async function POST(req: NextRequest) {
  // Whatever happens below, this must never break the caller's flow (signup, checkout
  // redirect, ...) — a broken/misconfigured CAPI just means this one event isn't sent.
  try {
    const consent = parseConsentCookie(req.cookies.get(CONSENT_COOKIE_NAME)?.value)
    if (consent?.categories.marketing !== true) {
      return NextResponse.json({ ok: true, skipped: 'no-consent' })
    }

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN
    if (!pixelId || !accessToken) {
      return NextResponse.json({ ok: true, skipped: 'not-configured' })
    }

    const body = await req.json() as MetaCapiBody
    if (!body?.eventName || !body?.eventId) {
      return NextResponse.json({ ok: false, error: 'eventName and eventId are required' }, { status: 400 })
    }

    const userData: Record<string, unknown> = {}
    if (body.email) userData.em = [hashForMatching(body.email)]
    const fbp = req.cookies.get('_fbp')?.value
    const fbc = req.cookies.get('_fbc')?.value
    if (fbp) userData.fbp = fbp
    if (fbc) userData.fbc = fbc
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (clientIp) userData.client_ip_address = clientIp
    const userAgent = req.headers.get('user-agent')
    if (userAgent) userData.client_user_agent = userAgent

    const payload = {
      data: [{
        event_name: body.eventName,
        event_id: body.eventId,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: body.eventSourceUrl,
        user_data: userData,
        ...(body.value !== undefined
          ? { custom_data: { value: body.value, currency: body.currency ?? 'EUR' } }
          : {}),
      }],
    }

    const graphRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!graphRes.ok) {
      console.error('[meta-capi] Graph API error:', graphRes.status, await graphRes.text().catch(() => ''))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[meta-capi] failed to send event:', err)
    return NextResponse.json({ ok: true })
  }
}
