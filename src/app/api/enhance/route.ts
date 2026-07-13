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
//   1. centreAndUpload: RMBG to find car bbox → crop original + 30% grey padding → upload
//   2. bria/background/remove on centred image → transparent PNG
//   3. PhotoRoom image-editing: transparent PNG + studio bg → composite with shadow + perspective
//   4. License plate blur (Florence-2 + Sharp)
// =============================================================================

// Background image sent to PhotoRoom as the studio backdrop.
// The walls are intentionally blank so a client logo can be composited later.
const STUDIO_BG_FILE = 'white-studio.jpg'

// ─── Centre car with asymmetric padding ───────────────────────────────────────
// Asymmetric vertical padding: lots of space ABOVE (shows background wall/ceiling)
// and almost none BELOW (car sits near the ground line).
// This ensures wheels are never cut off AND the car appears grounded when
// PhotoRoom composites it onto the studio background.
const PADDING_X      = 0.25  // 25% of car width, each horizontal side
const PADDING_TOP    = 0.45  // 45% of car height above — room for background wall
const PADDING_BOTTOM = 0.04  // 4% of car height below  — car near the ground

async function centreAndUpload(imageUrl: string): Promise<string> {
  const rmbg = await withRetry(
    () => fal.subscribe('fal-ai/bria/background/remove', { input: { image_url: imageUrl } }),
    3, 'rmbg/centre',
  )
  const carPngUrl = (rmbg.data as any).image?.url as string | undefined
  if (!carPngUrl) throw new Error('centreAndUpload: RMBG returned no image')

  const [origResp, carResp] = await Promise.all([fetch(imageUrl), fetch(carPngUrl)])
  if (!origResp.ok) throw new Error(`Cannot fetch original: ${origResp.status}`)
  if (!carResp.ok)  throw new Error(`Cannot fetch car cutout: ${carResp.status}`)

  const [origBuf, carBuf] = await Promise.all([
    origResp.arrayBuffer().then(b => Buffer.from(b)),
    carResp.arrayBuffer().then(b => Buffer.from(b)),
  ])

  // Find tight bounding box of non-transparent pixels in the cutout
  const { data: rgba, info } = await sharp(carBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height
  let minX = W, minY = H, maxX = 0, maxY = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rgba[(y * W + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    // RMBG found nothing — upload original as-is
    const file = new File([origBuf], 'centred.jpg', { type: 'image/jpeg' })
    return fal.storage.upload(file)
  }

  const carW = maxX - minX + 1
  const carH = maxY - minY + 1
  const padX   = Math.round(carW * PADDING_X)
  const padTop = Math.round(carH * PADDING_TOP)
  const padBot = Math.round(carH * PADDING_BOTTOM)

  // Crop original to car bbox + asymmetric padding (clamped to image bounds)
  const cropLeft   = Math.max(0, minX - padX)
  const cropTop    = Math.max(0, minY - padTop)
  const cropRight  = Math.min(W, maxX + 1 + padX)
  const cropBottom = Math.min(H, maxY + 1 + padBot)
  const cropW = cropRight - cropLeft
  const cropH = cropBottom - cropTop

  // Canvas: car near the bottom, lots of space above for the background to show
  const canvasW   = carW + padX * 2
  const canvasH   = carH + padTop + padBot
  const pasteLeft = Math.max(0, padX   - (minX - cropLeft))
  const pasteTop  = Math.max(0, padTop - (minY - cropTop))

  const cropped = await sharp(origBuf)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .toBuffer()

  const canvas = await sharp({
    create: { width: canvasW, height: canvasH, channels: 3, background: { r: 128, g: 128, b: 128 } },
  })
    .composite([{ input: cropped, left: pasteLeft, top: pasteTop }])
    .jpeg({ quality: 95 })
    .toBuffer()

  const file = new File([canvas], 'centred.jpg', { type: 'image/jpeg' })
  const url  = await fal.storage.upload(file)
  console.log(`[enhance] centreAndUpload — car bbox ${carW}×${carH}, padTop=${padTop} padBot=${padBot} → canvas ${canvasW}×${canvasH}`)
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
// Stage 4: License plate detection + blur
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

  const { imageUrl, vehicleId, workspaceId, batchSeed } = await req.json()

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

  const photo = await db.photo.create({
    data: {
      workspaceId,
      vehicleId:   vehicleId ?? null,
      originalUrl: imageUrl,
      status:      'PROCESSING',
      styleUsed:   'studio',
      toolsUsed:   ['photoroom_image_editing'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    // Stage 1: centre car with 30% padding on grey canvas
    console.log('[enhance] stage 1: centreAndUpload — start')
    const t1 = Date.now()
    const centredImageUrl = await centreAndUpload(imageUrl)
    console.log(`[enhance] stage 1 done in ${Date.now() - t1}ms`)

    // Stage 2: PhotoRoom — détourage + fond + ombre en un seul appel
    console.log('[enhance] stage 2: photoroom /v2/edit — start')
    const t2 = Date.now()

    const photoRoomApiKey = process.env.PHOTOROOM_API_KEY
    if (!photoRoomApiKey) throw new Error('PHOTOROOM_API_KEY is not set in environment')

    const bgPath = path.join(process.cwd(), 'public', 'backgrounds', STUDIO_BG_FILE)

    const [centredBuf, bgBuf] = await Promise.all([
      fetch(centredImageUrl).then(r => {
        if (!r.ok) throw new Error(`Cannot fetch centred image: ${r.status}`)
        return r.arrayBuffer()
      }),
      readFile(bgPath),
    ])

    const formData = new FormData()

    // Image principale : la voiture (PhotoRoom détourera lui-même via removeBackground)
    formData.append(
      'imageFile',
      new Blob([centredBuf], { type: 'image/png' }),
      'car.png',
    )

    // Fond exact à appliquer
    formData.append(
      'background.imageFile',
      new Blob([bgBuf], { type: 'image/jpeg' }),
      'background.jpg',
    )

    formData.append('removeBackground', 'true')
    formData.append('shadow.mode',      'ai.soft')
    formData.append('padding',          '0.1')

    console.log('[photoroom] sending — centredImageUrl:', centredImageUrl, '— bg:', STUDIO_BG_FILE)

    const prResponse = await fetch('https://image-api.photoroom.com/v2/edit', {
      method:  'POST',
      headers: {
        'x-api-key': photoRoomApiKey,
        'pr-ai-background-model-version': 'background-studio-beta-2025-03-17',
      },
      body: formData,
    })

    console.log('[photoroom] response status:', prResponse.status, prResponse.statusText)
    if (!prResponse.ok) {
      const errText = await prResponse.text()
      console.error('[photoroom] error body:', errText)
      throw new Error(`PhotoRoom API error ${prResponse.status}: ${errText}`)
    }

    const prBuffer = await prResponse.arrayBuffer()
    const prFile   = new File([Buffer.from(prBuffer)], 'photoroom-result.jpg', { type: 'image/jpeg' })
    const rawUrl   = await fal.storage.upload(prFile)
    console.log(`[enhance] stage 2 done in ${Date.now() - t2}ms`)

    // Stage 3: license plate blur
    console.log('[enhance] stage 3: plate detection + blur — start')
    const t3 = Date.now()
    const finalUrl = await blurLicensePlates(rawUrl)
    console.log(`[enhance] stage 3 done in ${Date.now() - t3}ms`)

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
    } else if (msg.includes('PhotoRoom API error')) {
      userMessage = 'Background composite failed. Please try again.'
    } else if (msg.includes('no output') || msg.includes('source image')) {
      userMessage = 'Could not process the vehicle photo. Make sure the car is fully visible.'
    }

    return NextResponse.json({ error: userMessage, detail: msg }, { status: 500 })
  }
}
