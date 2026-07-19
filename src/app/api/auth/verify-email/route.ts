import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const email = req.nextUrl.searchParams.get('email')

  if (!token || !email) return NextResponse.redirect(new URL('/check-email?error=invalid', req.url))

  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: `verify:${email}`, token } },
  }).catch(() => null)

  if (!record || record.expires < new Date()) {
    return NextResponse.redirect(new URL('/check-email?error=expired', req.url))
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } })
  if (!user) return NextResponse.redirect(new URL('/check-email?error=invalid', req.url))

  await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
  await db.verificationToken.delete({
    where: { identifier_token: { identifier: `verify:${email}`, token } },
  }).catch(() => {})

  // Email de bienvenue maintenant que l'adresse est confirmée
  sendWelcomeEmail(email, user.name ?? email.split('@')[0])

  return NextResponse.redirect(new URL('/app', req.url))
}
