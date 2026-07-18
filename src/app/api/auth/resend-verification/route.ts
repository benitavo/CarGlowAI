import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, emailVerified: true, name: true },
  })

  if (!user) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ ok: true }) // déjà vérifié

  const token   = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await db.verificationToken.deleteMany({ where: { identifier: `verify:${user.email}` } })
  await db.verificationToken.create({
    data: { identifier: `verify:${user.email}`, token, expires },
  })

  const verifyLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`
  await sendVerificationEmail(user.email, verifyLink)

  return NextResponse.json({ ok: true })
}
