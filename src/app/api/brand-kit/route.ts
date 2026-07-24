import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWorkspaceSummary } from '@/lib/workspace-summary'
import { saveBrandKit } from '@/lib/brand-kit'
import { uploadBuffer } from '@/lib/blob-storage'

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const summary = await getWorkspaceSummary(session.user.id, session.user.email, session.user.name)
  if (!summary) {
    return NextResponse.json({ error: 'Espace de travail introuvable' }, { status: 404 })
  }

  const formData = await req.formData()
  const businessName = formData.get('businessName')
  const primaryColor = formData.get('primaryColor')
  const logo = formData.get('logo') as File | null

  let logoUrl: string | undefined
  if (logo && logo.size > 0) {
    if (!ALLOWED_LOGO_TYPES.includes(logo.type)) {
      return NextResponse.json({ error: 'Format de logo non supporté (PNG, JPG, WEBP ou SVG).' }, { status: 400 })
    }
    if (logo.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: 'Logo trop volumineux (5 Mo max).' }, { status: 400 })
    }
    const buffer = Buffer.from(await logo.arrayBuffer())
    logoUrl = await uploadBuffer(buffer, logo.type, `brand-logo-${summary.workspaceId}-${Date.now()}`)
  }

  const brandKit = await saveBrandKit(summary.workspaceId, {
    ...(typeof businessName === 'string' && businessName.trim() ? { businessName: businessName.trim() } : {}),
    ...(typeof primaryColor === 'string' && primaryColor.trim() ? { primaryColor: primaryColor.trim() } : {}),
    ...(logoUrl ? { logoUrl } : {}),
  })

  return NextResponse.json(brandKit)
}
