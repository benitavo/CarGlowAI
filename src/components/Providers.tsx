'use client'

import { SessionProvider } from 'next-auth/react'
import { Suspense, type ReactNode } from 'react'
import { PostHogPageview } from '@/components/analytics/PostHogPageview'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </SessionProvider>
  )
}
