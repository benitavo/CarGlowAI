'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload, Download, Check, Loader2,
  RefreshCw, ArrowLeft, Zap, AlertCircle,
  Library, Sparkles, X, GripVertical, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// STYLE CATALOGUE
// Hardcoded client-side, decoupled from the DB Style table so the picker shows
// exactly the three productised options. The slug is what gets sent to the
// /api/enhance endpoint, which maps it to a prompt template server-side.
// ─────────────────────────────────────────────────────────────────────────────

interface StyleOption {
  slug:        string
  name:        string
  description: string
  thumbnail:   string
}

const STYLES: StyleOption[] = [
  {
    slug:        'dealership',
    name:        'Dealership',
    description: 'Blurred premium showroom backdrop',
    thumbnail:   '/backgrounds/dealership.jpg',
  },
  {
    slug:        'wood-floor',
    name:        'Showroom Floor',
    description: 'Wood floor with showroom behind',
    thumbnail:   '/backgrounds/wood-floor.jpg',
  },
  {
    slug:        'showroom',
    name:        'Full Showroom',
    description: 'Bright spacious multi-car dealership',
    thumbnail:   '/backgrounds/showroom.jpg',
  },
]

// ─── Photo-slot state model ─────────────────────────────────────────────────

type PhotoStatus = 'uploading' | 'uploaded' | 'enhancing' | 'enhanced' | 'failed'

interface PhotoSlot {
  id:           string         // client-side id (stable across reorders)
  localUrl:     string         // blob: preview URL for the original
  uploadedUrl?: string         // fal.ai CDN URL after upload
  enhancedUrl?: string         // result URL after enhancement
  status:       PhotoStatus
  error?:       string
  processingMs?: number
}

const MAX_PHOTOS    = 10
const ACCEPT_TYPES  = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

// Photo quality requirements — shown to user if their photo might be problematic
const PHOTO_TIPS = [
  'La voiture doit être entièrement visible (4 roues et carrosserie complète)',
  'Évitez les photos trop serrées ou partielles',
  'Minimum 800px de large recommandé',
  'Bonne luminosité — évitez les photos très sombres',
]

// Client-side pre-flight checks — fast, before upload
// Returns a warning string or null if the photo looks usable
async function checkPhotoQuality(file: File): Promise<string | null> {
  return new Promise(resolve => {
    // Check minimum file size (very small = too low res or cropped)
    if (file.size < 50_000) {
      resolve('Cette photo est trop petite (moins de 50 KB). Utilisez une photo de meilleure qualité.')
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (img.width < 400 || img.height < 300) {
        resolve(`Photo trop petite (${img.width}×${img.height}px). Minimum recommandé : 800×600px.`)
      } else {
        resolve(null) // looks fine
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level store — survives component unmount/remount during client-side
// navigation (e.g. tabbing away to Library and back) so an in-progress batch
// isn't lost. A tiny pub/sub lets whichever EditorPage instance is currently
// mounted receive updates even if the batch loop was started by a previous
// (now-unmounted) instance. Does NOT survive a full page reload — results are
// saved to the library server-side regardless.
const editorStore: {
  photos:    PhotoSlot[]
  styleSlug: string
  sessionId: string
  batchSeed: number
  running:   boolean
} = {
  photos:    [],
  styleSlug: STYLES[0].slug,
  sessionId: cryptoId(),
  batchSeed: randomSeed(),
  running:   false,
}

const storeListeners = new Set<() => void>()
function notifyStore() { storeListeners.forEach(fn => fn()) }
function updateStorePhotos(updater: (p: PhotoSlot[]) => PhotoSlot[]) {
  editorStore.photos = updater(editorStore.photos)
  notifyStore()
}

export default function EditorPage() {
  const [photos, setPhotosRaw]        = useState<PhotoSlot[]>(editorStore.photos)
  const [styleSlug, setStyleSlugRaw]  = useState<string>(editorStore.styleSlug)
  const [sessionId, setSessionId]     = useState<string>(editorStore.sessionId)
  const [batchSeed, setBatchSeed]     = useState<number>(editorStore.batchSeed)
  const [batchRunning, setBatchRunning] = useState(editorStore.running)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Subscribe to store changes so this instance reflects updates made by a
  // batch loop that may have been started before navigating away and back.
  useEffect(() => {
    const sync = () => {
      setPhotosRaw(editorStore.photos)
      setBatchRunning(editorStore.running)
    }
    storeListeners.add(sync)
    sync() // pull latest immediately on mount
    return () => { storeListeners.delete(sync) }
  }, [])

  // All photo mutations go through the store so they survive navigation AND
  // notify the live instance.
  const setPhotos = (v: PhotoSlot[] | ((p: PhotoSlot[]) => PhotoSlot[])) => {
    updateStorePhotos(prev => (typeof v === 'function' ? (v as (p: PhotoSlot[]) => PhotoSlot[])(prev) : v))
  }
  const setStyleSlug: typeof setStyleSlugRaw = (v) => {
    setStyleSlugRaw(prev => {
      const next = typeof v === 'function' ? (v as (s: string) => string)(prev) : v
      editorStore.styleSlug = next
      return next
    })
  }
  const setRunning = (v: boolean) => { editorStore.running = v; setBatchRunning(v); notifyStore() }
  useEffect(() => { editorStore.sessionId = sessionId }, [sessionId])
  useEffect(() => { editorStore.batchSeed = batchSeed }, [batchSeed])

  const [credits, setCredits]         = useState<number | null>(null)
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<{ slotId: string | null }>({ slotId: null })

  const enhancedCount = photos.filter(p => p.status === 'enhanced').length
  const remaining     = credits !== null ? credits - enhancedCount : null

  // ── Bootstrap: workspace + credits ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => { setCredits(d.creditsRemaining); setWorkspaceId(d.workspaceId); setIsSuperuser(!!d.isSuperuser) })
      .catch(() => {})
  }, [])

  // ── Add photo(s) → create slots + upload in parallel ─────────────────────
  const addPhotos = useCallback(async (files: File[]) => {
    if (!files.length) return
    setGlobalError(null)

    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setGlobalError(`Maximum ${MAX_PHOTOS} photos par lot.`)
      return
    }
    const accepted = files.slice(0, room).filter(f => f.type.startsWith('image/'))

    // Run client-side quality checks before creating slots
    const warnings: string[] = []
    for (const file of accepted) {
      const warning = await checkPhotoQuality(file)
      if (warning) warnings.push(`${file.name}: ${warning}`)
    }
    if (warnings.length > 0) {
      setGlobalError(warnings.join(' • '))
      // Don't block — warn but still let them upload if they insist
      // (server-side will catch true failures)
    }

    // Create slots up-front so the UI feels instant
    const newSlots: PhotoSlot[] = accepted.map(file => ({
      id:       cryptoId(),
      localUrl: URL.createObjectURL(file),
      status:   'uploading',
    }))
    setPhotos(prev => [...prev, ...newSlots])

    // Upload in parallel — each settles independently so one failure doesn't
    // poison the batch.
    await Promise.allSettled(
      newSlots.map(async (slot, idx) => {
        try {
          const fd = new FormData()
          fd.append('file', accepted[idx])
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error('Upload failed')
          const { url } = await res.json()
          setPhotos(prev => prev.map(p =>
            p.id === slot.id ? { ...p, uploadedUrl: url, status: 'uploaded' } : p
          ))
        } catch (err) {
          setPhotos(prev => prev.map(p =>
            p.id === slot.id ? { ...p, status: 'failed', error: 'Upload failed' } : p
          ))
        }
      })
    )
  }, [photos.length])

  // ── Remove a slot ────────────────────────────────────────────────────────
  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const slot = prev.find(p => p.id === id)
      if (slot?.localUrl.startsWith('blob:')) URL.revokeObjectURL(slot.localUrl)
      return prev.filter(p => p.id !== id)
    })
  }

  // ── Replace a slot (keeps position) ──────────────────────────────────────
  const triggerReplace = (id: string) => {
    replaceRef.current.slotId = id
    fileRef.current?.click()
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''  // allow re-selecting the same file later

    // Replace flow
    const replaceId = replaceRef.current.slotId
    if (replaceId && files[0]) {
      replaceRef.current.slotId = null
      const file = files[0]
      const localUrl = URL.createObjectURL(file)
      setPhotos(prev => prev.map(p => p.id === replaceId
        ? { ...p, localUrl, uploadedUrl: undefined, enhancedUrl: undefined, status: 'uploading', error: undefined }
        : p
      ))
      try {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error()
        const { url } = await res.json()
        setPhotos(prev => prev.map(p =>
          p.id === replaceId ? { ...p, uploadedUrl: url, status: 'uploaded' } : p
        ))
      } catch {
        setPhotos(prev => prev.map(p =>
          p.id === replaceId ? { ...p, status: 'failed', error: 'Upload failed' } : p
        ))
      }
      return
    }

    // Add flow
    await addPhotos(files)
  }

  // ── Drag & drop reorder (HTML5 native — no library needed) ───────────────
  const dragSrcRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    dragSrcRef.current = id
    e.dataTransfer.effectAllowed = 'move'
    // Some browsers require dataTransfer data to be set
    e.dataTransfer.setData('text/plain', id)
  }
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }
  const onDragLeave = () => setDragOverId(null)
  const onDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverId(null)
    const sourceId = dragSrcRef.current
    dragSrcRef.current = null
    if (!sourceId || sourceId === targetId) return

    setPhotos(prev => {
      const src = prev.findIndex(p => p.id === sourceId)
      const tgt = prev.findIndex(p => p.id === targetId)
      if (src < 0 || tgt < 0) return prev
      const next = prev.slice()
      const [moved] = next.splice(src, 1)
      next.splice(tgt, 0, moved)
      return next
    })
  }
  const onDragEnd = () => { dragSrcRef.current = null; setDragOverId(null) }

  // ── Drop files anywhere on the upload zone ───────────────────────────────
  const onDropZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) await addPhotos(files)
  }

  // ── Run enhance batch ────────────────────────────────────────────────────
  const runBatch = async () => {
    if (!workspaceId) return
    const eligible = photos.filter(p => p.status === 'uploaded' && p.uploadedUrl)
    if (eligible.length === 0) return

    if (!isSuperuser && remaining !== null && eligible.length > remaining) {
      setGlobalError(`Not enough credits. You have ${remaining}, need ${eligible.length}.`)
      return
    }

    setRunning(true)
    setGlobalError(null)

    // Process sequentially to avoid bursting FAL rate limits and to keep the
    // results stylistically coherent (same prompt, same model state).
    for (const slot of eligible) {
      setPhotos(prev => prev.map(p => p.id === slot.id ? { ...p, status: 'enhancing', error: undefined } : p))
      try {
        const res = await fetch('/api/enhance', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl:    slot.uploadedUrl,
            styleSlug,
            workspaceId,
            sessionId,
            batchSeed,
          }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? 'Enhancement failed')
        }
        const data = await res.json()
        setPhotos(prev => prev.map(p => p.id === slot.id
          ? { ...p, status: 'enhanced', enhancedUrl: data.enhancedUrl, processingMs: data.processingMs }
          : p
        ))
      } catch (err) {
        setPhotos(prev => prev.map(p => p.id === slot.id
          ? { ...p, status: 'failed', error: err instanceof Error ? err.message : 'Failed' }
          : p
        ))
      }
    }

    setRunning(false)
  }

  const resetBatch = () => {
    photos.forEach(p => { if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl) })
    setPhotos([])
    setSessionId(cryptoId())
    setBatchSeed(randomSeed())
    setGlobalError(null)
  }

  const hasPhotos       = photos.length > 0
  const hasEnhanced     = photos.some(p => p.status === 'enhanced')
  const uploadingCount  = photos.filter(p => p.status === 'uploading').length
  const readyToEnhance  = photos.filter(p => p.status === 'uploaded').length
  const enhancingCount  = photos.filter(p => p.status === 'enhancing').length

  return (
    <div className="min-h-screen flex flex-col bg-midnight">

      {/* Header */}
      <header className="h-12 border-b border-white/[0.06] bg-midnight-800/60 backdrop-blur flex items-center px-5 gap-4 shrink-0">
        <Link href="/app" className="flex items-center gap-1.5 text-sm text-offwhite/50 hover:text-offwhite transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
          <span className="text-offwhite/55 text-xs">Plates auto-anonymised</span>
        </div>
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className={cn(
          'flex items-center gap-1.5 text-sm font-medium',
          !isSuperuser && remaining !== null && remaining < 10 ? 'text-rose-400' : 'text-offwhite/60'
        )}>
          <Zap className="w-3.5 h-3.5 text-glow-500" fill="currentColor" />
          <span className="tabular-nums">{isSuperuser ? '∞' : (remaining !== null ? remaining : '—')}</span>
          <span className="text-offwhite/35">credits</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 px-6 lg:px-10 py-8 max-w-[1480px] w-full mx-auto">
        {!hasPhotos ? (
          /* ── Empty state — initial upload ─────────────────────────────── */
          <div className="w-full max-w-lg mx-auto pt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-offwhite mb-2">Uploadez vos photos</h2>
              <p className="text-offwhite/45 text-sm">
                Jusqu'à {MAX_PHOTOS} photos du même véhicule · JPG, PNG, WEBP, HEIC
              </p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              onDrop={onDropZoneDrop}
              onDragOver={e => e.preventDefault()}
              className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/[0.12] hover:border-glow-500/50 bg-white/[0.02] hover:bg-glow-500/[0.04] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] group-hover:bg-glow-500/15 flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-offwhite/40 group-hover:text-glow-400 transition-colors" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-offwhite/80 group-hover:text-offwhite">Déposez vos photos ici</p>
                <p className="text-xs text-offwhite/35 mt-1">ou cliquez pour parcourir</p>
              </div>
            </button>

            {/* Photo quality requirements */}
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-semibold text-offwhite/60 mb-3 uppercase tracking-wider">
                Pour un meilleur résultat
              </p>
              <ul className="space-y-2">
                {PHOTO_TIPS.map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-offwhite/45">
                    <Check className="w-3.5 h-3.5 text-glow-400/70 shrink-0 mt-0.5" strokeWidth={2.5} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          /* ── Working state — photos grid + style picker ───────────────── */
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">

            {/* LEFT — photo strip */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-offwhite">
                  Your photos
                  <span className="text-offwhite/40 ml-2 text-sm font-normal">
                    {photos.length} of {MAX_PHOTOS}
                  </span>
                </h2>
                {!batchRunning && photos.length < MAX_PHOTOS && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-glow-400 hover:text-glow-300 inline-flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Add more
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p) => (
                  <PhotoCard
                    key={p.id}
                    slot={p}
                    onRemove={() => removePhoto(p.id)}
                    onReplace={() => triggerReplace(p.id)}
                    isDragOver={dragOverId === p.id}
                    onDragStart={onDragStart(p.id)}
                    onDragOver={onDragOver(p.id)}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop(p.id)}
                    onDragEnd={onDragEnd}
                    disabled={batchRunning}
                  />
                ))}

                {photos.length < MAX_PHOTOS && !batchRunning && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    onDrop={onDropZoneDrop}
                    onDragOver={e => e.preventDefault()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/[0.1] hover:border-glow-500/50 bg-white/[0.02] hover:bg-glow-500/[0.04] transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Upload className="w-5 h-5 text-offwhite/35 group-hover:text-glow-400 transition-colors" strokeWidth={1.5} />
                    <span className="text-xs text-offwhite/35 group-hover:text-offwhite/60">Add photo</span>
                  </button>
                )}
              </div>

              {globalError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                  {globalError}
                </div>
              )}
            </div>

            {/* RIGHT — style picker + enhance */}
            <aside className="space-y-4 lg:sticky lg:top-6 self-start">
              <div>
                <h3 className="font-display font-semibold text-sm mb-1">Choose a style</h3>
                <p className="text-xs text-offwhite/45 mb-3">All photos will use the same style for a consistent shoot.</p>
                <div className="space-y-2">
                  {STYLES.map(s => (
                    <button
                      key={s.slug}
                      onClick={() => setStyleSlug(s.slug)}
                      disabled={batchRunning}
                      className={cn(
                        'w-full flex gap-3 p-2.5 rounded-xl border transition-all text-left disabled:opacity-50',
                        styleSlug === s.slug
                          ? 'border-glow-500/60 bg-glow-500/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/[0.08]">
                        <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{s.name}</span>
                          {styleSlug === s.slug && (
                            <Check className="w-3.5 h-3.5 text-glow-400" strokeWidth={3} />
                          )}
                        </div>
                        <p className="text-[11px] text-offwhite/50 mt-0.5 leading-snug">{s.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy notice (replaces the old toggle) */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-xs font-semibold text-emerald-300">Plates auto-anonymised</p>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">All visible registration plates are blurred. Cannot be disabled.</p>
                </div>
              </div>

              {/* Enhance CTA */}
              <button
                onClick={runBatch}
                disabled={
                  batchRunning ||
                  uploadingCount > 0 ||
                  readyToEnhance === 0 ||
                  (!isSuperuser && remaining !== null && remaining < 1)
                }
                className="w-full h-12 rounded-2xl bg-glow-500 hover:bg-glow-400 disabled:opacity-60 disabled:cursor-not-allowed text-midnight font-semibold text-sm shadow-glow-md transition-all flex items-center justify-center gap-2"
              >
                {batchRunning
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enhancing {enhancingCount > 0 ? `(${enhancedCount + 1}/${photos.length})` : ''}</>
                  : uploadingCount > 0
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : readyToEnhance === 0
                      ? 'No photos ready'
                      : <><Sparkles className="w-4 h-4" /> Enhance {readyToEnhance} photo{readyToEnhance !== 1 ? 's' : ''}{isSuperuser ? '' : ` · ${readyToEnhance} credit${readyToEnhance !== 1 ? 's' : ''}`}</>
                }
              </button>

              {!isSuperuser && remaining !== null && remaining < 5 && remaining > 0 && (
                <p className="text-xs text-center text-rose-400">
                  Only {remaining} credit{remaining !== 1 ? 's' : ''} left.{' '}
                  <Link href="/app/billing" className="underline hover:text-rose-300">Top up</Link>
                </p>
              )}

              {hasEnhanced && !batchRunning && (
                <div className="pt-3 border-t border-white/[0.05] space-y-2">
                  <Link
                    href="/app/library"
                    className="block text-center w-full h-10 rounded-xl border border-glow-500/30 hover:border-glow-500/60 text-glow-400 hover:text-glow-300 text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Library className="w-4 h-4" /> View in library
                  </Link>
                  <button
                    onClick={resetBatch}
                    className="block text-center w-full h-10 rounded-xl border border-white/[0.08] hover:border-white/[0.18] text-offwhite/60 hover:text-offwhite text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" /> Start a new batch
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Hidden file input — handles both add and replace flows */}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_TYPES}
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo card — handles preview, status overlay, remove, replace, drag handle
// ─────────────────────────────────────────────────────────────────────────────

interface PhotoCardProps {
  slot:        PhotoSlot
  onRemove:    () => void
  onReplace:   () => void
  isDragOver:  boolean
  disabled:    boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver:  (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop:      (e: React.DragEvent) => void
  onDragEnd:   () => void
}

function PhotoCard({
  slot, onRemove, onReplace, isDragOver, disabled,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: PhotoCardProps) {
  // Prefer the enhanced result, then the original-upload CDN URL, then the
  // local blob preview. After navigating away the blob: URL may be dead, so the
  // uploaded CDN URL is the reliable fallback.
  const previewUrl = slot.enhancedUrl ?? slot.uploadedUrl ?? slot.localUrl

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden border bg-midnight-900 group transition-all',
        isDragOver ? 'border-glow-500 scale-[1.02]' : 'border-white/[0.08]',
        slot.status === 'failed' && 'border-rose-500/40',
        disabled ? 'cursor-not-allowed' : 'cursor-move',
      )}
    >
      <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Status overlay */}
      {slot.status === 'uploading' && (
        <div className="absolute inset-0 bg-midnight-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5">
          <Loader2 className="w-5 h-5 animate-spin text-offwhite/60" />
          <span className="text-[10px] uppercase tracking-wider text-offwhite/50">Uploading</span>
        </div>
      )}
      {slot.status === 'enhancing' && (
        <div className="absolute inset-0 bg-glow-500/10 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5">
          <Sparkles className="w-5 h-5 animate-pulse text-glow-300" />
          <span className="text-[10px] uppercase tracking-wider text-glow-200">Enhancing</span>
        </div>
      )}
      {slot.status === 'enhanced' && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[9px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-0.5">
          <Check className="w-2.5 h-2.5" strokeWidth={3} /> Done
        </div>
      )}
      {slot.status === 'failed' && (
        <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1 p-2 text-center">
          <AlertCircle className="w-5 h-5 text-rose-300" />
          <span className="text-[10px] text-rose-200">{slot.error ?? 'Failed'}</span>
        </div>
      )}

      {/* Drag handle (top-right) */}
      {!disabled && slot.status !== 'enhancing' && slot.status !== 'uploading' && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded bg-midnight-900/85 backdrop-blur flex items-center justify-center">
            <GripVertical className="w-3.5 h-3.5 text-offwhite/70" />
          </div>
        </div>
      )}

      {/* Action bar — bottom on hover */}
      {!disabled && slot.status !== 'enhancing' && slot.status !== 'uploading' && (
        <div className="absolute inset-x-0 bottom-0 p-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-midnight-900/95 to-transparent">
          <button
            onClick={onReplace}
            className="flex-1 h-7 rounded bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur text-[10px] font-semibold uppercase tracking-wider text-offwhite/85 transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5" strokeWidth={2.5} /> Replace
          </button>
          {slot.status === 'enhanced' && slot.enhancedUrl && (
            <a
              href={slot.enhancedUrl}
              download="carglow.jpg"
              className="flex-1 h-7 rounded bg-glow-500 hover:bg-glow-400 text-[10px] font-bold uppercase tracking-wider text-midnight transition-colors flex items-center justify-center gap-1"
            >
              <Download className="w-2.5 h-2.5" strokeWidth={2.5} />
            </a>
          )}
          <button
            onClick={onRemove}
            className="h-7 w-7 rounded bg-white/[0.08] hover:bg-rose-500/80 backdrop-blur text-offwhite/85 hover:text-white transition-colors flex items-center justify-center"
            aria-label="Remove photo"
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cryptoId(): string {
  // Prefer crypto.randomUUID in modern browsers; fall back to a Math-based id.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// One seed per batch — passed to every photo so they share an identical
// generated background environment (Bria: same seed + same prompt = same bg).
function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647)
}
