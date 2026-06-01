'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, ImageIcon, ArrowRight, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

interface Photo {
  id:           string
  thumbnailUrl: string | null
  fullUrl:      string | null
  vehicleName:  string | null
  styleUsed:    string | null
  status:       string
  createdAt:    string
  processingMs: number | null
}

const STATUS_CLS: Record<string, string> = {
  ENHANCED:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PROCESSING: 'bg-glow-500/15 text-glow-300 border-glow-500/30',
  QUEUED:     'bg-sky-500/15 text-sky-300 border-sky-500/30',
  FAILED:     'bg-rose-500/15 text-rose-300 border-rose-500/30',
  UPLOADED:   'bg-white/10 text-offwhite/70 border-white/15',
}

const STATUS_LABEL: Record<string, string> = {
  ENHANCED:   'Enhanced',
  PROCESSING: 'Processing',
  QUEUED:     'Queued',
  FAILED:     'Failed',
  UPLOADED:   'Uploaded',
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [preview, setPreview] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div className="px-6 lg:px-10 py-20 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
          <ImageIcon className="w-7 h-7 text-offwhite/25" strokeWidth={1.5} />
        </div>
        <h2 className="font-display font-semibold text-lg text-offwhite mb-2">No photos yet</h2>
        <p className="text-offwhite/45 text-sm mb-6">
          Upload your first car photo and CarGlow will remove the background and apply a professional style.
        </p>
        <Link
          href="/app/editor"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm transition-all"
        >
          Enhance your first photo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Grid */}
      <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {photos.map(p => (
            <button
              key={p.id}
              onClick={() => setPreview(p)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-white/20 transition-all text-left"
            >
              {/* Thumbnail */}
              {p.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnailUrl}
                  alt={p.vehicleName ?? 'Photo'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-midnight-900 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-offwhite/20" strokeWidth={1.5} />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/10 to-midnight-900/30" />

              {/* Status badge */}
              <div className={cn(
                'absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border backdrop-blur-md',
                STATUS_CLS[p.status] ?? STATUS_CLS.UPLOADED
              )}>
                {STATUS_LABEL[p.status] ?? p.status}
              </div>

              {/* Info footer */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {p.vehicleName && (
                  <div className="text-[13px] font-medium text-offwhite truncate">
                    {p.vehicleName}
                  </div>
                )}
                <div className="text-[11px] text-offwhite/50 mt-0.5 flex items-center gap-1.5">
                  <span>{p.styleUsed ?? 'Custom'}</span>
                  <span>·</span>
                  <span>{timeAgo(p.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-midnight-900/85 backdrop-blur-sm"
          onClick={() => setPreview(null)}
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
                  <span>{preview.styleUsed ?? 'Custom'}</span>
                  <span>·</span>
                  <span>{timeAgo(preview.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {preview.fullUrl && (
                  <a
                    href={preview.fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm transition-all"
                  >
                    <Download className="w-4 h-4" strokeWidth={2} /> Download
                    <ExternalLink className="w-3 h-3 opacity-60" strokeWidth={2} />
                  </a>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-offwhite/70 hover:text-offwhite transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Large image */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-midnight-900 flex items-center justify-center">
              {preview.fullUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.fullUrl}
                  alt={preview.vehicleName ?? 'Enhanced photo'}
                  className="max-h-[75vh] w-auto object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-offwhite/20" strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
