import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWorkspaceSummary } from '@/lib/workspace-summary'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary = await getWorkspaceSummary(session.user.id, session.user.email, session.user.name)
  if (!summary) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  }

  return NextResponse.json(summary)
}
