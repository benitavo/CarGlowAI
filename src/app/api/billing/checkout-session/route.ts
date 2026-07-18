import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe } from '@/lib/stripe'

// Read-only lookup used by the billing page to get the real amount paid for a completed
// Checkout session, so it can fire the Meta Purchase event with an accurate value —
// purely for tracking display, not a source of truth for credit granting (the Stripe
// webhook remains the only thing that ever grants credits).
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      paid: checkoutSession.payment_status === 'paid',
      value: (checkoutSession.amount_total ?? 0) / 100,
      currency: (checkoutSession.currency ?? 'eur').toUpperCase(),
      email: checkoutSession.customer_details?.email ?? session.user.email ?? null,
    })
  } catch (err) {
    console.error('[billing/checkout-session] error:', err)
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 })
  }
}
