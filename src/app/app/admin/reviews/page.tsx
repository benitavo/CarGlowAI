'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, Loader2, Star, Check, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewRow {
  id: string
  quote: string
  stars: number
  displayName: string
  role: string | null
  location: string | null
  approved: boolean
  createdAt: string
  email: string
}

type LoadState = 'loading' | 'forbidden' | 'ready' | 'error'

export default function AdminReviewsPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [reviews, setReviews] = useState<ReviewRow[]>([])

  const load = useCallback(() => {
    fetch('/api/admin/reviews')
      .then(async r => {
        if (r.status === 403) { setState('forbidden'); return }
        if (!r.ok) { setState('error'); return }
        const d = await r.json()
        setReviews(d.reviews)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => { load() }, [load])

  async function setApproved(id: string, approved: boolean) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r))
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    }).catch(() => {})
  }

  async function remove(id: string) {
    setReviews(prev => prev.filter(r => r.id !== id))
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }).catch(() => {})
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

  const pending = reviews.filter(r => !r.approved)
  const approved = reviews.filter(r => r.approved)

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1000px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">Administration</div>
          <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">Avis clients</h1>
          <p className="text-midnight/45 mt-2 text-[15px]">
            {pending.length} en attente · {approved.length} publié{approved.length > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-8 max-w-[1000px] space-y-10">
        {reviews.length === 0 && (
          <p className="text-sm text-midnight/45">Aucun avis pour l&apos;instant.</p>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-sm text-midnight/70 uppercase tracking-wide mb-3">En attente de validation</h2>
            <div className="space-y-3">
              {pending.map(r => <ReviewCard key={r.id} r={r} onApprove={() => setApproved(r.id, true)} onRemove={() => remove(r.id)} />)}
            </div>
          </div>
        )}

        {approved.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-sm text-midnight/70 uppercase tracking-wide mb-3">Publiés</h2>
            <div className="space-y-3">
              {approved.map(r => <ReviewCard key={r.id} r={r} onUnpublish={() => setApproved(r.id, false)} onRemove={() => remove(r.id)} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function ReviewCard({ r, onApprove, onUnpublish, onRemove }: {
  r: ReviewRow
  onApprove?: () => void
  onUnpublish?: () => void
  onRemove: () => void
}) {
  return (
    <div className={cn(
      'rounded-2xl border bg-white shadow-sm p-5',
      r.approved ? 'border-sage-200' : 'border-sage-100',
    )}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-sage-500 fill-sage-500" />)}
        </div>
        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
          r.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
        )}>
          {r.approved ? 'Publié' : 'En attente'}
        </span>
      </div>
      <p className="text-sm text-midnight/80 leading-relaxed mb-3">&ldquo;{r.quote}&rdquo;</p>
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-midnight/45">
          <span className="font-semibold text-midnight/70">{r.displayName}</span>
          {r.role && <> · {r.role}</>}
          {r.location && <> · {r.location}</>}
          <span className="block mt-0.5">{r.email} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onApprove && (
            <button onClick={onApprove} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sage-500 hover:bg-sage-600 text-white text-xs font-semibold transition-colors">
              <Check className="w-3.5 h-3.5" /> Publier
            </button>
          )}
          {onUnpublish && (
            <button onClick={onUnpublish} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-midnight/[0.12] hover:border-midnight/[0.25] text-midnight/60 text-xs font-semibold transition-colors">
              <X className="w-3.5 h-3.5" /> Dépublier
            </button>
          )}
          <button onClick={onRemove} aria-label="Supprimer" className="p-1.5 rounded-lg text-midnight/30 hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
