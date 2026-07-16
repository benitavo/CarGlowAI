'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const SLIDES = [
  '/scroll-garden-1.jpeg',
  '/scroll-garden-2.jpeg',
  '/scroll-garden-3.jpeg',
  '/scroll-garden-4.jpeg',
  '/scroll-garden-5.jpeg',
  '/scroll-garden-6.jpeg',
]

export function AuthVisualCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="absolute inset-0">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Rendu de jardin généré par Verdia"
          fill
          priority={i === 0}
          className={cn(
            'object-cover transition-opacity duration-1000 ease-in-out',
            i === current ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
    </div>
  )
}
