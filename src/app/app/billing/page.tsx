'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ExternalLink, Plus, Lock, Zap, X, ArrowUpRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingPlan {
  id: 'FREE' | 'ESSENTIAL' | 'PRO' | 'BUSINESS'
  label: string
  price: number
  credits: number
}

interface CreditPack {
  id: 'pack1' | 'pack2' | 'pack3'
  credits: number
  price: number
}

interface PricingData {
  plans: PricingPlan[]
  packs: CreditPack[]
}

interface WorkspaceInfo {
  workspaceId: string
  workspaceName: string
  plan: string
  monthlyCredits: number
  bonusCredits: number
  subscriptionStatus: string
  renewalDate: string | null
}

interface CreditTx {
  id: string
  delta: number
  balanceAfter: number
  reason: string
  featureKey: string | null
  notes: string | null
  createdAt: string
}

const REASON_LABEL: Record<string, string> = {
  MONTHLY_GRANT: 'Crédit mensuel',
  MONTHLY_RESET: 'Renouvellement mensuel',
  PURCHASE: 'Achat',
  PACK_PURCHASE: 'Achat de pack',
  ENHANCEMENT: 'Génération IA',
  REFUND: 'Remboursement',
  ADJUSTMENT: 'Ajustement',
}

export default function BillingPage() {
  const [showTopUp, setShowTopUp]         = useState(false)
  const [workspace, setWorkspace]         = useState<WorkspaceInfo | null>(null)
  const [pricing, setPricing]             = useState<PricingData | null>(null)
  const [history, setHistory]             = useState<CreditTx[]>([])
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const plan             = workspace?.plan ?? 'FREE'
  const monthlyCredits   = workspace?.monthlyCredits ?? 0
  const bonusCredits     = workspace?.bonusCredits ?? 0
  const totalCredits     = monthlyCredits + bonusCredits
  const currentPlanMeta  = pricing?.plans.find(p => p.id === plan)
  const monthlyAllotment = currentPlanMeta?.credits ?? 0
  const pct = monthlyAllotment > 0 ? (monthlyCredits / monthlyAllotment) * 100 : 0

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setWorkspace({
        workspaceId:        d.workspaceId,
        workspaceName:      d.workspaceName,
        plan:               d.plan ?? 'FREE',
        monthlyCredits:     d.monthlyCredits ?? 0,
        bonusCredits:       d.bonusCredits ?? 0,
        subscriptionStatus: d.subscriptionStatus ?? 'active',
        renewalDate:        d.renewalDate ?? null,
      }))
      .then(() => fetch('/api/pricing').then(r => r.json()).then(setPricing))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!workspace?.workspaceId) return
    fetch(`/api/billing/history?workspaceId=${workspace.workspaceId}`)
      .then(r => r.json())
      .then(d => setHistory(d.transactions ?? []))
      .catch(() => {})
  }, [workspace?.workspaceId])

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

  const startCheckout = useCallback(async (body: { plan?: string; pack?: string }) => {
    if (!workspace?.workspaceId) return
    const key = body.plan ?? body.pack ?? ''
    setCheckoutLoading(key)
    try {
      const res = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...body, workspaceId: workspace.workspaceId }),
      })
      const { url, error } = await res.json()
      if (!res.ok) throw new Error(error)
      window.location.href = url
    } catch (e) {
      console.error('[billing] checkout error:', e)
      setCheckoutLoading(null)
    }
  }, [workspace])

  const renewalDateLabel = workspace?.renewalDate
    ? new Date(workspace.renewalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

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
                Plan {currentPlanMeta?.label ?? plan}
              </h1>
              <p className="text-midnight/45 mt-2 text-[15px]">
                {workspace ? `${totalCredits.toLocaleString()} crédits disponibles` : 'Chargement…'}
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

      <section className="px-6 lg:px-10 py-8 max-w-[1480px] space-y-8">
        <div className="grid lg:grid-cols-2 gap-4 max-w-2xl">

          {/* Plan card */}
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 mb-1">Plan actuel</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl text-midnight">
                    {currentPlanMeta?.label ?? plan}
                  </span>
                  {!!currentPlanMeta?.price && (
                    <span className="text-midnight/40 text-sm">€{currentPlanMeta.price}/mois</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
                {plan === 'FREE' ? 'Gratuit' : workspace?.subscriptionStatus === 'active' ? 'Actif' : workspace?.subscriptionStatus}
              </span>
            </div>

            <ul className="space-y-2 mb-5">
              <li className="flex items-center gap-2 text-sm text-midnight/65">
                <Check className="w-3.5 h-3.5 text-sage-500 flex-shrink-0" strokeWidth={2.5} />
                {(currentPlanMeta?.credits ?? 0).toLocaleString()} crédit{(currentPlanMeta?.credits ?? 0) === 1 ? '' : 's'} / mois
              </li>
              {renewalDateLabel && (
                <li className="flex items-center gap-2 text-sm text-midnight/65">
                  <Clock className="w-3.5 h-3.5 text-sage-500 flex-shrink-0" strokeWidth={2} />
                  Renouvellement le {renewalDateLabel}
                </li>
              )}
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
                <div className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 mb-1">Crédits mensuels</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl tabular-nums text-midnight">
                    {monthlyCredits.toLocaleString()}
                  </span>
                  <span className="text-midnight/40 text-sm tabular-nums">
                    / {monthlyAllotment.toLocaleString()}
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

            <div className="space-y-1.5 mb-4">
              <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sage-500 to-sage-400 rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-midnight/45">
                <span><span className="tabular-nums text-midnight/70">{Math.round(pct)}%</span> restants</span>
                <span>Expirent en fin de cycle</span>
              </div>
            </div>

            <div className="pt-3 border-t border-sage-100 flex items-center justify-between">
              <div className="text-xs text-midnight/45">Crédits achetés (n&apos;expirent jamais)</div>
              <div className="font-display font-bold text-midnight tabular-nums">{bonusCredits.toLocaleString()}</div>
            </div>
          </div>

        </div>

        {/* Plans grid */}
        {pricing && (
          <div>
            <h2 className="font-display font-bold text-lg text-midnight mb-3">Changer de plan</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pricing.plans.map((p) => {
                const isCurrent = p.id === plan
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'rounded-2xl border p-5 flex flex-col',
                      isCurrent ? 'border-sage-400 bg-sage-50' : 'border-sage-100 bg-white',
                    )}
                  >
                    <div className="font-display font-bold text-midnight mb-1">{p.label}</div>
                    <div className="text-2xl font-display font-bold text-midnight mb-1">
                      {p.price > 0 ? `€${p.price}` : 'Gratuit'}
                      {p.price > 0 && <span className="text-xs text-midnight/40 font-normal">/mois</span>}
                    </div>
                    <div className="text-xs text-midnight/50 mb-4">
                      {p.credits.toLocaleString()} crédit{p.credits === 1 ? '' : 's'} / mois
                    </div>
                    {isCurrent ? (
                      <span className="mt-auto text-center text-xs font-semibold uppercase tracking-wide text-sage-600 py-2">
                        Plan actuel
                      </span>
                    ) : p.id === 'FREE' ? (
                      <button
                        onClick={openPortal}
                        className="mt-auto rounded-lg border border-sage-200 hover:bg-cream-50 text-midnight/70 text-sm font-semibold py-2 transition-colors"
                      >
                        Rétrograder
                      </button>
                    ) : (
                      <button
                        onClick={() => startCheckout({ plan: p.id })}
                        disabled={checkoutLoading === p.id}
                        className="mt-auto rounded-lg bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white text-sm font-semibold py-2 flex items-center justify-center gap-1 transition-colors"
                      >
                        {checkoutLoading === p.id ? 'Redirection…' : <>Choisir <ArrowUpRight className="w-3.5 h-3.5" /></>}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Credit history */}
        {history.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg text-midnight mb-3">Historique des crédits</h2>
            <div className="rounded-2xl border border-sage-100 bg-white shadow-sm overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {history.map((tx) => (
                    <tr key={tx.id} className="border-b border-sage-50 last:border-0">
                      <td className="px-4 py-3 text-midnight/60">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-midnight/70">
                        {REASON_LABEL[tx.reason] ?? tx.reason}
                        {tx.featureKey && <span className="text-midnight/40"> · {tx.featureKey}</span>}
                      </td>
                      <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', tx.delta >= 0 ? 'text-emerald-600' : 'text-midnight/70')}>
                        {tx.delta >= 0 ? '+' : ''}{tx.delta}
                      </td>
                      <td className="px-4 py-3 text-right text-midnight/40 tabular-nums">{tx.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {showTopUp && pricing && (
        <TopUpModal
          workspaceId={workspace?.workspaceId ?? ''}
          packs={pricing.packs}
          onClose={() => setShowTopUp(false)}
          onCheckout={startCheckout}
          loading={checkoutLoading}
        />
      )}
    </div>
  )
}

function TopUpModal({
  workspaceId, packs, onClose, onCheckout, loading,
}: {
  workspaceId: string
  packs: CreditPack[]
  onClose: () => void
  onCheckout: (body: { pack: string }) => void
  loading: string | null
}) {
  const [selected, setSelected] = useState(packs[1]?.id ?? packs[0].id)
  const pack = packs.find((p) => p.id === selected)!
  const perCredit = pack.price / pack.credits

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packs.map((p) => (
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
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-sage-500" strokeWidth={2} />
                  <span className="font-display font-bold text-lg tabular-nums text-midnight">{p.credits.toLocaleString()}</span>
                </div>
                <span className="tabular-nums font-semibold text-midnight">€{p.price}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-sage-100 bg-cream-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-midnight/60"><span>Crédits</span><span className="tabular-nums text-midnight">{pack.credits.toLocaleString()}</span></div>
            <div className="flex justify-between text-midnight/60"><span>Prix</span><span className="tabular-nums text-midnight">€{pack.price}</span></div>
            <div className="flex justify-between text-midnight/60"><span>Prix / crédit</span><span className="tabular-nums text-midnight">€{perCredit.toFixed(2)}</span></div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onClose} className="rounded-lg border border-sage-200 bg-white hover:bg-cream-50 px-3.5 py-2 text-sm text-midnight/60">
              Annuler
            </button>
            <button
              onClick={() => onCheckout({ pack: pack.id })}
              disabled={loading === pack.id || !workspaceId}
              className="rounded-lg bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              {loading === pack.id ? 'Redirection…' : `Payer €${pack.price}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
