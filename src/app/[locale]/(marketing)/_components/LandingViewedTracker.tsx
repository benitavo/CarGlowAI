'use client'

import { useEffect } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/client'

export function LandingViewedTracker() {
  useEffect(() => { trackEvent(ANALYTICS_EVENTS.LANDING_VIEWED, {}) }, [])
  return null
}
