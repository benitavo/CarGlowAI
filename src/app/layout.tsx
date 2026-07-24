import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://verdia-app.com'),
  title: {
    default: 'Verdia — Visualisez votre jardin de rêve en secondes',
    template: '%s | Verdia',
  },
  description:
    'Verdia transforme la photo de votre jardin actuel en rendu photo ou vidéo de votre futur aménagement paysager, propulsé par l\'IA.',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  // Meta Business domain verification — rendered server-side via Next's Metadata API,
  // so it's present in the initial HTML <head> rather than injected by client JS
  // (Meta explicitly requires the former; the latter fails verification).
  verification: { other: { 'facebook-domain-verification': 'w6qw1m5a64t6j6t3mtgqsva7pqngdn' } },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <style>{`:root { --font-display: var(--font-inter); }`}</style>
        {/* Warms up the TCP+TLS handshake ahead of time for third-party origins the site
            actually loads (PostHog, Meta Pixel, Calendly) — each is still deferred/lazy on
            its own terms, this just means the connection is already half-open by the time
            they're needed instead of paying that cost cold. */}
        <link rel="preconnect" href="https://eu.i.posthog.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://calendly.com" />
      </head>
      <body className="bg-cream text-midnight antialiased">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
