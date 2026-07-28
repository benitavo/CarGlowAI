'use client'

import { useEffect, useState } from 'react'
import { Star, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReviewPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)

  const [stars, setStars]             = useState(5)
  const [quote, setQuote]             = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole]               = useState('')
  const [location, setLocation]       = useState('')
  const [consent, setConsent]         = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        setWorkspaceId(d.workspaceId ?? null)
        if (d.name) setDisplayName(d.name)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const valid = quote.trim().length > 0 && displayName.trim().length > 0 && consent && !!workspaceId

  async function submit() {
    if (!valid) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, quote, stars, displayName, role, location }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="pb-24 lg:pb-12 flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 text-sage-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[700px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">Votre avis</div>
          <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">Racontez votre expérience.</h1>
          <p className="text-midnight/45 mt-2 text-[15px]">
            Deux minutes suffisent. Avec votre accord, votre témoignage peut être affiché publiquement sur le site Verdia.
          </p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[700px] space-y-6">
        {saved ? (
          <div className="rounded-2xl border border-sage-200 bg-sage-50 p-8 text-center">
            <Check className="w-10 h-10 text-sage-500 mx-auto mb-3" strokeWidth={1.75} />
            <h2 className="font-display font-semibold text-lg text-midnight mb-1">Merci !</h2>
            <p className="text-midnight/50 text-sm">Votre avis a été transmis et sera examiné avant une éventuelle publication.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
              <h2 className="font-display font-semibold text-base text-midnight mb-4">Note</h2>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setStars(n)} aria-label={`${n} étoiles`}>
                    <Star className={cn('w-7 h-7 transition-colors', n <= stars ? 'text-sage-500 fill-sage-500' : 'text-midnight/15')} />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
              <h2 className="font-display font-semibold text-base text-midnight mb-4">Votre témoignage</h2>
              <textarea
                value={quote}
                onChange={e => setQuote(e.target.value)}
                maxLength={600}
                rows={5}
                placeholder="Qu'est-ce que Verdia vous a apporté ?"
                className="w-full bg-cream-50 border border-sage-200 rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors resize-none"
              />
              <p className="text-xs text-midnight/35 mt-1.5 text-right">{quote.length}/600</p>
            </div>

            <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6 space-y-4">
              <h2 className="font-display font-semibold text-base text-midnight">Comment vous présenter</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-widest mb-1.5 block">Nom affiché</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Thomas B."
                    className="w-full bg-cream-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-widest mb-1.5 block">Métier (optionnel)</label>
                  <input type="text" value={role} onChange={e => setRole(e.target.value)}
                    placeholder="Paysagiste"
                    className="w-full bg-cream-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-midnight/50 uppercase tracking-widest mb-1.5 block">Ville (optionnel)</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Lyon, 69"
                  className="w-full sm:w-1/2 bg-cream-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors" />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-midnight/60 px-1">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-sage-500" />
              J&apos;accepte que ce témoignage soit affiché publiquement sur le site Verdia, après validation.
            </label>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={!valid || saving}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sage-sm transition-all"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : 'Envoyer mon avis'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
