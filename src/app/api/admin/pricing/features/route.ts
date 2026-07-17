import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

function requireSuperuser(email: string | null | undefined) {
  return !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
}

// Lets a superuser define a brand-new AI feature (Sky replacement, 360 panorama, Night
// rendering, ...) purely as a { key, label, creditCost, enabled } row — no backend code
// change is ever needed to make a new feature chargeable.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!requireSuperuser(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { key, label, creditCost, enabled } = await req.json() as {
    key?: string
    label?: string
    creditCost?: number
    enabled?: boolean
  }

  if (!key?.trim() || !label?.trim() || !Number.isFinite(creditCost) || (creditCost as number) < 0) {
    return NextResponse.json({ error: 'key, label and a non-negative creditCost are required' }, { status: 400 })
  }

  const feature = await db.aiFeature.create({
    data: { key: key.trim(), label: label.trim(), creditCost: creditCost as number, enabled: enabled ?? true },
  })

  return NextResponse.json({ feature })
}
