'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Plus, ShieldAlert, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingConfig {
  id: string
  freeCredits: number
  essentialPrice: number
  essentialCredits: number
  proPrice: number
  proCredits: number
  businessPrice: number
  businessCredits: number
  pack1Price: number
  pack1Credits: number
  pack2Price: number
  pack2Credits: number
  pack3Price: number
  pack3Credits: number
}

interface AiFeature {
  key: string
  label: string
  creditCost: number
  enabled: boolean
}

type LoadState = 'loading' | 'forbidden' | 'ready' | 'error'

export default function AdminPricingPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [features, setFeatures] = useState<AiFeature[]>([])
  const [savingConfig, setSavingConfig] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [newFeature, setNewFeature] = useState({ key: '', label: '', creditCost: 1 })
  const [addingFeature, setAddingFeature] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/pricing')
      .then(async r => {
        if (r.status === 403) { setState('forbidden'); return }
        if (!r.ok) { setState('error'); return }
        const d = await r.json()
        setConfig(d.config)
        setFeatures(d.features)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => { load() }, [load])

  const updateConfigField = (field: keyof PricingConfig, value: number) => {
    setConfig(c => c ? { ...c, [field]: value } : c)
  }

  const saveConfig = async () => {
    if (!config) return
    setSavingConfig(true)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error()
      setSavedAt(Date.now())
    } catch {
      // no-op — button re-enables, user can retry
    } finally {
      setSavingConfig(false)
    }
  }

  const updateFeature = async (key: string, patch: Partial<AiFeature>) => {
    setFeatures(fs => fs.map(f => f.key === key ? { ...f, ...patch } : f))
    await fetch(`/api/admin/pricing/features/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {})
  }

  const addFeature = async () => {
    if (!newFeature.key.trim() || !newFeature.label.trim()) return
    setAddingFeature(true)
    try {
      const res = await fetch('/api/admin/pricing/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeature),
      })
      if (!res.ok) throw new Error()
      const { feature } = await res.json()
      setFeatures(fs => [...fs, feature])
      setNewFeature({ key: '', label: '', creditCost: 1 })
    } catch {
      // no-op
    } finally {
      setAddingFeature(false)
    }
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

  if (state === 'error' || !config) {
    return <div className="p-10 text-center text-sm text-rose-500">Impossible de charger la configuration tarifaire.</div>
  }

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1200px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">
            Administration
          </div>
          <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">
            Configuration tarifaire
          </h1>
          <p className="text-midnight/45 mt-2 text-[15px]">
            Ces valeurs pilotent l&apos;ensemble de l&apos;application — plans, packs de crédits et coûts par action IA.
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-8 max-w-[1200px] space-y-10">

        {/* Plans */}
        <div>
          <h2 className="font-display font-bold text-lg text-midnight mb-3">Plans d&apos;abonnement</h2>
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wide text-midnight/40">
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Prix (€/mois)</th>
                  <th className="px-4 py-3 font-semibold">Crédits / mois</th>
                </tr>
              </thead>
              <tbody>
                <ConfigRow label="Découverte (gratuit)" priceField={null} creditsField="freeCredits" config={config} onChange={updateConfigField} />
                <ConfigRow label="Essentiel" priceField="essentialPrice" creditsField="essentialCredits" config={config} onChange={updateConfigField} />
                <ConfigRow label="Pro" priceField="proPrice" creditsField="proCredits" config={config} onChange={updateConfigField} />
                <ConfigRow label="Business" priceField="businessPrice" creditsField="businessCredits" config={config} onChange={updateConfigField} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit packs */}
        <div>
          <h2 className="font-display font-bold text-lg text-midnight mb-3">Packs de crédits (achat unique)</h2>
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wide text-midnight/40">
                  <th className="px-4 py-3 font-semibold">Pack</th>
                  <th className="px-4 py-3 font-semibold">Prix (€)</th>
                  <th className="px-4 py-3 font-semibold">Crédits</th>
                </tr>
              </thead>
              <tbody>
                <ConfigRow label="Pack 1" priceField="pack1Price" creditsField="pack1Credits" config={config} onChange={updateConfigField} />
                <ConfigRow label="Pack 2" priceField="pack2Price" creditsField="pack2Credits" config={config} onChange={updateConfigField} />
                <ConfigRow label="Pack 3" priceField="pack3Price" creditsField="pack3Credits" config={config} onChange={updateConfigField} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveConfig}
            disabled={savingConfig}
            className="rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white px-5 py-2.5 font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingConfig ? 'Enregistrement…' : 'Enregistrer les tarifs'}
          </button>
          {savedAt && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Enregistré
            </span>
          )}
        </div>

        {/* AI features */}
        <div>
          <h2 className="font-display font-bold text-lg text-midnight mb-3">Coût des actions IA</h2>
          <p className="text-sm text-midnight/45 mb-3">
            Chaque action consomme des crédits déduits automatiquement. Désactiver une action la rend indisponible sans toucher au code.
          </p>
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wide text-midnight/40">
                  <th className="px-4 py-3 font-semibold">Clé</th>
                  <th className="px-4 py-3 font-semibold">Libellé</th>
                  <th className="px-4 py-3 font-semibold">Coût (crédits)</th>
                  <th className="px-4 py-3 font-semibold">Activé</th>
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.key} className="border-b border-sage-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-midnight/50">{f.key}</td>
                    <td className="px-4 py-3">
                      <input
                        defaultValue={f.label}
                        onBlur={e => e.target.value !== f.label && updateFeature(f.key, { label: e.target.value })}
                        className="w-full bg-transparent border border-transparent hover:border-sage-200 focus:border-sage-400 rounded-lg px-2 py-1 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        defaultValue={f.creditCost}
                        onBlur={e => {
                          const v = Number(e.target.value)
                          if (Number.isFinite(v) && v >= 0 && v !== f.creditCost) updateFeature(f.key, { creditCost: v })
                        }}
                        className="w-24 bg-transparent border border-sage-200 rounded-lg px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-sage-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateFeature(f.key, { enabled: !f.enabled })}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                          f.enabled ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-600',
                        )}
                      >
                        {f.enabled ? 'Activé' : 'Désactivé'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add feature */}
        <div>
          <h2 className="font-display font-bold text-lg text-midnight mb-3">Ajouter une nouvelle action IA</h2>
          <p className="text-sm text-midnight/45 mb-3">
            Ex : remplacement de ciel, panorama 360°, rendu de nuit, upscale vidéo, suppression d&apos;objet — définissez une clé stable, un libellé et un coût, sans toucher au backend.
          </p>
          <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 block mb-1">Clé (unique)</label>
              <input
                value={newFeature.key}
                onChange={e => setNewFeature(f => ({ ...f, key: e.target.value }))}
                placeholder="skyReplacement"
                className="rounded-lg border border-sage-200 px-3 py-2 text-sm focus:outline-none focus:border-sage-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 block mb-1">Libellé</label>
              <input
                value={newFeature.label}
                onChange={e => setNewFeature(f => ({ ...f, label: e.target.value }))}
                placeholder="Remplacement de ciel"
                className="rounded-lg border border-sage-200 px-3 py-2 text-sm focus:outline-none focus:border-sage-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-midnight/40 block mb-1">Coût (crédits)</label>
              <input
                type="number"
                min={0}
                value={newFeature.creditCost}
                onChange={e => setNewFeature(f => ({ ...f, creditCost: Number(e.target.value) }))}
                className="w-24 rounded-lg border border-sage-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-sage-400"
              />
            </div>
            <button
              onClick={addFeature}
              disabled={addingFeature || !newFeature.key.trim() || !newFeature.label.trim()}
              className="rounded-lg bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ConfigRow({
  label, priceField, creditsField, config, onChange,
}: {
  label: string
  priceField: keyof PricingConfig | null
  creditsField: keyof PricingConfig
  config: PricingConfig
  onChange: (field: keyof PricingConfig, value: number) => void
}) {
  return (
    <tr className="border-b border-sage-50 last:border-0">
      <td className="px-4 py-3 text-midnight/70 font-medium">{label}</td>
      <td className="px-4 py-3">
        {priceField ? (
          <input
            type="number"
            min={0}
            value={config[priceField]}
            onChange={e => onChange(priceField, Number(e.target.value))}
            className="w-24 bg-transparent border border-sage-200 rounded-lg px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-sage-400"
          />
        ) : (
          <span className="text-midnight/40">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={config[creditsField]}
          onChange={e => onChange(creditsField, Number(e.target.value))}
          className="w-24 bg-transparent border border-sage-200 rounded-lg px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-sage-400"
        />
      </td>
    </tr>
  )
}
