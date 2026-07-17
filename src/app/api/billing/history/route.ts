import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const transactions = await db.creditTransaction.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      delta: true,
      balanceAfter: true,
      reason: true,
      featureKey: true,
      bucket: true,
      notes: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ transactions })
}
