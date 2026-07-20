import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { GARDEN_STYLES, buildVideoPrompt } from '@/lib/gardenPrompts'
import { generateStyledImage } from '@/lib/gemini'
import { uploadBufferToFal } from '@/lib/fal-storage'
import { deductCredits, refundCredits, getAvailableCredits, InsufficientCreditsError } from '@/lib/credits'
import { trackServerEvent, captureServerException } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

export const maxDuration = 300

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']
const FEATURE_KEY = 'videoGeneration'

async function pollOperation(operationName: string, apiKey: string, maxWaitMs = 240000): Promise<string> {
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
  const start = Date.now()
  const interval = 5000

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, interval))
    const res = await fetch(pollUrl)
    if (!res.ok) throw new Error(`Polling error ${res.status}`)
    const data = await res.json()

    if (data.done) {
      if (data.error) throw new Error(`Veo: ${data.error.message}`)
      const sample = data.response?.generateVideoResponse?.generatedSamples?.[0]
      const videoUri = sample?.video?.uri
      if (!videoUri) throw new Error('Aucune vidéo dans la réponse')
      return videoUri
    }
  }

  throw new Error('Délai de génération dépassé (240s)')
}

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
    include: { workspace: { select: { plan: true } } },
  })

  if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const analyticsIdentity = { userId: session.user.id, email: session.user.email ?? null, plan: member.workspace.plan, workspaceId }

  const priorVideoCount = await db.creditTransaction.count({
    where: { workspaceId, featureKey: FEATURE_KEY, reason: 'ENHANCEMENT' },
  })

  let deduction: Awaited<ReturnType<typeof deductCredits>> | null = null
  if (!isSuperuser) {
    try {
      deduction = await deductCredits(workspaceId, FEATURE_KEY)
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        trackServerEvent(ANALYTICS_EVENTS.OUT_OF_CREDITS, {
          ...analyticsIdentity,
          remainingCredits: err.available,
          featureKey: FEATURE_KEY,
          required: err.required,
          available: err.available,
        })
        return NextResponse.json(
          { error: 'insufficient_credits', message: `Crédits insuffisants (${err.required} crédits requis pour une vidéo)`, available: err.available, required: err.required },
          { status: 402 },
        )
      }
      throw err
    }
  }

  const style = GARDEN_STYLES[styleSlug] ?? GARDEN_STYLES['gazon-fleurs']

  const photo = await db.photo.create({
    data: {
      workspaceId,
      originalUrl: 'jardin-direct-upload',
      status: 'PROCESSING',
      styleUsed: styleSlug,
      toolsUsed: ['gemini_image_generation', 'veo_video_generation'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY absent')

    // Step 1: style the garden with Gemini image generation (same as /api/generate)
    const styled = await generateStyledImage(apiKey, imageData, mimeType ?? 'image/jpeg', style, characteristics)

    // Step 2: animate the styled image with Veo — no restyling, motion only
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt: buildVideoPrompt(characteristics),
            image: { bytesBase64Encoded: styled.base64, mimeType: styled.mimeType },
          }],
          parameters: {
            durationSeconds: 6,
            aspectRatio: '16:9',
          },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Veo API ${response.status}: ${errText}`)
    }

    const opData = await response.json()
    const operationName = opData.name
    if (!operationName) throw new Error('Pas d\'opération retournée par Veo')

    // Poll until done, then download server-side (the file URI requires the API key)
    const videoUri = await pollOperation(operationName, apiKey)
    const videoRes = await fetch(`${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${apiKey}`)
    if (!videoRes.ok) throw new Error(`Téléchargement vidéo ${videoRes.status}`)
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
    const thumbExt = styled.mimeType.split('/')[1] ?? 'jpg'
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadBufferToFal(videoBuffer, 'video/mp4', `video-${photo.id}.mp4`),
      uploadBufferToFal(Buffer.from(styled.base64, 'base64'), styled.mimeType, `video-thumb-${photo.id}.${thumbExt}`),
    ])

    const processingMs = Date.now() - startMs

    await db.photo.update({
      where: { id: photo.id },
      data: { enhancedUrl: videoUrl, thumbnailUrl, status: 'ENHANCED', processingMs },
    })

    if (deduction) {
      await db.creditTransaction.updateMany({
        where: { id: { in: deduction.transactionIds } },
        data: { photoId: photo.id },
      })
    }

    console.log(`[generate-video] done in ${processingMs}ms style=${styleSlug}`)
    const credits = isSuperuser ? null : await getAvailableCredits(workspaceId)
    const remainingCredits = credits?.total ?? 0

    trackServerEvent(ANALYTICS_EVENTS.VIDEO_GENERATED, { ...analyticsIdentity, remainingCredits, styleSlug, processingMs })
    if (deduction) {
      trackServerEvent(ANALYTICS_EVENTS.CREDITS_CONSUMED, {
        ...analyticsIdentity, remainingCredits, featureKey: FEATURE_KEY, amount: deduction.monthlySpent + deduction.bonusSpent,
      })
    }
    if (priorVideoCount === 0) {
      trackServerEvent(ANALYTICS_EVENTS.FIRST_VIDEO_GENERATED, { ...analyticsIdentity, remainingCredits })
    }

    return NextResponse.json({ photoId: photo.id, videoUrl, processingMs, credits })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[generate-video]', msg)
    captureServerException(err, session.user.id)
    await db.photo.update({
      where: { id: photo.id },
      data: { status: 'FAILED', errorMessage: msg },
    })

    if (deduction) {
      await refundCredits(workspaceId, deduction, { featureKey: FEATURE_KEY, photoId: photo.id })
    }

    return NextResponse.json(
      { error: 'Génération vidéo échouée. Vérifiez que votre clé API Gemini supporte Veo 3.1.', detail: msg },
      { status: 500 },
    )
  }
}
