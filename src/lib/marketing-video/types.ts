export type MarketingVideoFormat = 'reel' | 'story' | 'landscape' | 'square'

export interface VideoTimelineSpec {
  beforeImageUrl: string
  /** The "Après" media — a still image by default, or the user's own generated video
   *  (see `afterIsVideo`) when they opt to use their real animated result instead. */
  afterMediaUrl: string
  afterIsVideo: boolean
  width: number
  height: number
  accentColor: string
  endText: string
  ctaText: string
  logoUrl: string | null
  businessName: string | null
  /** Reserved for a future "add background music" option — unused in v1. */
  audioTrackUrl?: string
}

export type RenderState = 'queued' | 'processing' | 'done' | 'failed'

export interface RenderStatus {
  state: RenderState
  outputUrl?: string
  error?: string
}

export interface VideoRenderProvider {
  submitRender(spec: VideoTimelineSpec): Promise<{ renderId: string }>
  getRenderStatus(renderId: string): Promise<RenderStatus>
}
