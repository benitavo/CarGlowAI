'use client'

import { useEffect } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/client'

export function PricingViewedTracker({ source }: { source: string }) {
  useEffect(() => { trackEvent(ANALYTICS_EVENTS.PRICING_VIEWED, { source }) }, [source])
  return null
}
