import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { getPricingConfig, listAiFeatures, invalidatePricingCache } from '@/lib/pricing'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

function requireSuperuser(email: string | null | undefined) {
  return !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
}

export async function GET() {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [config, features] = await Promise.all([getPricingConfig(), listAiFeatures()])
  return NextResponse.json({ config, features })
}

// Editable, non-derived numeric/text fields only — id and updatedAt are managed by the DB.
const EDITABLE_FIELDS = [
  'freeCredits',
  'essentialPrice', 'essentialCredits',
  'proPrice', 'proCredits',
  'businessPrice', 'businessCredits',
  'pack1Price', 'pack1Credits',
  'pack2Price', 'pack2Credits',
  'pack3Price', 'pack3Credits',
] as const

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as Record<string, unknown>
  const data: Record<string, number> = {}

  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      const value = Number(body[field])
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 })
      }
      data[field] = value
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const config = await db.pricingConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global', ...data },
    update: data,
  })
  invalidatePricingCache()

  return NextResponse.json({ config })
}
