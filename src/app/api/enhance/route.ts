import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { fal } from '@fal-ai/client'
import sharp from 'sharp'

export const maxDuration = 120

fal.config({ credentials: process.env.FAL_KEY })

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE: Bria RMBG → composite onto fixed background → local plate blur
//
// Stage 2 no longer generates a background with a prompt. Instead the cut-out
// car is composited (locally, with sharp) onto one of several fixed background
// images shipped in /public/backgrounds. This is fully deterministic — the same
// background every time, no hallucination, no other cars, instant, no API cost.
//
// Each background has placement tuning (where the floor sits, how wide the car
// should be) so the car lands naturally on the ground line of that scene.
//
// Stage 3 blurs ONLY the plate locally (Florence-2 detect + sharp blur) so the
// car stays pixel-sharp.
// ═══════════════════════════════════════════════════════════════════════════════

import { readFile } from 'fs/promises'
import path from 'path'

interface BgConfig {
  file:       string   // filename in /public/backgrounds
  // Vertical position of the floor/ground line as a fraction of bg height,
  // where the BOTTOM of the car should sit (0 = top, 1 = bottom).
  groundY:    number
  // Target car width as a fraction of background width.
  carWidth:   number
  // Horizontal center as a fraction of bg width (0.5 = centered).
  centerX:    number
  // Whether to add a soft contact shadow under the car.
  shadow:     boolean
}

const BACKGROUNDS: Record<string, BgConfig> = {
  // Floor lines measured against each real background. groundY = where the
  // car's wheels sit (on the floor, in front of the back wall). carWidth kept
  // moderate so the car sits flat and grounded, not oversized/floating.
  'white-studio':  { file: 'white-studio.jpg',  groundY: 0.80, carWidth: 0.66, centerX: 0.5,  shadow: true },
  'wood-corner':   { file: 'wood-corner.webp',  groundY: 0.80, carWidth: 0.60, centerX: 0.5,  shadow: true },
  'dealership':    { file: 'dealership.jpg',    groundY: 0.85, carWidth: 0.46, centerX: 0.5,  shadow: true },
  'wood-floor':    { file: 'wood-floor.jpg',     groundY: 0.90, carWidth: 0.60, centerX: 0.5,  shadow: true },
  'podium':        { file: 'podium.webp',        groundY: 0.86, carWidth: 0.52, centerX: 0.5,  shadow: false },
  'dark-garage':   { file: 'dark-garage.jpg',    groundY: 0.82, carWidth: 0.54, centerX: 0.5,  shadow: true },
}
const DEFAULT_BG_SLUG = 'white-studio'

// Composite the cut-out car PNG onto a fixed background image, grounded on the
// scene's floor line, with an optional soft contact shadow. Returns a fal URL.
async function compositeOntoBackground(carPngUrl: string, slug: string): Promise<string> {
  const cfg = BACKGROUNDS[slug] ?? BACKGROUNDS[DEFAULT_BG_SLUG]

  // Load the background from disk
  const bgPath = path.join(process.cwd(), 'public', 'backgrounds', cfg.file)
  const bgBuf  = await readFile(bgPath)
  const bg     = sharp(bgBuf)
  const bgMeta = await bg.metadata()
  const BW = bgMeta.width  ?? 1024
  const BH = bgMeta.height ?? 768

  // Download the cut-out car PNG (transparent background)
  const carResp = await fetch(carPngUrl)
  if (!carResp.ok) throw new Error(`Could not download car cutout: ${carResp.status}`)
  const carBuf  = Buffer.from(await carResp.arrayBuffer())

  // Find the TRUE bounding box of the car from the alpha channel. sharp.trim()
  // is unreliable on transparent PNGs (it keys off corner colour), which left
  // transparent padding below the wheels and made the car appear to float.
  // Here we read raw alpha and find the car bounds robustly. Instead of the
  // absolute first/last opaque pixel (which can be RMBG noise, faint residual
  // shadow, or stray semi-transparent specks that make the car appear to
  // float), we count opaque pixels per row and per column and keep only rows/
  // columns that have a MEANINGFUL number of opaque pixels. This ignores noise.
  const { data: alpha, info: aInfo } = await sharp(carBuf)
    .ensureAlpha()
    .extractChannel('alpha')
    .raw()
    .toBuffer({ resolveWithObject: true })

  const AW = aInfo.width
  const AH = aInfo.height
  const ALPHA_THRESHOLD = 40  // higher than before: ignore faint anti-alias edges

  const rowCounts = new Array(AH).fill(0)
  const colCounts = new Array(AW).fill(0)
  for (let y = 0; y < AH; y++) {
    const rowOff = y * AW
    for (let x = 0; x < AW; x++) {
      if (alpha[rowOff + x] > ALPHA_THRESHOLD) {
        rowCounts[y]++
        colCounts[x]++
      }
    }
  }

  // A row/column counts as "part of the car" only if it has a meaningful
  // number of opaque pixels relative to the densest row/column. This ignores
  // stray noise strips (residual shadow/reflection) that RMBG sometimes leaves
  // below the wheels and that would otherwise make the car float.
  const maxRow = Math.max(...rowCounts)
  const maxCol = Math.max(...colCounts)
  const rowMin = Math.max(3, Math.round(maxRow * 0.12))
  const colMin = Math.max(3, Math.round(maxCol * 0.06))

  let minX = AW, minY = AH, maxX = -1, maxY = -1
  for (let y = 0; y < AH; y++) {
    if (rowCounts[y] >= rowMin) { if (y < minY) minY = y; if (y > maxY) maxY = y }
  }
  for (let x = 0; x < AW; x++) {
    if (colCounts[x] >= colMin) { if (x < minX) minX = x; if (x > maxX) maxX = x }
  }

  // Fallback to full image if detection failed (shouldn't happen with a cutout)
  if (maxX < 0 || maxY < 0) { minX = 0; minY = 0; maxX = AW - 1; maxY = AH - 1 }

  const cropW = maxX - minX + 1
  const cropH = maxY - minY + 1
  console.log(`[composite] alpha ${AW}x${AH} → car bbox=[${minX},${minY},${maxX},${maxY}] (rowMin=${rowMin} colMin=${colMin})`)

  // Crop tightly to the car's real opaque pixels — bottom edge = lowest wheel.
  const trimmed = await sharp(carBuf)
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer()

  const carW0 = cropW
  const carH0 = cropH

  // Scale to the target width, but cap the height so the car always fits
  // between the top of the frame and its ground line.
  const maxCarH = Math.round(BH * cfg.groundY * 0.95)
  let targetW = Math.round(BW * cfg.carWidth)
  let targetH = Math.round(carH0 * (targetW / carW0))
  if (targetH > maxCarH) {
    targetH = maxCarH
    targetW = Math.round(carW0 * (targetH / carH0))
  }

  const carResized = await sharp(trimmed)
    .resize(targetW, targetH, { fit: 'fill' })
    .toBuffer()

  // Anchor: horizontally centered, vertically so the car's BOTTOM (wheels) sits
  // on the ground line. Clamp so the car can NEVER float (top >= 0) and never
  // sink below the frame.
  let left = Math.round(BW * cfg.centerX - targetW / 2)
  let top  = Math.round(BH * cfg.groundY - targetH)

  // Clamp horizontally within the frame
  if (left < 0) left = 0
  if (left + targetW > BW) left = BW - targetW

  // Clamp vertically: never above the frame, and keep wheels on/below the
  // ground line — if the car is too tall, push it up only as far as the top.
  if (top < 0) top = 0
  const wheelsY = top + targetH
  if (wheelsY > BH) top = BH - targetH   // never sink below the frame bottom

  console.log(`[composite] bg=${slug} ${BW}x${BH} | bbox=[${minX},${minY},${maxX},${maxY}] crop=${cropW}x${cropH} | car=${targetW}x${targetH} at(${left},${top}) wheels@${top + targetH} ground@${Math.round(BH * cfg.groundY)}`)

  const layers: sharp.OverlayOptions[] = []

  // Optional soft contact shadow — a blurred dark ellipse directly under the
  // wheels (uses the real wheel Y = top + targetH, so shadow always aligns).
  if (cfg.shadow) {
    const shW = Math.round(targetW * 0.92)
    const shH = Math.round(targetH * 0.12)
    const shadowSvg = Buffer.from(
      `<svg width="${shW}" height="${shH}" xmlns="http://www.w3.org/2000/svg">
         <ellipse cx="${shW / 2}" cy="${shH / 2}" rx="${shW / 2}" ry="${shH / 2}" fill="rgba(0,0,0,0.38)"/>
       </svg>`
    )
    const shadowImg = await sharp(shadowSvg).blur(Math.max(4, shH / 2)).png().toBuffer()
    let shLeft = Math.round(BW * cfg.centerX - shW / 2)
    let shTop  = Math.round((top + targetH) - shH * 0.6)  // centred on the wheels
    if (shLeft < 0) shLeft = 0
    if (shLeft + shW > BW) shLeft = BW - shW
    if (shTop + shH > BH) shTop = BH - shH
    layers.push({ input: shadowImg, left: shLeft, top: shTop })
  }

  // The car on top of the shadow
  layers.push({ input: carResized, left, top })

  const out = await bg.composite(layers).jpeg({ quality: 95 }).toBuffer()

  // Upload composite to fal storage so downstream stages have a URL
  const file = new File([out], 'composite.jpg', { type: 'image/jpeg' })
  return fal.storage.upload(file)
}

// ─── Polling helper ────────────────────────────────────────────────────────────
async function pollUntilDone(
  endpointId: string,
  requestId: string,
  timeoutMs = 90_000,
  intervalMs = 3_000,
): Promise<any> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs))
    const status = await fal.queue.status(endpointId, { requestId, logs: false })
    console.log(`[enhance] poll ${endpointId} → ${status.status}`)
    if (status.status === 'COMPLETED') {
      // Fetching the result can itself 504 at the gateway even though the job
      // is done. Retry a few times with a short backoff before giving up.
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          const result = await fal.queue.result(endpointId, { requestId })
          return result.data
        } catch (resErr: any) {
          const code = resErr?.status
          const retryable = code === 504 || code === 502 || code === 500
          // Surface the actual Bria error body so we can see the real reason
          const bodyStr = resErr?.body ? JSON.stringify(resErr.body).slice(0, 400) : ''
          console.warn(`[enhance] result fetch attempt ${attempt} failed (${code}): ${bodyStr}`)
          // 422 = validation error, not transient — don't waste retries on it
          if (!retryable || attempt === 4) throw resErr
          await new Promise(r => setTimeout(r, 2000 * attempt))
        }
      }
    }
    if (status.status === 'FAILED') {
      throw new Error(`Job failed: ${endpointId} — ${JSON.stringify(status).slice(0, 200)}`)
    }
  }
  throw new Error(`Timed out after ${timeoutMs / 1000}s: ${endpointId}`)
}

// ─── Plate blur — Florence-2 detection + local sharp blur ───────────────────────
//
// This is the key to "car stays sharp, only the plate is blurred":
//   1. Florence-2 phrase-grounding detects the license plate → bounding box(es)
//   2. We download the composite image, blur ONLY the box region(s) with sharp,
//      and composite the blurred patch back over the original pixels.
//
// The car is never passed through a generative model for blurring, so it stays
// pixel-identical to Bria's sharp output. Only the plate pixels change.
//
// Returns the URL of the blurred image (re-uploaded to fal storage), or null
// if detection found nothing / failed (caller decides fallback).

interface BBox { x1: number; y1: number; x2: number; y2: number }

async function detectPlateBoxes(imageUrl: string): Promise<BBox[]> {
  // Florence-2 caption-to-phrase-grounding: give it a phrase, get bounding boxes.
  // We try several phrasings since the model can be picky about wording.
  const phrases = ['license plate', 'car license plate', 'number plate', 'registration plate']

  // We also need the dimensions Florence used, because it reports box
  // coordinates in the space of the (possibly resized) image it processed.
  // The blur runs on the real composite, so we scale boxes to the composite's
  // dimensions. Read the real composite size once here.
  const realMeta = await sharp(Buffer.from(await (await fetch(imageUrl)).arrayBuffer())).metadata()
  const realW = realMeta.width ?? 0
  const realH = realMeta.height ?? 0

  for (const phrase of phrases) {
    try {
      const result = await fal.subscribe('fal-ai/florence-2-large/caption-to-phrase-grounding', {
        input: { image_url: imageUrl, text_input: phrase },
      })
      const data = result.data as any

      // Log the raw shape once so we can see exactly what Florence returns
      console.log(`[enhance] florence "${phrase}" raw:`, JSON.stringify(data).slice(0, 400))

      // Dimensions Florence reports for the image it processed — used to scale
      // coordinates back onto the real composite.
      const fW = data?.image?.width  ?? realW
      const fH = data?.image?.height ?? realH
      const sx = fW > 0 ? realW / fW : 1
      const sy = fH > 0 ? realH / fH : 1

      // Florence on fal returns:
      //   { results: { bboxes: [ { x, y, w, h, label } ] } }
      // (x,y = top-left corner, w,h = width/height). Older/other shapes use
      // arrays [x1,y1,x2,y2]. Handle both.
      const grounding =
        data?.results?.['<CAPTION_TO_PHRASE_GROUNDING>']
        ?? data?.results
        ?? data
      const rawBoxes: any[] =
        grounding?.bboxes
        ?? grounding?.entities?.bboxes
        ?? []

      const boxes: BBox[] = rawBoxes.map((b: any) => {
        let x1, y1, x2, y2
        if (Array.isArray(b) && b.length === 4) {
          [x1, y1, x2, y2] = b
        } else if (b && typeof b === 'object' && 'x' in b && 'y' in b && 'w' in b && 'h' in b) {
          x1 = b.x; y1 = b.y; x2 = b.x + b.w; y2 = b.y + b.h
        } else if (b && typeof b === 'object' && 'x1' in b) {
          x1 = b.x1; y1 = b.y1; x2 = b.x2; y2 = b.y2
        } else {
          return null
        }
        // Scale Florence coordinates onto the real composite dimensions
        return { x1: x1 * sx, y1: y1 * sy, x2: x2 * sx, y2: y2 * sy }
      }).filter((b): b is BBox => b !== null)
      // Reject boxes that are clearly NOT a plate: a real plate is small. If a
      // box covers more than 35% of the image area, Florence grabbed the whole
      // car (common when no plate is clearly visible) — skip it rather than
      // blurring the entire vehicle.
      .filter((b) => {
        const area = (b.x2 - b.x1) * (b.y2 - b.y1)
        const frac = realW > 0 && realH > 0 ? area / (realW * realH) : 1
        return frac > 0 && frac < 0.35
      })

      if (boxes.length > 0) {
        console.log(`[enhance] florence matched "${phrase}" (scale ${sx.toFixed(2)}x${sy.toFixed(2)}) → ${boxes.length} box(es): ${JSON.stringify(boxes.map(b => [Math.round(b.x1),Math.round(b.y1),Math.round(b.x2),Math.round(b.y2)]))}`)
        return boxes
      }
    } catch (err) {
      console.warn(`[enhance] florence "${phrase}" error:`, err)
    }
  }
  return []
}

async function blurPlateRegions(imageUrl: string, boxes: BBox[]): Promise<string> {
  // Download the composite image
  const resp = await fetch(imageUrl)
  if (!resp.ok) throw new Error(`Could not download composite for blur: ${resp.status}`)
  const inputBuffer = Buffer.from(await resp.arrayBuffer())

  const base = sharp(inputBuffer)
  const meta = await base.metadata()
  const W = meta.width ?? 0
  const H = meta.height ?? 0
  if (!W || !H) throw new Error('Could not read image dimensions for blur')

  // Build a list of blurred patches to composite over the plate regions
  const overlays: sharp.OverlayOptions[] = []

  for (const box of boxes) {
    // Pad the box by 8% on each side to fully cover the plate edges
    const padX = (box.x2 - box.x1) * 0.08
    const padY = (box.y2 - box.y1) * 0.08
    let left   = Math.max(0, Math.floor(box.x1 - padX))
    let top    = Math.max(0, Math.floor(box.y1 - padY))
    let right  = Math.min(W, Math.ceil(box.x2 + padX))
    let bottom = Math.min(H, Math.ceil(box.y2 + padY))
    const w = right - left
    const h = bottom - top
    if (w < 4 || h < 4) continue

    // Extract the region and apply a strong clean Gaussian blur
    const blurRadius = Math.max(12, Math.round(Math.min(w, h) / 3))
    const patch = await sharp(inputBuffer)
      .extract({ left, top, width: w, height: h })
      .blur(blurRadius)
      .toBuffer()

    overlays.push({ input: patch, left, top })
  }

  if (overlays.length === 0) {
    // Nothing to blur — return the original unchanged
    return imageUrl
  }

  const outputBuffer = await base
    .composite(overlays)
    .jpeg({ quality: 95 })
    .toBuffer()

  // Re-upload the blurred image to fal storage to get a stable URL
  const file = new File([outputBuffer], 'blurred.jpg', { type: 'image/jpeg' })
  const url = await fal.storage.upload(file)
  return url
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageUrl, styleSlug, vehicleId, workspaceId } = await req.json()

  if (!imageUrl || !workspaceId) {
    return NextResponse.json({ error: 'imageUrl and workspaceId are required' }, { status: 400 })
  }

  // Superusers have unlimited credits and skip all credit checks/deductions.
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
      styleUsed:   styleSlug ?? 'white-showroom',
      toolsUsed:   ['bria_rmbg', 'composite_background'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    // ── STAGE 1: Background removal ──────────────────────────────────────────
    console.log('[enhance] stage 1: bria rmbg — start')
    const t1 = Date.now()
    const rmbgResult = await fal.subscribe('fal-ai/bria/background/remove', {
      input: { image_url: imageUrl, refine_foreground: true },
    })
    console.log(`[enhance] stage 1 done in ${Date.now() - t1}ms`)

    const carPngUrl = (rmbgResult.data as any).image?.url as string | undefined
    if (!carPngUrl) throw new Error('Stage 1 (RMBG): no output image returned')

    // ── STAGE 2: Composite car onto the chosen fixed background ──────────────
    // Local sharp composite — deterministic, instant, no API cost, no other
    // cars, exactly the background the user picked.
    console.log('[enhance] stage 2: composite onto background — start')
    const t2 = Date.now()
    const compositeUrl = await compositeOntoBackground(carPngUrl, styleSlug ?? DEFAULT_BG_SLUG)
    console.log(`[enhance] stage 2 done in ${Date.now() - t2}ms`)

    // ── STAGE 3: Plate blur — Florence-2 detect + local sharp blur ───────────
    // The car stays exactly as Bria produced it (sharp, high quality).
    //
    // STAGE 3 (plate blur) IS CURRENTLY DISABLED.
    // Florence-2 was confusing the whole car for the plate (returning a box
    // covering ~25% of the image), which blurred the entire vehicle. Until we
    // wire in a dedicated license-plate detector, we skip blurring entirely so
    // the car always stays sharp. The detectPlateBoxes / blurPlateRegions
    // helpers are kept below for when we re-enable with a proper detector.
    const t3 = Date.now()
    let finalUrl = compositeUrl
    console.log('[enhance] stage 3: plate blur disabled — skipping')

    // To re-enable later, restore the detect + blur block here.

    const processingMs = Date.now() - startMs
    console.log(`[enhance] complete in ${processingMs}ms`)

    const updatedPhoto = await db.photo.update({
      where: { id: photo.id },
      data:  { enhancedUrl: finalUrl, thumbnailUrl: finalUrl, status: 'ENHANCED', processingMs },
    })

    // Deduct one credit — unless the user is a superuser (unlimited credits).
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
    await db.photo.update({
      where: { id: photo.id },
      data:  { status: 'FAILED', errorMessage: msg },
    })
    console.error('[enhance] error:', err)

    let userMessage = 'Enhancement failed. Please try again.'
    if (msg.includes('RMBG') || msg.includes('segment')) {
      userMessage = 'Could not isolate the vehicle. Make sure the car is fully visible and well-lit.'
    } else if (msg.includes('Timed out')) {
      userMessage = 'The enhancement took too long. Please try again in a moment.'
    }

    return NextResponse.json({ error: userMessage, detail: msg }, { status: 500 })
  }
}
