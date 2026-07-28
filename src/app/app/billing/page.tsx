'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, ExternalLink, Plus, Lock, Zap, X, ArrowUpRight, Clock, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/meta'

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

interface Promo {
  label: string
  plan: string
  originalPrice: number
  discountedPrice: number
  code: string
  endDate: string
}

interface PricingData {
  plans: PricingPlan[]
  packs: CreditPack[]
  promo: Promo | null
}

// A short, reassuring reason to pick each paid plan — this page is a purchase decision point,
// bare credit numbers alone don't sell it. Kept local rather than importing the marketing
// site's PLAN_META to keep the app section's copy independent of the marketing pages'.
const PLAN_PITCH: Record<string, string> = {
  ESSENTIAL: 'Le choix des paysagistes indépendants qui présentent des projets chaque semaine.',
  PRO:       'Pour les équipes qui produisent des rendus au quotidien, sans compter.',
  BUSINESS:  'Volume et support dédié pour les groupes multi-sites.',
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showTopUp, setShowTopUp]         = useState(false)
  const [workspace, setWorkspace]         = useState<WorkspaceInfo | null>(null)
  const [pricing, setPricing]             = useState<PricingData | null>(null)
  const [history, setHistory]             = useState<CreditTx[]>([])
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError]     = useState<string | null>(null)

  const plan             = workspace?.plan ?? 'FREE'
  const monthlyCredits   = workspace?.monthlyCredits ?? 0
  const bonusCredits     = workspace?.bonusCredits ?? 0
  const totalCredits     = monthlyCredits + bonusCredits
  const currentPlanMeta  = pricing?.plans.find(p => p.id === plan)
  const monthlyAllotment = currentPlanMeta?.credits ?? 0
  const pct = monthlyAllotment > 0 ? (monthlyCredits / monthlyAllotment) * 100 : 0

  useEffect(() => {
    Promise.all([
      fetch('/api/me').then(r => r.json()),
      fetch('/api/pricing').then(r => r.json()),
    ]).then(([d, pricingData]) => {
      // Billing is fully gated behind email verification — a user who used their one free
      // unverified generation can browse the rest of the app, but not pay or see invoices.
      if (!d.emailVerified) {
        router.replace('/check-email')
        return
      }
      setWorkspace({
        workspaceId:        d.workspaceId,
        workspaceName:      d.workspaceName,
        plan:               d.plan ?? 'FREE',
        monthlyCredits:     d.monthlyCredits ?? 0,
        bonusCredits:       d.bonusCredits ?? 0,
        subscriptionStatus: d.subscriptionStatus ?? 'active',
        renewalDate:        d.renewalDate ?? null,
      })
      setPricing(pricingData)
    }).catch(() => {})
  }, [router])

  useEffect(() => {
    if (!workspace?.workspaceId) return
    fetch(`/api/billing/history?workspaceId=${workspace.workspaceId}`)
      .then(r => r.json())
      .then(d => setHistory(d.transactions ?? []))
      .catch(() => {})
  }, [workspace?.workspaceId])

  // Landing here from the "out of credits" redirect (editor, retouch, kit marketing) should
  // open straight into the purchase flow, not just the general billing overview one more click
  // away from it.
  useEffect(() => {
    if (searchParams.get('topup') === '1') setShowTopUp(true)
  }, [searchParams])

  // Fires once, right after a credit-pack purchase actually succeeds on Stripe's side
  // (real amount pulled from the completed Checkout session, not a hardcoded price) —
  // guarded so a refresh of this same URL never double-counts the same purchase.
  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return

    const trackedKey = `meta_purchase_tracked_${sessionId}`
    if (sessionStorage.getItem(trackedKey)) return

    fetch(`/api/billing/checkout-session?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.paid) return
        sessionStorage.setItem(trackedKey, '1')
        trackEvent('Purchase', {
          eventId: sessionId,
          value: d.value,
          currency: d.currency ?? 'EUR',
          email: d.email ?? undefined,
        })
      })
      .catch(() => {})
      .finally(() => {
        router.replace('/app/billing')
      })
  }, [searchParams, router])

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
    setCheckoutError(null)

    // Fires before the checkout redirect — the only mid-funnel Meta signal that exists
    // today (PostHog's CHECKOUT_STARTED already covers this server-side, but Meta had
    // nothing between signup and a completed Purchase, which starves ad optimization).
    const price = body.plan
      ? pricing?.plans.find(p => p.id === body.plan)?.price
      : pricing?.packs.find(p => p.id === body.pack)?.price
    trackEvent('InitiateCheckout', { value: price, currency: 'EUR' })

    try {
      const res = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...body, workspaceId: workspace.workspaceId }),
      })
      // A caught-elsewhere real bug this session: an unhandled server exception (e.g. Stripe
      // misconfigured) returns a non-JSON body, and res.json() throwing was previously
      // swallowed silently here — the button just stopped spinning with zero explanation.
      const { url, error } = await res.json().catch(() => {
        throw new Error('Le paiement est temporairement indisponible. Réessayez dans un instant.')
      })
      if (!res.ok) throw new Error(error ?? 'Le paiement a échoué. Réessayez.')
      window.location.href = url
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : 'Le paiement a échoué. Réessayez.')
      console.error('[billing] checkout error:', e)
      setCheckoutLoading(null)
    }
  }, [workspace, pricing])

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              {pricing.plans.map((p) => {
                const isCurrent = p.id === plan
                const isPromo = pricing.promo && pricing.promo.plan === p.id
                // Recommended defaults to Essentiel; a live promo on a different plan takes
                // over that visual slot instead, so there's still exactly one emphasized card,
                // not two competing for attention.
                const isFeatured = isPromo || (p.id === 'ESSENTIAL' && !pricing.promo)
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'relative rounded-2xl border p-5 flex flex-col transition-all',
                      isCurrent ? 'border-sage-400 bg-sage-50'
                        : isFeatured ? 'border-sage-300 bg-white shadow-card ring-1 ring-sage-200'
                        : 'border-sage-100 bg-white',
                    )}
                  >
                    {isFeatured && !isCurrent && (
                      <span className={cn(
                        'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[11px] font-bold whitespace-nowrap flex items-center gap-1',
                        isPromo ? 'bg-rose-500' : 'bg-sage-500',
                      )}>
                        {isPromo ? <Sparkles className="w-3 h-3" /> : null}
                        {isPromo ? pricing.promo!.label : 'Recommandé'}
                      </span>
                    )}
                    <div className="font-display font-bold text-midnight mb-1">{p.label}</div>
                    <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
                      {isPromo && (
                        <span className="text-sm line-through text-midnight/30">€{pricing.promo!.originalPrice}</span>
                      )}
                      <span className="text-2xl font-display font-bold text-midnight">
                        {isPromo ? `€${pricing.promo!.discountedPrice}` : p.price > 0 ? `€${p.price}` : 'Gratuit'}
                      </span>
                      {p.price > 0 && <span className="text-xs text-midnight/40 font-normal">/mois</span>}
                    </div>
                    {isPromo && <div className="text-[11px] font-semibold text-rose-500 mb-1">1ère année</div>}
                    <div className="text-xs text-midnight/50 mb-3">
                      {p.credits.toLocaleString()} crédit{p.credits === 1 ? '' : 's'} / mois
                    </div>
                    {PLAN_PITCH[p.id] && (
                      <p className="text-xs text-midnight/45 leading-relaxed mb-4">{PLAN_PITCH[p.id]}</p>
                    )}
                    <div className="mt-auto">
                      {isCurrent ? (
                        <span className="block text-center text-xs font-semibold uppercase tracking-wide text-sage-600 py-2">
                          Plan actuel
                        </span>
                      ) : p.id === 'FREE' ? (
                        <button
                          onClick={openPortal}
                          className="w-full rounded-lg border border-sage-200 hover:bg-cream-50 text-midnight/70 text-sm font-semibold py-2 transition-colors"
                        >
                          Rétrograder
                        </button>
                      ) : (
                        <button
                          onClick={() => startCheckout({ plan: p.id })}
                          disabled={checkoutLoading === p.id}
                          className={cn(
                            'w-full rounded-lg disabled:opacity-50 text-sm font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-all',
                            isFeatured
                              ? 'bg-sage-500 hover:bg-sage-600 text-white shadow-sage-sm hover:shadow-sage-md'
                              : 'border border-midnight/[0.12] hover:border-sage-400 text-midnight/70 hover:text-sage-600',
                          )}
                        >
                          {checkoutLoading === p.id ? 'Redirection…' : <>Passer à {p.label} <ArrowUpRight className="w-3.5 h-3.5" /></>}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {checkoutError && (
              <p className="text-center text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 mt-4 max-w-md mx-auto">
                {checkoutError}
              </p>
            )}
            <p className="flex items-center justify-center gap-1.5 text-xs text-midnight/35 mt-4">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              Paiement sécurisé par Stripe · Résiliable à tout moment, sans engagement
            </p>
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
          error={checkoutError}
        />
      )}
    </div>
  )
}

function TopUpModal({
  workspaceId, packs, onClose, onCheckout, loading, error,
}: {
  workspaceId: string
  packs: CreditPack[]
  onClose: () => void
  error: string | null
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

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5 mt-4">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-5">
            <p className="hidden sm:flex items-center gap-1.5 text-xs text-midnight/35">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              Paiement sécurisé par Stripe
            </p>
            <div className="flex gap-2 ml-auto">
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
      </div>
    </>
  )
}
