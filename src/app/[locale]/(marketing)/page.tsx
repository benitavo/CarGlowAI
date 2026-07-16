'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import {
  ArrowRight, Check, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Star, Leaf, PlayCircle, X,
  Phone, Wallet, Clock, ScanSearch, Layers, Wand2, PackageCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── AVATAR (cropped from a 5x2 face-grid image via background-position) ─────
function GridAvatar({
  col, row, className,
}: { col: number; row: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(/avatars/face-${row}-${col}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}

// ─── PAIRS ────────────────────────────────────────────────────────────────────
const PAIRS: { before: string; after: string; video?: string }[] = [
  { before: '/garden-before-7.jpg', after: '/garden-after-7.png', video: '/garden-video-7.mp4' },
  { before: '/garden-before-4.jpg', after: '/garden-after-4.jpg' },
  { before: '/garden-before-5.jpg', after: '/garden-after-5.jpg' },
]

// ─── BEFORE / AFTER SLIDER ───────────────────────────────────────────────────
function BeforeAfterSlider({
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Après" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-midnight/40 backdrop-blur-sm text-xs font-semibold text-white border border-white/20">
        Après ✨
      </div>

      {/* BEFORE — clipped */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Avant"
          className="absolute inset-0 h-full object-cover pointer-events-none"
          style={{ width: `${10000 / pos}%`, maxWidth: 'none' }}
        />
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

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-44 pb-16 overflow-hidden bg-cream-50">
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-sage-200/40 rounded-full blur-[140px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-petal-100/50 rounded-full blur-[120px] pointer-events-none translate-y-1/4 -translate-x-1/4" />

      <div className="relative z-10 w-full max-w-[860px] mx-auto px-5 lg:px-8 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-50 border border-sage-200 text-sage-600 text-sm font-medium">
            <Leaf className="w-3.5 h-3.5 text-sage-500" fill="currentColor" />
            Premier rendu offert · Sans engagement
          </div>
        </div>

        <h1 className="font-display font-bold tracking-tight leading-[1.05] text-midnight mb-6"
          style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)' }}>
          Montrez le jardin fini<br />
          <span className="text-gradient">avant de commencer</span><br />
          les travaux.
        </h1>

        <p className="text-lg text-midnight/55 leading-relaxed max-w-[560px] mx-auto mb-10">
          Photographiez le terrain de votre client. Notre IA génère un rendu photoréaliste
          de l&apos;aménagement en 60 secondes. Présentez, convainquez, signez.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/signup"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
            Recevoir mon rendu offert
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="#galerie"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-midnight/[0.12] text-midnight/65 hover:text-midnight hover:bg-midnight/[0.04] text-base font-medium transition-all">
            Voir les exemples
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-midnight/40">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sage-500" /> Sans carte bancaire</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sage-500" /> 60 secondes</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sage-500" /> Styles illimités</span>
        </div>
      </div>
    </section>
  )
}

// ─── STATS ────────────────────────────────────────────────────────────────────
const STATS = [
  { icon: Phone,  value: '3x',  title: 'plus de devis signés',
    desc: "Les clients qui voient leur futur jardin avant travaux valident un devis 3 fois plus vite qu'avec un plan seul." },
  { icon: Wallet, value: '90%', title: 'moins cher',
    desc: "À partir de 1,50€ par rendu, contre 500 à 2 000€ pour une maquette 3D ou un architecte paysagiste." },
  { icon: Clock,  value: '60s', title: 'par rendu',
    desc: "Uploadez une photo, choisissez un style, recevez un rendu photoréaliste en 60 secondes." },
]

function StatsSection() {
  return (
    <section className="py-16 md:py-20 bg-cream-50">
      <div className="page-container max-w-4xl">
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-6 text-center">
          {STATS.map(stat => (
            <div key={stat.title}>
              <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
              </div>
              <p className="font-display font-extrabold text-gradient leading-none mb-2" style={{ fontSize: 'clamp(2.25rem,4vw,2.75rem)' }}>
                {stat.value}
              </p>
              <h3 className="font-display font-bold text-midnight text-lg mb-3">{stat.title}</h3>
              <p className="text-midnight/50 text-sm leading-relaxed max-w-[260px] mx-auto">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── BEFORE/AFTER GALLERY ─────────────────────────────────────────────────────
function GallerySection() {
  const [active, setActive]       = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const pair = PAIRS[active]

  return (
    <section id="galerie" className="section-pad bg-cream-50 pt-40">
      <div className="page-container">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10 lg:gap-16 items-start">

          {/* Image : slider + vignettes */}
          <div>
            {showVideo && pair.video ? (
              <div className="relative aspect-[4/3] w-full mb-3 rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card bg-midnight">
                <video src={pair.video} controls autoPlay className="absolute inset-0 w-full h-full object-cover" />
                <button
                  onClick={() => setShowVideo(false)}
                  className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight/60 backdrop-blur-sm text-xs font-semibold text-white border border-white/20 hover:bg-midnight/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Fermer
                </button>
              </div>
            ) : (
              <BeforeAfterSlider
                key={active}
                before={pair.before}
                after={pair.after}
                className="aspect-[4/3] w-full mb-3"
                initialPos={25}
              />
            )}

            {pair.video && !showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage-50 border border-sage-200 text-sage-700 text-sm font-medium hover:bg-sage-100 transition-colors"
              >
                <PlayCircle className="w-4 h-4" /> Voir la visite en vidéo
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              {PAIRS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setShowVideo(false) }}
                  className={cn(
                    'relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all',
                    i === active
                      ? 'border-sage-500 shadow-sage-sm scale-[1.05]'
                      : 'border-transparent opacity-55 hover:opacity-85 hover:border-sage-300',
                  )}
                >
                  <Image src={p.after} alt={`Rendu ${i + 1}`} fill className="object-cover" sizes="80px" />
                  {p.video && (
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
              {PAIRS.length} transformations<br /><span className="text-gradient">en 60 secondes.</span>
            </h2>
            <p className="text-midnight/45 text-[15px] leading-relaxed mb-7">
              Toutes ces transformations ont été générées par Verdia à partir d&apos;une simple photo de jardin.
            </p>

            <Link href="/signup"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all mb-3">
              Essayer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-midnight/35 mb-6">Sans carte bancaire · Résultat en 60 secondes</p>

            <p className="text-xs text-midnight/30 flex items-center gap-2 mb-6">
              <ChevronLeft className="w-3 h-3" />
              Glissez pour comparer avant / après
              <ChevronRight className="w-3 h-3" />
            </p>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {[{ col: 0, row: 0 }, { col: 2, row: 0 }, { col: 4, row: 1 }, { col: 1, row: 1 }].map((a, i) => (
                  <GridAvatar key={i} col={a.col} row={a.row}
                    className="w-11 h-11 rounded-full ring-2 ring-white bg-sage-100 shrink-0" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-midnight">100+ paysagistes l&apos;utilisent déjà</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-sage-500 fill-sage-500" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── VIDEO DEMO ───────────────────────────────────────────────────────────────
function TabletVideoPlayer() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 760 }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -50, left: -50, right: -50, bottom: -50,
        background: 'radial-gradient(ellipse at center, rgba(82,183,136,0.20) 0%, transparent 70%)',
        filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none',
      }} />
      {/* Tablet shell */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: 28,
        padding: '14px 14px 20px',
        background: 'linear-gradient(160deg, #243028 0%, #0d1f11 100%)',
        boxShadow: '0 40px 100px -15px rgba(13,31,17,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* Front camera dot */}
        <div style={{
          position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)',
          width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1a2e1e',
        }} />
        {/* Screen 16:9 via padding-bottom */}
        <div style={{
          position: 'relative',
          paddingBottom: '56.25%',
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#111',
        }}>
          <video
            src="/video-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
        {/* Home bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <div style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
        </div>
        {/* Side buttons */}
        <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 44, background: '#1a2e1e', borderRadius: '0 3px 3px 0' }} />
        <div style={{ position: 'absolute', left: -3, top: 70, width: 3, height: 36, background: '#1a2e1e', borderRadius: '3px 0 0 3px' }} />
        <div style={{ position: 'absolute', left: -3, top: 116, width: 3, height: 36, background: '#1a2e1e', borderRadius: '3px 0 0 3px' }} />
      </div>
    </div>
  )
}

function VideoSection() {
  return (
    <section className="section-pad bg-white overflow-hidden">
      <div className="page-container">
        {/* Text */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="eyebrow mb-3">Verdia en action</p>
          <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            60 secondes.<br /><span className="text-gradient">Un jardin transformé.</span>
          </h2>
          <p className="text-midnight/50 text-[15px] leading-relaxed">
            Regardez comment Verdia transforme une simple photo de jardin en rendu photoréaliste.
          </p>
        </div>

        {/* Tablet centré */}
        <div className="flex justify-center px-4">
          <TabletVideoPlayer />
        </div>

        {/* Étapes en dessous */}
        <div className="flex flex-col sm:flex-row justify-center gap-8 mt-10 max-w-2xl mx-auto">
          {['Photographiez votre terrain', 'Choisissez votre style', 'Recevez votre rendu en 60s'].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-midnight/60">
              <div className="w-7 h-7 rounded-full bg-sage-100 border border-sage-200 flex items-center justify-center text-xs font-bold text-sage-600 shrink-0">
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CALENDLY ─────────────────────────────────────────────────────────────────
function CalendlySection() {
  return (
    <section id="rendez-vous" className="section-pad bg-white">
      <div className="page-container max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left: text */}
          <div className="lg:w-[380px] shrink-0">
            <p className="eyebrow mb-3">Démo personnalisée</p>
            <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
              Parlons de votre<br /><span className="text-gradient">activité.</span>
            </h2>
            <p className="text-midnight/50 text-[15px] leading-relaxed mb-8">
              Réservez 20 minutes avec moi pour découvrir comment Verdia peut transformer votre façon de présenter vos projets paysagers.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                'Démo sur un de vos projets réels',
                'Conseils personnalisés pour votre activité',
                'Sans engagement, sans carte bancaire',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-midnight/60">
                  <Check className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
            <div className="card-light rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <GridAvatar col={0} row={1}
                  className="w-10 h-10 rounded-full shrink-0 bg-sage-200" />
                <div>
                  <p className="text-sm font-semibold text-midnight">Antoine R.</p>
                  <p className="text-xs text-midnight/45">Fondateur de Verdia</p>
                </div>
              </div>
              <p className="text-xs text-midnight/50 leading-relaxed">
                &ldquo;Je réponds personnellement à chaque demande. Montrez-moi votre terrain et on voit ensemble ce que Verdia peut faire.&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Calendly iframe embed */}
          <div className="flex-1 w-full rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card">
            <iframe
              src="https://calendly.com/verdia-rendus/nouvelle-reunion?embed_type=Inline&hide_gdpr_banner=1&background_color=fafaf7&text_color=0d1f11&primary_color=52b788"
              width="100%"
              height="700"
              style={{ border: 'none' }}
              title="Réserver une démo Verdia"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SCROLLING GALLERY ────────────────────────────────────────────────────────
const SCROLL_GALLERY = [
  { src: '/scroll-garden-1.jpeg', label: 'Terrasse méditerranéenne' },
  { src: '/scroll-garden-2.jpeg', label: 'Prairie fleurie naturelle' },
  { src: '/scroll-garden-3.jpeg', label: 'Jardin zen & mousse' },
  { src: '/scroll-garden-4.jpeg', label: 'Jardin zen minéral' },
  { src: '/scroll-garden-5.jpeg', label: 'Potager surélevé' },
  { src: '/scroll-garden-6.jpeg', label: 'Jardin zen contemporain' },
]

function ScrollingGallerySection() {
  return (
    <section className="py-14 bg-white overflow-hidden">
      <div className="page-container mb-8">
        <p className="eyebrow text-center">Rendus générés par Verdia</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex w-max gap-5 animate-marquee" style={{ animationDuration: '38s' }}>
          {[...SCROLL_GALLERY, ...SCROLL_GALLERY].map((item, i) => (
            <div key={i} className="relative w-[280px] sm:w-[360px] aspect-video rounded-2xl overflow-hidden border border-midnight/[0.08] shadow-card shrink-0">
              <Image src={item.src} alt={item.label} fill className="object-cover" sizes="360px" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/70 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-4 text-white text-sm font-semibold">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { num: '1', title: 'Importez vos photos', img: '/howitworks-import-crop.png',
      desc: "Uploadez les photos du jardin ou du terrain. Jusqu'à 3 photos par projet, tous les formats acceptés." },
    { num: '2', title: "L'IA applique le rendu paysager", img: '/howitworks-generate-crop.png',
      desc: "Choisissez un style parmi nos options. L'IA transforme automatiquement chaque photo en rendu photoréaliste professionnel." },
    { num: '3', title: 'Retouchez en illimité', img: '/howitworks-retouch-crop.png',
      desc: "Affinez chaque rendu dans l'éditeur intégré. Changez de style, ajustez les détails, sans limite de retouches." },
  ]

  return (
    <section id="comment-ca-marche" className="section-pad bg-cream-50">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow mb-3">Comment ça marche</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Simple comme<br /><span className="text-gradient">prendre une photo.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-sage-500 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-2 translate-x-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-sage-300" strokeWidth={2} />
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold text-midnight text-lg mb-2">{step.title}</h3>
              <p className="text-midnight/50 text-[14px] leading-relaxed mb-6">{step.desc}</p>
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-sage-100 shadow-card bg-white mt-auto">
                <Image
                  src={step.img}
                  alt={step.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── WHY IT CONVINCES ─────────────────────────────────────────────────────────
const ARGUMENTS = [
  { title: '« On a du mal à s’imaginer »', desc: "C'est la première cause de devis sans réponse. Le rendu supprime cette objection avant qu'elle n'existe." },
  { title: 'Deux devis identiques sur la table', desc: 'Celui accompagné du futur jardin en photo gagne. Vos concurrents envoient un PDF de chiffres.' },
  { title: 'Zéro logiciel à apprendre', desc: "Pas de 3D, pas de formation, pas d'abonnement complexe. Vous envoyez une photo, vous recevez une image." },
]

function ArgumentsSection() {
  return (
    <section className="section-pad bg-white">
      <div className="page-container max-w-3xl">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="eyebrow mb-3">Pourquoi ça change la vente</p>
          <h2 className="font-display font-bold text-midnight" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Le rendu qui <span className="text-gradient">fait signer.</span>
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {ARGUMENTS.map(arg => (
            <div key={arg.title} className="pl-5 pr-6 py-4 rounded-r-xl border-l-[3px] border-sage-500 bg-sage-50">
              <p className="text-sm">
                <strong className="text-midnight font-semibold">{arg.title}.</strong>{' '}
                <span className="text-midnight/60">{arg.desc}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── STYLES GRID ──────────────────────────────────────────────────────────────
const GARDEN_STYLES = [
  { emoji: '🌸', name: 'Gazon & Fleurs',    desc: 'Pelouse verte, massifs fleuris et bordures colorées', color: 'bg-petal-50 border-petal-200/60' },
  { emoji: '🫒', name: 'Méditerranéen',      desc: 'Olivier, lavande, gravier blanc et pierre naturelle', color: 'bg-cream-100 border-cream-300/60' },
  { emoji: '◼',  name: 'Contemporain',       desc: 'Lignes épurées, ardoise, végétation structurée',      color: 'bg-midnight/[0.03] border-midnight/[0.08]' },
  { emoji: '🌿', name: 'Naturel & Sauvage', desc: 'Prairie fleurie, graminées, plantes indigènes',        color: 'bg-sage-50 border-sage-200/60' },
  { emoji: '🎋', name: 'Zen & Japonais',    desc: 'Bambou, mousse, graviers ratissés, pierres',           color: 'bg-cream-100 border-cream-300/60' },
  { emoji: '🥬', name: 'Potager',           desc: 'Carrés potagers, aromates, arbres fruitiers',          color: 'bg-sage-50 border-sage-200/60' },
]

// ─── AUTOMATION ───────────────────────────────────────────────────────────────
const AUTOMATION_STEPS = [
  { icon: ScanSearch, title: 'Analyse intelligente', time: '~10 secondes',
    desc: "L'IA détecte le terrain, l'exposition et les éléments existants (murs, arbres, mobilier) et suggère le style le plus adapté au jardin." },
  { icon: Layers, title: 'Génération multi-styles', time: '~60 s pour 3 styles',
    desc: "Générez plusieurs styles en parallèle sur la même photo — méditerranéen, contemporain, zen — pour laisser le client choisir." },
  { icon: Wand2, title: 'Retouche en illimité', time: '~15 secondes',
    desc: "Affinez chaque rendu directement dans l'éditeur : changez de style, précisez un détail, régénérez sans repartir de zéro." },
  { icon: PackageCheck, title: 'Kit client prêt à l’emploi', time: '~5 secondes',
    desc: "Téléchargez le rendu HD et le comparatif avant/après, prêts à présenter à vos clients ou à joindre à votre devis." },
]

function AutomationSection() {
  return (
    <section className="section-pad bg-white">
      <div className="page-container max-w-3xl">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="eyebrow mb-3">Automatisation</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Gagnez des heures avec<br /><span className="text-gradient">votre IA paysagère.</span>
          </h2>
          <p className="text-midnight/50 text-[15px] leading-relaxed">
            Verdia traite vos photos automatiquement, suggère le style adapté et prépare vos visuels — vous n&apos;avez plus qu&apos;à présenter.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-6 top-6 bottom-6 w-px hidden sm:block"
            style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(82,183,136,0.45) 0 4px, transparent 4px 9px)' }}
          />
          <div className="flex flex-col gap-4">
            {AUTOMATION_STEPS.map(step => (
              <div key={step.title} className="relative flex gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl bg-sage-50 border border-sage-200/60 flex items-center justify-center shrink-0 z-10">
                  <step.icon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
                </div>
                <div className="card-light rounded-2xl p-5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h3 className="font-display font-semibold text-midnight text-[15px]">{step.title}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-600 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-400" /> {step.time}
                    </span>
                  </div>
                  <p className="text-midnight/50 text-[13.5px] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            { icon: Clock,  text: '60 secondes par rendu' },
            { icon: Layers, text: 'Styles illimités' },
            { icon: Wand2,  text: 'Retouche en illimité incluse' },
          ].map(pill => (
            <div key={pill.text} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sage-50 border border-sage-200/60 text-sage-700 text-sm font-medium">
              <pill.icon className="w-4 h-4 text-sage-500" strokeWidth={1.75} />
              {pill.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StylesSection() {
  return (
    <section className="section-pad bg-cream-50">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="eyebrow mb-3">Styles paysagers</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Chaque projet mérite<br /><span className="text-gradient">son ambiance.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GARDEN_STYLES.map(s => (
            <div key={s.name} className={cn('group p-6 rounded-2xl border transition-all cursor-default hover:shadow-card', s.color)}>
              <span className="text-3xl mb-4 block">{s.emoji}</span>
              <h3 className="font-display font-semibold text-midnight text-[15px] mb-1.5 group-hover:text-sage-600 transition-colors">{s.name}</h3>
              <p className="text-xs text-midnight/45 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: "J'ai montré le rendu à mes clients avant même de calculer le devis. Ils ont dit oui sur le champ. C'est devenu mon outil de vente numéro un.", name: 'Thomas B.', role: 'Paysagiste', location: 'Lyon, 69', stars: 5, avatar: { col: 2, row: 0 } },
  { quote: "En 2 minutes, j'avais 6 versions différentes du futur jardin. Le client a choisi le style méditerranéen. Le chantier commence la semaine prochaine.", name: 'Sophie L.', role: 'Architecte paysagiste', location: 'Aix-en-Provence, 13', stars: 5, avatar: { col: 1, row: 0 } },
  { quote: "Mes clients n'arrivent plus à se projeter sur les plans papier. Avec Verdia, ils voient exactement ce que ça va donner. Le taux de signature a explosé.", name: 'Marc D.', role: 'Aménageur extérieur', location: 'Bordeaux, 33', stars: 5, avatar: { col: 4, row: 0 } },
]

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setCurrent(c => (c + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(t)
  }, [current, paused])

  const t = TESTIMONIALS[current]

  return (
    <section className="section-pad bg-white">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Témoignages</p>
          <h2 className="font-display font-bold text-midnight" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Ils ont <span className="text-gradient">convaincu</span> leurs clients.
          </h2>
        </div>

        <div
          className="card-light rounded-3xl p-10 md:p-14 text-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-4 h-4 text-sage-500 fill-sage-500" />)}
          </div>
          <p className="text-lg md:text-xl text-midnight/70 leading-relaxed mb-8 max-w-xl mx-auto">&ldquo;{t.quote}&rdquo;</p>
          <div className="flex items-center justify-center gap-3">
            <GridAvatar col={t.avatar.col} row={t.avatar.row}
              className="w-10 h-10 rounded-full shrink-0 bg-sage-200" />
            <div className="text-left">
              <p className="text-sm font-semibold text-midnight">{t.name}</p>
              <p className="text-xs text-midnight/45">{t.role} · {t.location}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setCurrent(c => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            className="w-8 h-8 rounded-full border border-midnight/[0.10] flex items-center justify-center text-midnight/35 hover:text-midnight transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('h-1.5 rounded-full transition-all', i === current ? 'bg-sage-500 w-5' : 'bg-midnight/15 w-1.5')} />
            ))}
          </div>
          <button onClick={() => setCurrent(c => (c + 1) % TESTIMONIALS.length)}
            className="w-8 h-8 rounded-full border border-midnight/[0.10] flex items-center justify-center text-midnight/35 hover:text-midnight transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
const PLANS = [
  { name: 'Découverte', price: 'Gratuit', per: '', sub: '1 rendu offert', features: ['1 rendu photoréaliste', 'Tous les styles disponibles', 'Téléchargement HD'], cta: 'Commencer gratuitement', href: '/signup', highlight: false },
  { name: 'Essentiel',  price: '€29', per: '/mois', sub: '20 rendus par mois', badge: 'Le plus populaire', features: ['20 rendus / mois', 'Tous les 6 styles', 'Téléchargement HD', 'Support prioritaire'], cta: "Démarrer l'essai", href: '/signup?plan=essentiel', highlight: true },
  { name: 'Pro',        price: '€89', per: '/mois', sub: 'Rendus illimités', features: ['Rendus illimités', 'Tous les styles', 'Export haute résolution', 'Support dédié'], cta: "Démarrer l'essai", href: '/signup?plan=pro', highlight: false },
]

function PricingSection() {
  return (
    <section id="tarifs" className="section-pad bg-cream-50">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="eyebrow mb-3">Tarifs</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Commencez gratuitement,<br /><span className="text-gradient">évoluez à votre rythme.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map(plan => (
            <div key={plan.name} className={cn(
              'relative rounded-3xl p-8 flex flex-col border transition-all',
              plan.highlight ? 'bg-midnight border-sage-500/30 shadow-sage-md' : 'bg-white border-midnight/[0.07] shadow-card hover:shadow-card-hover',
            )}>
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-sage-500 text-white text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <div className="mb-5">
                <h3 className={cn('font-display font-semibold mb-1', plan.highlight ? 'text-offwhite' : 'text-midnight')}>{plan.name}</h3>
                <p className={cn('text-xs', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{plan.sub}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={cn('text-4xl font-display font-bold', plan.highlight ? 'text-offwhite' : 'text-midnight')}>{plan.price}</span>
                {plan.per && <span className={cn('text-sm', plan.highlight ? 'text-offwhite/40' : 'text-midnight/40')}>{plan.per}</span>}
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className={cn('flex items-start gap-2.5 text-sm', plan.highlight ? 'text-offwhite/65' : 'text-midnight/60')}>
                    <Check className={cn('w-4 h-4 mt-0.5 shrink-0', plan.highlight ? 'text-sage-400' : 'text-sage-500')} />{f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={cn(
                'text-center py-3 rounded-2xl text-sm font-semibold transition-all',
                plan.highlight ? 'bg-sage-500 hover:bg-sage-600 text-white shadow-sage-sm' : 'border border-midnight/[0.12] hover:border-sage-400 text-midnight/70 hover:text-sage-600',
              )}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Comment fonctionne la génération de rendu ?', a: "Vous téléchargez une photo du jardin, choisissez un style parmi nos 6 options, et notre IA transforme la photo en rendu photoréaliste en environ 60 secondes. L'IA conserve la structure existante et transforme uniquement les zones végétales." },
  { q: 'Quelle qualité de photo est nécessaire ?', a: "Une photo prise avec un smartphone récent est largement suffisante. Photographiez en pleine lumière naturelle depuis un angle montrant l'ensemble du jardin." },
  { q: 'Puis-je utiliser les rendus dans mes devis ?', a: "Oui, absolument. Les rendus sont téléchargeables en haute résolution et librement utilisables dans vos documents commerciaux, présentations, réseaux sociaux ou site web." },
  { q: 'Le rendu modifie-t-il les structures existantes ?', a: "Non. L'IA respecte strictement le bâti existant : murs, clôtures, terrasse, mobilier, bâtiments. Seules les zones de végétation et de sol sont transformées." },
  { q: 'Mon premier rendu est vraiment gratuit ?', a: "Oui, sans aucune condition. Créez votre compte, téléchargez votre photo, choisissez votre style et générez votre premier rendu — sans carte bancaire, sans engagement." },
]

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="section-pad bg-cream-50">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Questions <span className="text-gradient">fréquentes.</span>
          </h2>
        </div>
        <div className="flex flex-col divide-y divide-midnight/[0.07]">
          {FAQS.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="w-full flex items-start justify-between gap-4 text-left">
                <span className={cn('font-medium text-base transition-colors', open === i ? 'text-sage-600' : 'text-midnight/75 hover:text-midnight')}>
                  {faq.q}
                </span>
                {open === i ? <ChevronUp className="w-5 h-5 text-sage-500 mt-0.5 shrink-0" /> : <ChevronDown className="w-5 h-5 text-midnight/30 mt-0.5 shrink-0" />}
              </button>
              {open === i && (
                <p id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-trigger-${i}`} className="mt-3 text-sm text-midnight/50 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  return (
    <section className="section-pad bg-midnight relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-sage-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="page-container relative text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-500/15 border border-sage-400/25 text-sage-300 text-sm font-medium mb-8">
          <Leaf className="w-3.5 h-3.5" fill="currentColor" />
          Premier rendu offert · Sans carte bancaire
        </div>

        <h2 className="font-display font-bold text-offwhite mb-6 leading-tight" style={{ fontSize: 'clamp(2rem,4.5vw,3.2rem)' }}>
          Convainquez votre prochain client<br /><span className="text-gradient-green">dès aujourd&apos;hui.</span>
        </h2>

        <p className="text-lg text-offwhite/45 mb-10 leading-relaxed">
          Rejoignez les paysagistes qui présentent leurs projets avec des rendus
          photoréalistes avant de commencer les travaux.
        </p>

        <Link href="/signup"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
          Recevoir mon rendu offert
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-4 text-xs text-offwhite/25">
          Aucune carte bancaire · Résultat en 60 secondes · Styles à l&apos;infini
        </p>
      </div>
    </section>
  )
}

// ─── STICKY MOBILE CTA ────────────────────────────────────────────────────────
function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'lg:hidden fixed left-0 right-0 bottom-0 z-40 px-4 pt-3',
        'bg-white/95 backdrop-blur-sm border-t border-midnight/[0.08] shadow-[0_-8px_24px_-8px_rgba(13,31,17,0.12)]',
        'transition-transform duration-300',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-midnight leading-tight">1er rendu offert</p>
          <p className="text-[11px] text-midnight/45 leading-tight">Sans carte bancaire · 60 secondes</p>
        </div>
        <Link href="/signup"
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-sm whitespace-nowrap transition-all shadow-sage-sm">
          Recevoir <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <GallerySection />
      <HeroSection />
      <ScrollingGallerySection />
      <VideoSection />
      <StatsSection />
      <HowItWorksSection />
      <ArgumentsSection />
      <AutomationSection />
      <StylesSection />
      <TestimonialsSection />
      <PricingSection />
      <CalendlySection />
      <FAQSection />
      <FinalCTASection />
      <StickyMobileCTA />
    </>
  )
}
