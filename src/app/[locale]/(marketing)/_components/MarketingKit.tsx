'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrackedLink } from './TrackedLink'
import { gardenImagePath, videoPaths } from '@/lib/showcase-data'

// jardin-03 and jardin-04 are tied at 2 distinct video aspect ratios each (see Phase 0 report)
// — no single garden's real assets cover all three (9:16 / 1:1 / 16:9). Picked jardin-04: its
// square (1:1) card reads as a starker contrast against the two 9:16 cards than jardin-03's
// 16:9 would at a glance. Only 3 format cards below, not 4 — there is no real "Paysage" video
// for this garden, and duplicating a ratio or borrowing another garden's clip would misrepresent
// "one photo, several formats" as the actual premise of this section.
const KIT_GARDEN_ID = 'jardin-04'
const KIT_FORMATS: { videoName: string; label: string }[] = [
  { videoName: 'jardin-04-reel',  label: 'Reel · 9:16' },
  { videoName: 'jardin-04-story', label: 'Story · 9:16' },
  { videoName: 'jardin-04-carre', label: 'Carré · 1:1' },
]

// Not shared with AiContentSection.tsx / VideoShowcaseSection.tsx's own copies of this same
// hook shape — Phase 3's brief only lists this file, so the de-duplication flagged in the
// Phase 1 report is deferred rather than touching those two files out of scope here.
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { rootMargin: '-80px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ref, visible }
}

// Plays only while >=50% in view, pauses on exit — not a one-shot "seen once" flag like the
// other lazy-mount hooks in this codebase, since this genuinely starts/stops repeatedly as the
// user scrolls (and, on mobile, as the snap-carousel moves between cards).
function useAutoplayInView(threshold = 0.5) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [manuallyPlaying, setManuallyPlaying] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [reducedMotion, threshold])

  return { containerRef, videoRef, reducedMotion, manuallyPlaying, setManuallyPlaying }
}

function FormatCard({ videoName, label, aspectClass }: { videoName: string; label: string; aspectClass: string }) {
  const { containerRef, videoRef, reducedMotion, manuallyPlaying, setManuallyPlaying } = useAutoplayInView()
  const { mp4, poster } = videoPaths(videoName)
  const showPosterOnly = reducedMotion && !manuallyPlaying

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative shrink-0 rounded-2xl overflow-hidden border border-midnight/[0.08] shadow-card bg-midnight snap-center',
        aspectClass,
      )}
    >
      {showPosterOnly ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          preload="none"
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={mp4} type="video/mp4" />
        </video>
      )}

      {reducedMotion && !manuallyPlaying && (
        <button
          onClick={() => setManuallyPlaying(true)}
          aria-label={`Lire la vidéo ${label}`}
          className="absolute inset-0 flex items-center justify-center bg-midnight/20 hover:bg-midnight/30 transition-colors"
        >
          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <span className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-midnight ml-1" />
          </span>
        </button>
      )}

      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-midnight/50 backdrop-blur-sm text-[11px] font-semibold text-white border border-white/15">
        {label}
      </div>
    </div>
  )
}

export function MarketingKit() {
  const { ref: sectionRef, visible } = useRevealOnScroll<HTMLDivElement>()

  return (
    <section id="kit-marketing" className="section-pad bg-cream-50">
      <div
        ref={sectionRef}
        className={cn(
          'page-container transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        )}
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-200 text-sage-600 text-xs font-bold uppercase tracking-wider mb-5">
            Nouveau
          </div>
          <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.9rem,3.8vw,2.9rem)', lineHeight: 1.12 }}>
            Le kit marketing, <span className="text-gradient">généré en un clic</span>
          </h2>
          <p className="text-midnight/50 text-[15px] leading-relaxed">
            À partir de la même photo, Verdia produit la vidéo avant/après déjà déclinée aux
            formats des réseaux — vous n&apos;avez rien à recadrer ni remonter.
          </p>
        </div>

        {/* Desktop: three blocks side by side. Mobile: stacked, kit becomes a snap-scroll row. */}
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-6">
          {/* 1. Starting photo — small, static */}
          <div className="md:w-[140px] shrink-0 mx-auto md:mx-0">
            <div className="relative w-[140px] aspect-[4/5] rounded-2xl overflow-hidden border border-midnight/[0.08] shadow-card">
              <Image
                src={gardenImagePath(KIT_GARDEN_ID, 'before')}
                alt="Photo de départ du jardin"
                fill
                sizes="140px"
                className="object-cover"
              />
            </div>
            <p className="text-center text-xs text-midnight/40 mt-2">Votre photo de départ</p>
          </div>

          {/* 2. Discreet connector — real measured delay, not invented */}
          <div className="flex md:flex-col items-center justify-center gap-2 text-center shrink-0 md:w-[100px]">
            <ArrowRight className="w-5 h-5 text-sage-400 shrink-0 md:rotate-0" />
            <p className="text-xs text-midnight/40 leading-snug">
              Généré par l&apos;IA<br />en environ une minute
            </p>
          </div>

          {/* 3. The kit — real ratios, side by side */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-2 md:pb-0 justify-start md:justify-center items-end">
              <FormatCard videoName={KIT_FORMATS[0].videoName} label={KIT_FORMATS[0].label} aspectClass="w-[172px] aspect-[9/16]" />
              <FormatCard videoName={KIT_FORMATS[1].videoName} label={KIT_FORMATS[1].label} aspectClass="w-[172px] aspect-[9/16]" />
              <FormatCard videoName={KIT_FORMATS[2].videoName} label={KIT_FORMATS[2].label} aspectClass="w-[306px] aspect-square" />
            </div>
          </div>
        </div>

        <div className="mt-14 lg:mt-16 text-center max-w-xl mx-auto">
          <h3 className="font-display font-bold text-midnight mb-6" style={{ fontSize: 'clamp(1.4rem,2.6vw,2rem)' }}>
            Photographiez une fois, publiez partout.
          </h3>
          <TrackedLink href="/signup" ctaId="marketing_kit_section" label="Essayer le kit marketing" location="marketing_kit_section"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
            Essayer le kit marketing
            <ArrowRight className="w-5 h-5" />
          </TrackedLink>
        </div>
      </div>
    </section>
  )
}
