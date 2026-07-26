import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getPricingConfig, monthlyCreditsForPlan } from '@/lib/pricing'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

// Full NextAuth instance (Node.js runtime — uses bcrypt + Prisma directly in authorize()).
// Lives outside app/api/auth/[...nextauth]/route.ts because Next's typed route handlers only
// allow a route module to export GET/POST/etc — anything else (auth, signIn, signOut) fails
// the build's route type-check. The route file just re-exports { GET, POST } from here.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Still JWT sessions (required — Credentials providers can't use database sessions). The
  // adapter below is only exercised by the Google provider: Auth.js's Credentials handling
  // never touches the adapter, authorize()'s return value goes straight into the JWT exactly
  // as before. This is what lets both providers coexist without changing the Credentials path.
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google verifies the email before issuing it in the profile, so treating it as
      // pre-verified and auto-linking to an existing password account with the same email is
      // the standard, low-risk case for this flag — it would NOT be safe with an arbitrary or
      // unverified-email provider.
      allowDangerousEmailAccountLinking: true,
      // NOTE: this emailVerified is currently dead for brand-new sign-ups — Auth.js's own
      // core (handle-login.js, the no-existing-account OAuth branch) unconditionally does
      // `createUser({ ...profile, emailVerified: null })`, which overwrites whatever this
      // callback returns. Left in place in case that ever changes upstream; the real fix is
      // the explicit update in events.createUser below.
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        }
      },
    }),
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
    // Fires once, right after the adapter inserts a brand-new User row — in this app that only
    // ever happens for the Google provider (Credentials' authorize() bypasses the adapter
    // entirely, exactly as before). Mirrors /api/auth/register's user+workspace+membership
    // bundle so a first-time Google sign-in ends up with somewhere to attach credits/photos to,
    // instead of a bare User row and a broken workspaceId lookup in the jwt() callback above.
    //
    // Also re-sets emailVerified here: Auth.js's core forces it to null on this exact code
    // path regardless of what the provider's profile() callback returns (verified by reading
    // node_modules/@auth/core/lib/actions/callback/handle-login.js directly — the no-existing-
    // account OAuth branch does `createUser({ ...profile, emailVerified: null })`, which wins
    // over our profile() mapping). Safe to always set here rather than re-check Google's claim,
    // since this handler only ever runs for Google sign-ups in this app.
    async createUser({ user }) {
      if (!user.id) return
      try {
        const config = await getPricingConfig()
        const freeCredits = monthlyCreditsForPlan(config, 'FREE')
        const nextReset = new Date()
        nextReset.setMonth(nextReset.getMonth() + 1)

        const [workspace] = await Promise.all([
          db.workspace.create({
            data: {
              name:           user.name ?? 'My Workspace',
              slug:           `ws-${user.id}`,
              plan:           'FREE',
              monthlyCredits: freeCredits,
              renewalDate:    nextReset,
              members: { create: { userId: user.id, role: 'OWNER' } },
            },
          }),
          db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
        ])

        trackServerEvent(ANALYTICS_EVENTS.ACCOUNT_CREATED, {
          userId: user.id,
          email: user.email ?? null,
          plan: 'FREE',
          remainingCredits: freeCredits,
          workspaceId: workspace.id,
          method: 'google',
        })
      } catch (err) {
        console.error('[auth] createUser workspace provisioning failed:', err)
      }
    },

    async signIn({ user, account }) {
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
          method: account?.provider === 'google' ? 'google' : 'credentials',
        })
      } catch {
        // analytics must never break the login flow
      }
    },
  },
})
