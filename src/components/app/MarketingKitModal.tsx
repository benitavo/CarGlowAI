'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Clapperboard, Loader2, Download, Music, PenLine, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { downloadUrlAsFile } from '@/lib/download-file'
import { MUSIC_PRESETS } from '@/lib/marketing-video/music-presets'

type Format = 'reel' | 'story' | 'landscape' | 'square'

const FORMATS: { id: Format; label: string }[] = [
  { id: 'reel',      label: 'Reel Instagram / Facebook' },
  { id: 'story',     label: 'Story Instagram / Facebook' },
  { id: 'landscape', label: 'Format paysage' },
  { id: 'square',    label: 'Format carré' },
]

const CTA_PRESETS = [
  'Transformez votre jardin.',
  'Demandez votre devis.',
  'Contactez-nous.',
  'Votre extérieur mérite mieux.',
]

interface Props {
  photoId: string
  onClose: () => void
  /** True when this photo has a real generated video ("Vidéo" mode) — enables the option to
   *  use it as the "Après" segment instead of the static thumbnail. */
  hasVideoAfter?: boolean
}

export function MarketingKitModal({ photoId, onClose, hasVideoAfter = false }: Props) {
  const [format, setFormat]     = useState<Format>('reel')
  const [accentColor, setAccentColor] = useState('#4B7F52')
  const [endText, setEndText]   = useState('')
  const [ctaText, setCtaText]   = useState('')
  const [businessName, setBusinessName] = useState('')
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [useVideoAfter, setUseVideoAfter] = useState(hasVideoAfter)

  const [musicId, setMusicId] = useState<string | null>(null) // null = "Aucune musique"

  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [insufficientCredits, setInsufficientCredits] = useState<{ available: number; required: number } | null>(null)
  const [creditCost, setCreditCost] = useState<number | null>(null)

  const [captionStatus, setCaptionStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [caption, setCaption]   = useState<string | null>(null)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    fetch('/api/brand-kit/default')
      .then(r => r.json())
      .then(d => {
        if (d.primaryColor) setAccentColor(d.primaryColor)
        if (d.businessName) setBusinessName(d.businessName)
        if (d.logoUrl) setLogoUrl(d.logoUrl)
      })
      .catch(() => {})

    fetch('/api/pricing')
      .then(r => r.json())
      .then(d => {
        const feature = (d.features ?? []).find((f: { key: string }) => f.key === 'marketingVideo')
        if (feature) setCreditCost(feature.creditCost)
      })
      .catch(() => {})
  }, [])

  const selectedMusic = MUSIC_PRESETS.find(p => p.id === musicId) ?? null

  const generate = async () => {
    setStatus('loading')
    setError(null)
    setInsufficientCredits(null)
    try {
      const res = await fetch(`/api/photos/${photoId}/marketing-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format, accentColor, endText, ctaText, businessName, logoUrl,
          audioTrackUrl: selectedMusic?.url ?? undefined,
          useVideoAfter: hasVideoAfter && useVideoAfter,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402 || data.error === 'insufficient_credits') {
          setStatus('idle')
          setInsufficientCredits({ available: data.available ?? 0, required: data.required ?? 0 })
          return
        }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      setVideoUrl(data.videoUrl)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  const download = () => {
    if (videoUrl) downloadUrlAsFile(videoUrl, `verdia-marketing-${format}-${Date.now()}.mp4`)
  }

  const generateCaption = async () => {
    setCaptionStatus('loading')
    setCaptionError(null)
    try {
      const res = await fetch(`/api/photos/${photoId}/marketing-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctaText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setCaption(data.caption)
      setCaptionStatus('idle')
    } catch (err) {
      setCaptionError(err instanceof Error ? err.message : 'Erreur inconnue')
      setCaptionStatus('error')
    }
  }

  const copyCaption = () => {
    if (!caption) return
    navigator.clipboard.writeText(caption).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-midnight/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white border border-sage-100 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto shadow-card relative">
          <div className="sticky top-0 bg-white border-b border-sage-100 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
              <h3 className="font-display font-semibold text-lg text-midnight">Kit marketing</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-sage-50 text-midnight/40" aria-label="Fermer">
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {status === 'done' && videoUrl ? (
              <>
                <video src={videoUrl} controls autoPlay loop className="w-full rounded-xl border border-sage-100" />
                <button
                  onClick={download}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-4 py-3 text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" strokeWidth={2} /> Télécharger la vidéo
                </button>

                <div className="rounded-xl border border-sage-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-midnight/50 uppercase tracking-wide">Texte pour la publication</label>
                    {caption && (
                      <button onClick={copyCaption} className="text-xs text-sage-600 hover:text-sage-700 font-medium flex items-center gap-1">
                        {copied ? <><Check className="w-3.5 h-3.5" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                      </button>
                    )}
                  </div>
                  {caption ? (
                    <p className="text-sm text-midnight/70 whitespace-pre-wrap leading-relaxed">{caption}</p>
                  ) : (
                    <button
                      onClick={generateCaption}
                      disabled={captionStatus === 'loading'}
                      className="flex items-center gap-2 text-sm text-sage-600 hover:text-sage-700 font-medium disabled:opacity-60"
                    >
                      {captionStatus === 'loading'
                        ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Génération…</>
                        : <><PenLine className="w-4 h-4" strokeWidth={1.75} /> Générer un texte pour la publication</>
                      }
                    </button>
                  )}
                  {captionError && <p className="text-[11px] text-rose-500 mt-1.5">{captionError}</p>}
                </div>

                <button
                  onClick={() => { setStatus('idle'); setVideoUrl(null); setCaption(null) }}
                  className="text-sm text-midnight/40 hover:text-midnight/60 py-1"
                >
                  Générer un autre format
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-wide mb-2 block">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all',
                          format === f.id
                            ? 'border-sage-400 bg-sage-50 text-sage-700'
                            : 'border-sage-100 text-midnight/60 hover:border-sage-300',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hasVideoAfter && (
                  <label className="flex items-start gap-3 rounded-xl border border-sage-100 px-3.5 py-3 cursor-pointer hover:border-sage-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={useVideoAfter}
                      onChange={e => setUseVideoAfter(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-sage-300 text-sage-500 focus:ring-sage-400"
                    />
                    <span>
                      <span className="block text-sm font-medium text-midnight">Utiliser ma vidéo générée comme &quot;Après&quot;</span>
                      <span className="block text-xs text-midnight/45 mt-0.5">Au lieu de la photo statique, la partie « Après » utilisera votre vidéo animée.</span>
                    </span>
                  </label>
                )}

                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-wide mb-2 block">Couleur d&apos;accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-sage-100 cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="flex-1 rounded-lg border border-sage-100 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-sage-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-wide mb-2 block">Texte de fin</label>
                  <input
                    type="text"
                    value={endText}
                    onChange={e => setEndText(e.target.value)}
                    placeholder="Transformez votre jardin."
                    className="w-full rounded-lg border border-sage-100 px-3 py-2 text-sm focus:outline-none focus:border-sage-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-wide mb-2 block">Appel à l&apos;action</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    placeholder="Demandez votre devis."
                    className="w-full rounded-lg border border-sage-100 px-3 py-2 text-sm mb-2 focus:outline-none focus:border-sage-400"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {CTA_PRESETS.map(preset => (
                      <button
                        key={preset}
                        onClick={() => setCtaText(preset)}
                        className="text-xs px-2.5 py-1 rounded-full border border-sage-100 text-midnight/50 hover:border-sage-300 hover:text-midnight transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-midnight/50 uppercase tracking-wide mb-2 block">Musique de fond</label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setMusicId(null)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-all',
                        musicId === null
                          ? 'border-sage-400 bg-sage-50 text-sage-700 font-medium'
                          : 'border-sage-100 text-midnight/60 hover:border-sage-300',
                      )}
                    >
                      Aucune musique
                    </button>
                    {MUSIC_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setMusicId(preset.id)}
                        disabled={!preset.url}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                          musicId === preset.id
                            ? 'border-sage-400 bg-sage-50 text-sage-700 font-medium'
                            : 'border-sage-100 text-midnight/60 hover:border-sage-300',
                        )}
                      >
                        <Music className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        {preset.label}
                        {!preset.url && <span className="text-[11px] text-midnight/30 ml-auto">bientôt</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>
                )}

                {insufficientCredits && (
                  <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
                    <p className="mb-1.5">
                      Il vous faut {insufficientCredits.required} crédit{insufficientCredits.required === 1 ? '' : 's'}
                      {' '}pour cette action, il vous en reste {insufficientCredits.available}.
                    </p>
                    <Link href="/app/billing" className="font-semibold underline underline-offset-2 hover:text-rose-800">
                      Recharger des crédits →
                    </Link>
                  </div>
                )}

                <button
                  onClick={generate}
                  disabled={status === 'loading'}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-semibold transition-colors"
                >
                  {status === 'loading'
                    ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Génération en cours… (~30-60s)</>
                    : <>Générer la vidéo{creditCost != null && ` · ${creditCost} crédit${creditCost === 1 ? '' : 's'}`}</>
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
