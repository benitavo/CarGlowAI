'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useConsent } from './ConsentProvider'

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

// Meta's standard base snippet. The init + first PageView calls are inlined directly in
// this same script body (not deferred to Script's `onLoad`) — `onLoad` is meant for
// external `src` scripts and isn't reliably fired for inline script content, which
// silently meant the pixel's own fbq() proxy loaded but was never actually initialized.
function pixelBaseCode(pixelId: string): string {
  return `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `
}

export function MetaPixel() {
  const { marketingGranted } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialized = useRef(false)

  // App Router has no built-in "page loaded" event, so subsequent client-side
  // navigations fire their own PageView — same pattern as the PostHog integration.
  // The very first PageView is already covered by the inline script itself above, so
  // this only fires on real navigations after that (guarded by `initialized`).
  useEffect(() => {
    if (!marketingGranted) return
    if (!initialized.current) {
      initialized.current = true
      return
    }
    if (window.fbq) window.fbq('track', 'PageView')
  }, [marketingGranted, pathname, searchParams])

  if (!marketingGranted || !PIXEL_ID) return null

  return (
    <Script id="meta-pixel-base" strategy="afterInteractive">
      {pixelBaseCode(PIXEL_ID)}
    </Script>
  )
}
