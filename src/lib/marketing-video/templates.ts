import type { MarketingVideoFormat } from './types'

interface FormatConfig {
  width: number
  height: number
}

// 'reel' and 'story' are shown as two separate options in the UI (per the product spec) but
// render identically — both are 9:16. Kept as distinct keys so the UI labels stay meaningful
// and either can diverge later (e.g. different safe-zone padding) without an API shape change.
export const FORMAT_CONFIGS: Record<MarketingVideoFormat, FormatConfig> = {
  reel:      { width: 1080, height: 1920 },
  story:     { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square:    { width: 1080, height: 1080 },
}

// Segment durations sum to 12s (image "after") or 13.5s (video "after"), both inside the
// requested 10-15s range. Kept as named constants (not inlined in build-storyboard.ts) so a
// future template/transition change only touches this one file.
export const TIMING = {
  beforeDuration: 4.5,
  afterDuration: 4.5,
  // Matches the fixed clip length generate-video/route.ts requests from Veo
  // (`durationSeconds: 6`) — played in full rather than cropped to afterDuration.
  afterVideoDuration: 6,
  endCardDuration: 3,
  transitionDuration: 0.6,
} as const
