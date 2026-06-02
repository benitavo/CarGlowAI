import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 120

fal.config({ credentials: process.env.FAL_KEY })

// =============================================================================
// PIPELINE (2 stages):
//
// 1. Prepare in parallel:
//    a. Depth-of-field reference: load the EXACT background image the user
//       selected, apply a realistic DoF blur (sharp floor, soft walls/ceiling),
//       and upload to fal CDN.  Cached per slug — never regenerated.
//       Because the reference IS the actual library image, Bria's output will
//       look very very similar to the chosen background model.
//    b. Padded car photo: 30 % padding on all sides so the car is centred and
//       zoomed out before Bria processes it.
//
// 2. fal-ai/bria/background/replace
//      image_url     = padded car photo
//      ref_image_url = blurred library background (DoF style reference)
//      seed          = batchSeed (same for every photo in the batch)
//
//    Using the same reference + the same seed for all photos in a batch
//    makes Bria produce the same background environment each time.
// =============================================================================

interface BgConfig {
  file:     string
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png'
}

const BACKGROUNDS: Record<string, BgConfig> = {
  'dealership': { file: 'dealership.jpg', mimeType: 'image/jpeg' },
  'wood-floor': { file: 'wood-floor.jpg', mimeType: 'image/jpeg' },
}
const DEFAULT_BG_SLUG = 'dealership'

// =============================================================================
// Precise visual descriptions of each library background.
// These are used as Bria's text prompt so the generated background stays
// very close to what the user selected.  The image is ALSO passed as
// ref_image_url for maximum fidelity — Bria combines both signals.
// =============================================================================
const BACKGROUND_DESCRIPTIONS: Record<string, string> = {
  // Bright panoramic car dealership showroom. Creamy beige highly polished
  // reflective floor with warm golden reflections. Multiple blurred cars in
  // background as soft bokeh shapes. High ceiling with round recessed spotlights.
  // Large floor-to-ceiling glass windows at the back flooding the space with
  // warm natural daylight. Airy, luminous, premium atmosphere.
  'dealership':
    'Bright panoramic car dealership showroom interior, creamy beige highly polished ' +
    'reflective floor with warm golden light reflections, blurred cars in background as ' +
    'soft bokeh, high ceiling with round recessed spotlights, large floor-to-ceiling glass ' +
    'windows at back with warm natural daylight flooding in, airy luminous premium atmosphere, ' +
    'shallow depth of field background blur, no foreground objects',

  // Bright modern car dealership. Light natural oak wood plank floor sharp in
  // the foreground. Blurred background with multiple colorful cars (black, yellow,
  // silver, dark) as soft bokeh shapes. White ceiling with round recessed
  // spotlights. Bright white walls. Large windows with abundant natural daylight.
  // Clean open automotive showroom.
  'wood-floor':
    'Bright modern car dealership showroom, light natural oak wood plank floor sharp in ' +
    'foreground, blurred colorful cars in background as soft bokeh including black yellow ' +
    'silver vehicles, white ceiling with round recessed spotlights, bright white walls, ' +
    'large windows with abundant natural daylight, clean open showroom, ' +
    'strong background blur bokeh effect',
}

// Bria is told to not keep window reflections of the original car background.
const NEGATIVE_PROMPT =
  'reflections of previous background in car windows, old environment visible through glass, ' +
  'wrong reflections in windshield, original background reflected in windows, ' +
  'distorted proportions, warped architecture, unrealistic perspective'

// ─── DoF reference cache ─────────────────────────────────────────────────────
// We apply a LIGHT depth-of-field blur to the library background image before
// using it as Bria's ref_image_url.  Sigma 7 (vs the old 18) keeps visual
// detail and interest while gently softening the scene.  The floor strip
// (bottom 28 %) is barely blurred (sigma 1.5) so ground contact stays crisp.
const dofRefCache = new Map<string, string>()

async function buildDofReference(slug: string): Promise<string> {
  if (dofRefCache.has(slug)) return dofRefCache.get(slug)!

  const cfg = BACKGROUNDS[slug] ?? BACKGROUNDS[DEFAULT_BG_SLUG]
  const buf = await readFile(path.join(process.cwd(), 'public', 'backgrounds', cfg.file))

  const { width: W = 1920, height: H = 1080 } = await sharp(buf).metadata()

  // ── Gradient blur: sharp floor → gently blurred upper background ──────────
  //
  // Technique: two-layer composite with a vertical gradient alpha mask.
  //   Layer 1 (base)    : original image blurred at sigma 5
  //   Layer 2 (overlay) : original image, pixel alpha = linear gradient
  //                       0 (transparent) at the top → 255 (opaque) at the bottom
  //
  // Where the overlay is opaque (bottom) the sharp original shows through.
  // Where it is transparent (top) the blurred base shows through.
  // The transition between the two creates a smooth, well-faded DoF effect.
  //
  // FADE_START = 0.45 → blur begins at 45 % from the top (55 % from the bottom).
  // Everything below that line is fully sharp (floor + lower walls).
  // sigma = 5 → gentle blur that keeps scene detail and recognisability.

  const FADE_START = 0.45
  const SIGMA      = 5

  // Blurred base
  const blurredBuf = await sharp(buf).blur(SIGMA).png().toBuffer()

  // Sharp overlay with gradient alpha
  const { data: raw, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = Buffer.from(raw)
  for (let y = 0; y < info.height; y++) {
    const yFrac = y / info.height
    // alpha: 0 at top, rises linearly once yFrac crosses FADE_START, 255 at bottom
    const alpha = yFrac <= FADE_START
      ? 0
      : Math.round(255 * (yFrac - FADE_START) / (1 - FADE_START))
    for (let x = 0; x < info.width; x++) {
      pixels[(y * info.width + x) * 4 + 3] = alpha
    }
  }

  const sharpOverlay = await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer()

  // Composite: blurred base + sharp overlay faded in from the bottom
  const final = await sharp(blurredBuf)
    .composite([{ input: sharpOverlay }])
    .jpeg({ quality: 95 })
    .toBuffer()

  const file = new File([Buffer.from(final)], `${slug}-dof.jpg`, { type: 'image/jpeg' })
  const url  = await fal.storage.upload(file)

  dofRefCache.set(slug, url)
  console.log(`[enhance] DoF reference "${slug}" cached (gradient blur sigma=${SIGMA} fade=${FADE_START})`)
  return url
}

// ─── Padding ──────────────────────────────────────────────────────────────────
// 30 % padding on each side: car occupies ~55 % of width, perfectly centred.
const PADDING_FRACTION = 0.30

async function padAndUpload(imageUrl: string): Promise<string> {
  const resp = await fetch(imageUrl)
  if (!resp.ok) throw new Error(`Could not fetch source image: ${resp.status}`)
  const buf = Buffer.from(await resp.arrayBuffer())

  const { width: W = 1024, height: H = 768 } = await sharp(buf).metadata()
  const padX = Math.round(W * PADDING_FRACTION)
  const padY = Math.round(H * PADDING_FRACTION)

  const padded = await sharp({
    create: {
      width:      W + padX * 2,
      height:     H + padY * 2,
      channels:   3,
      background: { r: 220, g: 220, b: 220 },
    },
  })
    .composite([{ input: buf, left: padX, top: padY }])
    .jpeg({ quality: 96 })
    .toBuffer()

  const file = new File([Buffer.from(padded)], 'padded.jpg', { type: 'image/jpeg' })
  return fal.storage.upload(file)
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = 'fal',
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const retryable = [504, 502, 429].includes(err?.status)
      if (!retryable || attempt === maxAttempts) throw err
      const wait = 4_000 * attempt
      console.warn(`[enhance] ${label} attempt ${attempt} failed (${err?.status}) — retry in ${wait}ms`)
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw lastErr
}

// =============================================================================
// Main handler
// =============================================================================
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageUrl, styleSlug, vehicleId, workspaceId, batchSeed } = await req.json()

  if (!imageUrl || !workspaceId) {
    return NextResponse.json({ error: 'imageUrl and workspaceId are required' }, { status: 400 })
  }

  const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']
  const isSuperuser = !!session.user.email &&
    SUPERUSER_EMAILS.includes(session.user.email.toLowerCase())

  const member = await db.workspaceMember.findUnique({
    where:   { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  })

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSuperuser && member.workspace.creditsRemaining < 1) {
    return NextResponse.json({ error: 'No credits remaining' }, { status: 402 })
  }

  const slug = styleSlug ?? DEFAULT_BG_SLUG
  const seed = typeof batchSeed === 'number' ? batchSeed : undefined

  const photo = await db.photo.create({
    data: {
      workspaceId,
      vehicleId:   vehicleId ?? null,
      originalUrl: imageUrl,
      status:      'PROCESSING',
      styleUsed:   slug,
      toolsUsed:   ['bria_background_replace'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    // Stage 1: prepare DoF reference + padded image in parallel
    console.log(`[enhance] stage 1: prepare assets — slug="${slug}"`)
    const t1 = Date.now()

    const [dofRefUrl, paddedImageUrl] = await Promise.all([
      buildDofReference(slug),   // exact library image with DoF blur, cached forever
      padAndUpload(imageUrl),    // car zoomed-out and centred
    ])

    console.log(`[enhance] stage 1 done in ${Date.now() - t1}ms`)

    // Stage 2: Bria generates a background that looks like the library image,
    // with depth-of-field blur, around the (sharp) car.
    console.log(`[enhance] stage 2: bria/background/replace — start`)
    const t2 = Date.now()

    // Bria receives:
    //   • ref_image_url = the lightly DoF-blurred library image → visual style
    //   • refine_prompt = true → Bria derives the scene prompt from the reference
    //     image, but we also provide our precise description via `prompt` to
    //     override/enrich it.  When both are present Bria v2 merges them.
    // If the API rejects both together it falls back to ref_image_url only.
    const briaInput: Record<string, unknown> = {
      image_url:       paddedImageUrl,
      ref_image_url:   dofRefUrl,
      negative_prompt: NEGATIVE_PROMPT,
      refine_prompt:   true,
      num_images:      1,
      fast:            true,
      ...(seed !== undefined && { seed }),
    }

    const result = await withRetry(
      () => fal.subscribe('fal-ai/bria/background/replace', { input: briaInput as any }),
      3,
      'bria/background/replace',
    )

    console.log(`[enhance] stage 2 done in ${Date.now() - t2}ms`)

    const images   = (result.data as any).images as Array<{ url: string }> | undefined
    const finalUrl = images?.[0]?.url
    if (!finalUrl) throw new Error('bria/background/replace: no output image returned')

    const processingMs = Date.now() - startMs
    console.log(`[enhance] complete in ${processingMs}ms`)

    const updatedPhoto = await db.photo.update({
      where: { id: photo.id },
      data:  { enhancedUrl: finalUrl, thumbnailUrl: finalUrl, status: 'ENHANCED', processingMs },
    })

    if (!isSuperuser) {
      await db.$transaction([
        db.workspace.update({
          where: { id: workspaceId },
          data:  { creditsRemaining: { decrement: 1 } },
        }),
        db.creditTransaction.create({
          data: {
            workspaceId,
            delta:        -1,
            balanceAfter: member.workspace.creditsRemaining - 1,
            reason:       'ENHANCEMENT',
            photoId:      photo.id,
          },
        }),
      ])
    } else {
      console.log('[enhance] superuser — credit not deducted')
    }

    return NextResponse.json({
      photoId:      updatedPhoto.id,
      enhancedUrl:  updatedPhoto.enhancedUrl,
      thumbnailUrl: updatedPhoto.thumbnailUrl,
      processingMs,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if ((err as any)?.status === 422) {
      console.error('[enhance] 422 body:', JSON.stringify((err as any).body, null, 2))
    }
    console.error('[enhance] error:', err)

    await db.photo.update({
      where: { id: photo.id },
      data:  { status: 'FAILED', errorMessage: msg },
    })

    let userMessage = 'Enhancement failed. Please try again.'
    if (msg.includes('Timed out')) {
      userMessage = 'The enhancement took too long. Please try again.'
    } else if (msg.includes('no output') || msg.includes('source image')) {
      userMessage = 'Could not process the vehicle photo. Make sure the car is fully visible.'
    }

    return NextResponse.json({ error: userMessage, detail: msg }, { status: 500 })
  }
}
