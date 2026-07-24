'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Check, Loader2 } from 'lucide-react'

export default function BrandKitPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [businessName, setBusinessName] = useState('')
  const [logoUrl, setLogoUrl]           = useState<string | null>(null)
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#4B7F52')
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/brand-kit/default')
      .then(r => r.json())
      .then(d => {
        setBusinessName(d.businessName ?? '')
        setLogoUrl(d.logoUrl ?? null)
        setPrimaryColor(d.primaryColor ?? '#4B7F52')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleFile(file: File) {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('businessName', businessName)
      formData.append('primaryColor', primaryColor)
      if (logoFile) formData.append('logo', logoFile)

      const res = await fetch('/api/brand-kit', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      setLogoUrl(data.logoUrl ?? null)
      setLogoFile(null)
      setLogoPreview(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  const displayedLogo = logoPreview ?? logoUrl

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
        <div className="px-6 lg:px-10 py-8 max-w-[900px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-600/80 mb-2">Brand kit</div>
          <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">Votre marque.</h1>
          <p className="text-midnight/45 mt-2 text-[15px]">
            Votre nom et votre logo apparaissent automatiquement sur l&apos;écran de fin de vos vidéos marketing.
          </p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[900px] space-y-6">
        {/* Business name */}
        <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
          <h2 className="font-display font-semibold text-base text-midnight mb-4">Nom de l&apos;entreprise</h2>
          <input
            type="text"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Jardins Dupont"
            className="w-full max-w-sm bg-cream-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Logo */}
        <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
          <h2 className="font-display font-semibold text-base text-midnight mb-4">Logo</h2>
          <div className="flex items-center gap-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-sage-200 hover:border-sage-400 flex items-center justify-center bg-cream-50 hover:bg-sage-50 transition-all shrink-0 overflow-hidden"
            >
              {displayedLogo
                ? <Image src={displayedLogo} alt="" width={80} height={80} className="max-w-[80px] max-h-[80px] object-contain" unoptimized />
                : <Upload className="w-6 h-6 text-midnight/30" strokeWidth={1.5} />
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div>
              <button onClick={() => fileRef.current?.click()} className="text-sm font-medium text-sage-600 hover:text-sage-700">
                {displayedLogo ? 'Changer le logo' : 'Importer un logo'}
              </button>
              <p className="text-xs text-midnight/40 mt-1">PNG avec fond transparent recommandé · 5 Mo max</p>
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="rounded-2xl border border-sage-100 bg-white shadow-sm p-6">
          <h2 className="font-display font-semibold text-base text-midnight mb-4">Couleur de marque</h2>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-32 bg-cream-50 border border-sage-200 rounded-lg px-3 py-2 text-sm font-mono uppercase text-midnight focus:outline-none focus:border-sage-400"
            />
            <span className="text-sm text-midnight/45">Couleur d&apos;accent par défaut du Kit marketing</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold text-sm shadow-sage-sm transition-all"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            : saved
              ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Enregistré !</>
              : 'Enregistrer'
          }
        </button>
      </div>
    </div>
  )
}
