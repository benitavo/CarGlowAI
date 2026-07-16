import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { retouchImage } from '@/lib/gemini'

export const maxDuration = 120

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const { imageData, mimeType, instruction, workspaceId, styleSlug } = body as {
    imageData: string
    mimeType: string
    instruction: string
    workspaceId: string
    styleSlug?: string
  }

  if (!imageData || !workspaceId || !instruction?.trim()) {
    return NextResponse.json({ error: 'imageData, workspaceId et instruction sont requis' }, { status: 400 })
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

  const photo = await db.photo.create({
    data: {
      workspaceId,
      originalUrl: 'jardin-retouche',
      status: 'PROCESSING',
      styleUsed: styleSlug,
      toolsUsed: ['gemini_image_retouch'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY absent')

    const retouched = await retouchImage(apiKey, imageData, mimeType ?? 'image/png', instruction.trim())
    const enhancedUrl = `data:${retouched.mimeType};base64,${retouched.base64}`
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

    console.log(`[retouch] done in ${processingMs}ms`)
    return NextResponse.json({ photoId: photo.id, enhancedUrl, processingMs })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[retouch]', msg)
    await db.photo.update({
      where: { id: photo.id },
      data: { status: 'FAILED', errorMessage: msg },
    })
    return NextResponse.json(
      { error: 'Retouche échouée, veuillez réessayer.', detail: msg },
      { status: 500 },
    )
  }
}
