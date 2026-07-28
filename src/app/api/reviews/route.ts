import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId, quote, stars, displayName, role, location } = await req.json() as {
    workspaceId?: string
    quote?: string
    stars?: number
    displayName?: string
    role?: string
    location?: string
  }

  if (!workspaceId || !quote?.trim() || !displayName?.trim()) {
    return NextResponse.json({ error: 'workspaceId, quote et displayName sont requis' }, { status: 400 })
  }
  if (quote.trim().length > 600) {
    return NextResponse.json({ error: 'Le témoignage est trop long (600 caractères max).' }, { status: 400 })
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  })
  if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const starsInt = Math.min(5, Math.max(1, Math.round(stars ?? 5)))

  const review = await db.review.create({
    data: {
      workspaceId,
      userId: session.user.id,
      quote: quote.trim(),
      stars: starsInt,
      displayName: displayName.trim(),
      role: role?.trim() || null,
      location: location?.trim() || null,
      // approved defaults to false — an admin reviews it before it can show publicly.
    },
  })

  return NextResponse.json({ id: review.id })
}
