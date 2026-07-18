'use client'

import { useEffect, useRef, useState } from 'react'

export function TabletVideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  // The 2MB demo video only starts downloading once this scrolls near the viewport,
  // instead of eagerly on every page load regardless of whether it's ever seen —
  // that eager download was competing with the critical path for bandwidth on mobile.
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
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 760 }}>
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
          {shouldLoad && (
            <video
              src="/video-demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}
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
