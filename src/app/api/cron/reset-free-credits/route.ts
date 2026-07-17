import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resetMonthlyCredits } from '@/lib/credits'

// Scheduled daily via vercel.json (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
//
// FREE workspaces have no Stripe subscription, so nothing else resets their monthly credits —
// paid plans get that from the Stripe renewal webhook (see /api/webhooks/stripe), this route
// is the FREE-plan equivalent. A workspace is due once its renewalDate has passed (or was never
// set, for workspaces created before this cron existed).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const due = await db.workspace.findMany({
    where: {
      plan: 'FREE',
      OR: [{ renewalDate: null }, { renewalDate: { lte: new Date() } }],
    },
    select: { id: true },
  })

  let resetCount = 0
  for (const ws of due) {
    const nextReset = new Date()
    nextReset.setMonth(nextReset.getMonth() + 1)
    await resetMonthlyCredits(ws.id, { renewalDate: nextReset })
    resetCount++
  }

  return NextResponse.json({ reset: resetCount })
}
