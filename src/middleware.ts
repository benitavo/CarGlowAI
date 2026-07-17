import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import createNextIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const { auth } = NextAuth(authConfig)
const intlMiddleware = createNextIntlMiddleware(routing)

// Pages that authenticated users should not see (redirect them to /app)
const GUEST_ONLY = ['/signin', '/signup', '/forgot-password', '/verify']

export default auth(function middleware(req: any) {
  const { pathname } = req.nextUrl

  // Auth pages: redirect if already logged in, otherwise pass through as-is.
  if (GUEST_ONLY.includes(pathname)) {
    if (req.auth?.user) return Response.redirect(new URL('/app', req.url))
    return // not authenticated → let Next.js render the page normally
  }

  // /app/* requires a session. The `authorized` callback in auth.config.ts does not actually
  // block the request here (confirmed: this function still runs with req.auth === null for an
  // unauthenticated request) — enforce the redirect explicitly instead of relying on it.
  if (pathname.startsWith('/app')) {
    if (!req.auth?.user) {
      const signInUrl = new URL('/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return Response.redirect(signInUrl)
    }
    return
  }

  // Apply next-intl locale detection to marketing routes.
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    // Protect the whole app shell
    '/app/:path*',
    // Redirect authenticated users away from auth pages
    '/signin',
    '/signup',
    '/forgot-password',
    '/verify',
    // Apply next-intl to marketing routes (exclude api, assets, auth pages)
    '/((?!api|_next/static|_next/image|app|signin|signup|verify|forgot-password|auth|onboarding|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|mp4|webm|mov|ogg)).*)',
  ],
}
