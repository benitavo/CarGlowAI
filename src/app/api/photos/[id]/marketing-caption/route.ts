import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getDefaultBrandKit } from '@/lib/brand-kit'
import { generateText } from '@/lib/gemini'
import { GARDEN_STYLES, buildSocialCaptionPrompt } from '@/lib/gardenPrompts'

export const maxDuration = 30

// Free — a short text completion is cheap relative to the video render, which already costs
// a credit; gating this too would just add friction to something meant to lower it.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { ctaText } = body as { ctaText?: string }

  const photo = await db.photo.findUnique({
    where: { id },
    select: {
      workspaceId: true,
      styleUsed: true,
      workspace: { select: { members: { where: { userId: session.user.id }, select: { userId: true } } } },
    },
  })

  if (!photo || photo.workspace.members.length === 0) {
    return NextResponse.json({ error: 'Rendu introuvable' }, { status: 404 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })

  try {
    const brandKit = await getDefaultBrandKit(photo.workspaceId)
    const styleName = (photo.styleUsed && GARDEN_STYLES[photo.styleUsed]?.name) || photo.styleUsed || 'jardin'
    const prompt = buildSocialCaptionPrompt(styleName, brandKit.businessName ?? undefined, ctaText)
    const caption = await generateText(apiKey, prompt)
    return NextResponse.json({ caption })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[marketing-caption]', msg)
    return NextResponse.json({ error: 'Génération du texte échouée, veuillez réessayer.' }, { status: 500 })
  }
}
