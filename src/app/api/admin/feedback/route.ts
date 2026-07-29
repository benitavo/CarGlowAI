import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

function requireSuperuser(email: string | null | undefined) {
  return !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
}

export async function GET() {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const feedback = await db.creditFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, name: true } },
      workspace: { select: { name: true, plan: true } },
    },
  })

  return NextResponse.json({
    feedback: feedback.map(f => ({
      id: f.id,
      message: f.message,
      rating: f.rating,
      createdAt: f.createdAt,
      email: f.user.email,
      name: f.user.name,
      workspaceName: f.workspace.name,
      plan: f.workspace.plan,
    })),
  })
}
