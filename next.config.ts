import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Static /public photos essentially never change — cache the optimized variants for a
    // year instead of Next's 60s default, so repeat visits (and CDN edges) don't re-optimize.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }, // Vercel Blob (generated renders)
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google account profile photos
    ],
  },
  experimental: {
    reactCompiler: false,
  },
  serverExternalPackages: ['sharp'],
}

export default withNextIntl(nextConfig)
