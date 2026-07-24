'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrackedLink } from './TrackedLink'

interface Example {
  id: string
  videoUrl: string
  poster: string
  style: string
  format: string
  aspect: string
}

const EXAMPLES: Example[] = [
  {
    id: 'cottage-gravier',
    videoUrl: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/examples/cottage-gravier.mp4',
    poster: '/garden-after-1.jpg',
    style: 'Cottage & Naturel',
    format: 'Reel Instagram',
    aspect: 'aspect-[9/16]',
  },
  {
    id: 'gazon-roses',
    videoUrl: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/examples/gazon-roses.mp4',
    poster: '/garden-after-6.jpg',
    style: 'Gazon & Roses',
    format: 'Post carré',
    aspect: 'aspect-square',
  },
  {
    id: 'zen-japonais',
    videoUrl: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/examples/zen-japonais.mp4',
    poster: '/garden-after-7.png',
    style: 'Zen & Japonais',
    format: 'Format paysage',
    aspect: 'aspect-video',
  },
]

// Same reveal-on-scroll shape as AiContentSection.tsx.
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

function VideoCard({ example, delay }: { example: Example; delay: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [muted, setMuted] = useState(true)

  // Same lazy-mount-on-scroll pattern as TabletVideoPlayer.tsx — these are several-MB video
  // files each, no reason to download all 3 on page load regardless of whether they're seen.
  useEffect(() => {
    if (shouldLoad || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShouldLoad(true) },
      { rootMargin: '200px' },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [shouldLoad])

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card bg-midnight w-full transition-all duration-700 ease-out',
        example.aspect,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={example.videoUrl}
          poster={example.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={example.poster} alt={example.style} className="absolute inset-0 w-full h-full object-cover" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent pointer-events-none" />

      <button
        onClick={toggleMute}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-midnight/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-midnight/70 transition-colors"
        aria-label={muted ? 'Activer le son' : 'Couper le son'}
      >
        {muted ? <VolumeX className="w-4 h-4" strokeWidth={2} /> : <Volume2 className="w-4 h-4" strokeWidth={2} />}
      </button>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-white font-display font-semibold text-[15px]">{example.style}</div>
        <div className="text-white/60 text-xs mt-0.5">{example.format}</div>
      </div>
    </div>
  )
}

export function VideoShowcaseSection() {
  const { ref: sectionRef, visible } = useRevealOnScroll<HTMLDivElement>()

  return (
    <section className="section-pad bg-cream-50">
      <div
        ref={sectionRef}
        className={cn(
          'page-container transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        )}
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-200 text-sage-600 text-xs font-bold uppercase tracking-wider mb-5">
            Exemples réels
          </div>
          <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.9rem,3.8vw,2.9rem)', lineHeight: 1.12 }}>
            Vos vidéos avant / après, <span className="text-gradient">prêtes en un clic</span>
          </h2>
          <p className="text-midnight/50 text-[15px] leading-relaxed">
            Chaque rendu peut devenir une courte vidéo animée et sonorisée, au format de votre
            choix — prête pour Instagram, Facebook ou TikTok, sans montage.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 items-start">
          {EXAMPLES.map((example, i) => (
            <VideoCard key={example.id} example={example} delay={visible ? i * 100 : 0} />
          ))}
        </div>
      </div>

      <div className="page-container mt-14 lg:mt-16">
        <div className="max-w-2xl mx-auto text-center">
          <TrackedLink href="/signup" ctaId="video_showcase_section" label="Créer ma vidéo" location="video_showcase_section"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
            Créer ma première vidéo
            <ArrowRight className="w-5 h-5" />
          </TrackedLink>
        </div>
      </div>
    </section>
  )
}
