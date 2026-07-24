// Single source of truth for every analytics event name and its property shape.
// Pure constants/types only (no PostHog import) so both the client and server
// analytics modules can depend on this without pulling in browser- or Node-only code.
// Change an event's name or payload shape here and both sides stay in sync.

export const ANALYTICS_EVENTS = {
  // Marketing
  LANDING_VIEWED: 'Landing Viewed',
  CTA_CLICKED: 'CTA Clicked',
  PRICING_VIEWED: 'Pricing Viewed',
  // Authentication
  ACCOUNT_CREATED: 'Account Created',
  LOGIN: 'Login',
  // AI
  IMAGE_GENERATED: 'Image Generated',
  IMAGE_RETOUCHED: 'Image Retouched',
  VIDEO_GENERATED: 'Video Generated',
  // Payments
  CHECKOUT_STARTED: 'Checkout Started',
  SUBSCRIPTION_PURCHASED: 'Subscription Purchased',
  CREDIT_PACK_PURCHASED: 'Credit Pack Purchased',
  PAYMENT_FAILED: 'Payment Failed',
  // Credits
  CREDITS_CONSUMED: 'Credits Consumed',
  CREDITS_PURCHASED: 'Credits Purchased',
  OUT_OF_CREDITS: 'Out Of Credits',
  // Retention
  FIRST_IMAGE_GENERATED: 'First Image Generated',
  FIRST_VIDEO_GENERATED: 'First Video Generated',
  UPGRADE_SUBSCRIPTION: 'Upgrade Subscription',
  CANCEL_SUBSCRIPTION: 'Cancel Subscription',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// Included on every server-side event (identity + billing context). Callers pass these
// straight from data already loaded for the request — never fetched fresh here, so
// tracking never adds an extra DB round trip on a hot path.
export interface BaseEventProperties {
  userId: string
  email: string | null
  plan: string
  remainingCredits: number
  workspaceId?: string
}

// Marketing events can fire before sign-in, so identity fields are best-effort there.
export type MarketingEventProperties = Partial<BaseEventProperties>

// Per-event extra properties. Keep this the only place event payload shapes are defined.
export interface EventPropertiesMap {
  [ANALYTICS_EVENTS.LANDING_VIEWED]: Record<string, unknown>
  [ANALYTICS_EVENTS.CTA_CLICKED]: { ctaId: string; label?: string; location?: string }
  [ANALYTICS_EVENTS.PRICING_VIEWED]: { source?: string }
  [ANALYTICS_EVENTS.ACCOUNT_CREATED]: { method: 'credentials' | 'google' }
  [ANALYTICS_EVENTS.LOGIN]: { method: 'credentials' | 'google' }
  [ANALYTICS_EVENTS.IMAGE_GENERATED]: { styleSlug?: string; processingMs?: number }
  [ANALYTICS_EVENTS.IMAGE_RETOUCHED]: { processingMs?: number }
  [ANALYTICS_EVENTS.VIDEO_GENERATED]: { styleSlug?: string; processingMs?: number }
  [ANALYTICS_EVENTS.CHECKOUT_STARTED]: { kind: 'subscription' | 'pack'; target: string }
  [ANALYTICS_EVENTS.SUBSCRIPTION_PURCHASED]: { amount?: number }
  [ANALYTICS_EVENTS.CREDIT_PACK_PURCHASED]: { pack: string; credits: number; amount?: number }
  [ANALYTICS_EVENTS.PAYMENT_FAILED]: { reason?: string; amount?: number }
  [ANALYTICS_EVENTS.CREDITS_CONSUMED]: { featureKey: string; amount: number }
  [ANALYTICS_EVENTS.CREDITS_PURCHASED]: { amount: number; source: 'pack' | 'adjustment' }
  [ANALYTICS_EVENTS.OUT_OF_CREDITS]: { featureKey: string; required: number; available: number }
  [ANALYTICS_EVENTS.FIRST_IMAGE_GENERATED]: Record<string, unknown>
  [ANALYTICS_EVENTS.FIRST_VIDEO_GENERATED]: Record<string, unknown>
  [ANALYTICS_EVENTS.UPGRADE_SUBSCRIPTION]: { fromPlan: string; toPlan: string }
  [ANALYTICS_EVENTS.CANCEL_SUBSCRIPTION]: { cancelledPlan: string }
}

export type ServerTrackPayload<E extends AnalyticsEventName> = BaseEventProperties & EventPropertiesMap[E]
export type ClientTrackPayload<E extends AnalyticsEventName> = MarketingEventProperties & EventPropertiesMap[E]
