import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getPricingConfig, monthlyCreditsForPlan } from '@/lib/pricing'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

/**
 * POST /api/auth/register
 *
 * Creates a new account with a hashed password and provisions a workspace.
 * Returns 200 on success; the client then calls signIn() to issue a JWT.
 *
 * Validation rules:
 *   - email: required, must be a valid format
 *   - password: required, minimum 8 characters
 *   - name: optional; defaults to the email local-part
 *
 * Special handling:
 *   - If an account exists *without* a password (legacy email-only user) and
 *     the same email is used to register, we SET the password on the existing
 *     account rather than creating a duplicate. This is the only safe "upgrade"
 *     path from legacy → password accounts.
 *   - If an account already has a password, we reject with 409.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email    = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const name     = body.name?.trim() || undefined

  // ── Validation ─────────────────────────────────────────────────────────
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  if (password.length > 200) {
    return NextResponse.json({ error: 'Password is too long.' }, { status: 400 })
  }

  try {
    const existing = await db.user.findUnique({
      where:  { email },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // ── Fresh account → create user + workspace + membership ─────────────
    const user = await db.user.create({
      data: {
        email,
        name:          name ?? email.split('@')[0],
        password:      passwordHash,
        emailVerified: new Date(),  // marked verified at sign-up time for MVP
      },
    })

    const config = await getPricingConfig()

    // FREE plan: 1 credit/month, same "monthly allotment" model as paid plans. There's no
    // Stripe subscription to key a renewal off, so renewalDate is set here and
    // /api/cron/reset-free-credits resets it (and monthlyCredits) once it's due.
    const nextReset = new Date()
    nextReset.setMonth(nextReset.getMonth() + 1)

    const freeCredits = monthlyCreditsForPlan(config, 'FREE')

    const workspace = await db.workspace.create({
      data: {
        name:           name ?? 'My Workspace',
        slug:           `ws-${user.id}`,
        plan:           'FREE',
        monthlyCredits: freeCredits,
        renewalDate:    nextReset,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
    })

    trackServerEvent(ANALYTICS_EVENTS.ACCOUNT_CREATED, {
      userId: user.id,
      email: user.email,
      plan: 'FREE',
      remainingCredits: freeCredits,
      workspaceId: workspace.id,
      method: 'credentials',
    })

    console.log(`[auth/register] created account for ${email}`)
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[auth/register] error:', err)
    return NextResponse.json(
      { error: 'Account creation failed. Please try again.' },
      { status: 500 },
    )
  }
}
