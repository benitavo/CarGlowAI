// Typed catalog for the marketing showcase assets under public/showcase/ — built by reading
// the actual processed output (see the asset pipeline this was generated from), not presumed.
// Nothing here should be hardcoded again in JSX; components read this file instead.

export type GardenStyle = 'gazon-fleurs' | 'mediterraneen' | 'contemporain' | 'naturel' | 'zen' | 'potager'

export const ALL_STYLES: GardenStyle[] = [
  'gazon-fleurs', 'mediterraneen', 'contemporain', 'naturel', 'zen', 'potager',
]

export const STYLE_LABELS: Record<GardenStyle, string> = {
  'gazon-fleurs':  'Gazon & Fleurs',
  'mediterraneen': 'Méditerranéen',
  'contemporain':  'Contemporain',
  'naturel':       'Naturel & Sauvage',
  'zen':           'Zen & Japonais',
  'potager':       'Potager',
}

export interface ShowcaseGarden {
  id: string
  /** Real width/height of the source "before" photo (read directly from the file — each
   *  garden has a genuinely different native ratio, there is no shared portrait ratio across
   *  them). Used to reserve layout space per-garden and avoid CLS. */
  beforeAspect: { width: number; height: number }
  /** Styles this garden actually has a real, distinct render for (hash-verified — see the
   *  jardin-04 note below for why one style silently didn't make it in). */
  availableStyles: GardenStyle[]
}

export const SHOWCASE_GARDENS: ShowcaseGarden[] = [
  { id: 'jardin-01', beforeAspect: { width: 2000, height: 924 },  availableStyles: ['gazon-fleurs', 'mediterraneen', 'contemporain', 'naturel', 'zen', 'potager'] },
  { id: 'jardin-02', beforeAspect: { width: 608,  height: 1080 }, availableStyles: ['gazon-fleurs', 'mediterraneen', 'contemporain', 'naturel', 'zen', 'potager'] },
  // No zen/potager renders exist for this garden at all (verified: not present in source).
  { id: 'jardin-03', beforeAspect: { width: 810,  height: 1080 }, availableStyles: ['gazon-fleurs', 'mediterraneen', 'contemporain', 'naturel'] },
  // Source had a file named verdia-zen-*.png, but it was byte-identical (sha256) to one of
  // two verdia-potager-*.png files in the same folder — a mislabeled duplicate, not a real
  // zen render. Kept the unambiguous potager file, dropped both the duplicate and the zen
  // claim rather than guess which label was ever correct.
  { id: 'jardin-04', beforeAspect: { width: 800,  height: 600 },  availableStyles: ['gazon-fleurs', 'mediterraneen', 'contemporain', 'naturel', 'potager'] },
]

// WebP only — no JPEG fallback exists (dropped to help hit the 12 Mo budget; WebP has >96%
// global browser support in 2026 and nothing in this codebase used the fallback anyway).
export function gardenImagePath(gardenId: string, variant: 'before' | `after-${GardenStyle}` | `thumb-${GardenStyle}`): string {
  return `/showcase/jardins/${gardenId}/${variant}.webp`
}

export type VideoAspect = '9:16' | '16:9' | '1:1'

export interface ShowcaseVideo {
  name: string
  gardenId: string
  aspect: VideoAspect
  width: number
  height: number
  /** Real duration in seconds, rounded — read from the source, not assumed. */
  durationSeconds: number
}

// width/height/durationSeconds re-verified against the actual processed files (ffmpeg -i) after
// the 12 Mo budget pass — every video is now uniformly 6s and capped at 720px wide.
export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  { name: 'jardin-01-dynamique-1', gardenId: 'jardin-01', aspect: '16:9', width: 720, height: 406,  durationSeconds: 6 },
  { name: 'jardin-01-dynamique-2', gardenId: 'jardin-01', aspect: '16:9', width: 720, height: 406,  durationSeconds: 6 },
  { name: 'jardin-02-dynamique',   gardenId: 'jardin-02', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-02-reel-1',      gardenId: 'jardin-02', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-02-reel-2',      gardenId: 'jardin-02', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-03-story-1',     gardenId: 'jardin-03', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-03-story-2',     gardenId: 'jardin-03', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-03-paysage',     gardenId: 'jardin-03', aspect: '16:9', width: 720, height: 406,  durationSeconds: 6 },
  { name: 'jardin-04-reel',        gardenId: 'jardin-04', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-04-story',       gardenId: 'jardin-04', aspect: '9:16', width: 720, height: 1280, durationSeconds: 6 },
  { name: 'jardin-04-carre',       gardenId: 'jardin-04', aspect: '1:1',  width: 720, height: 720,  durationSeconds: 6 },
]

export function videoPaths(name: string) {
  return {
    // No .webm — VP9 at crf 36 came out LARGER than h264 at crf 28 for every source video in
    // the first Phase 0 pass (see that report), so it was pure added weight for zero benefit
    // once the 12 Mo budget forced a choice. H.264/MP4 alone has near-universal browser support.
    mp4: `/showcase/videos/${name}.mp4`,
    poster: `/showcase/videos/${name}-poster.jpg`,
  }
}

/** Gardens ranked by number of *distinct aspect ratios* covered by their videos — this is
 *  what actually matters for a "same photo, every format" narrative, not raw video count.
 *  jardin-03 and jardin-04 are tied at 2 distinct ratios each; neither covers all three
 *  (9:16 / 1:1 / 16:9) — see the Phase 0 report for the full breakdown. */
export function distinctVideoAspects(gardenId: string): VideoAspect[] {
  const aspects = SHOWCASE_VIDEOS.filter(v => v.gardenId === gardenId).map(v => v.aspect)
  return Array.from(new Set(aspects))
}
