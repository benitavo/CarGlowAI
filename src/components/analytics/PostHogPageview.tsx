'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { capturePageview, analyticsEnabled } from '@/lib/analytics/client'

// App Router has no built-in "page loaded" event (unlike the Pages Router), so pageviews
// are captured manually on every route change instead.
export function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!analyticsEnabled || !pathname) return
    let url = window.origin + pathname
    if (searchParams && searchParams.toString()) url += `?${searchParams.toString()}`
    capturePageview(url)
  }, [pathname, searchParams])

  return null
}
