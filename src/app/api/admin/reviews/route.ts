import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

function requireSuperuser(email: string | null | undefined) {
  return !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
}

export async function GET() {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reviews = await db.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
  })

  return NextResponse.json({
    reviews: reviews.map(r => ({
      id: r.id,
      quote: r.quote,
      stars: r.stars,
      displayName: r.displayName,
      role: r.role,
      location: r.location,
      approved: r.approved,
      createdAt: r.createdAt,
      email: r.user.email,
    })),
  })
}
