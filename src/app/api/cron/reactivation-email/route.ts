import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAvailableCredits } from '@/lib/credits'
import { sendReactivationEmail } from '@/lib/email'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

const DAY_MS = 24 * 60 * 60 * 1000

// Scheduled daily via vercel.json (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
//
// Targets workspaces whose most recent render falls between 14 and 15 days ago — a fixed
// window checked daily catches each workspace exactly once as it crosses the threshold,
// rather than re-sending every day it stays quiet. Applies to every plan (FREE or paid):
// a paying subscriber who's gone quiet is the more valuable case to catch, not less.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - 15 * DAY_MS)
  const windowEnd = new Date(now.getTime() - 14 * DAY_MS)

  const grouped = await db.photo.groupBy({
    by: ['workspaceId'],
    _max: { createdAt: true },
  })
  const due = grouped.filter(g => {
    const last = g._max.createdAt
    return last && last >= windowStart && last < windowEnd
  })

  let sentCount = 0
  for (const g of due) {
    const owner = await db.workspaceMember.findFirst({
      where: { workspaceId: g.workspaceId, role: 'OWNER' },
      select: { userId: true, user: { select: { email: true, name: true } } },
    })
    if (!owner?.user.email) continue

    const workspace = await db.workspace.findUnique({ where: { id: g.workspaceId }, select: { plan: true } })

    await sendReactivationEmail(owner.user.email, { name: owner.user.name ?? undefined })
    sentCount++

    const remainingCredits = (await getAvailableCredits(g.workspaceId)).total
    const daysSinceLastRender = Math.round((now.getTime() - g._max.createdAt!.getTime()) / DAY_MS)
    trackServerEvent(ANALYTICS_EVENTS.REACTIVATION_EMAIL_SENT, {
      userId: owner.userId,
      email: owner.user.email,
      plan: workspace?.plan ?? 'FREE',
      remainingCredits,
      workspaceId: g.workspaceId,
      daysSinceLastRender,
    })
  }

  return NextResponse.json({ sent: sentCount })
}
