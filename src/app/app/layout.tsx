'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Wand2, FolderOpen,
  CreditCard, Zap, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/app',         icon: LayoutDashboard },
  { label: 'Editor',    href: '/app/editor',  icon: Wand2 },
  { label: 'Library',   href: '/app/library', icon: FolderOpen },
  { label: 'Billing',   href: '/app/billing', icon: CreditCard },
]

const NAV_MOBILE = [
  { label: 'Home',    href: '/app',         icon: LayoutDashboard },
  { label: 'Editor',  href: '/app/editor',  icon: Wand2 },
  { label: 'Photos',  href: '/app/library', icon: FolderOpen },
  { label: 'Billing', href: '/app/billing', icon: CreditCard },
]

interface WorkspaceSummary {
  workspaceId:      string
  plan:             string
  creditsRemaining: number
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname            = usePathname()
  const router              = useRouter()
  const { data: session }   = useSession()
  const [ws, setWs]         = useState<WorkspaceSummary | null>(null)

  // Pull workspace summary (plan + credits) for the sidebar.
  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    fetch('/api/me')
      .then(r => r.json())
      .then(d => { if (!cancelled) setWs({
        workspaceId:      d.workspaceId,
        plan:             d.plan ?? 'TRIAL',
        creditsRemaining: d.creditsRemaining ?? 0,
      })})
      .catch(() => {})
    return () => { cancelled = true }
  }, [session?.user?.id])

  // Fix for the logout bug. Two-step pattern works across next-auth v4 and v5:
  //   1. signOut({ redirect: false }) — clear the JWT cookie
  //   2. router.push('/signin') + refresh() — kick to the sign-in page and
  //      force middleware to re-evaluate authorization on /app/*
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
    <div className="min-h-screen bg-midnight text-offwhite flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[200px] shrink-0 flex-col border-r border-white/[0.06] bg-midnight-800/40">
        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2 h-16 px-4 border-b border-white/[0.06] group">
          <div className="w-8 h-8 rounded-lg bg-glow-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
            <Zap className="w-4 h-4 text-midnight" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-[1.05rem] tracking-tight">
            Car<span className="text-glow-500">Glow</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const active = item.href === '/app'
              ? pathname === '/app'
              : !!pathname?.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'relative flex items-center gap-3 h-9 px-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-white/[0.06] text-offwhite'
                    : 'text-offwhite/50 hover:text-offwhite hover:bg-white/[0.03]'
                )}>
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-glow-500" />}
                <item.icon className={cn('w-[17px] h-[17px] shrink-0', active ? 'text-glow-400' : 'text-offwhite/40')} strokeWidth={1.75} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + credits */}
        <div className="border-t border-white/[0.06] p-3 space-y-2">
          <Link href="/app/billing"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-glow-500/30 transition-colors">
            <span className="text-xs text-offwhite/50">Credits</span>
            <span className="text-sm font-semibold tabular-nums text-offwhite">
              {ws ? ws.creditsRemaining.toLocaleString() : '—'}
            </span>
          </Link>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-glow-500/15 border border-glow-500/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-glow-400">{avatarChar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">{displayName}</div>
              <div className="text-[10px] text-offwhite/40 truncate">{planLabel}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-offwhite/30 hover:text-rose-400 transition-colors p-1 rounded hover:bg-white/[0.04]"
              title="Sign out"
              aria-label="Sign out"
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
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 h-16 bg-midnight-800/95 backdrop-blur-xl border-t border-white/[0.08] flex">
        {NAV_MOBILE.map(it => {
          const active = it.href === '/app' ? pathname === '/app' : !!pathname?.startsWith(it.href)
          return (
            <Link key={it.href} href={it.href}
              className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-glow-400' : 'text-offwhite/45')}>
              <it.icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px] font-medium">{it.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
