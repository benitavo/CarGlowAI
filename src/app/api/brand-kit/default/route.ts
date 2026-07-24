import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWorkspaceSummary } from '@/lib/workspace-summary'
import { getDefaultBrandKit } from '@/lib/brand-kit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const summary = await getWorkspaceSummary(session.user.id, session.user.email, session.user.name)
  if (!summary) {
    return NextResponse.json({ error: 'Espace de travail introuvable' }, { status: 404 })
  }

  const brandKit = await getDefaultBrandKit(summary.workspaceId)
  return NextResponse.json(brandKit)
}
