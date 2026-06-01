import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
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
