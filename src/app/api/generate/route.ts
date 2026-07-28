import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { GARDEN_STYLES } from '@/lib/gardenPrompts'
import { generateStyledImage } from '@/lib/gemini'
import { uploadBase64WithFallback } from '@/lib/blob-storage'
import { deductCredits, refundCredits, getAvailableCredits, InsufficientCreditsError } from '@/lib/credits'
import { trackServerEvent, captureServerException } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { isEmailVerified } from '@/lib/auth-guards'
import { sendReviewRequestEmail, sendWelcomeEmail, sendFeatureDiscoveryEmail } from '@/lib/email'

export const maxDuration = 120

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']
const FEATURE_KEY = 'imageGeneration'

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

  const [member, verified] = await Promise.all([
    db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
      include: { workspace: { select: { plan: true } } },
    }),
    isEmailVerified(session.user.id),
  ])

  if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const analyticsIdentity = { userId: session.user.id, email: session.user.email ?? null, plan: member.workspace.plan, workspaceId }

  // Checked before deducting so a mid-request race can't misreport "first" — a prior count
  // of 0 here means whichever generation succeeds first genuinely is the first for this workspace.
  const priorImageCount = await db.creditTransaction.count({
    where: { workspaceId, featureKey: FEATURE_KEY, reason: 'ENHANCEMENT' },
  })

  // An unverified account gets exactly one free generation — enough to see the product work
  // before being asked to leave the app and verify — then every subsequent attempt needs a
  // verified email. Bounds the abuse surface (disposable-email credit farming) to one
  // 1-credit render per fake account instead of unlimited free use.
  if (!verified && priorImageCount > 0) {
    return NextResponse.json(
      { error: 'email_not_verified', message: 'Vérifiez votre adresse e-mail pour générer un nouveau rendu.' },
      { status: 403 },
    )
  }

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
          { error: 'insufficient_credits', message: 'Crédits insuffisants', available: err.available, required: err.required },
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
      toolsUsed: ['gemini_image_generation'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY absent')

    // The original upload is independent of the Gemini call, so it runs in parallel rather
    // than adding its own latency on top. uploadBase64WithFallback never throws — a storage
    // outage falls back to a data URI instead of failing the whole generation.
    const [styled, originalUrl] = await Promise.all([
      generateStyledImage(apiKey, imageData, mimeType ?? 'image/jpeg', style, characteristics),
      uploadBase64WithFallback(imageData, mimeType ?? 'image/jpeg', `original-${photo.id}.jpg`),
    ])
    const enhancedUrl = await uploadBase64WithFallback(styled.base64, styled.mimeType, `enhanced-${photo.id}.png`)
    const processingMs = Date.now() - startMs

    await db.photo.update({
      where: { id: photo.id },
      data: { originalUrl, enhancedUrl, thumbnailUrl: enhancedUrl, status: 'ENHANCED', processingMs },
    })

    if (deduction) {
      await db.creditTransaction.updateMany({
        where: { id: { in: deduction.transactionIds } },
        data: { photoId: photo.id },
      })
    }

    console.log(`[generate] done in ${processingMs}ms style=${styleSlug}`)
    const credits = isSuperuser ? null : await getAvailableCredits(workspaceId)
    const remainingCredits = credits?.total ?? 0

    trackServerEvent(ANALYTICS_EVENTS.IMAGE_GENERATED, { ...analyticsIdentity, remainingCredits, styleSlug, processingMs })
    if (deduction) {
      trackServerEvent(ANALYTICS_EVENTS.CREDITS_CONSUMED, {
        ...analyticsIdentity, remainingCredits, featureKey: FEATURE_KEY, amount: deduction.monthlySpent + deduction.bonusSpent,
      })
    }
    if (priorImageCount === 0) {
      trackServerEvent(ANALYTICS_EVENTS.FIRST_IMAGE_GENERATED, { ...analyticsIdentity, remainingCredits })
      // The "moment magique" email — fires on the render itself, not on signup/verification,
      // so it lands while the emotion is highest (and covers Google sign-ups too, who never
      // got a welcome email before since they skip the verification-email code path entirely).
      if (session.user.email) {
        sendWelcomeEmail(session.user.email, session.user.name ?? session.user.email.split('@')[0], enhancedUrl).catch(() => {})
      }
    }

    // Habit-building nudge on the 2nd render, before the credit ceiling hits — pointed at a
    // feature they haven't tried yet (video / kit marketing), not a repeat of the first email.
    if (priorImageCount === 1 && session.user.email) {
      sendFeatureDiscoveryEmail(session.user.email, { name: session.user.name ?? undefined }).catch(() => {})
    }

    // Ask for a review once a workspace has real usage behind it (their 3rd render) — not
    // on the very first one, when they've barely had time to form an opinion. The atomic
    // updateMany (only claims if reviewRequestedAt is still null) means concurrent requests
    // can't both "win" and send the email twice.
    if (priorImageCount === 2 && session.user.email) {
      const claimed = await db.workspace.updateMany({
        where: { id: workspaceId, reviewRequestedAt: null },
        data: { reviewRequestedAt: new Date() },
      })
      if (claimed.count > 0) {
        sendReviewRequestEmail(session.user.email, { name: session.user.name ?? undefined }).catch(() => {})
      }
    }

    return NextResponse.json({ photoId: photo.id, originalUrl, enhancedUrl, processingMs, credits })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[generate]', msg)
    captureServerException(err, session.user.id)
    await db.photo.update({
      where: { id: photo.id },
      data: { status: 'FAILED', errorMessage: msg },
    })

    if (deduction) {
      await refundCredits(workspaceId, deduction, { featureKey: FEATURE_KEY, photoId: photo.id })
    }

    return NextResponse.json(
      { error: 'Génération échouée, veuillez réessayer.', detail: msg },
      { status: 500 },
    )
  }
}
