import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const photo = await db.photo.findUnique({
    where: { id },
    select: { id: true, downloadedAt: true, workspace: { select: { members: { where: { userId: session.user.id }, select: { userId: true } } } } },
  })

  if (!photo || photo.workspace.members.length === 0) {
    return NextResponse.json({ error: 'Rendu introuvable' }, { status: 404 })
  }

  if (!photo.downloadedAt) {
    await db.photo.update({ where: { id }, data: { downloadedAt: new Date() } })
  }

  return NextResponse.json({ ok: true })
}
