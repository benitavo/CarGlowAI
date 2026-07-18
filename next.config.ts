import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Static /public photos essentially never change — cache the optimized variants for a
    // year instead of Next's 60s default, so repeat visits (and CDN edges) don't re-optimize.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'fal-cdn.fal.ai' },
      { protocol: 'https', hostname: 'storage.fal.ai' },
      { protocol: 'https', hostname: 'v3.fal.media' },       // fal.ai CDN v3
      { protocol: 'https', hostname: '**.fal.media' },        // any fal.ai media subdomain
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  experimental: {
    reactCompiler: false,
  },
  serverExternalPackages: ['sharp'],
}

export default withNextIntl(nextConfig)
