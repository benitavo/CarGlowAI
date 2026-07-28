import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getStripe, priceIdForPlan, priceIdForPack, type SubscriptionPlan, type CreditPackId } from '@/lib/stripe'
import { getPricingConfig, activePromo } from '@/lib/pricing'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['ESSENTIAL', 'PRO', 'BUSINESS']
const CREDIT_PACKS: CreditPackId[] = ['pack1', 'pack2', 'pack3']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, pack, workspaceId } = await req.json() as {
    plan?: string
    pack?: string
    workspaceId?: string
  }

  if (!workspaceId || (!plan && !pack)) {
    return NextResponse.json({ error: 'workspaceId and either plan or pack are required' }, { status: 400 })
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  })

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const analyticsIdentity = {
    userId: session.user.id,
    email: session.user.email ?? null,
    plan: member.workspace.plan,
    remainingCredits: member.workspace.monthlyCredits + member.workspace.bonusCredits,
    workspaceId,
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  // Everything below can throw on a real misconfiguration (e.g. STRIPE_SECRET_KEY missing —
  // getStripe() throws synchronously) or a live Stripe API error. Previously uncaught, which
  // crashed this route with a non-JSON response — the client's res.json() would then throw its
  // own confusing parse error instead of anything a user could act on. Same class of bug as the
  // photo-upload one fixed earlier this session, just on the payment path instead.
  try {
    const stripe = getStripe()

    // Reuse an existing Stripe customer for this workspace, or create one on first checkout.
    let customerId = member.workspace.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: member.workspace.name,
        metadata: { workspaceId },
      })
      customerId = customer.id
      await db.workspace.update({ where: { id: workspaceId }, data: { stripeCustomerId: customerId } })
    }

    if (plan) {
      if (!SUBSCRIPTION_PLANS.includes(plan as SubscriptionPlan)) {
        return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 })
      }

      // Auto-apply the active promo's Stripe Promotion Code when checking out for the plan it
      // targets — looked up by its human code (not a hardcoded Stripe ID) so admin edits to the
      // code in PricingConfig take effect immediately, no redeploy. Falls back to letting the
      // customer type any valid code by hand (allow_promotion_codes) if the promo isn't live for
      // this plan, or if the code string doesn't resolve to a real, active Stripe object — Stripe
      // rejects a session that requests both `discounts` and `allow_promotion_codes` together.
      const promo = activePromo(await getPricingConfig())
      let discounts: { promotion_code: string }[] | undefined
      if (promo && promo.plan === plan) {
        const found = await stripe.promotionCodes.list({ code: promo.code, active: true, limit: 1 })
        if (found.data[0]) discounts = [{ promotion_code: found.data[0].id }]
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceIdForPlan(plan as SubscriptionPlan), quantity: 1 }],
        ...(discounts ? { discounts } : { allow_promotion_codes: true }),
        success_url: `${baseUrl}/app/billing?checkout=success`,
        cancel_url: `${baseUrl}/app/billing?checkout=cancelled`,
        metadata: { workspaceId, plan, userId: session.user.id, email: session.user.email ?? '' },
        subscription_data: { metadata: { workspaceId, plan, userId: session.user.id, email: session.user.email ?? '' } },
      })
      trackServerEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, { ...analyticsIdentity, kind: 'subscription', target: plan })
      return NextResponse.json({ url: checkoutSession.url })
    }

    if (!pack || !CREDIT_PACKS.includes(pack as CreditPackId)) {
      return NextResponse.json({ error: `Unknown pack: ${pack}` }, { status: 400 })
    }
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: priceIdForPack(pack as CreditPackId), quantity: 1 }],
      // session_id lets the billing page look up the actual amount paid (via
      // /api/billing/checkout-session) to fire the Meta Purchase event with a real value —
      // purely additive, doesn't change how the purchase itself is processed.
      success_url: `${baseUrl}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/app/billing?checkout=cancelled`,
      metadata: { workspaceId, pack, userId: session.user.id, email: session.user.email ?? '' },
    })
    trackServerEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, { ...analyticsIdentity, kind: 'pack', target: pack })
    return NextResponse.json({ url: checkoutSession.url })

  } catch (err) {
    console.error('[billing/checkout]', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Le paiement est temporairement indisponible. Réessayez dans un instant.' },
      { status: 500 },
    )
  }
}
