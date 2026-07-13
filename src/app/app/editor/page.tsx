'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Upload, Loader2, Download, ArrowLeft, Sparkles,
  Leaf, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const GARDEN_STYLES = [
  { slug: 'gazon-fleurs',   name: 'Gazon & Fleurs',    emoji: '🌸', desc: 'Pelouse verte et massifs fleuris' },
  { slug: 'mediterraneen',  name: 'Méditerranéen',      emoji: '🫒', desc: 'Olivier, lavande et pierre naturelle' },
  { slug: 'contemporain',   name: 'Contemporain',       emoji: '◼', desc: 'Lignes épurées et végétation structurée' },
  { slug: 'naturel',        name: 'Naturel & Sauvage',  emoji: '🌿', desc: 'Prairie fleurie et plantes locales' },
  { slug: 'zen',            name: 'Zen & Japonais',     emoji: '🎋', desc: 'Bambou, mousse et pierres' },
  { slug: 'potager',        name: 'Potager',            emoji: '🥬', desc: 'Carrés potagers et aromatiques' },
]

interface GenState {
  status: 'idle' | 'loading' | 'done' | 'error'
  resultUrl?: string
  error?: string
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

export default function EditorPage() {
  const { data: session } = useSession()

  const [file, setFile]             = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [styleSlug, setStyleSlug]   = useState('gazon-fleurs')
  const [gen, setGen]               = useState<GenState>({ status: 'idle' })
  const fileInputRef                = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setGen({ status: 'idle' })
  }, [previewUrl])

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
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData:   base64,
          mimeType:    file.type || 'image/jpeg',
          styleSlug,
          workspaceId: session.user.workspaceId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setGen({ status: 'done', resultUrl: data.enhancedUrl, processingMs: data.processingMs })
    } catch (err) {
      setGen({ status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }, [file, session, styleSlug])

  const handleDownload = () => {
    if (!gen.resultUrl) return
    const a = document.createElement('a')
    a.href = gen.resultUrl
    a.download = `jardin-${styleSlug}-${Date.now()}.png`
    a.click()
  }

  const canGenerate = !!file && gen.status !== 'loading'

  return (
    <div className="min-h-screen bg-midnight text-offwhite">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-midnight/95 backdrop-blur-xl">
        <Link href="/app" className="flex items-center gap-2 text-offwhite/55 hover:text-offwhite text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Tableau de bord</span>
        </Link>
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-glow-400" />
          <span className="font-display font-semibold text-sm">Générateur de jardin</span>
        </div>
        <div className="w-28" />
      </header>

      <div className="max-w-[1200px] mx-auto px-5 py-8 grid lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* Left: upload + result */}
        <div className="flex flex-col gap-6">

          {/* Upload zone */}
          <div
            className={cn(
              'relative rounded-3xl border-2 border-dashed transition-all',
              file
                ? 'border-white/[0.1]'
                : 'border-white/[0.1] bg-white/[0.015] hover:border-white/[0.2] hover:bg-white/[0.025] cursor-pointer',
            )}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 px-8">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Upload className="w-7 h-7 text-offwhite/35" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-offwhite/60 mb-1">Déposez votre photo de jardin</p>
                  <p className="text-sm text-offwhite/35">JPG, PNG, HEIC · jusqu&apos;à 20 Mo</p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm font-medium text-offwhite/60 hover:text-offwhite hover:bg-white/[0.09] transition-all"
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
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-midnight/75 backdrop-blur-sm text-xs font-semibold text-offwhite/70 border border-white/[0.1]">
                  Photo originale
                </div>
                <button
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight/80 backdrop-blur-sm text-xs text-offwhite/70 hover:text-offwhite border border-white/[0.12] transition-colors"
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
          {gen.status === 'done' && gen.resultUrl && (
            <div className="rounded-3xl border border-glow-500/30 bg-glow-500/[0.03] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-glow-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-glow-400" />
                  <span className="font-semibold text-sm text-glow-300">Rendu généré</span>
                  {gen.processingMs && (
                    <span className="text-xs text-offwhite/30 ml-1">
                      {(gen.processingMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight text-xs font-semibold transition-all shadow-glow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gen.resultUrl}
                alt="Jardin généré"
                className="w-full object-contain"
                style={{ maxHeight: 520 }}
              />
            </div>
          )}

          {gen.status === 'error' && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-5 py-4 text-sm text-rose-300">
              {gen.error}
            </div>
          )}
        </div>

        {/* Right: style picker + generate */}
        <div className="flex flex-col gap-5">

          {/* Style picker */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-display font-semibold text-[15px]">Style de jardin</h2>
              <p className="text-xs text-offwhite/40 mt-0.5">Choisissez l&apos;ambiance de votre rendu</p>
            </div>
            <div className="p-3 flex flex-col gap-1">
              {GARDEN_STYLES.map(style => (
                <button
                  key={style.slug}
                  onClick={() => setStyleSlug(style.slug)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    styleSlug === style.slug
                      ? 'bg-glow-500/[0.1] border border-glow-500/35'
                      : 'border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]',
                  )}
                >
                  <span className="text-xl shrink-0">{style.emoji}</span>
                  <div>
                    <p className={cn(
                      'text-sm font-semibold',
                      styleSlug === style.slug ? 'text-glow-300' : 'text-offwhite/80',
                    )}>
                      {style.name}
                    </p>
                    <p className="text-xs text-offwhite/40">{style.desc}</p>
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
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all',
              canGenerate
                ? 'bg-glow-500 hover:bg-glow-400 text-midnight shadow-glow-md hover:shadow-glow-lg cursor-pointer'
                : 'bg-white/[0.05] text-offwhite/25 cursor-not-allowed border border-white/[0.06]',
            )}
          >
            {gen.status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer mon rendu
              </>
            )}
          </button>

          {gen.status === 'loading' && (
            <p className="text-xs text-center text-offwhite/35 leading-relaxed">
              L&apos;IA analyse et transforme votre jardin.<br />
              Comptez 30 à 60 secondes.
            </p>
          )}

          {!file && gen.status !== 'loading' && (
            <p className="text-xs text-center text-offwhite/30">
              Téléchargez d&apos;abord une photo de votre jardin
            </p>
          )}

          {/* Tips */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <p className="text-[11px] font-semibold text-offwhite/35 uppercase tracking-widest mb-3">
              Conseils photo
            </p>
            <ul className="flex flex-col gap-2.5 text-xs text-offwhite/50 leading-relaxed">
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
        </div>
      </div>
    </div>
  )
}
