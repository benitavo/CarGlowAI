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

  // /app/* is already guarded by the `authorized` callback (returns false → redirect to /signin).
  if (pathname.startsWith('/app')) return

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
    '/((?!api|_next/static|_next/image|app|signin|signup|verify|forgot-password|auth|onboarding|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)).*)',
  ],
}
