'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard, Wand2, FolderOpen,
  CreditCard, LogOut, ShieldCheck, Palette, Users,
  AlertCircle, Loader2, RefreshCw, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { identifyUser, resetAnalyticsIdentity } from '@/lib/analytics/client'
import { PromoBanner } from './PromoBanner'

const VERIFY_DISMISS_KEY = 'verdia-verify-reminder-dismissed'

// Non-blocking reminder for accounts that used their one free unverified generation
// (see /api/generate) — everything past that (second render, video, retouch, kit
// marketing, billing) needs a verified email, so this stays visible until they either
// verify or dismiss it for the session.
function VerifyReminderBanner() {
  const [dismissed, setDismissed] = useState(true)
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(VERIFY_DISMISS_KEY) === '1')
  }, [])

  if (dismissed) return null

  const resend = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Erreur inconnue')
      } else {
        setSent(true)
      }
    } catch {
      setError('Erreur inconnue')
    } finally {
      setSending(false)
    }
  }

  const dismiss = () => {
    sessionStorage.setItem(VERIFY_DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center gap-3 text-sm">
      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.75} />
      <span className="flex-1 min-w-0 text-amber-900">
        {sent
          ? 'E-mail de vérification envoyé — pensez à vérifier vos spams.'
          : 'Vérifiez votre e-mail pour générer d\'autres rendus et accéder à la facturation.'}
      </span>
      {!sent && (
        <button onClick={resend} disabled={sending}
          className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 font-semibold whitespace-nowrap disabled:opacity-60">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Renvoyer l&apos;e-mail
        </button>
      )}
      {error && <span className="text-rose-600 text-xs whitespace-nowrap">{error}</span>}
      <button onClick={dismiss} aria-label="Masquer" className="text-amber-400 hover:text-amber-700 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

const NAV = [
  { label: 'Tableau de bord', href: '/app',           icon: LayoutDashboard },
  { label: 'Générateur',      href: '/app/editor',    icon: Wand2 },
  { label: 'Mes rendus',      href: '/app/library',   icon: FolderOpen },
  { label: 'Marque',          href: '/app/brand-kit', icon: Palette },
  { label: 'Abonnement',      href: '/app/billing',   icon: CreditCard },
]

const NAV_MOBILE = [
  { label: 'Accueil',  href: '/app',           icon: LayoutDashboard },
  { label: 'Générer',  href: '/app/editor',    icon: Wand2 },
  { label: 'Rendus',   href: '/app/library',   icon: FolderOpen },
  { label: 'Marque',   href: '/app/brand-kit', icon: Palette },
  { label: 'Plan',     href: '/app/billing',   icon: CreditCard },
]

interface WorkspaceSummary {
  workspaceId:      string
  plan:             string
  creditsRemaining: number
  isSuperuser:      boolean
}

interface InitialWorkspace {
  workspaceId: string
  plan: string
  creditsRemaining: number
  isSuperuser: boolean
}

export default function AppLayoutClient({
  children, initialWorkspace, emailVerified,
}: {
  children: React.ReactNode
  initialWorkspace: InitialWorkspace | null
  emailVerified: boolean
}) {
  const pathname          = usePathname()
  const router            = useRouter()
  const { data: session } = useSession()
  // Seeded from the server (layout.tsx already fetched this) — the sidebar shows real
  // numbers immediately instead of "—" while a client fetch resolves. The effect below
  // still refreshes once client-side to pick up anything that changed since that render.
  const [ws, setWs] = useState<WorkspaceSummary | null>(initialWorkspace)

  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        setWs({
          workspaceId:      d.workspaceId,
          plan:             d.plan ?? 'FREE',
          creditsRemaining: d.creditsRemaining ?? 0,
          isSuperuser:      !!d.isSuperuser,
        })
        if (session.user!.id) {
          identifyUser(session.user!.id, { email: session.user!.email, plan: d.plan, workspaceId: d.workspaceId })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session?.user?.id])

  const nav = ws?.isSuperuser
    ? [
        ...NAV,
        { label: 'Admin utilisateurs', href: '/app/admin/users',   icon: Users },
        { label: 'Admin tarifs',       href: '/app/admin/pricing', icon: ShieldCheck },
      ]
    : NAV

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    resetAnalyticsIdentity()
    router.push('/signin')
    router.refresh()
  }

  const displayName = session?.user?.name ?? session?.user?.email ?? 'You'
  const planLabel   = ws?.plan ? ws.plan.charAt(0) + ws.plan.slice(1).toLowerCase() : '—'
  const avatarChar  = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-cream-50 text-midnight flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[210px] shrink-0 flex-col border-r border-sage-100 bg-white">
        <Link href="/" className="flex items-center h-24 px-5 border-b border-sage-100">
          <Image src="/logo%20verdia%20without%20background.png" alt="Verdia" height={500} width={500} className="h-16 w-auto object-contain" />
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(item => {
            const active = item.href === '/app'
              ? pathname === '/app'
              : !!pathname?.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'relative flex items-center gap-3 h-9 px-3 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-sage-50 text-sage-700 border border-sage-200/80'
                    : 'text-midnight/50 hover:text-midnight hover:bg-cream-100',
                )}>
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-sage-500" />}
                <item.icon className={cn('w-[17px] h-[17px] shrink-0', active ? 'text-sage-600' : 'text-midnight/35')} strokeWidth={1.75} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sage-100 p-3 space-y-2">
          {/* Present on every /app page (this is the persistent sidebar) — the single most
              reliable place to catch a user at 0 credits regardless of which page they're on. */}
          <Link
            href={ws?.creditsRemaining === 0 ? '/app/billing?topup=1' : '/app/billing'}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl border transition-colors',
              ws?.creditsRemaining === 0
                ? 'bg-rose-50 border-rose-200 hover:border-rose-300 animate-pulse'
                : 'bg-sage-50 border-sage-200 hover:border-sage-300',
            )}
          >
            <span className={cn('text-xs', ws?.creditsRemaining === 0 ? 'text-rose-600' : 'text-midnight/50')}>
              {ws?.creditsRemaining === 0 ? 'Recharger' : 'Crédits'}
            </span>
            <span className={cn('text-sm font-semibold tabular-nums', ws?.creditsRemaining === 0 ? 'text-rose-700' : 'text-sage-700')}>
              {ws ? ws.creditsRemaining.toLocaleString() : '—'}
            </span>
          </Link>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-sage-100 border border-sage-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-sage-600">{avatarChar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-midnight truncate">{displayName}</div>
              <div className="text-[10px] text-midnight/40 truncate">{planLabel}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-midnight/30 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* No fixed header to account for here (unlike the marketing Nav) — this layout is a
            plain flex column, so the banners just push `main` down normally. */}
        {!emailVerified && <VerifyReminderBanner />}
        <PromoBanner ctaHref="/app/billing" />
        <main className="flex-1 min-w-0 overflow-auto pb-16 lg:pb-0">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 h-16 bg-white border-t border-sage-100 flex">
        {NAV_MOBILE.map(it => {
          const active = it.href === '/app' ? pathname === '/app' : !!pathname?.startsWith(it.href)
          return (
            <Link key={it.href} href={it.href}
              className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-sage-600' : 'text-midnight/40')}>
              <it.icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px] font-medium">{it.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
