'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard, Wand2, FolderOpen,
  CreditCard, LogOut, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { identifyUser } from '@/lib/analytics/client'

const NAV = [
  { label: 'Tableau de bord', href: '/app',         icon: LayoutDashboard },
  { label: 'Générateur',      href: '/app/editor',  icon: Wand2 },
  { label: 'Mes rendus',      href: '/app/library', icon: FolderOpen },
  { label: 'Abonnement',      href: '/app/billing', icon: CreditCard },
]

const NAV_MOBILE = [
  { label: 'Accueil',  href: '/app',         icon: LayoutDashboard },
  { label: 'Générer',  href: '/app/editor',  icon: Wand2 },
  { label: 'Rendus',   href: '/app/library', icon: FolderOpen },
  { label: 'Plan',     href: '/app/billing', icon: CreditCard },
]

interface WorkspaceSummary {
  workspaceId:      string
  plan:             string
  creditsRemaining: number
  isSuperuser:      boolean
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname            = usePathname()
  const router              = useRouter()
  const { data: session }   = useSession()
  const [ws, setWs]         = useState<WorkspaceSummary | null>(null)

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
    ? [...NAV, { label: 'Admin tarifs', href: '/app/admin/pricing', icon: ShieldCheck }]
    : NAV

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/signin')
    router.refresh()
  }

  const displayName  = session?.user?.name  ?? session?.user?.email ?? 'You'
  const displayEmail = session?.user?.email ?? ''
  const planLabel    = ws?.plan ? ws.plan.charAt(0) + ws.plan.slice(1).toLowerCase() : '—'
  const avatarChar   = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-cream-50 text-midnight flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[210px] shrink-0 flex-col border-r border-sage-100 bg-white">
        {/* Logo */}
        <Link href="/" className="flex items-center h-24 px-5 border-b border-sage-100">
          <Image src="/logo%20verdia%20without%20background.png" alt="Verdia" height={64} width={209} className="h-16 w-auto object-contain" />
        </Link>

        {/* Nav */}
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

        {/* User + credits */}
        <div className="border-t border-sage-100 p-3 space-y-2">
          <Link href="/app/billing"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-sage-50 border border-sage-200 hover:border-sage-300 transition-colors">
            <span className="text-xs text-midnight/50">Crédits</span>
            <span className="text-sm font-semibold tabular-nums text-sage-700">
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-w-0 overflow-auto pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
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
