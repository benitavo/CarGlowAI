# CarGlow — Marketing site + Authenticated app

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Prisma · NextAuth

## Product scope

CarGlow does exactly two things to a vehicle photo:

1. **Background swap** — replaces the photo's background with a clean studio, outdoor, or lifestyle scene from a library of 15 backgrounds. The car itself is never modified.
2. **Plate masking & logo watermark** — automatically detects the license plate and replaces it with the dealer's plate frame (GDPR), then overlays the dealership logo as a watermark. Both happen in one step.

There is no upscaling, color editing, object removal, sky replacement, wheel/paint preview, 360° spins, or batch-only features. The UI, copy, and editor across the whole app reflect this two-feature scope.

## What's included

### Marketing site (`/`, `/pricing`, `/solutions/*`, `/features`, `/about`)
Full marketing pages from the original site, now in the `(marketing)` route group.

### Authenticated app (`/app/*`)
Nine fully-designed pages built on the same design system:

| Route | Page |
|---|---|
| `/app` | Dashboard — KPIs, recent enhancements, onboarding, activity, tips |
| `/app/editor` | Editor — background swap + plate/logo tools, before/after slider, history scrubber |
| `/app/library` | Library — grid/list views, smart folders, multi-select bulk actions |
| `/app/styles` | Styles — 15 backgrounds across 5 categories, preview drawer |
| `/app/brand-kit` | Brand Kit — multi-kit editor with live watermark preview |
| `/app/vehicles` | Vehicles — table view with status workflow, sort, filters |
| `/app/integrations` | Integrations — connected apps, API keys, webhooks (3 tabs) |
| `/app/team` | Team — members, roles, invites, permissions matrix, SSO/audit cards |
| `/app/billing` | Billing — plan, credits, usage chart, invoices, top-up & cancel flows |

### Auth & onboarding
Pre-authenticated pages with their own split-layout shell (form left, branded visual right):

| Route | Page |
|---|---|
| `/signin` | Sign in — magic link or password, Google + Apple OAuth |
| `/signup` | Sign up — name + email + dealership, with benefits |
| `/verify` | Post-magic-link "check your inbox" screen with resend + cooldown |
| `/forgot-password` | Password reset request |
| `/auth/error` | Error states (configuration, access denied, expired link, etc.) |
| `/onboarding` | 5-step wizard: workspace → brand → default style → invite team → first enhancement |

**End-to-end demo flow:** marketing → `/signup` → `/verify` (click "Continue without email" for demo) → `/onboarding` (5 steps) → `/app`

### Internationalization

The marketing site is localized in 5 languages: English (default), French, German, Spanish, Portuguese.

| Locale | URL pattern |
|---|---|
| English (default) | `/`, `/pricing`, `/about` (no prefix) |
| French | `/fr`, `/fr/pricing`, `/fr/about` |
| German | `/de`, `/de/pricing`, `/de/about` |
| Spanish | `/es`, `/es/pricing`, `/es/about` |
| Portuguese | `/pt`, `/pt/pricing`, `/pt/about` |

**What's translated:** Nav (all dropdowns + CTAs), Footer (every column + CTAs + bottom bar), home page hero + final CTA, pricing page hero + tier names. Body copy on individual marketing pages is currently English-only — translations live in `messages/{locale}.json` and can be extended page-by-page.

**Language switcher** works in both Nav (desktop globe icon, top right) and Footer (bottom bar). Auth/onboarding/app routes stay English (excluded via middleware).

**To add more translations:** add keys to `messages/en.json` first (source of truth), then to the other 4 locale files. In components, call `useTranslations('namespace')` and reference keys. See `Nav.tsx` and `Footer.tsx` for the pattern.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 for marketing, http://localhost:3000/app for the app.

## Architecture

```
src/
  app/
    (marketing)/        # Marketing route group with Nav + Footer layout
      page.tsx
      pricing/
      solutions/
      ...
    app/                # Authenticated app (no marketing chrome)
      layout.tsx        # Sidebar + topbar + cmd-K palette
      page.tsx          # Dashboard
      editor/
      library/
      styles/
      brand-kit/
      vehicles/
      integrations/
      team/
      billing/
    layout.tsx          # Root: html/body/fonts/theme only
  lib/
    mock-data.ts        # All demo fixtures (vehicles, photos, styles, team, etc.)
    utils.ts            # cn() helper
prisma/
  schema.prisma         # Complete production schema (Postgres)
```

## Current state — demo / UI-complete

This build delivers the entire authenticated UI with production-grade fidelity, wired to **mock data** in `src/lib/mock-data.ts`. All 9 pages render, all interactions work (selection, filters, tabs, modals, drawers, slider), and the design system matches the marketing site exactly (midnight/glow/offwhite palette, font-display/font-inter, grain texture, glass surfaces, glow shadows).

### What's complete
- Full UI for 9 authenticated pages
- Collapsible sidebar with workspace switcher
- Top bar with cmd+K command palette
- Mobile bottom tab bar
- Editor with 2 tools (background swap, plate & logo), before/after slider, processing overlay, hotkeys modal
- Complete Prisma schema with all models from the spec
- Package.json with all production dependencies

### What's not wired (backend work)
The following pieces from the spec are **scaffolded but not implemented** — pages use mock fixtures rather than database queries:

- **NextAuth v5** — install configured, but `auth.ts` and providers (Email/Google/Apple/Credentials) need to be wired
- **Prisma queries** — schema is complete, but page-level `prisma.X.findMany()` calls have not replaced `mock-data.ts` imports
- **Stripe** — `creditPacks` and plan tiers are defined, but Stripe Checkout / Customer Portal / webhooks need implementation
- **AI processing queue** — BullMQ/Redis worker for actual photo enhancement
- **S3/R2 uploads** — presigned URL endpoints for original/enhanced photos
- **Resend** — magic-link auth emails and team invite emails
- **i18n** — `next-intl` is installed but pages are English-only; locale files (`en`, `fr`, `es`, `de`, `pt`, `it`) need to be added
- **Real-time** — SSE endpoint for job progress (mocked with `setInterval` in the editor's processing overlay)

## To replace mocks with real data

For each page, swap the `mock-data` import for an async server component using Prisma. Example for the library page:

```tsx
// Before (current)
import { photos } from '@/lib/mock-data'

// After
import { prisma } from '@/lib/prisma'
const photos = await prisma.photo.findMany({
  where: { workspaceId: session.workspaceId },
  include: { vehicle: true, createdBy: true },
})
```

## Deploy

```bash
npx vercel
```

Required env vars:
- `DATABASE_URL` (Postgres)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`
- `REDIS_URL` (for BullMQ)

## Brand tokens

Defined in `tailwind.config.ts` and `src/app/globals.css`:
- `midnight` (50-900) — base background `#0B1220`
- `glow` (50-900) — primary accent `#FF8A3D`
- `offwhite` (50-900) — text `#F7F5F1`
- `font-display` (General Sans for headings, falls back to Inter)
- `font-inter` (body)
- Custom shadows: `glow-sm/md/lg`, `card`, `card-hover`
- Utility classes: `grain`, `glass`, `glow-border`, `card-noise`, `text-gradient`, `eyebrow`
