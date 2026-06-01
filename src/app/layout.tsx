import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { Providers } from '@/components/Providers'
import './globals.css'

// One Inter instance — multiple instances cause font-dedup warnings in Next 15
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://carglowai.com'),
  title: {
    default: 'CarGlow AI — Phone photos in. Showroom photos out.',
    template: '%s | CarGlow AI',
  },
  description:
    'CarGlow AI transforms ordinary phone photos of vehicles into studio-grade listing images in seconds.',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* --font-display falls back to --font-inter (production: license General Sans / Söhne) */}
        <style>{`:root { --font-display: var(--font-inter); }`}</style>
      </head>
      <body className="bg-midnight text-offwhite antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
