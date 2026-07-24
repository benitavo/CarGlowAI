import type { RenderStatus, VideoRenderProvider, VideoTimelineSpec } from '../types'
import { TIMING } from '../templates'

// Confirmed against Shotstack's published Edit API docs (base URLs, auth header,
// timeline/tracks/clips/output shape, GET /render/{id} status enum, and — after an initial
// render came back with the end card collapsed to a small box instead of filling the frame —
// the html5 asset's exact schema too: `html`/`css` live on the asset, but `width`/`height` are
// SIBLING properties of the clip (not nested inside `asset`), and the plain `html` asset type
// is deprecated in favor of `html5`. The `html, body { width/height }` CSS reset below is what
// actually makes the content fill the frame — percentage sizing alone collapses to content size.
const BASE_URL = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/edit/v1'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Same pill look as the web app's own before/after slider (GallerySection.tsx) — dark
// semi-transparent rounded pill, bold white label — rendered as a transparent full-frame
// html5 overlay so only the small pill itself is visible over the image track beneath it.
function buildCaptionAsset(label: string, side: 'left' | 'right', width: number, height: number): { html: string; css: string } {
  const html = `<div class="pill">${escapeHtml(label)}</div>`
  const css = `
    html, body { margin:0; padding:0; width:${width}px; height:${height}px; overflow:hidden; background:transparent; }
    .pill {
      position:absolute; bottom:40px; ${side}:40px;
      padding:10px 16px; border-radius:10px;
      background:rgba(13,31,17,0.55); border:1px solid rgba(255,255,255,0.2);
      color:#ffffff; font-family:sans-serif; font-weight:600; font-size:22px;
    }
  `
  return { html, css }
}

// The html5 asset is screenshotted by a headless renderer, which — unlike Shotstack's own
// dedicated `image` asset pipeline (used for the before/after photos, and which loads fine
// from the exact same host) — doesn't reliably fetch external <img src> URLs in time before
// capturing the page (confirmed: CORS was already wide open and the PNG itself is a plain,
// standard file, so this isn't a hosting/format problem). Inlining the logo as a base64 data
// URI removes the network fetch from their renderer's critical path entirely.
async function logoToDataUri(logoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(logoUrl)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.warn('[shotstack] failed to inline logo, falling back to business name', err)
    return null
  }
}

async function buildEndCardAsset(spec: VideoTimelineSpec): Promise<{ html: string; css: string }> {
  const logoDataUri = spec.logoUrl ? await logoToDataUri(spec.logoUrl) : null
  const logoMarkup = logoDataUri
    ? `<img class="logo" src="${logoDataUri}" width="360" height="360" />`
    : `<div class="business-name">${escapeHtml(spec.businessName ?? '')}</div>`

  const html = `
    <div class="card">
      ${logoMarkup}
      <div class="end-text">${escapeHtml(spec.endText)}</div>
      <div class="cta-text">${escapeHtml(spec.ctaText)}</div>
    </div>
  `

  const css = `
    html, body { margin:0; padding:0; width:${spec.width}px; height:${spec.height}px; overflow:hidden; }
    .card {
      width:${spec.width}px; height:${spec.height}px; box-sizing:border-box; padding:40px;
      display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
      background:${spec.accentColor}; font-family:sans-serif;
    }
    .logo { display:block; max-width:45%; max-height:220px; object-fit:contain; margin-bottom:28px; }
    .business-name { font-size:32px; font-weight:700; color:#ffffff; margin-bottom:24px; }
    .end-text { font-size:40px; font-weight:700; color:#ffffff; line-height:1.25; margin-bottom:16px; }
    .cta-text { font-size:26px; font-weight:600; color:#ffffff; opacity:0.9; }
  `

  return { html, css }
}

async function buildTimeline(spec: VideoTimelineSpec) {
  const { beforeDuration, afterDuration, afterVideoDuration, endCardDuration } = TIMING
  const { width, height } = spec
  const endCardAsset = await buildEndCardAsset(spec)

  // A real generated video plays in full (its own natural length) rather than being cropped
  // to the still-image duration, and gets no synthetic zoom (it's already moving) — its own
  // audio is muted so only the chosen soundtrack, if any, is heard.
  const afterSegmentDuration = spec.afterIsVideo ? afterVideoDuration : afterDuration
  const afterClipAsset = spec.afterIsVideo
    ? { type: 'video', src: spec.afterMediaUrl, volume: 0 }
    : { type: 'image', src: spec.afterMediaUrl }

  return {
    background: '#000000',
    // Track order is z-order: the first track is the TOP layer. Captions must render above
    // the photos, so the caption track comes first, the photos/end-card track second.
    tracks: [
      {
        clips: [
          {
            asset: { type: 'html5', ...buildCaptionAsset('Avant', 'left', width, height) },
            start: 0,
            length: beforeDuration,
            width,
            height,
          },
          {
            asset: { type: 'html5', ...buildCaptionAsset('Après', 'right', width, height) },
            start: beforeDuration,
            length: afterSegmentDuration,
            width,
            height,
          },
        ],
      },
      {
        clips: [
          {
            asset: { type: 'image', src: spec.beforeImageUrl },
            start: 0,
            length: beforeDuration,
            effect: 'zoomIn',
            transition: { out: 'fade' },
          },
          {
            asset: afterClipAsset,
            start: beforeDuration,
            length: afterSegmentDuration,
            ...(spec.afterIsVideo ? {} : { effect: 'zoomOut' }),
            transition: { in: 'fade', out: 'fade' },
          },
          {
            asset: { type: 'html5', ...endCardAsset },
            start: beforeDuration + afterSegmentDuration,
            length: endCardDuration,
            width,
            height,
            transition: { in: 'fade' },
          },
        ],
      },
    ],
    ...(spec.audioTrackUrl ? { soundtrack: { src: spec.audioTrackUrl, effect: 'fadeOut', volume: 0.8 } } : {}),
  }
}

interface ShotstackSubmitResponse {
  response: { id: string }
}

interface ShotstackStatusResponse {
  response: { status: string; url: string | null; error?: string }
}

export class ShotstackProvider implements VideoRenderProvider {
  private apiKey(): string {
    const key = process.env.SHOTSTACK_API_KEY
    if (!key) throw new Error('SHOTSTACK_API_KEY absent')
    return key
  }

  async submitRender(spec: VideoTimelineSpec): Promise<{ renderId: string }> {
    const timeline = await buildTimeline(spec)
    const res = await fetch(`${BASE_URL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey() },
      body: JSON.stringify({
        timeline,
        output: { format: 'mp4', size: { width: spec.width, height: spec.height } },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Shotstack submit ${res.status}: ${errText}`)
    }

    const data = (await res.json()) as ShotstackSubmitResponse
    return { renderId: data.response.id }
  }

  async getRenderStatus(renderId: string): Promise<RenderStatus> {
    const res = await fetch(`${BASE_URL}/render/${renderId}`, {
      headers: { 'x-api-key': this.apiKey() },
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Shotstack status ${res.status}: ${errText}`)
    }

    const data = (await res.json()) as ShotstackStatusResponse
    const { status, url, error } = data.response

    if (status === 'done') return { state: 'done', outputUrl: url ?? undefined }
    if (status === 'failed') return { state: 'failed', error: error ?? 'Render failed' }
    if (status === 'queued') return { state: 'queued' }
    return { state: 'processing' } // rendering, saving, fetching, etc.
  }
}
