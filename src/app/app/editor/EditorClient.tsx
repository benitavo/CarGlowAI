'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Upload, Loader2, Download, ArrowLeft, Sparkles,
  RotateCcw, Video, Image as ImageIcon, PenLine,
  Wand2, RefreshCw, Palette, Send, AlertTriangle, X, Clapperboard, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GARDEN_STYLES } from '@/lib/gardenStyles'
import { downloadUrlAsFile } from '@/lib/download-file'
import { MarketingKitModal } from '@/components/app/MarketingKitModal'

type Mode = 'image' | 'video'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // matches the "jusqu'à 20 Mo" copy on the dropzone
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function validateImageFile(f: File): string | null {
  if (!ACCEPTED_TYPES.includes(f.type) && !f.type.startsWith('image/')) {
    return 'Ce fichier n\'est pas une image. Formats acceptés : JPG, PNG, HEIC.'
  }
  if (f.size > MAX_FILE_SIZE) {
    return `Cette photo pèse ${(f.size / (1024 * 1024)).toFixed(1)} Mo, la limite est de 20 Mo.`
  }
  return null
}

interface GenState {
  status: 'idle' | 'loading' | 'done' | 'error'
  resultUrl?: string
  error?: string
  processingMs?: number
}

interface CreditError {
  available: number
  required: number
}

interface Version {
  id: string
  url: string
  mode: Mode
  kind: 'generate' | 'retouch'
  processingMs?: number
}

function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Real bug (a user's upload failed with a raw "Request Entity Too Large" — Vercel hard-caps
// serverless function request bodies at 4.5 Mo, and a phone photo sent at full resolution
// blows well past that once base64-encoded, which inflates size by ~33%). Downscaling here
// means the 20 Mo the dropzone advertises is honest — the actual upload the AI receives stays
// small regardless of the source photo's resolution, since a style-transfer render doesn't
// benefit from more than ~2000px on the long edge anyway.
const MAX_UPLOAD_DIMENSION = 2000
const UPLOAD_JPEG_QUALITY = 0.85

async function prepareImageForUpload(file: File): Promise<{ base64: string; mimeType: string }> {
  try {
    const dataUrl = await readFileAsDataUrl(file)
    const img = new window.Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode failed'))
      img.src = dataUrl
    })

    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
    const width  = Math.round(img.naturalWidth * scale)
    const height = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas context')
    ctx.drawImage(img, 0, 0, width, height)

    const resizedDataUrl = canvas.toDataURL('image/jpeg', UPLOAD_JPEG_QUALITY)
    return { base64: resizedDataUrl.split(',')[1], mimeType: 'image/jpeg' }
  } catch {
    // HEIC in particular can't be decoded into a canvas by every browser (Safari can, Chrome
    // generally can't) — fall back to sending the original file untouched rather than fail the
    // whole generation over a resize step that's a nice-to-have, not a requirement.
    const dataUrl = await readFileAsDataUrl(file)
    return { base64: dataUrl.split(',')[1], mimeType: file.type || 'image/jpeg' }
  }
}

function splitDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!match) throw new Error('Format image invalide')
  return { mimeType: match[1], base64: match[2] }
}

function focusAndScroll(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (ref.current instanceof HTMLInputElement || ref.current instanceof HTMLTextAreaElement) {
    window.setTimeout(() => ref.current?.focus(), 300)
  }
}

export default function EditorClient() {
  const { data: session } = useSession()

  const [mode, setMode]                      = useState<Mode>('image')
  const [file, setFile]                      = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]          = useState<string | null>(null)
  const [styleSlug, setStyleSlug]            = useState('gazon-fleurs')
  const [characteristics, setCharacteristics] = useState('')
  const [gen, setGen]                        = useState<GenState>({ status: 'idle' })
  const [uploadError, setUploadError]        = useState<string | null>(null)
  const [isDragging, setIsDragging]          = useState(false)
  const dragCounter                          = useRef(0)
  const fileInputRef                         = useRef<HTMLInputElement>(null)

  const [versions, setVersions]     = useState<Version[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [retouchText, setRetouchText]     = useState('')
  const [retouchStatus, setRetouchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [retouchError, setRetouchError]   = useState<string | undefined>()
  const [creditError, setCreditError]     = useState<CreditError | null>(null)
  const [showMarketingKit, setShowMarketingKit] = useState(false)
  // Starts true (badge hidden) to avoid a server/client mismatch flash — localStorage doesn't
  // exist during SSR, so we can only know the real answer after mount.
  const [marketingKitSeen, setMarketingKitSeen] = useState(true)
  const uploadSectionRef  = useRef<HTMLDivElement>(null)
  const styleSectionRef   = useRef<HTMLDivElement>(null)
  const characteristicsRef = useRef<HTMLTextAreaElement>(null)
  const retouchInputRef    = useRef<HTMLInputElement>(null)

  const [credits, setCredits]         = useState<number | null>(null)
  const [featureCosts, setFeatureCosts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/pricing')
      .then(r => r.json())
      .then(d => {
        const costs: Record<string, number> = {}
        for (const f of d.features ?? []) costs[f.key] = f.creditCost
        setFeatureCosts(costs)
      })
      .catch(() => {})
  }, [])

  const refreshCredits = useCallback(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setCredits((d.monthlyCredits ?? 0) + (d.bonusCredits ?? 0)))
      .catch(() => {})
  }, [])

  useEffect(() => { refreshCredits() }, [refreshCredits])
  useEffect(() => { setMarketingKitSeen(localStorage.getItem('verdia-marketing-kit-seen') === '1') }, [])

  const selected = selectedIdx !== null ? versions[selectedIdx] : null

  const pushVersion = useCallback((v: Version) => {
    setVersions(prev => {
      const next = [...prev, v]
      setSelectedIdx(next.length - 1)
      return next
    })
  }, [])

  const loadFile = useCallback((f: File) => {
    const error = validateImageFile(f)
    if (error) {
      setUploadError(error)
      return
    }
    setUploadError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setGen({ status: 'idle' })
    setVersions([])
    setSelectedIdx(null)
  }, [previewUrl])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }, [loadFile])

  // Counter-based (not a single boolean) because dragging over a child element fires
  // dragleave on the parent before dragenter on the child — a naive enter/leave toggle would
  // flicker the highlight off while the pointer is still inside the dropzone.
  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setGen({ status: 'error', error: 'Ajoutez une photo de votre jardin avant de générer.' })
      focusAndScroll(uploadSectionRef)
      return
    }
    if (!session?.user?.workspaceId) {
      setGen({ status: 'error', error: 'Session non chargée — rechargez la page et réessayez.' })
      return
    }
    setGen({ status: 'loading' })
    try {
      const { base64, mimeType } = await prepareImageForUpload(file)
      const endpoint = mode === 'video' ? '/api/generate-video' : '/api/generate'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData:       base64,
          mimeType,
          styleSlug,
          characteristics: characteristics.trim() || undefined,
          workspaceId:     session.user.workspaceId,
        }),
      })
      const data = await res.json().catch(() => {
        // A non-JSON body means the request never reached our route handler at all (e.g. the
        // platform itself rejecting an oversized payload with a plain-text "Request Entity Too
        // Large") — surface something a user can act on instead of the raw parse exception.
        throw new Error(res.status === 413
          ? 'Cette photo est trop volumineuse. Essayez une version compressée ou une autre photo.'
          : 'Le serveur a renvoyé une réponse inattendue. Réessayez.')
      })
      if (!res.ok) {
        if (res.status === 402 || data.error === 'insufficient_credits') {
          setGen({ status: 'idle' })
          setCreditError({ available: data.available ?? 0, required: data.required ?? 0 })
          return
        }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      const url = data.enhancedUrl ?? data.videoUrl
      pushVersion({ id: data.photoId ?? `${Date.now()}`, url, mode, kind: 'generate', processingMs: data.processingMs })
      setGen({ status: 'done', resultUrl: url, processingMs: data.processingMs })
      refreshCredits()
    } catch (err) {
      setGen({ status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }, [file, session, styleSlug, characteristics, mode, pushVersion, refreshCredits])

  const handleRetouch = useCallback(async () => {
    if (!retouchText.trim() || !selected || selected.mode !== 'image') return
    if (!session?.user?.workspaceId) {
      setRetouchError('Session non chargée — rechargez la page et réessayez.')
      setRetouchStatus('error')
      return
    }
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
      if (!res.ok) {
        if (res.status === 402 || data.error === 'insufficient_credits') {
          setRetouchStatus('idle')
          setCreditError({ available: data.available ?? 0, required: data.required ?? 0 })
          return
        }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      pushVersion({ id: data.photoId, url: data.enhancedUrl, mode: 'image', kind: 'retouch', processingMs: data.processingMs })
      setRetouchText('')
      setRetouchStatus('idle')
      refreshCredits()
    } catch (err) {
      setRetouchError(err instanceof Error ? err.message : 'Erreur inconnue')
      setRetouchStatus('error')
    }
  }, [retouchText, selected, session, styleSlug, pushVersion, refreshCredits])

  const handleDownload = async () => {
    const url = selected?.url ?? gen.resultUrl
    if (!url) return
    const ext = (selected?.mode ?? mode) === 'video' ? 'mp4' : 'png'
    await downloadUrlAsFile(url, `verdia-${styleSlug}-${Date.now()}.${ext}`)
  }

  // Deliberately does NOT require `file` — the button always stays clickable so a click with
  // no photo yet still reaches handleGenerate(), which shows a clear "add a photo" message and
  // scrolls to the upload zone, instead of silently doing nothing (a real bug report: a user
  // clicked a disabled-looking button repeatedly and assumed the site was broken).
  const canGenerate = gen.status !== 'loading'
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
        <Link
          href="/app/billing"
          className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-sage-50 border border-sage-200 text-xs sm:text-sm font-semibold text-sage-700 hover:bg-sage-100 transition-colors"
        >
          {credits === null ? '…' : `${credits.toLocaleString()} crédit${credits === 1 ? '' : 's'}`}
        </Link>
      </header>

      {/* Step tracker — the layout below already follows this exact order (see the order-*
          comment further down); this just makes that implicit sequence visible so a first-time
          user knows what's coming before they start, and where they are once they have. */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-5 pt-5 sm:pt-6">
        <ol className="flex items-center justify-center gap-2 sm:gap-3">
          {([
            { n: 1, label: 'Photo', done: !!file },
            { n: 2, label: 'Style', done: !!file },
            { n: 3, label: 'Résultat', done: versions.length > 0 },
          ] as const).map((step, i) => (
            <li key={step.n} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors',
                  step.done ? 'bg-sage-500 text-white' : 'bg-sage-100 text-sage-500 border border-sage-200',
                )}>
                  {step.done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : step.n}
                </span>
                <span className={cn('text-xs font-medium transition-colors', step.done ? 'text-midnight/70' : 'text-midnight/40')}>
                  {step.label}
                </span>
              </div>
              {i < 2 && <div className={cn('w-6 sm:w-12 h-px transition-colors', step.done ? 'bg-sage-400' : 'bg-sage-200')} />}
            </li>
          ))}
        </ol>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-6 sm:py-8 grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

        {/* Left: upload + result — `contents` on mobile lets children join the outer grid's
            order flow; becomes a real flex column again from lg+ (see order-* on each child) */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">

          {/* Upload zone */}
          <div
            ref={uploadSectionRef}
            className={cn(
              'order-1 lg:order-none relative rounded-3xl border-2 border-dashed transition-all',
              isDragging
                ? 'border-sage-500 bg-sage-100 scale-[1.01]'
                : file
                  ? 'border-sage-200'
                  : 'border-sage-200 bg-sage-50/40 hover:border-sage-400 hover:bg-sage-50 cursor-pointer',
            )}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 px-8">
                <div className="w-16 h-16 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-sage-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-midnight/55 mb-1">
                    {isDragging ? 'Lâchez votre photo ici' : 'Déposez votre photo de jardin'}
                  </p>
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

          {/* Shown right where the scroll-to-upload-zone behaviour above actually lands the
              user, instead of only in the generic error box further down the page which they'd
              have to keep scrolling to find. */}
          {(uploadError || (!file && gen.status === 'error')) && (
            <p className="order-1 lg:order-none -mt-3 text-sm text-rose-600 text-center">
              {uploadError ?? gen.error}
            </p>
          )}

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
                <div className="flex items-center gap-2">
                  {selected.kind === 'generate' && (
                    <button
                      onClick={() => {
                        setShowMarketingKit(true)
                        localStorage.setItem('verdia-marketing-kit-seen', '1')
                        setMarketingKitSeen(true)
                      }}
                      className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl border border-sage-200 text-sage-700 hover:bg-sage-50 text-xs font-semibold transition-all"
                    >
                      {/* Fades away for good once clicked once — a badge that never goes away
                          stops meaning "new" and just becomes decoration nobody trusts. */}
                      {!marketingKitSeen && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                      <Clapperboard className="w-3.5 h-3.5" />
                      Kit marketing
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </button>
                </div>
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
                          ) : v.url.startsWith('data:') ? (
                            // Older versions still have a base64 data: URI (pre-fal.ai-storage
                            // migration) — next/image can't optimize those.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.url} alt="" className="w-full aspect-[4/3] object-cover" />
                          ) : (
                            <div className="relative w-full aspect-[4/3]">
                              <Image src={v.url} alt="" fill sizes="96px" className="object-cover" />
                            </div>
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
                <div className="border-t border-sage-100 px-4 pt-3 pb-0 flex items-center justify-between">
                  <span className="text-[11px] text-midnight/35">
                    Retouche — Coûte {featureCosts.imageRetouch ?? 1} crédit{(featureCosts.imageRetouch ?? 1) === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              {selected.mode === 'image' && (
                <div className="px-4 py-3 flex items-center gap-2 bg-cream-50/60">
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

          {/* The "no photo yet" case is already shown right next to the upload zone above
              (that's where handleGenerate scrolls to) — only render this one for errors that
              happen once a file exists, e.g. an API failure, so the message isn't duplicated. */}
          {gen.status === 'error' && file && (
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
              aria-pressed={mode === 'image'}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
                mode === 'image'
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'text-midnight/45 hover:text-midnight hover:bg-sage-50',
              )}
            >
              <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
              Image
              {featureCosts.imageGeneration != null && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  mode === 'image' ? 'bg-white/20 text-white' : 'bg-sage-100 text-sage-600',
                )}>
                  {featureCosts.imageGeneration} crédit{featureCosts.imageGeneration === 1 ? '' : 's'}
                </span>
              )}
            </button>
            <button
              onClick={() => { setMode('video'); setGen({ status: 'idle' }) }}
              aria-pressed={mode === 'video'}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
                mode === 'video'
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'text-midnight/45 hover:text-midnight hover:bg-sage-50',
              )}
            >
              <Video className="w-4 h-4" strokeWidth={1.75} />
              Vidéo
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                mode === 'video' ? 'bg-white/20 text-white' : 'bg-sage-100 text-sage-600',
              )}>
                {featureCosts.videoGeneration != null ? `${featureCosts.videoGeneration} crédits` : 'IA'}
              </span>
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
                  aria-pressed={styleSlug === style.slug}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
                    styleSlug === style.slug
                      ? 'bg-sage-50 border border-sage-300'
                      : 'border border-transparent hover:bg-cream-100 hover:border-sage-100',
                  )}
                >
                  <Image src={style.image} alt="" width={44} height={44} className="w-11 h-11 rounded-lg object-cover shrink-0" />
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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
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
                {(() => {
                  const cost = mode === 'video' ? featureCosts.videoGeneration : featureCosts.imageGeneration
                  return cost != null ? ` · ${cost} crédit${cost === 1 ? '' : 's'}` : ''
                })()}
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

      {/* Blocking popup — the guaranteed-visible warning that a render is in progress and the
          user needs to wait, regardless of whether a previous result already fills the main
          content area (a first-ever generation has nothing else on screen to signal this). */}
      {gen.status === 'loading' && <GeneratingModal mode={mode} />}

      {creditError && (
        <InsufficientCreditsModal
          available={creditError.available}
          required={creditError.required}
          onClose={() => setCreditError(null)}
        />
      )}

      {showMarketingKit && selected && (
        <MarketingKitModal photoId={selected.id} onClose={() => setShowMarketingKit(false)} hasVideoAfter={selected.mode === 'video'} />
      )}
    </div>
  )
}

// No close button and the backdrop doesn't dismiss it — unlike InsufficientCreditsModal below,
// there is nothing to cancel here: the fetch keeps running either way, so offering a "close"
// affordance would just let the user believe they stopped something they didn't. It disappears
// on its own the moment gen.status leaves 'loading', which is the real signal, not a timer.
function GeneratingModal({ mode }: { mode: Mode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-midnight/40 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl w-full max-w-sm p-7 pointer-events-auto shadow-card text-center">
          <Loader2 className="w-9 h-9 mx-auto text-sage-500 animate-spin mb-4" />
          <h3 className="font-display font-semibold text-lg text-midnight mb-2">
            {mode === 'video' ? 'Génération de la vidéo en cours' : 'Génération du rendu en cours'}
          </h3>
          <p className="text-sm text-midnight/50">
            Merci de patienter, ne fermez pas cette page.
            <br />
            {mode === 'video' ? 'Comptez 60 à 120 secondes.' : 'Comptez 30 à 60 secondes.'}
          </p>
        </div>
      </div>
    </>
  )
}

function InsufficientCreditsModal({ available, required, onClose }: { available: number; required: number; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-midnight/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white border border-rose-100 rounded-2xl w-full max-w-sm p-6 pointer-events-auto shadow-card text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded hover:bg-sage-50 text-midnight/40"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" strokeWidth={1.75} />
          </div>
          <h3 className="font-display font-semibold text-lg text-midnight mb-2">Crédits insuffisants</h3>
          <p className="text-sm text-midnight/50 mb-6">
            Il vous faut {required} crédit{required === 1 ? '' : 's'} pour cette action, il vous en reste {available}.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/app/billing"
              className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              Recharger des crédits
            </Link>
            <button onClick={onClose} className="text-sm text-midnight/40 hover:text-midnight/60 py-1">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
