import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import createNextIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import type { NextRequest, NextFetchEvent } from 'next/server'

const { auth } = NextAuth(authConfig)
const intlMiddleware = createNextIntlMiddleware(routing)

// Pages that authenticated users should not see (redirect them to /app)
const GUEST_ONLY = ['/signin', '/signup', '/forgot-password', '/reset-password', '/verify']
// Pages that require auth but don't redirect verified users away
const AUTH_ONLY  = ['/check-email']

const authMiddleware = auth(function middleware(req: any) {
  const { pathname } = req.nextUrl

  // Auth pages: redirect if already logged in, otherwise pass through as-is.
  if (GUEST_ONLY.includes(pathname)) {
    if (req.auth?.user) return Response.redirect(new URL('/app', req.url))
    return // not authenticated → let Next.js render the page normally
  }

  // /check-email: requires auth but stays accessible regardless of verification status
  if (AUTH_ONLY.includes(pathname)) {
    if (!req.auth?.user) return Response.redirect(new URL('/signin', req.url))
    return
  }

  // /app/* requires a session.
  if (!req.auth?.user) {
    const signInUrl = new URL('/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(signInUrl)
  }
})

// Marketing routes never need a session check, so they skip `auth()`'s JWT decrypt/verify
// entirely (that cost was previously paid on every anonymous mobile pageview) and go
// straight to locale routing.
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl
  const needsAuth = pathname.startsWith('/app') || GUEST_ONLY.includes(pathname) || AUTH_ONLY.includes(pathname)
  if (needsAuth) return (authMiddleware as any)(req, event)
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Protect the whole app shell
    '/app/:path*',
    // Redirect authenticated users away from auth pages
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify',
    // Auth-required pages (not guest-only)
    '/check-email',
    // Apply next-intl to marketing routes (exclude api, assets, auth pages)
    '/((?!api|_next/static|_next/image|app|signin|signup|verify|forgot-password|reset-password|check-email|auth|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|html|mp4|webm|mov|ogg)).*)',
  ],
}
