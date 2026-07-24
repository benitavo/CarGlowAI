import type { VideoRenderProvider } from './types'
import { ShotstackProvider } from './providers/shotstack'

// The single seam for swapping video-rendering vendors (Creatomate, a future in-house
// ffmpeg pipeline, etc.) — everything else in the app talks to `VideoRenderProvider` only.
export function getVideoProvider(): VideoRenderProvider {
  const name = process.env.VIDEO_PROVIDER || 'shotstack'
  switch (name) {
    case 'shotstack':
      return new ShotstackProvider()
    default:
      throw new Error(`Unknown VIDEO_PROVIDER: "${name}"`)
  }
}
