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
  'showroom':   { file: 'showroom.jpg',   mimeType: 'image/jpeg' },
}
const DEFAULT_BG_SLUG = 'dealership'

// ── Trash mode ────────────────────────────────────────────────────────────────
// Text-only prompt (no ref image). Used exclusively to generate a "before"
// photo for before/after demos. Not shown to end users in production.
const TRASH_PROMPT =
  'Abandoned derelict outdoor parking lot, heavily cracked and stained dark asphalt full of ' +
  'potholes and oil stains, large dirty puddles reflecting a grey overcast sky, scattered ' +
  'litter and crushed plastic bottles on the ground, rusty chain-link fence with broken ' +
  'panels in the background, peeling graffiti-covered concrete wall, dead weeds growing ' +
  'through cracks, harsh flat grey daylight, gritty urban decay, dirty neglected atmosphere'

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

  // Modern luxury editorial showroom. Light natural oak hardwood planks floor
  // (horizontal grain, clearly visible, uniform from edge to edge). Left wall:
  // large dark matte black painted surface with recessed track spotlights above.
  // Center back: vertical narrow light wood slat panel. Right wall: large grey
  // raw concrete textured panel. Black ceiling with recessed directional
  // spotlights. Empty, architectural, premium brand environment.
  'wood-floor':
    'Modern luxury automotive showroom, continuous uniform light natural oak hardwood plank ' +
    'floor with consistent wood grain texture from left edge to right edge, ' +
    'horizontal wood planks running uniformly at the same level across the full width, ' +
    'large dark matte black wall on the left with recessed track spotlights, ' +
    'vertical narrow light wood slat panel on center back wall, ' +
    'large grey raw concrete texture panel on right wall, ' +
    'black ceiling with recessed directional spotlights, ' +
    'empty architectural premium interior, no cars no people, ' +
    'no trees no outdoor foliage no sky no nature visible, shallow depth of field',

  // Premium car dealership showroom. Wide central aisle in perspective leading
  // to the back wall. Cars parked in two parallel rows left and right of the
  // aisle: white, black and dark red sedans on the left; blue and white sedans
  // on the right; a single dark navy car centred at the far end.
  // Floor: large white/light grey polished tiles, clean and slightly reflective.
  // Left wall: floor-to-ceiling tall glass windows, bright cool natural daylight.
  // Back wall: dark display screen mounted centrally, diamond brand logo, central
  // glazed door. Upper level: white mezzanine gallery with railing at the back right.
  // Right side: two hanging navy blue brand banners with star logo.
  // Ceiling: flat white with evenly spaced recessed lighting panels.
  // Atmosphere: vast, bright, symmetric, premium brand environment.
  'showroom':
    'Premium car dealership showroom, wide symmetric central aisle in perspective, ' +
    'white and black and dark red sedans parked in a row on the left side, ' +
    'blue and white sedans parked in a row on the right side, ' +
    'single dark navy car centred at the far end of the aisle, ' +
    'large white polished tile floor with subtle clean reflections, ' +
    'full height floor-to-ceiling glass windows on the left wall with bright cool natural daylight, ' +
    'back wall with dark mounted display screen and diamond brand logo and central glazed door, ' +
    'white mezzanine gallery with railing visible at back right, ' +
    'two hanging navy blue brand banners with star logo on right side, ' +
    'flat white ceiling with evenly spaced recessed light panels, ' +
    'vast bright symmetric premium brand atmosphere, ' +
    'no trees no outdoor foliage no nature visible inside, shallow depth of field',
}

// Bria is told to not keep window reflections of the original car background.
const NEGATIVE_PROMPT =
  'tree reflections in car windows, green foliage reflected in glass, outdoor sky in windshield, ' +
  'nature reflected in windows, trees visible through glass, outdoor environment in car windows, ' +
  'reflections of previous background in windows, wrong reflections in glass, ' +
  'inconsistent floor texture, mismatched floor material, floor colour variation, ' +
  'mixed floor patterns, broken floor continuity, ' +
  'distorted proportions, warped architecture, unrealistic perspective'

// ─── DoF reference cache ─────────────────────────────────────────────────────
// We apply a LIGHT depth-of-field blur to the library background image before
// using it as Bria's ref_image_url.  Sigma 7 (vs the old 18) keeps visual
// detail and interest while gently softening the scene.  The floor strip
// (bottom 28 %) is barely blurred (sigma 1.5) so ground contact stays crisp.
const dofRefCache = new Map<string, string>()

// Build the source buffer for the DoF reference.
// For 'wood-floor' we composite the floor section from wood-corner.webp
// (consistent flat horizontal planks) over the upper showroom scene from
// wood-floor.jpg (bright atmosphere, bokeh cars, good lighting).
// Every other slug just reads its own file directly.
async function buildSourceBuffer(slug: string): Promise<Buffer> {
  const bgDir = path.join(process.cwd(), 'public', 'backgrounds')

  if (slug !== 'wood-floor') {
    const cfg = BACKGROUNDS[slug] ?? BACKGROUNDS[DEFAULT_BG_SLUG]
    return readFile(path.join(bgDir, cfg.file))
  }

  // ── wood-floor composite ─────────────────────────────────────────────────
  // 1. Load both source images, normalise to the same dimensions.
  // 2. Bottom 42 % → consistent horizontal parquet from wood-corner.webp
  // 3. Top    58 % → bright showroom scene from wood-floor.jpg
  // 4. Blend with a gradient so the seam is invisible.
  const [woodBuf, showroomBuf] = await Promise.all([
    readFile(path.join(bgDir, 'wood-corner.webp')),
    readFile(path.join(bgDir, 'wood-floor.jpg')),
  ])

  const { width: W = 1200, height: H = 800 } = await sharp(showroomBuf).metadata()

  const [woodResized, showroomResized] = await Promise.all([
    sharp(woodBuf).resize(W, H, { fit: 'cover', position: 'bottom' }).jpeg({ quality: 95 }).toBuffer(),
    sharp(showroomBuf).resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer(),
  ])

  // Extract the bottom floor strip from wood-corner
  const FLOOR_FRAC  = 0.42
  const floorH      = Math.round(H * FLOOR_FRAC)
  const floorStrip  = await sharp(woodResized)
    .extract({ left: 0, top: H - floorH, width: W, height: floorH })
    .toBuffer()

  // Apply vertical gradient alpha to the strip:
  //   top edge of strip  → alpha 0   (fully transparent → showroom shows through)
  //   bottom edge        → alpha 255 (fully opaque   → wood floor shows through)
  // Blend zone = top 40 % of the strip
  const { data: raw, info: ri } = await sharp(floorStrip)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const px = Buffer.from(raw)
  const BLEND_ZONE = 0.40
  for (let y = 0; y < ri.height; y++) {
    const alpha = y / ri.height < BLEND_ZONE
      ? Math.round(255 * (y / ri.height / BLEND_ZONE))
      : 255
    for (let x = 0; x < ri.width; x++) {
      px[(y * ri.width + x) * 4 + 3] = alpha
    }
  }

  const floorOverlay = await sharp(px, {
    raw: { width: ri.width, height: ri.height, channels: 4 },
  }).png().toBuffer()

  // showroom as base, wood floor blended in at the bottom
  return sharp(showroomResized)
    .composite([{ input: floorOverlay, left: 0, top: H - floorH }])
    .jpeg({ quality: 95 })
    .toBuffer()
}

async function buildDofReference(slug: string): Promise<string> {
  if (dofRefCache.has(slug)) return dofRefCache.get(slug)!

  const buf = await buildSourceBuffer(slug)

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

// ─── Centre car on neutral canvas ────────────────────────────────────────────
// Pipeline:
//   1. RMBG → transparent car PNG
//   2. Find car bounding box from alpha channel (ignores RMBG noise)
//   3. Crop tightly to the car
//   4. Place on a neutral grey canvas with 30 % padding on each side
//
// The car always lands at the exact centre of the canvas regardless of how
// it was framed in the original photo. Bria receives a clean, consistently
// composed image every time.
// Padding relative to the car's cropped size.
// 0.70 → car occupies ~42 % of the canvas width (strong zoom-out).
const PADDING_FRACTION = 0.70

async function centreAndUpload(imageUrl: string): Promise<string> {
  // Strategy: use RMBG only to LOCATE the car, then centre the ORIGINAL PHOTO
  // on a larger canvas — not the transparent cutout.
  //
  // Sending a cutout-on-grey-canvas to bria/background/replace causes Bria to
  // treat the whole rectangle (car + original background) as the "product" and
  // stamp it onto the new scene.  By keeping the original photo and just
  // reframing it, Bria receives a genuine photograph and does its own clean
  // subject extraction before generating the new background.

  // Step 1: RMBG → find car bounding box
  const rmbg = await withRetry(
    () => fal.subscribe('fal-ai/bria/background/remove', {
      input: { image_url: imageUrl },
    }),
    3, 'rmbg',
  )
  const carPngUrl = (rmbg.data as any).image?.url as string | undefined
  if (!carPngUrl) throw new Error('RMBG: no output image')

  const carResp = await fetch(carPngUrl)
  if (!carResp.ok) throw new Error(`Cannot fetch car cutout: ${carResp.status}`)
  const carBuf = Buffer.from(await carResp.arrayBuffer())

  const { data: alpha, info: ai } = await sharp(carBuf)
    .ensureAlpha().extractChannel('alpha').raw()
    .toBuffer({ resolveWithObject: true })

  const rowCounts = new Array(ai.height).fill(0)
  const colCounts = new Array(ai.width).fill(0)
  for (let y = 0; y < ai.height; y++) {
    const off = y * ai.width
    for (let x = 0; x < ai.width; x++) {
      if (alpha[off + x] > 20) { rowCounts[y]++; colCounts[x]++ }
    }
  }
  const maxRow = Math.max(...rowCounts)
  const maxCol = Math.max(...colCounts)
  const rowMin = Math.max(2, Math.round(maxRow * 0.05))
  const colMin = Math.max(2, Math.round(maxCol * 0.04))

  let minX = ai.width, minY = ai.height, maxX = -1, maxY = -1
  for (let y = 0; y < ai.height; y++) {
    if (rowCounts[y] >= rowMin) { minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
  }
  for (let x = 0; x < ai.width; x++) {
    if (colCounts[x] >= colMin) { minX = Math.min(minX, x); maxX = Math.max(maxX, x) }
  }
  if (maxX < 0) { minX = 0; minY = 0; maxX = ai.width - 1; maxY = ai.height - 1 }

  const bottomMargin = Math.round(ai.height * 0.01)
  maxY = Math.min(ai.height - 1, maxY + bottomMargin)

  const carW  = maxX - minX + 1
  const carH  = maxY - minY + 1
  const carCX = minX + carW / 2   // car centre X in original image coords
  const carCY = minY + carH / 2   // car centre Y in original image coords

  // Step 2: download the ORIGINAL photo
  const origResp = await fetch(imageUrl)
  if (!origResp.ok) throw new Error(`Cannot fetch original image: ${origResp.status}`)
  const origBuf = Buffer.from(await origResp.arrayBuffer())
  const { width: OW = ai.width, height: OH = ai.height } = await sharp(origBuf).metadata()

  // Step 3: canvas where car centre aligns to canvas centre + PADDING padding
  const padX    = Math.round(carW * PADDING_FRACTION)
  const padY    = Math.round(carH * PADDING_FRACTION)
  const canvasW = carW + padX * 2
  const canvasH = carH + padY * 2

  // Position of original image's top-left corner on the canvas
  const origOnCanvasX = Math.round(canvasW / 2 - carCX)
  const origOnCanvasY = Math.round(canvasH / 2 - carCY)

  // Sharp requires non-negative composite offsets — clip source + destination
  const srcLeft = Math.max(0, -origOnCanvasX)
  const srcTop  = Math.max(0, -origOnCanvasY)
  const dstLeft = Math.max(0,  origOnCanvasX)
  const dstTop  = Math.max(0,  origOnCanvasY)
  const copyW   = Math.min(OW - srcLeft, canvasW - dstLeft)
  const copyH   = Math.min(OH - srcTop,  canvasH - dstTop)

  const origPiece = await sharp(origBuf)
    .extract({ left: srcLeft, top: srcTop, width: Math.max(1, copyW), height: Math.max(1, copyH) })
    .toBuffer()

  // Grey fill for the padding strips — Bria will remove them together with
  // the original photo background and generate the new scene in their place.
  const centred = await sharp({
    create: { width: canvasW, height: canvasH, channels: 3, background: { r: 220, g: 220, b: 220 } },
  })
    .composite([{ input: origPiece, left: dstLeft, top: dstTop }])
    .jpeg({ quality: 96 })
    .toBuffer()

  const file = new File([Buffer.from(centred)], 'centred.jpg', { type: 'image/jpeg' })
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
    // Stage 1: prepare DoF reference + padded image in parallel
    console.log(`[enhance] stage 1: prepare assets — slug="${slug}"`)
    const t1 = Date.now()

    const isTrash = slug === 'trash'

    const [dofRefUrl, centredImageUrl] = await Promise.all([
      isTrash ? Promise.resolve('') : buildDofReference(slug),
      centreAndUpload(imageUrl),
    ])

    console.log(`[enhance] stage 1 done in ${Date.now() - t1}ms`)

    // Stage 2: Bria generates a background that looks like the library image,
    // with depth-of-field blur, around the (sharp) car.
    console.log(`[enhance] stage 2: bria/background/replace — start`)
    const t2 = Date.now()

    // Trash mode uses a text prompt directly (no ref image).
    // All other slugs use ref_image_url pointing to the DoF-blurred library image.
    const briaInput: Record<string, unknown> = isTrash
      ? {
          image_url:       centredImageUrl,
          prompt:          TRASH_PROMPT,
          negative_prompt: 'clean background, studio, showroom, professional, luxury, new car',
          num_images:      1,
          fast:            true,
          ...(seed !== undefined && { seed }),
        }
      : {
          image_url:       centredImageUrl,
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

    const images      = (result.data as any).images as Array<{ url: string }> | undefined
    const briaUrl     = images?.[0]?.url
    if (!briaUrl) throw new Error('bria/background/replace: no output image returned')

    // Stage 3: license plate blur
    console.log('[enhance] stage 3: plate detection + blur — start')
    const t3 = Date.now()
    const finalUrl = await blurLicensePlates(briaUrl)
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
    } else if (msg.includes('no output') || msg.includes('source image')) {
      userMessage = 'Could not process the vehicle photo. Make sure the car is fully visible.'
    }

    return NextResponse.json({ error: userMessage, detail: msg }, { status: 500 })
  }
}
