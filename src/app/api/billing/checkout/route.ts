import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// DEV MODE — Stripe is not configured. Returns a mock redirect URL.
// Wire up real Stripe price IDs in .env to activate live payments.

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, workspaceId } = await req.json()

  if (!plan || !workspaceId) {
    return NextResponse.json({ error: 'plan and workspaceId are required' }, { status: 400 })
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  })

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  console.log(`[billing/checkout] dev mock — plan: ${plan}, workspace: ${workspaceId}`)

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return NextResponse.json({ url: `${baseUrl}/app/billing?mock=checkout&plan=${plan}` })
}
