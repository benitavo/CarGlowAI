'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, Loader2, Users, Sparkles, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoogleIcon } from '@/components/GoogleIcon'

interface UserRow {
  id: string
  email: string
  name: string | null
  createdAt: string
  emailVerified: boolean
  provider: string
  plan: string | null
  creditsRemaining: number | null
  photosCreated: number
}

interface Summary {
  totalUsers: number
  activated: number
  totalPhotos: number
}

type LoadState = 'loading' | 'forbidden' | 'ready' | 'error'

export default function AdminUsersPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [users, setUsers] = useState<UserRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  const load = useCallback(() => {
    fetch('/api/admin/users')
      .then(async r => {
        if (r.status === 403) { setState('forbidden'); return }
        if (!r.ok) { setState('error'); return }
        const d = await r.json()
        setUsers(d.users)
        setSummary(d.summary)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => { load() }, [load])

  if (state === 'loading') {
    return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-sage-400" /></div>
  }

  if (state === 'forbidden') {
    return (
      <div className="p-10 flex flex-col items-center text-center gap-3 max-w-md mx-auto mt-16">
        <ShieldAlert className="w-8 h-8 text-rose-400" />
        <p className="font-display font-semibold text-midnight">Accès réservé</p>
        <p className="text-sm text-midnight/50">Cette page est réservée aux administrateurs.</p>
      </div>
    )
  }

  if (state === 'error' || !summary) {
    return <div className="p-10 text-center text-sm text-rose-500">Impossible de charger les utilisateurs.</div>
  }

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1200px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">
            Administration
          </div>
          <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">
            Inscriptions &amp; crédits
          </h1>
          <p className="text-midnight/45 mt-2 text-[15px]">
            Tous les comptes, triés du plus récent au plus ancien.
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-8 max-w-[1200px] space-y-8">

        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          <SummaryCard icon={Users} label="Inscrits" value={summary.totalUsers} />
          <SummaryCard icon={Sparkles} label="Ont généré au moins 1 rendu" value={summary.activated} sub={`${summary.totalUsers ? Math.round((summary.activated / summary.totalUsers) * 100) : 0}% des inscrits`} />
          <SummaryCard icon={ImageIcon} label="Rendus créés au total" value={summary.totalPhotos} />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-sage-100 bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wide text-midnight/40">
                <th className="px-4 py-3 font-semibold">Inscrit le</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Connexion</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Crédits restants</th>
                <th className="px-4 py-3 font-semibold">Rendus créés</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-sage-50 last:border-0 hover:bg-sage-50/40 transition-colors">
                  <td className="px-4 py-3 text-midnight/60 whitespace-nowrap tabular-nums">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-midnight/80">{u.email}</td>
                  <td className="px-4 py-3 text-midnight/60">{u.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {u.provider === 'google' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-midnight/60">
                        <GoogleIcon className="w-3.5 h-3.5" /> Google
                      </span>
                    ) : (
                      <span className="text-xs text-midnight/60">Email</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-midnight/60">{u.plan ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-midnight/70">{u.creditsRemaining ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums',
                      u.photosCreated > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-midnight/[0.04] text-midnight/40 border border-midnight/[0.08]',
                    )}>
                      {u.photosCreated}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-sage-100 bg-white px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-200/60 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-midnight tabular-nums leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-midnight/45 mt-1">{label}</p>
        {sub && <p className="text-[11px] text-sage-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
