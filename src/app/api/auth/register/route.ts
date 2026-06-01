import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

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
    const existing = await db.user.findUnique({ where: { email } })

    // ── Existing account with a password → reject ────────────────────────
    if (existing?.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // ── Legacy account (no password) → set password on existing record ───
    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          password: passwordHash,
          name:     name ?? existing.name,
          updatedAt: new Date(),
        },
      })
      return NextResponse.json({ ok: true, upgraded: true })
    }

    // ── Fresh account → create user + workspace + membership ─────────────
    const user = await db.user.create({
      data: {
        email,
        name:          name ?? email.split('@')[0],
        password:      passwordHash,
        emailVerified: new Date(),  // marked verified at sign-up time for MVP
      },
    })

    await db.workspace.create({
      data: {
        name:             name ?? 'My Workspace',
        slug:             `ws-${user.id}`,
        creditsRemaining: 3,   // 3 free enhancements before upgrade
        creditsPerMonth:  3,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
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
