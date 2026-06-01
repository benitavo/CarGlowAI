'use client'

import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPS = [
  {
    title: 'Watermark every photo automatically',
    body: 'Set a default watermark in your Brand Kit and CarGlow applies it to every enhanced photo — no per-photo clicks.',
  },
  {
    title: 'Plate masking is on by default',
    body: 'Every photo you enhance gets license plates auto-detected and replaced with your dealer frame. GDPR-safe without thinking about it.',
  },
  {
    title: 'Pick a default background',
    body: 'A consistent background across your listings makes inventory comparisons easier and lifts click-through on classifieds.',
  },
]

export default function TipCarousel() {
  const [idx, setIdx] = useState(0)
  const tip = TIPS[idx]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-glow-500/15 text-glow-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-widest uppercase text-offwhite/40">Tip of the day</div>
          <div className="text-[13px] font-medium">{tip.title}</div>
        </div>
      </div>
      <p className="text-[13px] text-offwhite/60 leading-relaxed">{tip.body}</p>
      <div className="flex items-center gap-1 mt-4">
        {TIPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={cn('h-1 rounded-full transition-all', i === idx ? 'w-8 bg-glow-500' : 'w-1.5 bg-white/[0.12]')}
          />
        ))}
      </div>
    </div>
  )
}
