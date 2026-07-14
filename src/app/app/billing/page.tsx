'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ExternalLink, Plus, Lock, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { creditPacks } from '@/lib/mock-data'

const PLAN_FEATURES: Record<string, { credits: number; price: number; features: string[] }> = {
  TRIAL:      { credits: 3,      price: 0,   features: ['3 rendus offerts', 'Tous les styles', 'Export PNG/JPG'] },
  STARTER:    { credits: 500,    price: 49,  features: ['500 crédits / mois', 'Tous les styles', 'Export PNG/JPG', 'Support e-mail'] },
  GROWTH:     { credits: 3000,   price: 249, features: ['3 000 crédits / mois', 'Tous les styles', 'Export 4K', 'API & webhooks', 'Support prioritaire'] },
  PRO:        { credits: 10_000, price: 599, features: ['10 000 crédits / mois', 'Styles personnalisés', 'Export 8K', 'SSO', 'CSM dédié'] },
  ENTERPRISE: { credits: -1,     price: -1,  features: ['Crédits illimités', 'Sièges illimités', 'SLA personnalisé'] },
}

const PACK_SLUG: Record<string, string> = {
  cp_500:   'credits_500',
  cp_2000:  'credits_2000',
  cp_5000:  'credits_5000',
  cp_15000: 'credits_15000',
}

interface WorkspaceInfo {
  workspaceId:      string
  workspaceName:    string
  plan:             string
  creditsRemaining: number
  creditsPerMonth:  number
}

export default function BillingPage() {
  const [showTopUp, setShowTopUp]         = useState(false)
  const [workspace, setWorkspace]         = useState<WorkspaceInfo | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const plan             = workspace?.plan ?? 'TRIAL'
  const creditsRemaining = workspace?.creditsRemaining ?? 0
  const creditsPerMonth  = workspace?.creditsPerMonth  ?? 50
  const pct = creditsPerMonth > 0 ? (creditsRemaining / creditsPerMonth) * 100 : 0
  const planMeta = PLAN_FEATURES[plan] ?? PLAN_FEATURES.TRIAL

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setWorkspace({
        workspaceId:      d.workspaceId,
        workspaceName:    d.workspaceName,
        plan:             d.plan ?? 'TRIAL',
        creditsRemaining: d.creditsRemaining,
        creditsPerMonth:  d.creditsPerMonth ?? 50,
      }))
      .catch(() => {})
  }, [])

  const openPortal = useCallback(async () => {
    if (!workspace?.workspaceId || portalLoading) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ workspaceId: workspace.workspaceId }),
      })
      const { url, error } = await res.json()
      if (!res.ok) throw new Error(error)
      window.location.href = url
    } catch (e) {
      console.error('[billing] portal error:', e)
    } finally {
      setPortalLoading(false)
    }
  }, [workspace, portalLoading])

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">
      {/* Header */}
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1480px]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">
                Abonnement &amp; facturation
              </div>
              <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">
                Plan {plan.charAt(0) + plan.slice(1).toLowerCase()}
              </h1>
              <p className="text-midnight/45 mt-2 text-[15px]">
                {workspace ? `${creditsRemaining.toLocaleString()} crédits restants` : 'Chargement…'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openPortal}
                disabled={portalLoading || !workspace}
                className="rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white px-5 py-2.5 font-semibold text-sm transition-colors"
              >
                {portalLoading ? 'Ouverture…' : 'Gérer mon plan'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-8 max-w-[1480px]">
        <div className="grid lg:grid-cols-2 gap-4 max-w-2xl">

          {/* Plan card */}
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 mb-1">Plan actuel</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl text-midnight">
                    {plan.charAt(0) + plan.slice(1).toLowerCase()}
                  </span>
                  {planMeta.price > 0 && (
                    <span className="text-midnight/40 text-sm">€{planMeta.price}/mois</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
                {plan === 'TRIAL' ? 'Essai' : 'Actif'}
              </span>
            </div>

            <ul className="space-y-2 mb-5">
              {planMeta.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-midnight/65">
                  <Check className="w-3.5 h-3.5 text-sage-500 flex-shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-sage-100">
              <button
                onClick={openPortal}
                disabled={portalLoading || !workspace}
                className="text-sage-600 hover:text-sage-700 disabled:opacity-50 inline-flex items-center gap-1 text-sm font-medium"
              >
                Gérer mon plan
                <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Credits card */}
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 mb-1">Crédits restants</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl tabular-nums text-midnight">
                    {creditsRemaining.toLocaleString()}
                  </span>
                  <span className="text-midnight/40 text-sm tabular-nums">
                    / {creditsPerMonth.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                disabled={!workspace}
                className="rounded-lg bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                Recharger
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sage-500 to-sage-400 rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-midnight/45">
                <span><span className="tabular-nums text-midnight/70">{Math.round(pct)}%</span> restants</span>
                <span>{creditsPerMonth.toLocaleString()} / mois</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {showTopUp && (
        <TopUpModal
          workspaceId={workspace?.workspaceId ?? ''}
          onClose={() => setShowTopUp(false)}
        />
      )}
    </div>
  )
}

function TopUpModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const [selected, setSelected] = useState(creditPacks[1].id)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const pack = creditPacks.find((p) => p.id === selected)!

  const handlePay = async () => {
    if (!workspaceId || loading) return
    setLoading(true)
    setError(null)
    try {
      const plan = PACK_SLUG[selected]
      if (!plan) throw new Error('Pack inconnu')
      const res = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan, workspaceId }),
      })
      const { url, error: apiError } = await res.json()
      if (!res.ok) throw new Error(apiError ?? 'Erreur de paiement')
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-midnight/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white border border-sage-100 rounded-2xl w-full max-w-xl p-6 pointer-events-auto shadow-card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-lg text-midnight">Recharger des crédits</h3>
              <p className="text-sm text-midnight/45 mt-0.5">
                Les achats ponctuels n&apos;expirent jamais.
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-sage-50 text-midnight/40">
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {creditPacks.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  'relative rounded-xl border p-4 text-left transition-colors',
                  selected === p.id
                    ? 'border-sage-400 bg-sage-50'
                    : 'border-sage-100 bg-white hover:bg-cream-50',
                )}
              >
                {p.popular && (
                  <div className="absolute -top-2 right-3 text-[9px] font-semibold uppercase tracking-wider bg-sage-500 text-white px-1.5 py-0.5 rounded">
                    Populaire
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-sage-500" strokeWidth={2} />
                  <span className="font-display font-bold text-lg tabular-nums text-midnight">{p.credits.toLocaleString()}</span>
                  <span className="text-xs text-midnight/45">crédits</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="tabular-nums font-semibold text-midnight">€{p.price}</span>
                  <span className="text-xs text-midnight/40 tabular-nums">€{p.perPhoto} / rendu</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-sage-100 bg-cream-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-midnight/60"><span>Crédits</span><span className="tabular-nums text-midnight">{pack.credits.toLocaleString()}</span></div>
            <div className="flex justify-between text-midnight/60"><span>Prix HT</span><span className="tabular-nums text-midnight">€{pack.price}.00</span></div>
            <div className="flex justify-between text-midnight/60"><span>TVA (20%)</span><span className="tabular-nums text-midnight">€{(pack.price * 0.20).toFixed(2)}</span></div>
            <div className="h-px bg-sage-100" />
            <div className="flex justify-between font-semibold text-midnight">
              <span>Total TTC</span>
              <span className="tabular-nums">€{(pack.price * 1.20).toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-rose-500 mt-3">{error}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onClose} className="rounded-lg border border-sage-200 bg-white hover:bg-cream-50 px-3.5 py-2 text-sm text-midnight/60">
              Annuler
            </button>
            <button
              onClick={handlePay}
              disabled={loading}
              className="rounded-lg bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              {loading ? 'Redirection…' : `Payer €${(pack.price * 1.20).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
