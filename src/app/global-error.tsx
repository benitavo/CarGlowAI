'use client'

import { useEffect } from 'react'
import { captureClientException } from '@/lib/analytics/client'

// Next.js only invokes global-error.tsx for errors thrown above the root layout (it
// replaces the whole document, hence the html/body tags) — this is the last-resort
// catch-all for PostHog Error Tracking on the client. Route-level error.tsx boundaries
// elsewhere in the app should call posthog.captureException(error) the same way.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureClientException(error)
  }, [error])

  return (
    <html lang="fr">
      <body className="bg-cream-50 text-midnight antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
          <h1 className="font-bold text-2xl">Une erreur est survenue</h1>
          <p className="text-midnight/50 max-w-md">
            Notre équipe a été notifiée. Réessayez, ou revenez à l&apos;accueil si le problème persiste.
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-5 py-2.5 font-semibold text-sm transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
