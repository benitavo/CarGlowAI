import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const styles = await db.style.findMany({
    where:   { workspaceId: null },
    orderBy: { popularity: 'desc' },
    take:    8,
    select:  { id: true, name: true, slug: true, category: true, thumbnailUrl: true },
  })

  return NextResponse.json(styles)
}
