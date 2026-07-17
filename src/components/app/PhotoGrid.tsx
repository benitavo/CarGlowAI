'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Download, ImageIcon, ArrowRight, X, ChevronLeft, ChevronRight, Play, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Photo {
  id:           string
  thumbnailUrl: string | null
  fullUrl:      string | null
  vehicleName:  string | null
  styleUsed:    string | null
  status:       string
  createdAt:    string
  processingMs: number | null
  isVideo:      boolean
}

const STATUS_CLS: Record<string, string> = {
  ENHANCED:   'bg-sage-500 text-white border-sage-500',
  PROCESSING: 'bg-sage-500 text-white border-sage-500',
  QUEUED:     'bg-white/90 text-midnight border-white/90',
  FAILED:     'bg-rose-500 text-white border-rose-500',
  UPLOADED:   'bg-midnight-900/60 text-offwhite border-white/15',
  EXPIRED:    'bg-midnight-900/60 text-offwhite border-white/15',
}

const STATUS_LABEL: Record<string, string> = {
  ENHANCED:   'Rendu',
  PROCESSING: 'En cours',
  QUEUED:     'En attente',
  FAILED:     'Échec',
  UPLOADED:   'Importé',
  EXPIRED:    'Expiré',
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)    return 'à l\'instant'
  if (s < 3600)  return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'hier' : `il y a ${d} j`
}

function daysUntilExpiry(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const remaining = 30 - Math.floor(ageMs / 86_400_000)
  return Math.max(0, remaining)
}

function markDownloaded(id: string) {
  fetch(`/api/photos/${id}/mark-downloaded`, { method: 'POST', keepalive: true }).catch(() => {})
}

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)

  const preview   = previewIdx !== null ? photos[previewIdx] : null
  const hasPrev   = previewIdx !== null && previewIdx > 0
  const hasNext   = previewIdx !== null && previewIdx < photos.length - 1

  const goPrev = useCallback(() => {
    setPreviewIdx(i => (i !== null && i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setPreviewIdx(i => (i !== null && i < photos.length - 1 ? i + 1 : i))
  }, [photos.length])

  const close = useCallback(() => setPreviewIdx(null), [])

  useEffect(() => {
    if (previewIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previewIdx, goPrev, goNext, close])

  if (photos.length === 0) {
    return (
      <div className="px-6 lg:px-10 py-20 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-sage-50 border border-sage-100 flex items-center justify-center mb-5">
          <ImageIcon className="w-7 h-7 text-sage-500" strokeWidth={1.5} />
        </div>
        <h2 className="font-display font-semibold text-lg text-midnight mb-2">Aucun rendu encore</h2>
        <p className="text-midnight/50 text-sm mb-6">
          Téléchargez une photo de votre jardin et Verdia génère un rendu photoréaliste en 60 secondes.
        </p>
        <Link
          href="/app/editor"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm transition-all shadow-sm shadow-sage-500/20"
        >
          Générer mon premier rendu <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Grid */}
      <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {photos.map((p, idx) => {
            const expiryDays = p.status === 'ENHANCED' ? daysUntilExpiry(p.createdAt) : null
            return (
            <button
              key={p.id}
              onClick={() => setPreviewIdx(idx)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-white border border-sage-100 ring-2 ring-transparent hover:ring-sage-300 hover:border-sage-300 shadow-sm hover:shadow-md hover:shadow-sage-500/10 transition-all text-left"
            >
              {p.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnailUrl}
                  alt={p.vehicleName ?? 'Rendu jardin'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-sage-50 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-sage-300" strokeWidth={1.5} />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/10 to-midnight-900/30" />

              {p.isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-midnight-900/60 backdrop-blur-md flex items-center justify-center">
                    <Play className="w-4 h-4 text-offwhite fill-offwhite" strokeWidth={0} />
                  </div>
                </div>
              )}

              <div className={cn(
                'absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border backdrop-blur-md',
                STATUS_CLS[p.status] ?? STATUS_CLS.UPLOADED
              )}>
                {STATUS_LABEL[p.status] ?? p.status}
              </div>

              {expiryDays !== null && expiryDays <= 7 && (
                <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-white/20 bg-rose-500/90 text-white backdrop-blur-md">
                  <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
                  {expiryDays === 0 ? 'Expire aujourd\'hui' : `${expiryDays} j restants`}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-3">
                {p.vehicleName && (
                  <div className="text-[13px] font-medium text-offwhite truncate">{p.vehicleName}</div>
                )}
                <div className="text-[11px] text-offwhite/50 mt-0.5 flex items-center gap-1.5">
                  <span>{p.styleUsed ?? 'Personnalisé'}</span>
                  <span>·</span>
                  <span>{timeAgo(p.createdAt)}</span>
                </div>
              </div>
            </button>
          )})}
        </div>
      </div>

      {/* Preview modal */}
      {preview && previewIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-midnight-900/85 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative max-w-5xl w-full max-h-full flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                {preview.vehicleName && (
                  <div className="text-sm font-medium text-offwhite truncate">{preview.vehicleName}</div>
                )}
                <div className="text-[12px] text-offwhite/50 flex items-center gap-1.5">
                  <span>{preview.styleUsed ?? 'Personnalisé'}</span>
                  <span>·</span>
                  <span>{timeAgo(preview.createdAt)}</span>
                  <span>·</span>
                  <span className="tabular-nums">{previewIdx + 1} / {photos.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {preview.fullUrl && (
                  <a
                    href={preview.fullUrl}
                    download={`verdia-${preview.vehicleName ?? preview.id}.${preview.isVideo ? 'mp4' : 'png'}`}
                    onClick={() => markDownloaded(preview.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-midnight font-semibold text-sm transition-all"
                  >
                    <Download className="w-4 h-4" strokeWidth={2} /> Télécharger
                  </a>
                )}
                <button
                  onClick={close}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-offwhite/70 hover:text-offwhite transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Image + side arrows */}
            <div className="relative flex items-center">
              {/* Left arrow */}
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className={cn(
                  'absolute left-1 sm:left-0 sm:-translate-x-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all',
                  'bg-midnight-800/90 border border-white/[0.12] backdrop-blur',
                  hasPrev
                    ? 'text-offwhite hover:bg-white/[0.12] hover:border-white/[0.25] cursor-pointer'
                    : 'text-offwhite/20 cursor-not-allowed'
                )}
                aria-label="Rendu précédent"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
              </button>

              {/* Image */}
              <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-midnight-900 flex items-center justify-center w-full">
                {preview.fullUrl ? (
                  preview.isVideo ? (
                    <video
                      key={preview.id}
                      src={preview.fullUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-[75vh] w-auto object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={preview.id}
                      src={preview.fullUrl}
                      alt={preview.vehicleName ?? 'Rendu jardin'}
                      className="max-h-[75vh] w-auto object-contain"
                    />
                  )
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center gap-2 py-16">
                    <ImageIcon className="w-10 h-10 text-offwhite/20" strokeWidth={1.5} />
                    {preview.status === 'EXPIRED' && (
                      <p className="text-xs text-offwhite/40 max-w-[220px] text-center leading-relaxed">
                        Ce rendu n&apos;a pas été téléchargé dans les 30 jours et a été supprimé.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right arrow */}
              <button
                onClick={goNext}
                disabled={!hasNext}
                className={cn(
                  'absolute right-1 sm:right-0 sm:translate-x-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all',
                  'bg-midnight-800/90 border border-white/[0.12] backdrop-blur',
                  hasNext
                    ? 'text-offwhite hover:bg-white/[0.12] hover:border-white/[0.25] cursor-pointer'
                    : 'text-offwhite/20 cursor-not-allowed'
                )}
                aria-label="Rendu suivant"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
