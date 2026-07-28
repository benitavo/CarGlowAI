// Credit ledger service. Every AI endpoint must go through deductCredits() BEFORE calling
// Gemini/Veo, and refundCredits() if the AI call then fails. Credits are workspace-scoped
// (this codebase's billing/plan state lives on Workspace, not User — teams share one pool).
//
// Consumption order: monthly (expiring) credits are spent first, bonus (purchased, never
// expiring) credits second. Deduction is a single atomic UPDATE guarded by a WHERE clause
// that Postgres re-checks against the live row, so concurrent requests can never push a
// workspace's balance negative — either the whole deduction succeeds or nothing is touched.
import { db } from './db'
import { getAiFeature, getPricingConfig, monthlyCreditsForPlan } from './pricing'
import { sendCreditsExhaustedEmail } from './email'
import type { CreditReason } from '@/generated/prisma/client'

export type FeatureKey = 'imageGeneration' | 'imageRetouch' | 'videoGeneration' | (string & {})

export class InsufficientCreditsError extends Error {
  constructor(public available: number, public required: number) {
    super(`Insufficient credits: need ${required}, have ${available}`)
  }
}

export class FeatureDisabledError extends Error {
  constructor(public featureKey: string) {
    super(`Feature "${featureKey}" is currently disabled`)
  }
}

export interface CreditBalance {
  monthly: number
  bonus: number
  total: number
}

// Fire-and-forget: notifies the workspace owner the first time a deduction fails for a
// workspace that has real usage behind it (at least one ENHANCED photo) — a brand-new
// workspace that never had credits to begin with isn't "exhausted", it's just empty.
// Guarded by an atomic updateMany so concurrent requests can't both "win" and double-send,
// and by only firing once per cycle (cleared again in grantCredits/resetMonthlyCredits below).
async function notifyCreditsExhausted(workspaceId: string): Promise<void> {
  try {
    const hasUsage = await db.photo.findFirst({ where: { workspaceId, status: 'ENHANCED' }, select: { id: true } })
    if (!hasUsage) return

    const claimed = await db.workspace.updateMany({
      where: { id: workspaceId, creditsExhaustedEmailSentAt: null },
      data: { creditsExhaustedEmailSentAt: new Date() },
    })
    if (claimed.count === 0) return

    const owner = await db.workspaceMember.findFirst({
      where: { workspaceId, role: 'OWNER' },
      select: { user: { select: { email: true, name: true } } },
    })
    if (owner?.user.email) {
      await sendCreditsExhaustedEmail(owner.user.email, { name: owner.user.name ?? undefined })
    }
  } catch (err) {
    console.error('[credits] notifyCreditsExhausted failed:', err)
  }
}

export async function getCreditCost(featureKey: FeatureKey): Promise<number> {
  const feature = await getAiFeature(featureKey)
  if (!feature) throw new Error(`Unknown AI feature: "${featureKey}". Add it via the admin pricing page first.`)
  if (!feature.enabled) throw new FeatureDisabledError(featureKey)
  return feature.creditCost
}

export async function getAvailableCredits(workspaceId: string): Promise<CreditBalance> {
  const ws = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { monthlyCredits: true, bonusCredits: true },
  })
  return { monthly: ws.monthlyCredits, bonus: ws.bonusCredits, total: ws.monthlyCredits + ws.bonusCredits }
}

export interface DeductResult {
  transactionIds: string[]
  monthlySpent: number
  bonusSpent: number
  remaining: CreditBalance
}

interface DeductRow {
  old_monthly: number
  old_bonus: number
  new_monthly: number | null
  new_bonus: number | null
}

// Throws InsufficientCreditsError (never calls the AI provider) if the workspace can't cover
// the cost. Callers should wrap this in try/catch and return the buy-credits/upgrade prompt
// on that specific error rather than a generic 500.
export async function deductCredits(
  workspaceId: string,
  featureKey: FeatureKey,
  opts: { photoId?: string; notes?: string } = {}
): Promise<DeductResult> {
  const cost = await getCreditCost(featureKey)

  const rows = await db.$queryRaw<DeductRow[]>`
    WITH before AS (
      SELECT "monthlyCredits", "bonusCredits" FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE
    ),
    updated AS (
      UPDATE "Workspace"
      SET
        "monthlyCredits" = "monthlyCredits" - LEAST("monthlyCredits", ${cost}),
        "bonusCredits" = "bonusCredits" - GREATEST(${cost} - "monthlyCredits", 0)
      WHERE id = ${workspaceId} AND ("monthlyCredits" + "bonusCredits") >= ${cost}
      RETURNING "monthlyCredits" AS new_monthly, "bonusCredits" AS new_bonus
    )
    SELECT before."monthlyCredits" AS old_monthly, before."bonusCredits" AS old_bonus,
           updated.new_monthly, updated.new_bonus
    FROM before LEFT JOIN updated ON true
  `

  if (rows.length === 0) throw new Error(`Workspace not found: ${workspaceId}`)

  const row = rows[0]
  if (row.new_monthly === null || row.new_bonus === null) {
    notifyCreditsExhausted(workspaceId).catch(() => {})
    throw new InsufficientCreditsError(row.old_monthly + row.old_bonus, cost)
  }

  const monthlySpent = Math.min(row.old_monthly, cost)
  const bonusSpent = cost - monthlySpent
  const remaining: CreditBalance = {
    monthly: row.new_monthly,
    bonus: row.new_bonus,
    total: row.new_monthly + row.new_bonus,
  }

  const transactionIds: string[] = []
  if (monthlySpent > 0) {
    const tx = await db.creditTransaction.create({
      data: {
        workspaceId,
        delta: -monthlySpent,
        balanceAfter: remaining.total,
        reason: 'ENHANCEMENT',
        featureKey,
        bucket: 'monthly',
        photoId: opts.photoId,
        notes: opts.notes,
      },
    })
    transactionIds.push(tx.id)
  }
  if (bonusSpent > 0) {
    const tx = await db.creditTransaction.create({
      data: {
        workspaceId,
        delta: -bonusSpent,
        balanceAfter: remaining.total,
        reason: 'ENHANCEMENT',
        featureKey,
        bucket: 'bonus',
        photoId: opts.photoId,
        notes: opts.notes,
      },
    })
    transactionIds.push(tx.id)
  }

  return { transactionIds, monthlySpent, bonusSpent, remaining }
}

// Reverses a deductCredits() call, crediting back the exact amounts to the exact buckets
// they were taken from. Call this when the AI provider call that followed deductCredits fails.
export async function refundCredits(
  workspaceId: string,
  deduction: Pick<DeductResult, 'monthlySpent' | 'bonusSpent'>,
  opts: { featureKey?: FeatureKey; photoId?: string; notes?: string } = {}
): Promise<CreditBalance> {
  const { monthlySpent, bonusSpent } = deduction
  if (monthlySpent === 0 && bonusSpent === 0) return getAvailableCredits(workspaceId)

  const rows = await db.$queryRaw<Array<{ monthlyCredits: number; bonusCredits: number }>>`
    UPDATE "Workspace"
    SET
      "monthlyCredits" = "monthlyCredits" + ${monthlySpent},
      "bonusCredits" = "bonusCredits" + ${bonusSpent}
    WHERE id = ${workspaceId}
    RETURNING "monthlyCredits", "bonusCredits"
  `
  if (rows.length === 0) throw new Error(`Workspace not found: ${workspaceId}`)

  const remaining: CreditBalance = {
    monthly: rows[0].monthlyCredits,
    bonus: rows[0].bonusCredits,
    total: rows[0].monthlyCredits + rows[0].bonusCredits,
  }
  const notes = opts.notes ?? 'Automatic refund: AI generation failed'

  if (monthlySpent > 0) {
    await db.creditTransaction.create({
      data: {
        workspaceId,
        delta: monthlySpent,
        balanceAfter: remaining.total,
        reason: 'REFUND',
        featureKey: opts.featureKey,
        bucket: 'monthly',
        photoId: opts.photoId,
        notes,
      },
    })
  }
  if (bonusSpent > 0) {
    await db.creditTransaction.create({
      data: {
        workspaceId,
        delta: bonusSpent,
        balanceAfter: remaining.total,
        reason: 'REFUND',
        featureKey: opts.featureKey,
        bucket: 'bonus',
        photoId: opts.photoId,
        notes,
      },
    })
  }

  return remaining
}

// Adds non-expiring credits to a workspace's bonus pool: credit-pack purchases, manual
// admin adjustments, promo grants, etc. Monthly (plan) credits are never granted this way —
// they're set wholesale by resetMonthlyCredits() on each billing cycle.
export async function grantCredits(
  workspaceId: string,
  amount: number,
  reason: CreditReason = 'ADJUSTMENT',
  opts: { stripeInvoiceId?: string; notes?: string } = {}
): Promise<CreditBalance> {
  if (amount <= 0) throw new Error('grantCredits: amount must be positive')

  const rows = await db.$queryRaw<Array<{ monthlyCredits: number; bonusCredits: number }>>`
    UPDATE "Workspace"
    SET "bonusCredits" = "bonusCredits" + ${amount}
    WHERE id = ${workspaceId}
    RETURNING "monthlyCredits", "bonusCredits"
  `
  if (rows.length === 0) throw new Error(`Workspace not found: ${workspaceId}`)

  const remaining: CreditBalance = {
    monthly: rows[0].monthlyCredits,
    bonus: rows[0].bonusCredits,
    total: rows[0].monthlyCredits + rows[0].bonusCredits,
  }

  await db.creditTransaction.create({
    data: {
      workspaceId,
      delta: amount,
      balanceAfter: remaining.total,
      reason,
      bucket: 'bonus',
      stripeInvoiceId: opts.stripeInvoiceId,
      notes: opts.notes,
    },
  })

  // Fresh credits mean a fresh chance to hit the wall again — clear both flags so the
  // exhausted-credits emails can fire again in a future cycle instead of staying silent forever.
  await db.workspace.updateMany({
    where: { id: workspaceId },
    data: { creditsExhaustedEmailSentAt: null, creditsExhaustedFollowupSentAt: null },
  })

  return remaining
}

// Resets monthlyCredits to a fresh allotment for the workspace's current plan. Unused monthly
// credits do NOT roll over — this overwrites rather than adds. bonusCredits (purchased packs)
// are untouched. Call this from the Stripe webhook on subscription renewal.
export async function resetMonthlyCredits(
  workspaceId: string,
  opts: { renewalDate?: Date } = {}
): Promise<CreditBalance> {
  const ws = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true },
  })
  const config = await getPricingConfig()
  const freshMonthly = monthlyCreditsForPlan(config, ws.plan)

  const updated = await db.workspace.update({
    where: { id: workspaceId },
    data: {
      monthlyCredits: freshMonthly,
      lastCreditReset: new Date(),
      // A fresh cycle is a fresh chance to hit the wall again.
      creditsExhaustedEmailSentAt: null,
      creditsExhaustedFollowupSentAt: null,
      ...(opts.renewalDate ? { renewalDate: opts.renewalDate } : {}),
    },
    select: { monthlyCredits: true, bonusCredits: true },
  })

  await db.creditTransaction.create({
    data: {
      workspaceId,
      delta: freshMonthly,
      balanceAfter: updated.monthlyCredits + updated.bonusCredits,
      reason: 'MONTHLY_RESET',
      bucket: 'monthly',
      notes: `Monthly credits reset to ${freshMonthly} for plan ${ws.plan}`,
    },
  })

  return {
    monthly: updated.monthlyCredits,
    bonus: updated.bonusCredits,
    total: updated.monthlyCredits + updated.bonusCredits,
  }
}
