'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Upload, Loader2, Download, ArrowLeft, Sparkles,
  Leaf, RotateCcw, Video, Image as ImageIcon, PenLine,
  Wand2, RefreshCw, Palette, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GARDEN_STYLES } from '@/lib/gardenStyles'

type Mode = 'image' | 'video'

interface GenState {
  status: 'idle' | 'loading' | 'done' | 'error'
  resultUrl?: string
  error?: string
  processingMs?: number
}

interface Version {
  id: string
  url: string
  mode: Mode
  kind: 'generate' | 'retouch'
  processingMs?: number
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function splitDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!match) throw new Error('Format image invalide')
  return { mimeType: match[1], base64: match[2] }
}

export default function EditorClient() {
  const { data: session } = useSession()

  const [mode, setMode]                      = useState<Mode>('image')
  const [file, setFile]                      = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]          = useState<string | null>(null)
  const [styleSlug, setStyleSlug]            = useState('gazon-fleurs')
  const [characteristics, setCharacteristics] = useState('')
  const [gen, setGen]                        = useState<GenState>({ status: 'idle' })
  const fileInputRef                         = useRef<HTMLInputElement>(null)

  const [versions, setVersions]     = useState<Version[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [retouchText, setRetouchText]     = useState('')
  const [retouchStatus, setRetouchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [retouchError, setRetouchError]   = useState<string | undefined>()
  const styleSectionRef   = useRef<HTMLDivElement>(null)
  const characteristicsRef = useRef<HTMLTextAreaElement>(null)
  const retouchInputRef    = useRef<HTMLInputElement>(null)

  const selected = selectedIdx !== null ? versions[selectedIdx] : null

  const pushVersion = useCallback((v: Version) => {
    setVersions(prev => {
      const next = [...prev, v]
      setSelectedIdx(next.length - 1)
      return next
    })
  }, [])

  const loadFile = useCallback((f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setGen({ status: 'idle' })
    setVersions([])
    setSelectedIdx(null)
  }, [previewUrl])

  const focusAndScroll = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (ref.current instanceof HTMLInputElement || ref.current instanceof HTMLTextAreaElement) {
      window.setTimeout(() => ref.current?.focus(), 300)
    }
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) loadFile(f)
  }, [loadFile])

  const handleGenerate = useCallback(async () => {
    if (!file || !session?.user?.workspaceId) return
    setGen({ status: 'loading' })
    try {
      const base64 = await fileToBase64(file)
      const endpoint = mode === 'video' ? '/api/generate-video' : '/api/generate'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData:       base64,
          mimeType:        file.type || 'image/jpeg',
          styleSlug,
          characteristics: characteristics.trim() || undefined,
          workspaceId:     session.user.workspaceId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      const url = data.enhancedUrl ?? data.videoUrl
      pushVersion({ id: data.photoId ?? `${Date.now()}`, url, mode, kind: 'generate', processingMs: data.processingMs })
      setGen({ status: 'done', resultUrl: url, processingMs: data.processingMs })
    } catch (err) {
      setGen({ status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }, [file, session, styleSlug, characteristics, mode, pushVersion])

  const handleRetouch = useCallback(async () => {
    if (!retouchText.trim() || !selected || selected.mode !== 'image' || !session?.user?.workspaceId) return
    setRetouchStatus('loading')
    setRetouchError(undefined)
    try {
      const { base64, mimeType } = splitDataUrl(selected.url)
      const res = await fetch('/api/retouch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData:   base64,
          mimeType,
          instruction: retouchText.trim(),
          workspaceId: session.user.workspaceId,
          styleSlug,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      pushVersion({ id: data.photoId, url: data.enhancedUrl, mode: 'image', kind: 'retouch', processingMs: data.processingMs })
      setRetouchText('')
      setRetouchStatus('idle')
    } catch (err) {
      setRetouchError(err instanceof Error ? err.message : 'Erreur inconnue')
      setRetouchStatus('error')
    }
  }, [retouchText, selected, session, styleSlug, pushVersion])

  const handleDownload = async () => {
    const url = selected?.url ?? gen.resultUrl
    if (!url) return
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `verdia-${styleSlug}-${Date.now()}.${(selected?.mode ?? mode) === 'video' ? 'mp4' : 'png'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  const canGenerate = !!file && gen.status !== 'loading'
  const canRetouch  = !!selected && selected.mode === 'image' && retouchStatus !== 'loading'

  return (
    <div className="min-h-screen bg-cream-50 text-midnight">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 sm:h-20 px-3 sm:px-5 border-b border-sage-100 bg-white/95 backdrop-blur-xl">
        <Link href="/app" className="flex items-center gap-2 text-midnight/45 hover:text-midnight text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Tableau de bord</span>
        </Link>
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo%20verdia%20without%20background.png" alt="Verdia" className="h-8 sm:h-14 w-auto object-contain" />
        </Link>
        <div className="w-8 sm:w-28 shrink-0" />
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-6 sm:py-8 grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

        {/* Left: upload + result — `contents` on mobile lets children join the outer grid's
            order flow; becomes a real flex column again from lg+ (see order-* on each child) */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">

          {/* Upload zone */}
          <div
            className={cn(
              'order-1 lg:order-none relative rounded-3xl border-2 border-dashed transition-all',
              file
                ? 'border-sage-200'
                : 'border-sage-200 bg-sage-50/40 hover:border-sage-400 hover:bg-sage-50 cursor-pointer',
            )}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 px-8">
                <div className="w-16 h-16 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-sage-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-midnight/55 mb-1">Déposez votre photo de jardin</p>
                  <p className="text-sm text-midnight/35">JPG, PNG, HEIC · jusqu&apos;à 20 Mo</p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-xl bg-white border border-sage-200 text-sm font-medium text-midnight/55 hover:text-midnight hover:border-sage-400 transition-all"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                >
                  Choisir un fichier
                </button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl!}
                  alt="Photo originale"
                  className="w-full object-contain"
                  style={{ maxHeight: 520 }}
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/85 backdrop-blur-sm text-xs font-semibold text-midnight/65 border border-sage-200">
                  Photo originale
                </div>
                <button
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm text-xs text-midnight/60 hover:text-midnight border border-sage-200 transition-colors"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                >
                  <RotateCcw className="w-3 h-3" /> Changer
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />

          {/* Result */}
          {selected && (
            <div className="order-2 lg:order-none rounded-3xl border border-sage-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-sage-100">
                <div className="flex items-center gap-2">
                  {selected.mode === 'video'
                    ? <Video className="w-4 h-4 text-sage-500" />
                    : <Sparkles className="w-4 h-4 text-sage-500" />}
                  <span className="font-semibold text-sm text-sage-700">
                    {selected.kind === 'retouch' ? 'Retouche appliquée' : selected.mode === 'video' ? 'Vidéo générée' : 'Rendu généré'}
                  </span>
                  {selected.processingMs && (
                    <span className="text-xs text-midnight/30 ml-1">
                      {(selected.processingMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
              </div>

              {/* Quick actions — horizontal scroll strip on mobile, vertical rail from sm+ */}
              <div className="flex sm:hidden gap-2 overflow-x-auto px-3 py-2.5 border-b border-sage-100">
                {[
                  { label: 'Style',    icon: Palette,    onClick: () => focusAndScroll(styleSectionRef),        disabled: false },
                  { label: 'Prompt',   icon: PenLine,    onClick: () => focusAndScroll(characteristicsRef),     disabled: false },
                  { label: 'Régénérer', icon: RefreshCw, onClick: () => { if (canGenerate) handleGenerate() },  disabled: !canGenerate },
                  { label: 'Retoucher', icon: Wand2,     onClick: () => focusAndScroll(retouchInputRef),        disabled: selected.mode !== 'image' },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap shrink-0 border transition-colors',
                      action.disabled
                        ? 'text-midnight/20 border-sage-100 cursor-not-allowed'
                        : 'text-midnight/60 border-sage-200 hover:text-sage-700 hover:bg-sage-50',
                    )}
                  >
                    <action.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="flex">
                {/* Quick actions rail (desktop) */}
                <div className="hidden sm:flex flex-col shrink-0 w-36 border-r border-sage-100 py-2">
                  {[
                    { label: 'Changer le style',  icon: Palette,    onClick: () => focusAndScroll(styleSectionRef),        disabled: false },
                    { label: 'Modifier le prompt', icon: PenLine,   onClick: () => focusAndScroll(characteristicsRef),     disabled: false },
                    { label: 'Regénérer',          icon: RefreshCw, onClick: () => { if (canGenerate) handleGenerate() },  disabled: !canGenerate },
                    { label: 'Retoucher',          icon: Wand2,     onClick: () => focusAndScroll(retouchInputRef),        disabled: selected.mode !== 'image' },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-left text-[13px] font-medium border-b border-sage-50 last:border-b-0 transition-colors',
                        action.disabled ? 'text-midnight/20 cursor-not-allowed' : 'text-midnight/60 hover:text-sage-700 hover:bg-sage-50',
                      )}
                    >
                      <action.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Main result + version thumbnails */}
                <div className="flex-1 flex flex-col sm:flex-row min-w-0">
                  <div className="flex-1 min-w-0 bg-cream-50 flex items-center justify-center">
                    {selected.mode === 'video' ? (
                      <video
                        key={selected.id}
                        src={selected.url}
                        controls
                        autoPlay
                        loop
                        className="w-full"
                        style={{ maxHeight: 520 }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={selected.id}
                        src={selected.url}
                        alt="Jardin généré"
                        className="w-full object-contain"
                        style={{ maxHeight: 520 }}
                      />
                    )}
                  </div>

                  {versions.length > 1 && (
                    <div className="w-full sm:w-24 shrink-0 border-t sm:border-t-0 sm:border-l border-sage-100 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto py-2 sm:py-3 px-2 flex flex-row sm:flex-col gap-2" style={{ maxHeight: 520 }}>
                      {versions.map((v, i) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedIdx(i)}
                          className={cn(
                            'w-20 sm:w-auto shrink-0 rounded-xl overflow-hidden border-2 transition-all text-left',
                            i === selectedIdx ? 'border-sage-500 ring-2 ring-sage-200' : 'border-transparent hover:border-sage-200',
                          )}
                        >
                          {v.mode === 'video' ? (
                            <video src={v.url} className="w-full aspect-[4/3] object-cover pointer-events-none" muted />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.url} alt="" className="w-full aspect-[4/3] object-cover" />
                          )}
                          <p className="text-[10px] text-center text-midnight/45 py-1 truncate px-1">Version {i + 1}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Retouch bar */}
              {selected.mode === 'image' && (
                <div className="border-t border-sage-100 px-4 py-3 flex items-center gap-2 bg-cream-50/60">
                  <input
                    ref={retouchInputRef}
                    type="text"
                    value={retouchText}
                    onChange={e => setRetouchText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && canRetouch && retouchText.trim()) handleRetouch() }}
                    placeholder="Ex : agrandir la terrasse en bois et ajouter un éclairage extérieur…"
                    className="flex-1 min-w-0 bg-white border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all"
                  />
                  <button
                    onClick={handleRetouch}
                    disabled={!canRetouch || !retouchText.trim()}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0',
                      canRetouch && retouchText.trim()
                        ? 'bg-glow-500 hover:bg-glow-400 text-white cursor-pointer'
                        : 'bg-sage-100 text-sage-300 cursor-not-allowed',
                    )}
                  >
                    {retouchStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Appliquer
                  </button>
                </div>
              )}
              {retouchStatus === 'error' && retouchError && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-xs text-rose-600">{retouchError}</p>
                </div>
              )}
            </div>
          )}

          {/* Characteristics */}
          <div className="order-8 lg:order-none rounded-2xl border border-sage-100 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-sage-100 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-sage-500" strokeWidth={1.75} />
              <div>
                <h2 className="font-display font-semibold text-[15px] text-midnight">Caractéristiques</h2>
                <p className="text-xs text-midnight/40 mt-0.5">Précisez votre projet — optionnel</p>
              </div>
            </div>
            <div className="p-4">
              <textarea
                ref={characteristicsRef}
                value={characteristics}
                onChange={e => setCharacteristics(e.target.value)}
                placeholder="Ex : ajouter une pergola en bois naturel, conserver les rosiers en facade, prévoir un espace pour les enfants, fontaine en pierre, budget intermédiaire, éviter les espèces invasives…"
                rows={4}
                className="w-full bg-cream-50 border border-sage-200 rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 resize-none transition-all"
              />
              <p className="text-xs text-midnight/30 mt-2">
                Ces précisions seront transmises à l&apos;IA pour personnaliser le rendu.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="order-9 lg:order-none rounded-2xl border border-sage-100 bg-cream-50 p-5">
            <p className="text-[11px] font-semibold text-midnight/35 uppercase tracking-widest mb-3">
              Conseils photo
            </p>
            <ul className="flex flex-col gap-2.5 text-xs text-midnight/50 leading-relaxed">
              <li className="flex items-start gap-2">
                <span>📸</span>
                <span>Photographiez depuis un angle montrant l&apos;ensemble du jardin</span>
              </li>
              <li className="flex items-start gap-2">
                <span>☀️</span>
                <span>La lumière naturelle du jour donne les meilleurs résultats</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🏠</span>
                <span>Incluez murs, clôtures et terrasse pour un rendu plus réaliste</span>
              </li>
            </ul>
          </div>

          {gen.status === 'error' && (
            <div className="order-10 lg:order-none rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm text-rose-700">
              {gen.error}
            </div>
          )}
        </div>

        {/* Right: mode + style + generate */}
        <div className="contents lg:flex lg:flex-col lg:gap-4">

          {/* Mode switch */}
          <div className="order-3 lg:order-none rounded-2xl border border-sage-200 bg-white p-1.5 flex gap-1 shadow-sm">
            <button
              onClick={() => { setMode('image'); setGen({ status: 'idle' }) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                mode === 'image'
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'text-midnight/45 hover:text-midnight hover:bg-sage-50',
              )}
            >
              <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
              Image
            </button>
            <button
              onClick={() => { setMode('video'); setGen({ status: 'idle' }) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                mode === 'video'
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'text-midnight/45 hover:text-midnight hover:bg-sage-50',
              )}
            >
              <Video className="w-4 h-4" strokeWidth={1.75} />
              Vidéo
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage-100 text-sage-600 font-bold">IA</span>
            </button>
          </div>

          {mode === 'video' && (
            <div className="order-4 lg:order-none rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-[13px] text-sage-700 leading-relaxed">
              <strong>🎬 Vidéo animée</strong> — Votre jardin transformé en vidéo 5 secondes. Parfait pour présenter vos projets ou partager sur les réseaux sociaux.
            </div>
          )}

          {/* Style picker */}
          <div ref={styleSectionRef} className="order-5 lg:order-none rounded-2xl border border-sage-100 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-sage-100">
              <h2 className="font-display font-semibold text-[15px] text-midnight">Style de jardin</h2>
              <p className="text-xs text-midnight/40 mt-0.5">Choisissez l&apos;ambiance de votre rendu</p>
            </div>
            <div className="p-3 flex flex-col gap-1">
              {GARDEN_STYLES.map(style => (
                <button
                  key={style.slug}
                  onClick={() => setStyleSlug(style.slug)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    styleSlug === style.slug
                      ? 'bg-sage-50 border border-sage-300'
                      : 'border border-transparent hover:bg-cream-100 hover:border-sage-100',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={style.image} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  <div>
                    <p className={cn(
                      'text-sm font-semibold',
                      styleSlug === style.slug ? 'text-sage-700' : 'text-midnight/75',
                    )}>
                      {style.name}
                    </p>
                    <p className="text-xs text-midnight/40">{style.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'order-6 lg:order-none w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all',
              canGenerate
                ? 'bg-sage-500 hover:bg-sage-600 text-white shadow-sm hover:shadow-md cursor-pointer'
                : 'bg-sage-100 text-sage-300 cursor-not-allowed border border-sage-200',
            )}
          >
            {gen.status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === 'video' ? 'Génération vidéo…' : 'Génération en cours…'}
              </>
            ) : (
              <>
                {mode === 'video' ? <Video className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {mode === 'video' ? 'Générer la vidéo' : 'Générer mon rendu'}
              </>
            )}
          </button>

          {gen.status === 'loading' && (
            <p className="order-7 lg:order-none text-xs text-center text-midnight/35 leading-relaxed">
              {mode === 'video'
                ? <>L&apos;IA génère votre vidéo.<br />Comptez 60 à 120 secondes.</>
                : <>L&apos;IA analyse et transforme votre jardin.<br />Comptez 30 à 60 secondes.</>
              }
            </p>
          )}

          {!file && gen.status !== 'loading' && (
            <p className="order-7 lg:order-none text-xs text-center text-midnight/30">
              Téléchargez d&apos;abord une photo de votre jardin
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
