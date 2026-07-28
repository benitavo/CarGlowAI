import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
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
  const data: Record<string, number | string | boolean | Date | null> = {}

  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      const value = Number(body[field])
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 })
      }
      data[field] = value
    }
  }

  // Promo fields — separate from EDITABLE_FIELDS above since they're not all plain positive
  // numbers (a toggle, free text, a nullable date). Same upsert, just different coercion per
  // field. Any field can be explicitly cleared by sending null (e.g. turning promoEnabled off
  // without necessarily wiping the rest, so re-enabling later doesn't require re-typing everything).
  if ('promoEnabled' in body) data.promoEnabled = !!body.promoEnabled
  if ('promoLabel' in body) data.promoLabel = body.promoLabel === null ? null : String(body.promoLabel)
  if ('promoPlan' in body) {
    const plan = body.promoPlan
    if (plan !== null && !['ESSENTIAL', 'PRO', 'BUSINESS'].includes(String(plan))) {
      return NextResponse.json({ error: 'promoPlan must be ESSENTIAL, PRO, BUSINESS, or null' }, { status: 400 })
    }
    data.promoPlan = plan === null ? null : String(plan)
  }
  if ('promoCode' in body) data.promoCode = body.promoCode === null ? null : String(body.promoCode).trim().toUpperCase()
  if ('promoDiscountedPrice' in body) {
    if (body.promoDiscountedPrice === null) {
      data.promoDiscountedPrice = null
    } else {
      const value = Number(body.promoDiscountedPrice)
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: 'Invalid value for promoDiscountedPrice' }, { status: 400 })
      }
      data.promoDiscountedPrice = value
    }
  }
  if ('promoEndDate' in body) {
    if (body.promoEndDate === null) {
      data.promoEndDate = null
    } else {
      const date = new Date(body.promoEndDate as string)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid value for promoEndDate' }, { status: 400 })
      }
      data.promoEndDate = date
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
