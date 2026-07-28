'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TestimonialAvatar } from '@/components/TestimonialAvatar'
import type { PublicTestimonial } from '@/lib/reviews'

export function TestimonialsSection({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000)
    return () => clearInterval(t)
  }, [current, paused, testimonials.length])

  if (testimonials.length === 0) return null
  const t = testimonials[current]

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
            <TestimonialAvatar name={t.name} className="w-10 h-10 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold text-midnight">{t.name}</p>
              {(t.role || t.location) && (
                <p className="text-xs text-midnight/45">{[t.role, t.location].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)}
            className="w-8 h-8 rounded-full border border-midnight/[0.10] flex items-center justify-center text-midnight/35 hover:text-midnight transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('h-1.5 rounded-full transition-all', i === current ? 'bg-sage-500 w-5' : 'bg-midnight/15 w-1.5')} />
            ))}
          </div>
          <button onClick={() => setCurrent(c => (c + 1) % testimonials.length)}
            className="w-8 h-8 rounded-full border border-midnight/[0.10] flex items-center justify-center text-midnight/35 hover:text-midnight transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
