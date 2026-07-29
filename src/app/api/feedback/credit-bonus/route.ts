import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { grantCredits } from '@/lib/credits'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

const MIN_MESSAGE_LENGTH = 15

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { workspaceId, message, rating } = await req.json() as {
    workspaceId?: string
    message?: string
    rating?: number
  }
  const trimmed = message?.trim() ?? ''

  if (!workspaceId || trimmed.length < MIN_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: 'message_too_short', message: `Merci d'écrire au moins ${MIN_MESSAGE_LENGTH} caractères.` },
      { status: 400 },
    )
  }
  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'invalid_rating', message: 'Note invalide.' }, { status: 400 })
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: { select: { plan: true } } },
  })
  if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Atomic claim — only the first submission for a workspace grants the credit, guards
  // against a double-submit or two tabs racing each other for the same one-time bonus.
  const claimed = await db.workspace.updateMany({
    where: { id: workspaceId, feedbackCreditGrantedAt: null },
    data: { feedbackCreditGrantedAt: new Date() },
  })
  if (claimed.count === 0) {
    return NextResponse.json(
      { error: 'already_granted', message: 'Vous avez déjà reçu votre crédit gratuit pour un avis.' },
      { status: 409 },
    )
  }

  await db.creditFeedback.create({
    data: { workspaceId, userId: session.user.id, message: trimmed, rating: rating ?? null },
  })

  const remaining = await grantCredits(workspaceId, 1, 'FEEDBACK_BONUS', {
    notes: 'Crédit gratuit pour avis honnête',
  })

  trackServerEvent(ANALYTICS_EVENTS.CREDIT_FEEDBACK_SUBMITTED, {
    userId: session.user.id,
    email: session.user.email ?? null,
    plan: member.workspace.plan,
    remainingCredits: remaining.total,
    workspaceId,
    rating: rating ?? null,
  })

  return NextResponse.json({ ok: true, remaining })
}
