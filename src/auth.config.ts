import type { NextAuthConfig } from 'next-auth'

// Edge-compatible auth config — no PrismaAdapter, no Node.js-only imports.
// Used by middleware to validate JWTs without a database round-trip.
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/signin',
    error:  '/auth/error',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isAppPath = request.nextUrl.pathname.startsWith('/app')
      if (isAppPath) return !!auth?.user
      return true
    },
  },
  providers: [],
}
