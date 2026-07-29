'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, Loader2, Star, Trash2, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackRow {
  id: string
  message: string
  rating: number | null
  createdAt: string
  email: string
  name: string | null
  workspaceName: string
  plan: string
}

type LoadState = 'loading' | 'forbidden' | 'ready' | 'error'

export default function AdminFeedbackPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [rows, setRows] = useState<FeedbackRow[]>([])

  const load = useCallback(() => {
    fetch('/api/admin/feedback')
      .then(async r => {
        if (r.status === 403) { setState('forbidden'); return }
        if (!r.ok) { setState('error'); return }
        const d = await r.json()
        setRows(d.feedback)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => { load() }, [load])

  async function remove(id: string) {
    setRows(prev => prev.filter(r => r.id !== id))
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' }).catch(() => {})
  }

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

  if (state === 'error') {
    return <div className="p-10 text-center text-sm text-rose-500">Impossible de charger les avis.</div>
  }

  const avgRating = rows.filter(r => r.rating != null).length > 0
    ? rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.filter(r => r.rating != null).length
    : null

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1000px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">Administration</div>
          <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">
            Avis contre crédit gratuit
          </h1>
          <p className="text-midnight/45 mt-2 text-[15px]">
            {rows.length} avis{avgRating != null && ` · note moyenne ${avgRating.toFixed(1)}/5`}
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-8 max-w-[1000px] space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-midnight/45">Aucun avis pour l&apos;instant.</p>
        )}

        {rows.map(r => (
          <div key={r.id} className="rounded-2xl border border-sage-100 bg-white shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {r.rating != null ? (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn('w-3.5 h-3.5', i < r.rating! ? 'text-amber-400 fill-amber-400' : 'text-midnight/15')}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-midnight/30">Pas de note</span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200">
                  <Gift className="w-3 h-3" /> {r.plan}
                </span>
              </div>
              <button onClick={() => remove(r.id)} aria-label="Supprimer" className="p-1.5 rounded-lg text-midnight/30 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-midnight/80 leading-relaxed mb-3">&ldquo;{r.message}&rdquo;</p>
            <div className="text-xs text-midnight/45">
              <span className="font-semibold text-midnight/70">{r.name ?? r.email}</span>
              {' '}· {r.workspaceName}
              <span className="block mt-0.5">{r.email} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
