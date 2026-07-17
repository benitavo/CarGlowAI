import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

// Full NextAuth instance (Node.js runtime — uses bcrypt + Prisma directly in authorize()).
// Lives outside app/api/auth/[...nextauth]/route.ts because Next's typed route handlers only
// allow a route module to export GET/POST/etc — anything else (auth, signIn, signOut) fails
// the build's route type-check. The route file just re-exports { GET, POST } from here.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions — no adapter, users managed directly in authorize()
  session: { strategy: 'jwt' },

  providers: [
    CredentialsProvider({
      id:   'credentials',
      name: 'Email',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      /**
       * Sign-in authorisation logic.
       *
       * Three paths, in order:
       *   1. New users → reject. Sign-up flows through /api/auth/register first.
       *   2. Users with a password set → bcrypt-validate against stored hash.
       *   3. Legacy users (no password set, created via the original email-only
       *      flow) → allow sign-in without a password to preserve backward
       *      compatibility with existing accounts. These users can set a
       *      password later via account settings.
       */
      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.trim().toLowerCase()
        const password = (credentials?.password as string | undefined) ?? ''

        if (!email || !password) return null

        try {
          const user = await db.user.findUnique({
            where:  { email },
            select: { id: true, email: true, name: true, password: true },
          })

          if (!user?.password) return null

          const ok = await bcrypt.compare(password, user.password)
          if (!ok) return null

          await db.user.update({
            where: { id: user.id },
            data:  { lastLoginAt: new Date() },
          }).catch(() => { /* non-fatal */ })

          return { id: user.id, email: user.email, name: user.name }

        } catch (err) {
          console.error('[auth] authorize error:', err)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Runs on sign-in (user defined) and every subsequent request (user undef).
      if (user?.id) {
        token.id = user.id

        const member = await db.workspaceMember.findFirst({
          where:   { userId: user.id },
          orderBy: { joinedAt: 'asc' },
          select:  { workspaceId: true },
        })
        if (member) token.workspaceId = member.workspaceId
      }
      return token
    },

    async session({ session, token }) {
      if (token.id)          session.user.id          = token.id
      if (token.workspaceId) session.user.workspaceId = token.workspaceId
      return session
    },
  },

  pages: {
    signIn: '/signin',
    error:  '/auth/error',
  },

  events: {
    async signIn({ user }) {
      if (!user?.id) return
      try {
        const member = await db.workspaceMember.findFirst({
          where:   { userId: user.id },
          orderBy: { joinedAt: 'asc' },
          include: { workspace: { select: { id: true, plan: true, monthlyCredits: true, bonusCredits: true } } },
        })
        trackServerEvent(ANALYTICS_EVENTS.LOGIN, {
          userId: user.id,
          email: user.email ?? null,
          plan: member?.workspace.plan ?? 'FREE',
          remainingCredits: member ? member.workspace.monthlyCredits + member.workspace.bonusCredits : 0,
          workspaceId: member?.workspace.id,
          method: 'credentials',
        })
      } catch {
        // analytics must never break the login flow
      }
    },
  },
})
