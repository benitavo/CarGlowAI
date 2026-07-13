import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://verdia.fr'),
  title: {
    default: 'Verdia — Visualisez votre jardin de rêve en secondes',
    template: '%s | Verdia',
  },
  description:
    'Verdia transforme la photo de votre jardin actuel en rendu photoréaliste de votre futur aménagement paysager, propulsé par l\'IA.',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <style>{`:root { --font-display: var(--font-inter); }`}</style>
      </head>
      <body className="bg-cream text-midnight antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
