import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import createNextIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const { auth } = NextAuth(authConfig)
const intlMiddleware = createNextIntlMiddleware(routing)

export default auth(function middleware(req: any) {
  // /app/* is already guarded by the `authorized` callback above.
  // For all other routes apply next-intl locale detection.
  if (!req.nextUrl.pathname.startsWith('/app')) {
    return intlMiddleware(req)
  }
})

export const config = {
  matcher: [
    // Protect the whole app shell
    '/app/:path*',
    // Apply next-intl to marketing routes (exclude api, assets, auth pages)
    '/((?!api|_next/static|_next/image|app|signin|signup|verify|forgot-password|auth|onboarding|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)).*)',
  ],
}
