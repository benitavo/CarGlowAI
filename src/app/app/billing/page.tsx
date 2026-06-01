'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ExternalLink, Plus, Lock, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { creditPacks } from '@/lib/mock-data'

const PLAN_FEATURES: Record<string, { credits: number; price: number; features: string[] }> = {
  TRIAL:      { credits: 3,      price: 0,   features: ['3 free photos', 'Basic styles', 'PNG/JPG exports'] },
  STARTER:    { credits: 500,    price: 49,  features: ['500 credits / month', 'Basic styles', 'PNG/JPG exports', 'Email support'] },
  GROWTH:     { credits: 3000,   price: 249, features: ['3,000 credits / month', 'All styles', '4K exports', 'API & webhooks', 'Priority support'] },
  PRO:        { credits: 10_000, price: 599, features: ['10,000 credits / month', 'Custom styles', '8K exports', 'SSO', 'Dedicated CSM'] },
  ENTERPRISE: { credits: -1,     price: -1,  features: ['Unlimited credits', 'Unlimited seats', 'Custom SLA'] },
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
    <div className="pb-24 lg:pb-12">
      {/* Header */}
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1480px]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">
                Plan &amp; billing
              </div>
              <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">
                {plan.charAt(0) + plan.slice(1).toLowerCase()} plan.
              </h1>
              <p className="text-offwhite/55 mt-2 text-[15px]">
                {workspace ? `${creditsRemaining.toLocaleString()} credits remaining` : 'Loading…'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openPortal}
                disabled={portalLoading || !workspace}
                className="rounded-xl bg-glow-500 hover:bg-glow-400 disabled:opacity-50 text-midnight px-5 py-2.5 font-semibold text-sm shadow-glow-md"
              >
                {portalLoading ? 'Opening…' : 'Manage plan'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-8 max-w-[1480px]">
        <div className="grid lg:grid-cols-2 gap-4 max-w-2xl">

          {/* Plan card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-offwhite/45 mb-1">Current plan</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl">
                    {plan.charAt(0) + plan.slice(1).toLowerCase()}
                  </span>
                  {planMeta.price > 0 && (
                    <span className="text-offwhite/55 text-sm">€{planMeta.price}/mo</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                {plan === 'TRIAL' ? 'Trial' : 'Active'}
              </span>
            </div>

            <ul className="space-y-2 mb-5">
              {planMeta.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-offwhite/75">
                  <Check className="w-3.5 h-3.5 text-glow-400 flex-shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-white/[0.05]">
              <button
                onClick={openPortal}
                disabled={portalLoading || !workspace}
                className="text-glow-400 hover:text-glow-300 disabled:opacity-50 inline-flex items-center gap-1 text-sm"
              >
                Manage plan
                <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Credits card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-offwhite/45 mb-1">Credits remaining</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl tabular-nums">
                    {creditsRemaining.toLocaleString()}
                  </span>
                  <span className="text-offwhite/55 text-sm tabular-nums">
                    / {creditsPerMonth.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                disabled={!workspace}
                className="rounded-lg bg-glow-500 hover:bg-glow-400 disabled:opacity-50 text-midnight px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                Top up
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-glow-500 to-glow-300 rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-offwhite/55">
                <span><span className="tabular-nums text-offwhite/85">{Math.round(pct)}%</span> remaining</span>
                <span>{creditsPerMonth.toLocaleString()} / month</span>
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

// ─── Top-up modal (unchanged logic) ──────────────────────────────────────────

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
      if (!plan) throw new Error('Unknown pack')
      const res = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan, workspaceId }),
      })
      const { url, error: apiError } = await res.json()
      if (!res.ok) throw new Error(apiError ?? 'Checkout failed')
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-midnight-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-midnight-900 border border-white/[0.08] rounded-2xl w-full max-w-xl p-6 pointer-events-auto shadow-card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-lg">Top up credits</h3>
              <p className="text-sm text-offwhite/55 mt-0.5">
                One-time purchases never expire.
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.06] text-offwhite/55">
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
                    ? 'border-glow-500/50 bg-glow-500/[0.08]'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]',
                )}
              >
                {p.popular && (
                  <div className="absolute -top-2 right-3 text-[9px] font-semibold uppercase tracking-wider bg-glow-500 text-midnight px-1.5 py-0.5 rounded">
                    Most popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-glow-400" strokeWidth={2} />
                  <span className="font-display font-bold text-lg tabular-nums">{p.credits.toLocaleString()}</span>
                  <span className="text-xs text-offwhite/55">credits</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="tabular-nums font-semibold">€{p.price}</span>
                  <span className="text-xs text-offwhite/45 tabular-nums">€{p.perPhoto} / photo</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-offwhite/55">Credits</span><span className="tabular-nums">{pack.credits.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-offwhite/55">Price</span><span className="tabular-nums">€{pack.price}.00</span></div>
            <div className="flex justify-between"><span className="text-offwhite/55">VAT (19%)</span><span className="tabular-nums">€{(pack.price * 0.19).toFixed(2)}</span></div>
            <div className="h-px bg-white/[0.05]" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">€{(pack.price * 1.19).toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-rose-400 mt-3">{error}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onClose} className="rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] px-3.5 py-2 text-sm text-offwhite/80">
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={loading}
              className="rounded-lg bg-glow-500 hover:bg-glow-400 disabled:opacity-60 text-midnight px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              {loading ? 'Redirecting…' : `Pay €${(pack.price * 1.19).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
