import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { GARDEN_STYLES } from '@/lib/gardenPrompts'
import { generateStyledImage } from '@/lib/gemini'

export const maxDuration = 120

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const { imageData, mimeType, styleSlug, workspaceId, characteristics } = body as {
    imageData: string
    mimeType: string
    styleSlug: string
    workspaceId: string
    characteristics?: string
  }

  if (!imageData || !workspaceId) {
    return NextResponse.json({ error: 'imageData et workspaceId sont requis' }, { status: 400 })
  }

  const isSuperuser = !!session.user.email &&
    SUPERUSER_EMAILS.includes(session.user.email.toLowerCase())

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  })

  if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  if (!isSuperuser && member.workspace.creditsRemaining < 1) {
    return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 })
  }

  const style = GARDEN_STYLES[styleSlug] ?? GARDEN_STYLES['gazon-fleurs']

  const photo = await db.photo.create({
    data: {
      workspaceId,
      originalUrl: 'jardin-direct-upload',
      status: 'PROCESSING',
      styleUsed: styleSlug,
      toolsUsed: ['gemini_image_generation'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY absent')

    const styled = await generateStyledImage(apiKey, imageData, mimeType ?? 'image/jpeg', style, characteristics)
    const enhancedUrl = `data:${styled.mimeType};base64,${styled.base64}`
    const processingMs = Date.now() - startMs

    await db.photo.update({
      where: { id: photo.id },
      data: { enhancedUrl, thumbnailUrl: enhancedUrl, status: 'ENHANCED', processingMs },
    })

    if (!isSuperuser) {
      await db.$transaction([
        db.workspace.update({
          where: { id: workspaceId },
          data: { creditsRemaining: { decrement: 1 } },
        }),
        db.creditTransaction.create({
          data: {
            workspaceId,
            delta: -1,
            balanceAfter: member.workspace.creditsRemaining - 1,
            reason: 'ENHANCEMENT',
            photoId: photo.id,
          },
        }),
      ])
    }

    console.log(`[generate] done in ${processingMs}ms style=${styleSlug}`)
    return NextResponse.json({ photoId: photo.id, enhancedUrl, processingMs })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[generate]', msg)
    await db.photo.update({
      where: { id: photo.id },
      data: { status: 'FAILED', errorMessage: msg },
    })
    return NextResponse.json(
      { error: 'Génération échouée, veuillez réessayer.', detail: msg },
      { status: 500 },
    )
  }
}
