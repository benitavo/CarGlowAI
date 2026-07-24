import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

function requireSuperuser(email: string | null | undefined) {
  return !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
}

// Everything before this was Benoit and friends testing the signup flow itself, not real
// prospects — excluded so this view reflects actual usage instead of noise.
const REAL_SIGNUPS_SINCE = new Date('2026-07-20T00:00:00Z')

export async function GET() {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await db.user.findMany({
    where: { createdAt: { gte: REAL_SIGNUPS_SINCE } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      emailVerified: true,
      accounts: { select: { provider: true } },
      workspaceMembers: {
        orderBy: { joinedAt: 'asc' },
        take: 1,
        select: {
          workspace: {
            select: {
              id: true,
              plan: true,
              monthlyCredits: true,
              bonusCredits: true,
              _count: { select: { photos: true } },
            },
          },
        },
      },
    },
  })

  const rows = users.map(u => {
    const workspace = u.workspaceMembers[0]?.workspace ?? null
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      emailVerified: !!u.emailVerified,
      provider: u.accounts[0]?.provider ?? 'credentials',
      plan: workspace?.plan ?? null,
      creditsRemaining: workspace ? workspace.monthlyCredits + workspace.bonusCredits : null,
      photosCreated: workspace?._count.photos ?? 0,
    }
  })

  const summary = {
    totalUsers: rows.length,
    activated: rows.filter(r => r.photosCreated > 0).length,
    totalPhotos: rows.reduce((sum, r) => sum + r.photosCreated, 0),
  }

  return NextResponse.json({ users: rows, summary })
}
