import type { MarketingVideoFormat, VideoTimelineSpec } from './types'
import { FORMAT_CONFIGS } from './templates'

export interface StoryboardPhoto {
  originalUrl: string
  thumbnailUrl: string
  /** The real generated video (Veo), if this photo was created in "Vidéo" mode. */
  videoUrl?: string | null
}

export interface StoryboardOptions {
  format: MarketingVideoFormat
  accentColor?: string
  endText?: string
  ctaText?: string
  businessName?: string
  logoUrl?: string
  audioTrackUrl?: string
  /** Use the photo's own generated video as the "Après" segment instead of the static
   *  thumbnail — only takes effect if `photo.videoUrl` is actually present. */
  useVideoAfter?: boolean
}

export interface StoryboardBrandKit {
  logoUrl: string | null
  primaryColor: string
  businessName: string | null
}

export function buildStoryboardFromPhoto(
  photo: StoryboardPhoto,
  options: StoryboardOptions,
  brandKit: StoryboardBrandKit,
): VideoTimelineSpec {
  const { width, height } = FORMAT_CONFIGS[options.format]
  const afterIsVideo = !!(options.useVideoAfter && photo.videoUrl)

  return {
    beforeImageUrl: photo.originalUrl,
    afterMediaUrl: afterIsVideo ? photo.videoUrl! : photo.thumbnailUrl,
    afterIsVideo,
    width,
    height,
    accentColor: options.accentColor?.trim() || brandKit.primaryColor,
    endText: options.endText?.trim() || 'Transformez votre jardin.',
    ctaText: options.ctaText?.trim() || 'Demandez votre devis.',
    logoUrl: options.logoUrl?.trim() || brandKit.logoUrl,
    businessName: options.businessName?.trim() || brandKit.businessName,
    audioTrackUrl: options.audioTrackUrl?.trim() || undefined,
  }
}
