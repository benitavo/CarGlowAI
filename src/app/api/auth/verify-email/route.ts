import { type NextRequest, redirect } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const email = req.nextUrl.searchParams.get('email')

  if (!token || !email) redirect('/check-email?error=invalid')

  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: `verify:${email}`, token } },
  }).catch(() => null)

  if (!record || record.expires < new Date()) redirect('/check-email?error=expired')

  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } })
  if (!user) redirect('/check-email?error=invalid')

  await db.user.update({ where: { id: user!.id }, data: { emailVerified: new Date() } })
  await db.verificationToken.delete({
    where: { identifier_token: { identifier: `verify:${email}`, token } },
  }).catch(() => {})

  // Email de bienvenue maintenant que l'adresse est confirmée
  sendWelcomeEmail(email, user!.name ?? email.split('@')[0])

  redirect('/app')
}
