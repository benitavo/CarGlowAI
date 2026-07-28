'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowRight, ChevronLeft, ChevronRight, PlayCircle, Star, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GridAvatar } from './GridAvatar'
import { gardenImagePath } from '@/lib/showcase-data'
import { TrackedLink } from './TrackedLink'

interface ShowcaseItem { before: string; after: string; video?: string; style: string; desc: string }

const SHOWCASE: ShowcaseItem[] = [
  { before: '/garden-before-7.jpg', after: '/garden-after-7.png', video: '/garden-video-7.mp4',
    style: 'Zen & Japonais',    desc: 'Bambou, mousse et pierres' },
  { before: '/garden-before-4.jpg', after: '/garden-after-4.jpg',
    style: 'Naturel & Sauvage', desc: 'Prairie fleurie et plantes locales' },
  { before: '/garden-before-5.jpg', after: '/garden-after-5.jpg',
    style: 'Gazon & Fleurs',    desc: 'Pelouse verte et massifs fleuris' },
  // Added from the real garden assets Benoit provided (Phase 0 showcase pipeline) — the three
  // above predate that batch entirely.
  { before: gardenImagePath('jardin-01', 'before'), after: gardenImagePath('jardin-01', 'after-mediterraneen'),
    style: 'Méditerranéen', desc: 'Olivier, lavande et pierre naturelle' },
  { before: gardenImagePath('jardin-03', 'before'), after: gardenImagePath('jardin-03', 'after-contemporain'),
    style: 'Contemporain',  desc: 'Lignes épurées et végétation structurée' },
]

const STYLE_PHOTOS = [
  { src: '/styles/gazon-fleurs.jpg',    style: 'Gazon & Fleurs',    desc: 'Pelouse verte et massifs fleuris' },
  { src: '/styles/mediterraneen.jpg',   style: 'Méditerranéen',     desc: 'Olivier, lavande et pierre naturelle' },
  { src: '/styles/contemporain.jpg',    style: 'Contemporain',      desc: 'Lignes épurées et végétation structurée' },
  { src: '/styles/naturel-sauvage.jpg', style: 'Naturel & Sauvage', desc: 'Prairie fleurie et plantes locales' },
  { src: '/styles/zen.jpg',             style: 'Zen & Japonais',    desc: 'Bambou, mousse et pierres' },
  { src: '/styles/potager.jpg',         style: 'Potager',           desc: 'Carrés potagers et aromatiques' },
]

// ─── BEFORE / AFTER SLIDER ───────────────────────────────────────────────────
export function BeforeAfterSlider({
  before, after, className, initialPos = 45,
}: { before: string; after: string; className?: string; initialPos?: number }) {
  const [pos, setPos]           = useState(initialPos)
  const [dragging, setDragging] = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    setPos(Math.min(97, Math.max(3, ((clientX - left) / width) * 100)))
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  { setPos(p => Math.max(3, p - 5)); e.preventDefault() }
    if (e.key === 'ArrowRight') { setPos(p => Math.min(97, p + 5)); e.preventDefault() }
  }, [])

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => updatePos(e.clientX)
    const up   = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragging, updatePos])

  useEffect(() => {
    if (!dragging) return
    const move = (e: TouchEvent) => { e.preventDefault(); updatePos(e.touches[0].clientX) }
    const end  = () => setDragging(false)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend',  end)
    return () => { window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end) }
  }, [dragging, updatePos])

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Comparateur avant / après. Utilisez les flèches gauche/droite pour révéler le rendu."
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      className={cn(
        'relative overflow-hidden select-none rounded-3xl border border-midnight/[0.08] shadow-card bg-cream-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
        dragging ? 'cursor-ew-resize' : 'cursor-col-resize',
        className,
      )}
      onMouseDown={e => { e.preventDefault(); setDragging(true); updatePos(e.clientX) }}
      onTouchStart={e => { setDragging(true); updatePos(e.touches[0].clientX) }}
      onKeyDown={handleKeyDown}
    >
      {/* AFTER */}
      <Image src={after} alt="Après" fill sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover pointer-events-none" />
      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-midnight/40 backdrop-blur-sm text-xs font-semibold text-white border border-white/20">
        Après ✨
      </div>

      {/* BEFORE — clipped */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <div className="absolute inset-0 h-full" style={{ width: `${10000 / pos}%`, maxWidth: 'none' }}>
          <Image src={before} alt="Avant" fill sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover pointer-events-none" />
        </div>
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-midnight/40 backdrop-blur-sm text-xs font-semibold text-white border border-white/15"
          style={{ maxWidth: `calc(${pos}% - 1rem)`, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          Avant
        </div>
      </div>

      {/* Divider */}
      <div className="absolute inset-y-0 w-[2px] bg-white shadow-[0_0_16px_rgba(255,255,255,0.9)] pointer-events-none"
        style={{ left: `calc(${pos}% - 1px)` }} />
      {/* Handle */}
      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center pointer-events-none z-10"
        style={{ left: `${pos}%` }}>
        <ChevronLeft  className="w-3.5 h-3.5 text-midnight/70 absolute -left-0.5" strokeWidth={2.5} />
        <ChevronRight className="w-3.5 h-3.5 text-midnight/70 absolute -right-0.5" strokeWidth={2.5} />
      </div>
    </div>
  )
}

// ─── STYLE PHOTOS STRIP (crossfade) ───────────────────────────────────────────
function StylePhotosStrip() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive(a => (a + 1) % STYLE_PHOTOS.length), 4000)
    return () => clearInterval(t)
  }, [paused])

  const goPrev = useCallback(() => {
    setActive(a => (a - 1 + STYLE_PHOTOS.length) % STYLE_PHOTOS.length)
  }, [])
  const goNext = useCallback(() => {
    setActive(a => (a + 1) % STYLE_PHOTOS.length)
  }, [])

  const current = STYLE_PHOTOS[active]

  return (
    <div className="mt-16 pt-14 border-t border-midnight/[0.06]">
      <div className="text-center max-w-lg mx-auto mb-8">
        <p className="eyebrow mb-3">Tous les styles</p>
        <h3 className="font-display font-bold text-midnight" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)' }}>
          Une ambiance pour chaque jardin.
        </h3>
      </div>

      <div
        className="relative max-w-xl mx-auto aspect-[16/9] rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {STYLE_PHOTOS.map((s, i) => (
          <Image
            key={s.style}
            src={s.src}
            alt={s.style}
            fill
            priority={i === 0}
            className={cn(
              'object-cover transition-opacity duration-1000 ease-in-out',
              i === active ? 'opacity-100' : 'opacity-0',
            )}
            sizes="(min-width: 1024px) 576px, 100vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-white font-display font-semibold text-lg">{current.style}</p>
          <p className="text-white/70 text-sm">{current.desc}</p>
        </div>

        <button
          onClick={goPrev}
          aria-label="Style précédent"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-midnight-800/70 border border-white/[0.15] backdrop-blur flex items-center justify-center text-white hover:bg-midnight-800/90 hover:border-white/25 transition-all"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
        <button
          onClick={goNext}
          aria-label="Style suivant"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-midnight-800/70 border border-white/[0.15] backdrop-blur flex items-center justify-center text-white hover:bg-midnight-800/90 hover:border-white/25 transition-all"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-5">
        {STYLE_PHOTOS.map((s, i) => (
          <button
            key={s.style}
            onClick={() => setActive(i)}
            aria-label={s.style}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === active ? 'w-6 bg-sage-500' : 'w-1.5 bg-midnight/15 hover:bg-midnight/30',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ─── BEFORE/AFTER GALLERY ─────────────────────────────────────────────────────
// Below this, showing the exact count reads as thin rather than reassuring.
const MIN_LANDSCAPER_COUNT_TO_SHOW = 10

export function GallerySection({ landscaperCount }: { landscaperCount: number }) {
  const [active, setActive]       = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [paused, setPaused]       = useState(false)
  const item = SHOWCASE[active]

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => {
      setActive(a => (a + 1) % SHOWCASE.length)
      setShowVideo(false)
    }, 30_000)
    return () => clearInterval(t)
  }, [active, paused])

  return (
    <section id="galerie" className="section-pad bg-cream-50 pt-40">
      <div className="page-container">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10 lg:gap-16 items-start">

          {/* Image : slider + vignettes */}
          <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {showVideo && item.video ? (
              <div className="relative aspect-[4/3] w-full mb-3 rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card bg-midnight">
                <video src={item.video} controls autoPlay preload="none" poster={item.after} className="absolute inset-0 w-full h-full object-cover" />
                <button
                  onClick={() => setShowVideo(false)}
                  className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight/60 backdrop-blur-sm text-xs font-semibold text-white border border-white/20 hover:bg-midnight/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Fermer
                </button>
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-midnight/50 backdrop-blur-sm border border-white/15">
                  <p className="text-xs font-semibold text-white">{item.style}</p>
                  <p className="text-[11px] text-white/70">{item.desc}</p>
                </div>
              </div>
            ) : (
              <div className="relative mb-3">
                <BeforeAfterSlider
                  key={active}
                  before={item.before}
                  after={item.after}
                  className="aspect-[4/3] w-full"
                  initialPos={25}
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-midnight/50 backdrop-blur-sm border border-white/15 pointer-events-none">
                  <p className="text-xs font-semibold text-white">{item.style}</p>
                  <p className="text-[11px] text-white/70">{item.desc}</p>
                </div>
              </div>
            )}

            {item.video && !showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage-50 border border-sage-200 text-sage-700 text-sm font-medium hover:bg-sage-100 transition-colors"
              >
                <PlayCircle className="w-4 h-4" /> Voir la visite en vidéo
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              {SHOWCASE.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setShowVideo(false) }}
                  aria-current={i === active}
                  aria-label={`Voir la transformation ${s.style}`}
                  className={cn(
                    'relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
                    i === active
                      ? 'border-sage-500 shadow-sage-sm scale-[1.05]'
                      : 'border-transparent opacity-55 hover:opacity-85 hover:border-sage-300',
                  )}
                >
                  <Image src={s.after} alt={s.style} fill className="object-cover" sizes="80px" />
                  {s.video && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-midnight/60 backdrop-blur-sm flex items-center justify-center">
                      <PlayCircle className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Texte */}
          <div className="lg:pt-4">
            <p className="eyebrow mb-3">Exemples réels</p>
            <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
              {SHOWCASE.length} transformations<br /><span className="text-gradient">en 60 secondes.</span>
            </h2>
            <p className="text-midnight/45 text-[15px] leading-relaxed mb-7">
              Toutes ces transformations ont été générées par Verdia à partir d&apos;une simple photo de jardin.
            </p>

            <TrackedLink href="/signup" ctaId="gallery_cta" label="Essayer gratuitement" location="gallery"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all mb-3">
              Essayer gratuitement
              <ArrowRight className="w-5 h-5" />
            </TrackedLink>
            <p className="text-xs text-midnight/35 mb-6">Sans carte bancaire · Résultat en 60 secondes</p>

            {!showVideo && (
              <p className="text-xs text-midnight/30 flex items-center gap-2 mb-6">
                <ChevronLeft className="w-3 h-3" />
                Glissez pour comparer avant / après
                <ChevronRight className="w-3 h-3" />
              </p>
            )}

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {[{ col: 0, row: 0 }, { col: 2, row: 0 }, { col: 4, row: 1 }, { col: 1, row: 1 }].map((a, i) => (
                  <GridAvatar key={i} col={a.col} row={a.row}
                    className="w-11 h-11 rounded-full ring-2 ring-white bg-sage-100 shrink-0" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-midnight">
                  {landscaperCount >= MIN_LANDSCAPER_COUNT_TO_SHOW
                    ? <>{landscaperCount.toLocaleString('fr-FR')}+ paysagistes l&apos;utilisent déjà</>
                    : <>Rejoignez les paysagistes qui utilisent Verdia</>}
                </p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-sage-500 fill-sage-500" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        <StylePhotosStrip />
      </div>
    </section>
  )
}
