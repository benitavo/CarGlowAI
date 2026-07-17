import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { getStripe, priceIdForPlan, priceIdForPack, type SubscriptionPlan, type CreditPackId } from '@/lib/stripe'

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

  const stripe = getStripe()
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

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
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceIdForPlan(plan as SubscriptionPlan), quantity: 1 }],
      success_url: `${baseUrl}/app/billing?checkout=success`,
      cancel_url: `${baseUrl}/app/billing?checkout=cancelled`,
      metadata: { workspaceId, plan },
      subscription_data: { metadata: { workspaceId, plan } },
    })
    return NextResponse.json({ url: checkoutSession.url })
  }

  if (!pack || !CREDIT_PACKS.includes(pack as CreditPackId)) {
    return NextResponse.json({ error: `Unknown pack: ${pack}` }, { status: 400 })
  }
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{ price: priceIdForPack(pack as CreditPackId), quantity: 1 }],
    success_url: `${baseUrl}/app/billing?checkout=success`,
    cancel_url: `${baseUrl}/app/billing?checkout=cancelled`,
    metadata: { workspaceId, pack },
  })
  return NextResponse.json({ url: checkoutSession.url })
}
