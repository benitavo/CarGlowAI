'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/mock-data'
import Link from 'next/link'

const CATS = ['All', 'Studio', 'Outdoor', 'Lifestyle', 'Premium', 'Minimal'] as const

export default function StylesPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>('All')
  const [picked, setPicked] = useState(styles[0].id)
  const filtered = cat === 'All' ? styles : styles.filter(s => s.category === cat)

  return (
    <div className="pb-24 lg:pb-12">
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">Styles</div>
          <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">Pick a background.</h1>
          <p className="text-offwhite/55 mt-2 text-[15px]">Your default style is applied automatically to every new photo.</p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-6 max-w-[1480px]">
        <div className="flex flex-wrap gap-2 mb-8">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={cn('px-3.5 py-1.5 rounded-full text-sm border transition-colors',
                cat === c ? 'border-glow-500/40 bg-glow-500/15 text-glow-300' : 'border-white/[0.08] text-offwhite/55 hover:border-white/[0.16] hover:text-offwhite'
              )}>{c}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(s => (
            <button key={s.id} onClick={() => setPicked(s.id)}
              className={cn('group relative aspect-[4/5] rounded-2xl overflow-hidden ring-2 transition-all',
                picked === s.id ? 'ring-glow-500' : 'ring-transparent hover:ring-white/20'
              )}>
              <Image src={s.thumbnailUrl} alt={s.name} fill sizes="20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/20 to-transparent" />
              {picked === s.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-glow-500 flex items-center justify-center shadow-glow-sm">
                  <Check className="w-3.5 h-3.5 text-midnight" strokeWidth={3} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <div className="text-[10px] font-semibold tracking-widest uppercase text-glow-400/80 mb-0.5">{s.category}</div>
                <div className="font-display font-semibold text-sm">{s.name}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button className="h-11 px-6 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm shadow-glow-sm transition-all">
            Save as default
          </button>
          <Link href="/app/editor" className="h-11 px-6 rounded-xl border border-white/[0.1] hover:border-white/[0.2] text-offwhite/70 hover:text-offwhite text-sm transition-all flex items-center">
            Use in editor →
          </Link>
        </div>
      </div>
    </div>
  )
}
