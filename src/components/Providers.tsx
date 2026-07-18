'use client'

import { SessionProvider } from 'next-auth/react'
import { Suspense, type ReactNode } from 'react'
import { PostHogPageview } from '@/components/analytics/PostHogPageview'
import { ConsentProvider } from '@/components/consent/ConsentProvider'
import { CookieBanner } from '@/components/consent/CookieBanner'
import { MetaPixel } from '@/components/consent/MetaPixel'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConsentProvider>
      <SessionProvider>
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        {children}
        <CookieBanner />
      </SessionProvider>
    </ConsentProvider>
  )
}
