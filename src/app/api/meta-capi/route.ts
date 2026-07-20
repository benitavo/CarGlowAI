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
      console.log('[meta-capi] skipped: no-consent', { marketingGranted: consent?.categories.marketing ?? null })
      return NextResponse.json({ ok: true, skipped: 'no-consent' })
    }

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN
    if (!pixelId || !accessToken) {
      console.log('[meta-capi] skipped: not-configured', {
        pixelIdPresent: !!pixelId,
        accessTokenPresent: !!accessToken,
      })
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
      const rawText = await graphRes.text().catch(() => '')
      let graphJson: unknown = rawText
      try { graphJson = JSON.parse(rawText) } catch { /* not JSON — keep raw text */ }

      console.error('[meta-capi] Graph API error:', {
        pixelId,
        graphVersion: GRAPH_VERSION,
        accessTokenPresent: !!accessToken,
        accessTokenPrefix: accessToken ? `${accessToken.slice(0, 8)}***` : null,
        status: graphRes.status,
        response: graphJson,
      })

      // Dev-only: surface the real Graph API failure in the response body so it's
      // visible in the browser's Network tab, not just Vercel's server logs.
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ ok: false, graph_status: graphRes.status, graph_response: graphJson })
      }
    } else {
      console.log('[meta-capi] success', {
        pixelId,
        graphVersion: GRAPH_VERSION,
        accessTokenPrefix: `${accessToken.slice(0, 8)}***`,
        eventName: body.eventName,
        eventId: body.eventId,
        status: graphRes.status,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[meta-capi] failed to send event:', err)
    return NextResponse.json({ ok: true })
  }
}
