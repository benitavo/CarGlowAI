import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = await req.json()

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  })

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!member.workspace.stripeCustomerId) {
    return NextResponse.json({ error: 'This workspace has no billing history yet' }, { status: 400 })
  }

  const stripe = getStripe()
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: member.workspace.stripeCustomerId,
    return_url: `${baseUrl}/app/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
