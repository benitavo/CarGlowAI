'use client'

import { useEffect, useRef, useState } from 'react'

export function LazyCalendlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShouldLoad(true) },
      { rootMargin: '200px' },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={containerRef} className="h-[560px] sm:h-[640px] lg:h-[700px]">
      {shouldLoad ? (
        <iframe
          src="https://calendly.com/verdia-rendus/nouvelle-reunion?embed_type=Inline&hide_gdpr_banner=1&background_color=fafaf7&text_color=0d1f11&primary_color=52b788"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Réserver une démo Verdia"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-cream-50">
          <div className="w-6 h-6 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
