import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ ok: true }) // ne pas révéler si l'email existe

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } })

  if (user) {
    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    // Réutilise la table VerificationToken de NextAuth
    await db.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } })
    await db.verificationToken.create({
      data: { identifier: `reset:${email}`, token, expires },
    })

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    await sendPasswordResetEmail(email, resetLink)
  }

  // Toujours OK : ne pas révéler si l'adresse email est connue
  return NextResponse.json({ ok: true })
}
