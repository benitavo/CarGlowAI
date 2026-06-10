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
// PIPELINE:
//
// Normal mode (all slugs except trash):
//   1. RMBG (fal-ai/bria/background/remove) → transparent car PNG
//   2. Sharp composite: car PNG scaled + placed on the exact background image
//   3. Upload composite to fal CDN
//   4. License plate blur (Florence-2 + Sharp)
//
// Trash mode (demo "before" photo — no real background image):
//   1. fal-ai/bria/background/replace with TRASH_PROMPT
//   2. License plate blur
//
// The background image is used pixel-for-pixel as-is.
// =============================================================================

interface BgConfig {
  file:     string
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png'
}

const BACKGROUNDS: Record<string, BgConfig> = {
  'dealership':  { file: 'dealership.jpg',  mimeType: 'image/jpeg' },
  'wood-floor':  { file: 'wood-floor.jpg',  mimeType: 'image/jpeg' },
  'showroom':    { file: 'showroom.jpg',    mimeType: 'image/jpeg' },
  'dark-garage': { file: 'dark-garage.jpg', mimeType: 'image/jpeg' },
  'white-studio':{ file: 'white-studio.jpg',mimeType: 'image/jpeg' },
  'podium':      { file: 'podium.webp',     mimeType: 'image/webp' },
}
const DEFAULT_BG_SLUG = 'dealership'

// Trash mode — text-only prompt, no background image, demo use only.
const TRASH_PROMPT =
  'Abandoned derelict outdoor parking lot, heavily cracked and stained dark asphalt full of ' +
  'potholes and oil stains, large dirty puddles reflecting a grey overcast sky, scattered ' +
  'litter and crushed plastic bottles on the ground, rusty chain-link fence with broken ' +
  'panels in the background, peeling graffiti-covered concrete wall, dead weeds growing ' +
  'through cracks, harsh flat grey daylight, gritty urban decay, dirty neglected atmosphere'

// ─── RMBG + Sharp composite ──────────────────────────────────────────────────
// 1. Remove the car background with Bria RMBG → transparent PNG
// 2. Scale the cutout to ~82 % of the background width (keeps aspect ratio)
// 3. Centre horizontally; align the bottom of the car to 88 % height of the bg
//    (leaves a natural floor strip below the car)
// 4. Composite onto the exact background image pixel-for-pixel
// 5. Upload the result to fal CDN so blurLicensePlates can fetch it
async function compositeCarOnBackground(carImageUrl: string, slug: string): Promise<string> {
  const cfg   = BACKGROUNDS[slug] ?? BACKGROUNDS[DEFAULT_BG_SLUG]
  const bgDir = path.join(process.cwd(), 'public', 'backgrounds')

  // RMBG + background load in parallel
  const [rmbg, bgBuf] = await Promise.all([
    withRetry(
      () => fal.subscribe('fal-ai/bria/background/remove', { input: { image_url: carImageUrl } }),
      3, 'rmbg',
    ),
    readFile(path.join(bgDir, cfg.file)),
  ])

  const carPngUrl = (rmbg.data as any).image?.url as string | undefined
  if (!carPngUrl) throw new Error('RMBG: no output image')

  const carResp = await fetch(carPngUrl)
  if (!carResp.ok) throw new Error(`Cannot fetch car cutout: ${carResp.status}`)
  const carBuf = Buffer.from(await carResp.arrayBuffer())

  const [bgMeta, carMeta] = await Promise.all([
    sharp(bgBuf).metadata(),
    sharp(carBuf).metadata(),
  ])
  const bgW  = bgMeta.width  ?? 1920
  const bgH  = bgMeta.height ?? 1080
  const carW = carMeta.width  ?? 800
  const carH = carMeta.height ?? 600

  // Scale car to fit within 82 % of bg width AND 82 % of bg height,
  // preserving aspect ratio (uniform scale — no padding added).
  const maxCarW = Math.round(bgW * 0.82)
  const maxCarH = Math.round(bgH * 0.82)
  const scale   = Math.min(maxCarW / carW, maxCarH / carH)
  const actualW = Math.round(carW * scale)
  const actualH = Math.round(carH * scale)

  const carResized = await sharp(carBuf)
    .resize(actualW, actualH, { fit: 'fill' })
    .png()
    .toBuffer()

  // Centre horizontally; bottom of car flush with the bottom of the background.
  const left = Math.max(0, Math.min(Math.round((bgW - actualW) / 2), bgW - actualW))
  const top  = Math.max(0, bgH - actualH)

  const composite = await sharp(bgBuf)
    .composite([{ input: carResized, left, top }])
    .jpeg({ quality: 95 })
    .toBuffer()

  const file = new File([Buffer.from(composite)], 'enhanced.jpg', { type: 'image/jpeg' })
  const url  = await fal.storage.upload(file)
  console.log(`[enhance] composite "${slug}" done — car ${actualW}×${actualH} at (${left},${top}) on ${bgW}×${bgH}`)
  return url
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
// Stage 3: License plate detection + blur
//
// Florence-2 phrase-grounding detects plates. Three strict filters reject the
// false positives that plagued the old implementation (Florence detecting the
// whole car):
//   1. Aspect ratio  > 1.5  — plates are always wider than tall
//   2. Vertical pos  < 80 % — plates sit in the lower portion of the image,
//                             never at the very top
//   3. Area fraction 0.1 %–8 % — a plate is small; anything larger is the car
//
// If no plate is found the original image URL is returned unchanged.
// =============================================================================

interface BBox { x1: number; y1: number; x2: number; y2: number }

async function blurLicensePlates(imageUrl: string): Promise<string> {
  const resp = await fetch(imageUrl)
  if (!resp.ok) throw new Error(`Cannot fetch image for plate blur: ${resp.status}`)
  const imgBuf = Buffer.from(await resp.arrayBuffer())
  const { width: W = 0, height: H = 0 } = await sharp(imgBuf).metadata()
  if (!W || !H) return imageUrl

  const phrases = ['license plate', 'number plate', 'registration plate']
  const boxes: BBox[] = []

  for (const phrase of phrases) {
    try {
      const res = await fal.subscribe('fal-ai/florence-2-large/caption-to-phrase-grounding', {
        input: { image_url: imageUrl, text_input: phrase },
      })
      const data = res.data as any

      // Scale factors: Florence may resize the image internally
      const fW = data?.image?.width  ?? W
      const fH = data?.image?.height ?? H
      const sx = fW > 0 ? W / fW : 1
      const sy = fH > 0 ? H / fH : 1

      const grounding =
        data?.results?.['<CAPTION_TO_PHRASE_GROUNDING>'] ?? data?.results ?? data
      const rawBoxes: any[] = grounding?.bboxes ?? grounding?.entities?.bboxes ?? []

      for (const b of rawBoxes) {
        let x1: number, y1: number, x2: number, y2: number
        if (Array.isArray(b) && b.length === 4)          { [x1, y1, x2, y2] = b }
        else if (b?.x !== undefined && b?.w !== undefined){ x1=b.x; y1=b.y; x2=b.x+b.w; y2=b.y+b.h }
        else if (b?.x1 !== undefined)                     { x1=b.x1; y1=b.y1; x2=b.x2; y2=b.y2 }
        else continue

        const bx1 = x1 * sx, by1 = y1 * sy, bx2 = x2 * sx, by2 = y2 * sy
        const bw   = bx2 - bx1
        const bh   = by2 - by1
        const area = (bw * bh) / (W * H)

        // Filter 1: plates are horizontal (wider than tall)
        if (bw / Math.max(bh, 1) < 1.5) continue
        // Filter 2: plate must be below the top 20 % of the image
        if (by1 / H < 0.20 && by2 / H < 0.35) continue
        // Filter 3: area must be between 0.1 % and 8 % of image
        if (area < 0.001 || area > 0.08)  continue

        boxes.push({ x1: bx1, y1: by1, x2: bx2, y2: by2 })
        console.log(`[plate] "${phrase}" → box [${Math.round(bx1)},${Math.round(by1)},${Math.round(bx2)},${Math.round(by2)}] area=${(area*100).toFixed(2)}%`)
      }
    } catch (err) {
      console.warn(`[plate] Florence "${phrase}" error:`, err)
    }
    if (boxes.length > 0) break  // found plates, no need to try other phrases
  }

  if (boxes.length === 0) {
    console.log('[plate] no plate detected — skipping blur')
    return imageUrl
  }

  // Blur each detected plate region with Sharp
  const overlays: sharp.OverlayOptions[] = []
  for (const box of boxes) {
    const padX = (box.x2 - box.x1) * 0.10
    const padY = (box.y2 - box.y1) * 0.10
    const left   = Math.max(0,  Math.floor(box.x1 - padX))
    const top    = Math.max(0,  Math.floor(box.y1 - padY))
    const right  = Math.min(W,  Math.ceil(box.x2  + padX))
    const bottom = Math.min(H,  Math.ceil(box.y2  + padY))
    const pw = right - left, ph = bottom - top
    if (pw < 4 || ph < 4) continue

    const blurR = Math.max(14, Math.round(Math.min(pw, ph) / 2.5))
    const patch = await sharp(imgBuf)
      .extract({ left, top, width: pw, height: ph })
      .blur(blurR)
      .toBuffer()
    overlays.push({ input: patch, left, top })
  }

  if (overlays.length === 0) return imageUrl

  const out  = await sharp(imgBuf).composite(overlays).jpeg({ quality: 95 }).toBuffer()
  const file = new File([Buffer.from(out)], 'plate-blurred.jpg', { type: 'image/jpeg' })
  const url  = await fal.storage.upload(file)
  console.log(`[plate] blurred ${overlays.length} plate(s)`)
  return url
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
    const isTrash = slug === 'trash'

    // Stage 1: composite car on background (or Bria for trash demo mode)
    console.log(`[enhance] stage 1: ${isTrash ? 'bria/trash' : 'rmbg+composite'} — slug="${slug}"`)
    const t1 = Date.now()

    let rawUrl: string
    if (isTrash) {
      const result = await withRetry(
        () => fal.subscribe('fal-ai/bria/background/replace', {
          input: {
            image_url:       imageUrl,
            prompt:          TRASH_PROMPT,
            negative_prompt: 'clean background, studio, showroom, professional, luxury, new car',
            num_images:      1,
            fast:            true,
            ...(seed !== undefined && { seed }),
          } as any,
        }),
        3, 'bria/trash',
      )
      const images = (result.data as any).images as Array<{ url: string }> | undefined
      rawUrl = images?.[0]?.url ?? ''
      if (!rawUrl) throw new Error('bria/background/replace: no output image returned')
    } else {
      rawUrl = await compositeCarOnBackground(imageUrl, slug)
    }

    console.log(`[enhance] stage 1 done in ${Date.now() - t1}ms`)

    // Stage 2: license plate blur
    console.log('[enhance] stage 2: plate detection + blur — start')
    const t2 = Date.now()
    const finalUrl = await blurLicensePlates(rawUrl)
    console.log(`[enhance] stage 2 done in ${Date.now() - t2}ms`)

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
