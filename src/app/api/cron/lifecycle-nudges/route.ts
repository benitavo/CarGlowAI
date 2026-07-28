import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendActivationNudgeEmail, sendFinalActivationNudgeEmail, sendCreditsExhaustedFollowupEmail } from '@/lib/email'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// Scheduled daily via vercel.json (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
//
// Bundles three time-boxed, one-shot lifecycle nudges into a single cron rather than three
// separate ones — each is gated by its own "sent at most once" flag, so this never re-notifies
// on a later run. Deliberately conservative on volume: a workspace that never activates gets
// at most 2 nudges total (day 1, day 3-4) and then nothing further from this cron.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = Date.now()

  async function getOwner(workspaceId: string) {
    const member = await db.workspaceMember.findFirst({
      where: { workspaceId, role: 'OWNER' },
      select: { user: { select: { email: true, name: true } } },
    })
    return member?.user.email ? member.user : null
  }

  // ── 1. Day-1 nudge: created 20-28h ago, zero renders ever ──────────────────
  const day1Due = await db.workspace.findMany({
    where: {
      createdAt: { gte: new Date(now - 28 * HOUR_MS), lt: new Date(now - 20 * HOUR_MS) },
      neverActivatedNudgeSentAt: null,
      photos: { none: {} },
    },
    select: { id: true },
  })
  let day1Sent = 0
  for (const ws of day1Due) {
    const claimed = await db.workspace.updateMany({
      where: { id: ws.id, neverActivatedNudgeSentAt: null },
      data: { neverActivatedNudgeSentAt: new Date() },
    })
    if (claimed.count === 0) continue
    const owner = await getOwner(ws.id)
    if (owner?.email) {
      await sendActivationNudgeEmail(owner.email, { name: owner.name ?? undefined })
      day1Sent++
    }
  }

  // ── 2. Day 3-4 final nudge: zero renders ever, one last time ────────────────
  const finalDue = await db.workspace.findMany({
    where: {
      createdAt: { gte: new Date(now - 4 * DAY_MS), lt: new Date(now - 3 * DAY_MS) },
      neverActivatedFinalNudgeSentAt: null,
      photos: { none: {} },
    },
    select: { id: true },
  })
  let finalSent = 0
  for (const ws of finalDue) {
    const claimed = await db.workspace.updateMany({
      where: { id: ws.id, neverActivatedFinalNudgeSentAt: null },
      data: { neverActivatedFinalNudgeSentAt: new Date() },
    })
    if (claimed.count === 0) continue
    const owner = await getOwner(ws.id)
    if (owner?.email) {
      await sendFinalActivationNudgeEmail(owner.email, { name: owner.name ?? undefined })
      finalSent++
    }
  }

  // ── 3. Credits-exhausted follow-up: 2-3 days after the first notice, still at 0 ──
  const followupDue = await db.workspace.findMany({
    where: {
      creditsExhaustedEmailSentAt: { gte: new Date(now - 3 * DAY_MS), lt: new Date(now - 2 * DAY_MS) },
      creditsExhaustedFollowupSentAt: null,
      monthlyCredits: 0,
      bonusCredits: 0,
    },
    select: { id: true },
  })
  let followupSent = 0
  for (const ws of followupDue) {
    const claimed = await db.workspace.updateMany({
      where: { id: ws.id, creditsExhaustedFollowupSentAt: null },
      data: { creditsExhaustedFollowupSentAt: new Date() },
    })
    if (claimed.count === 0) continue
    const owner = await getOwner(ws.id)
    if (owner?.email) {
      await sendCreditsExhaustedFollowupEmail(owner.email, { name: owner.name ?? undefined })
      followupSent++
    }
  }

  return NextResponse.json({ day1Sent, finalSent, followupSent })
}
