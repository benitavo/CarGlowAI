import { NextRequest, NextResponse } from 'next/server'

// DEV MODE — Stripe webhooks are not active.
// This endpoint accepts any POST and returns 200 so Next.js doesn't error.
// Wire up STRIPE_WEBHOOK_SECRET + real handlers when Stripe is configured.

export async function POST(req: NextRequest) {
  console.log('[webhooks/stripe] dev mock — event received, skipping processing')
  return NextResponse.json({ received: true })
}
