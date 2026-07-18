'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useConsent } from './ConsentProvider'

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

// Meta's standard base snippet, unchanged, minus the trailing `fbq('init', ...)` /
// `fbq('track', 'PageView')` calls — those only run from onLoad below, which only ever
// happens once this component has mounted, which only happens once marketing consent
// is granted (see the early return). No non-essential tracker fires before that.
const PIXEL_BASE_CODE = `
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
`

export function MetaPixel() {
  const { marketingGranted } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialized = useRef(false)

  // App Router has no built-in "page loaded" event, so subsequent client-side
  // navigations fire their own PageView — same pattern as the PostHog integration.
  // Guarded by `initialized` so it never double-fires alongside the onLoad below.
  useEffect(() => {
    if (!marketingGranted || !initialized.current || !window.fbq) return
    window.fbq('track', 'PageView')
  }, [marketingGranted, pathname, searchParams])

  if (!marketingGranted || !PIXEL_ID) return null

  return (
    <Script
      id="meta-pixel-base"
      strategy="afterInteractive"
      onLoad={() => {
        if (!window.fbq) return
        window.fbq('init', PIXEL_ID)
        window.fbq('track', 'PageView')
        initialized.current = true
      }}
    >
      {PIXEL_BASE_CODE}
    </Script>
  )
}
