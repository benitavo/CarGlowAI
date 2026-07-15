'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Upload, Loader2, Download, ArrowLeft, Sparkles,
  Leaf, RotateCcw, Video, Image as ImageIcon, PenLine,
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

type Mode = 'image' | 'video'

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

  const [mode, setMode]                      = useState<Mode>('image')
  const [file, setFile]                      = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]          = useState<string | null>(null)
  const [styleSlug, setStyleSlug]            = useState('gazon-fleurs')
  const [characteristics, setCharacteristics] = useState('')
  const [gen, setGen]                        = useState<GenState>({ status: 'idle' })
  const fileInputRef                         = useRef<HTMLInputElement>(null)

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
      setGen({ status: 'done', resultUrl: data.enhancedUrl ?? data.videoUrl, processingMs: data.processingMs })
    } catch (err) {
      setGen({ status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }, [file, session, styleSlug, characteristics, mode])

  const handleDownload = async () => {
    if (!gen.resultUrl) return
    const res = await fetch(gen.resultUrl)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `verdia-${styleSlug}-${Date.now()}.${mode === 'video' ? 'mp4' : 'png'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  const canGenerate = !!file && gen.status !== 'loading'

  return (
    <div className="min-h-screen bg-cream-50 text-midnight">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-5 border-b border-sage-100 bg-white/95 backdrop-blur-xl">
        <Link href="/app" className="flex items-center gap-2 text-midnight/45 hover:text-midnight text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Tableau de bord</span>
        </Link>
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-sage-500" />
          <span className="font-display font-semibold text-sm text-midnight">Générateur de jardin</span>
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

          {/* Result — image */}
          {gen.status === 'done' && gen.resultUrl && mode === 'image' && (
            <div className="rounded-3xl border border-sage-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-sage-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sage-500" />
                  <span className="font-semibold text-sm text-sage-700">Rendu généré</span>
                  {gen.processingMs && (
                    <span className="text-xs text-midnight/30 ml-1">
                      {(gen.processingMs / 1000).toFixed(1)}s
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gen.resultUrl}
                alt="Jardin généré"
                className="w-full object-contain"
                style={{ maxHeight: 520 }}
              />
            </div>
          )}

          {/* Result — video */}
          {gen.status === 'done' && gen.resultUrl && mode === 'video' && (
            <div className="rounded-3xl border border-sage-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-sage-100">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-sage-500" />
                  <span className="font-semibold text-sm text-sage-700">Vidéo générée</span>
                  {gen.processingMs && (
                    <span className="text-xs text-midnight/30 ml-1">
                      {(gen.processingMs / 1000).toFixed(1)}s
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
              <video
                src={gen.resultUrl}
                controls
                autoPlay
                loop
                className="w-full"
                style={{ maxHeight: 520 }}
              />
            </div>
          )}

          {gen.status === 'error' && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm text-rose-700">
              {gen.error}
            </div>
          )}
        </div>

        {/* Right: mode + style + characteristics + generate */}
        <div className="flex flex-col gap-4">

          {/* Mode switch */}
          <div className="rounded-2xl border border-sage-200 bg-white p-1.5 flex gap-1 shadow-sm">
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
            <div className="rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-[13px] text-sage-700 leading-relaxed">
              <strong>🎬 Vidéo animée</strong> — Votre jardin transformé en vidéo 5 secondes. Parfait pour présenter vos projets ou partager sur les réseaux sociaux.
            </div>
          )}

          {/* Style picker */}
          <div className="rounded-2xl border border-sage-100 bg-white overflow-hidden shadow-sm">
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
                  <span className="text-xl shrink-0">{style.emoji}</span>
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

          {/* Characteristics */}
          <div className="rounded-2xl border border-sage-100 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-sage-100 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-sage-500" strokeWidth={1.75} />
              <div>
                <h2 className="font-display font-semibold text-[15px] text-midnight">Caractéristiques</h2>
                <p className="text-xs text-midnight/40 mt-0.5">Précisez votre projet — optionnel</p>
              </div>
            </div>
            <div className="p-4">
              <textarea
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

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all',
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
            <p className="text-xs text-center text-midnight/35 leading-relaxed">
              {mode === 'video'
                ? <>L&apos;IA génère votre vidéo.<br />Comptez 60 à 120 secondes.</>
                : <>L&apos;IA analyse et transforme votre jardin.<br />Comptez 30 à 60 secondes.</>
              }
            </p>
          )}

          {!file && gen.status !== 'loading' && (
            <p className="text-xs text-center text-midnight/30">
              Téléchargez d&apos;abord une photo de votre jardin
            </p>
          )}

          {/* Tips */}
          <div className="rounded-2xl border border-sage-100 bg-cream-50 p-5">
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
        </div>
      </div>
    </div>
  )
}
