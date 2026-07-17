import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { token, email, password } = await req.json().catch(() => ({}))

  if (!token || !email || !password) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
  }

  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: `reset:${email}`, token } },
  })

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 })

  const hash = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id: user.id }, data: { password: hash } })
  await db.verificationToken.delete({ where: { identifier_token: { identifier: `reset:${email}`, token } } })

  return NextResponse.json({ ok: true })
}
