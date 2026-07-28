import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getDefaultBrandKit } from '@/lib/brand-kit'
import { buildStoryboardFromPhoto } from '@/lib/marketing-video/build-storyboard'
import { getVideoProvider } from '@/lib/marketing-video/provider'
import type { MarketingVideoFormat } from '@/lib/marketing-video/types'
import { deductCredits, refundCredits, getAvailableCredits, InsufficientCreditsError } from '@/lib/credits'
import { isEmailVerified } from '@/lib/auth-guards'

export const maxDuration = 300

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']
const FEATURE_KEY = 'marketingVideo'
const VALID_FORMATS: MarketingVideoFormat[] = ['reel', 'story', 'landscape', 'square']
const LEGACY_PLACEHOLDERS = ['jardin-direct-upload', 'jardin-retouche']

function isRealHostedUrl(url: string | null): url is string {
  return !!url && !url.startsWith('data:') && !LEGACY_PLACEHOLDERS.includes(url)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { format, accentColor, endText, ctaText, businessName, logoUrl, audioTrackUrl, useVideoAfter } = body as {
    format: MarketingVideoFormat
    accentColor?: string
    endText?: string
    ctaText?: string
    businessName?: string
    logoUrl?: string
    audioTrackUrl?: string
    useVideoAfter?: boolean
  }

  if (!VALID_FORMATS.includes(format)) {
    return NextResponse.json({ error: `format invalide, attendu l'un de : ${VALID_FORMATS.join(', ')}` }, { status: 400 })
  }

  const photo = await db.photo.findUnique({
    where: { id },
    select: {
      id: true,
      workspaceId: true,
      originalUrl: true,
      thumbnailUrl: true,
      enhancedUrl: true,
      status: true,
      toolsUsed: true,
      workspace: { select: { members: { where: { userId: session.user.id }, select: { userId: true } } } },
    },
  })

  if (!photo || photo.workspace.members.length === 0) {
    return NextResponse.json({ error: 'Rendu introuvable' }, { status: 404 })
  }

  if (!(await isEmailVerified(session.user.id))) {
    return NextResponse.json(
      { error: 'email_not_verified', message: 'Vérifiez votre adresse e-mail pour créer une vidéo marketing.' },
      { status: 403 },
    )
  }

  if (photo.status !== 'ENHANCED') {
    return NextResponse.json({ error: 'Ce rendu n\'est pas encore prêt.' }, { status: 422 })
  }

  // Retouch rows chain their `originalUrl` from a prior already-AI-generated render, not the
  // client's real photo — a marketing video built from it would show a fake before/after.
  if (Array.isArray(photo.toolsUsed) && photo.toolsUsed.includes('gemini_image_retouch')) {
    return NextResponse.json(
      { error: 'Le Kit marketing n\'est pas disponible pour les retouches — utilisez le rendu original.' },
      { status: 422 },
    )
  }

  if (!isRealHostedUrl(photo.originalUrl) || !isRealHostedUrl(photo.thumbnailUrl)) {
    return NextResponse.json(
      { error: 'Ce rendu a été généré avant la mise à jour du stockage — régénérez-le pour créer une vidéo marketing.' },
      { status: 422 },
    )
  }

  // Only wired up if the photo actually has a real, hosted generated video (i.e. it was made
  // in "Vidéo" mode and predates neither the storage migration) — otherwise silently falls
  // back to the static "Après" image rather than failing the request.
  const isVideoPhoto = Array.isArray(photo.toolsUsed) && photo.toolsUsed.includes('veo_video_generation')
  const photoVideoUrl = isVideoPhoto && isRealHostedUrl(photo.enhancedUrl) ? photo.enhancedUrl : null

  const isSuperuser = !!session.user.email && SUPERUSER_EMAILS.includes(session.user.email.toLowerCase())

  let deduction: Awaited<ReturnType<typeof deductCredits>> | null = null
  if (!isSuperuser) {
    try {
      deduction = await deductCredits(photo.workspaceId, FEATURE_KEY)
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json(
          { error: 'insufficient_credits', message: 'Crédits insuffisants', available: err.available, required: err.required },
          { status: 402 },
        )
      }
      throw err
    }
  }

  const startMs = Date.now()

  try {
    const brandKit = await getDefaultBrandKit(photo.workspaceId)
    const spec = buildStoryboardFromPhoto(
      { originalUrl: photo.originalUrl, thumbnailUrl: photo.thumbnailUrl, videoUrl: photoVideoUrl },
      { format, accentColor, endText, ctaText, businessName, logoUrl, audioTrackUrl, useVideoAfter },
      brandKit,
    )

    const provider = getVideoProvider()
    const { renderId } = await provider.submitRender(spec)

    // Shotstack's queue latency is variable (observed anywhere from ~15s to 150s+ for the
    // same kind of render) — this budget stays under `maxDuration` with headroom for the
    // surrounding auth/DB/JSON overhead, rather than the tighter 150s that turned out to
    // cut off a real, otherwise-successful render.
    const maxWaitMs = 270_000
    const pollIntervalMs = 3_000
    const pollStart = Date.now()
    let videoUrl: string | undefined
    let lastStatus: string = 'queued'

    while (Date.now() - pollStart < maxWaitMs) {
      await new Promise(r => setTimeout(r, pollIntervalMs))
      const status = await provider.getRenderStatus(renderId)
      lastStatus = status.state

      if (status.state === 'done') {
        videoUrl = status.outputUrl
        break
      }
      if (status.state === 'failed') {
        throw new Error(status.error ?? 'Le rendu vidéo a échoué')
      }
    }

    if (!videoUrl) throw new Error(`Délai de génération dépassé (renderId=${renderId}, dernier statut=${lastStatus})`)

    const credits = isSuperuser ? null : await getAvailableCredits(photo.workspaceId)
    return NextResponse.json({ videoUrl, processingMs: Date.now() - startMs, credits: credits?.total ?? null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[marketing-video]', msg)

    if (deduction) {
      await refundCredits(photo.workspaceId, deduction, { featureKey: FEATURE_KEY })
    }

    return NextResponse.json(
      { error: 'Génération de la vidéo marketing échouée, veuillez réessayer.', detail: msg },
      { status: 500 },
    )
  }
}
