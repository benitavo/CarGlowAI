import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

function requireSuperuser(email: string | null | undefined) {
  return !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { key } = await params
  const body = await req.json() as { label?: string; creditCost?: number; enabled?: boolean }
  const data: { label?: string; creditCost?: number; enabled?: boolean } = {}

  if (body.label !== undefined) data.label = body.label.trim()
  if (body.creditCost !== undefined) {
    if (!Number.isFinite(body.creditCost) || body.creditCost < 0) {
      return NextResponse.json({ error: 'creditCost must be a non-negative number' }, { status: 400 })
    }
    data.creditCost = body.creditCost
  }
  if (body.enabled !== undefined) data.enabled = body.enabled

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const feature = await db.aiFeature.update({ where: { key }, data })
  return NextResponse.json({ feature })
}
