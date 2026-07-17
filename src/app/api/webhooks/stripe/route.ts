import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { getStripe, type SubscriptionPlan, type CreditPackId } from '@/lib/stripe'
import { getPricingConfig, creditPacks } from '@/lib/pricing'
import { grantCredits, resetMonthlyCredits } from '@/lib/credits'

// Stripe requires the raw, unparsed request body to verify the webhook signature.
export const runtime = 'nodejs'

const PLAN_PRICE_ENV: Record<SubscriptionPlan, string> = {
  ESSENTIAL: 'STRIPE_PRICE_ESSENTIAL',
  PRO: 'STRIPE_PRICE_PRO',
  BUSINESS: 'STRIPE_PRICE_BUSINESS',
}

function planFromSubscription(subscription: Stripe.Subscription): SubscriptionPlan | null {
  const metaPlan = subscription.metadata?.plan as SubscriptionPlan | undefined
  if (metaPlan && metaPlan in PLAN_PRICE_ENV) return metaPlan

  const priceId = subscription.items.data[0]?.price.id
  for (const plan of Object.keys(PLAN_PRICE_ENV) as SubscriptionPlan[]) {
    if (process.env[PLAN_PRICE_ENV[plan]] === priceId) return plan
  }
  return null
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId
  if (!workspaceId) {
    console.warn('[webhooks/stripe] subscription has no workspaceId metadata, skipping', subscription.id)
    return
  }

  const plan = planFromSubscription(subscription)
  if (!plan) {
    console.warn('[webhooks/stripe] could not resolve plan for subscription', subscription.id)
    return
  }

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } })
  const planChanged = workspace?.plan !== plan
  const renewalDate = new Date(subscription.current_period_end * 1000)

  await db.workspace.update({
    where: { id: workspaceId },
    data: {
      plan,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      renewalDate,
    },
  })

  // New subscription or a plan change: give the workspace a fresh allotment for the new tier.
  // Pure status changes (e.g. past_due -> active with no plan change) don't touch credits.
  if (planChanged) {
    await resetMonthlyCredits(workspaceId, { renewalDate })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId
  if (!workspaceId) return

  await db.workspace.update({
    where: { id: workspaceId },
    data: { plan: 'FREE', subscriptionStatus: 'canceled', stripeSubscriptionId: null },
  })
  await resetMonthlyCredits(workspaceId)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Only true recurring renewals reset credits — the first invoice on a brand-new
  // subscription (billing_reason "subscription_create") is already handled by
  // handleSubscriptionUpsert, so resetting again here would double-grant.
  if (invoice.billing_reason !== 'subscription_cycle') return

  const subscriptionId = (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription
  if (!subscriptionId) return

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(
    typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id,
  )
  const workspaceId = subscription.metadata?.workspaceId
  if (!workspaceId) return

  const renewalDate = new Date(subscription.current_period_end * 1000)
  await db.workspace.update({ where: { id: workspaceId }, data: { renewalDate, subscriptionStatus: subscription.status } })
  await resetMonthlyCredits(workspaceId, { renewalDate })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'payment') return // subscriptions are handled by the subscription events

  const workspaceId = session.metadata?.workspaceId
  const pack = session.metadata?.pack as CreditPackId | undefined
  if (!workspaceId || !pack) {
    console.warn('[webhooks/stripe] payment checkout missing workspaceId/pack metadata', session.id)
    return
  }

  const config = await getPricingConfig()
  const packDef = creditPacks(config).find(p => p.id === pack)
  if (!packDef) {
    console.warn('[webhooks/stripe] unknown pack in checkout metadata', pack)
    return
  }

  await grantCredits(workspaceId, packDef.credits, 'PACK_PURCHASE', {
    stripeInvoiceId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
    notes: `Credit pack purchase: ${pack} (${packDef.credits} credits)`,
  })
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[webhooks/stripe] signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      default:
        // Unhandled event types are expected — Stripe sends many we don't act on.
        break
    }
  } catch (err) {
    console.error(`[webhooks/stripe] handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
