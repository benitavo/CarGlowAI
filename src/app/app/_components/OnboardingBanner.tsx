'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  photoCount:  number
  memberCount: number
}

export default function OnboardingBanner({ photoCount, memberCount }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const steps = [
    { id: 'account',  label: 'Create your account',          done: true,            href: '#' },
    { id: 'first',    label: 'Enhance your first photo',     done: photoCount > 0,  href: '/app/editor' },
    { id: 'invite',   label: 'Invite a teammate',            done: memberCount > 1, href: '/app/team' },
    { id: 'brand',    label: 'Set up your brand kit',        done: false,           href: '/app/brand-kit' },
    { id: 'style',    label: 'Pick a default style',         done: false,           href: '/app/styles' },
  ]

  const completed = steps.filter(s => s.done).length
  const pct = (completed / steps.length) * 100

  if (dismissed || pct >= 100) return null

  return (
    <div className="rounded-2xl border border-glow-500/25 bg-gradient-to-br from-glow-500/[0.06] to-transparent overflow-hidden">
      <header className="flex items-start justify-between p-5 pb-3">
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-glow-400 mb-1">Getting started</div>
          <h3 className="font-display font-semibold text-[15px]">Finish setup</h3>
        </div>
        <button onClick={() => setDismissed(true)} className="text-offwhite/40 hover:text-offwhite p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-offwhite/55">{completed} of {steps.length} complete</span>
          <span className="text-glow-400 font-semibold tabular-nums">{Math.round(pct)}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-glow-500 to-glow-300 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="px-2 pb-3">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors',
                step.done ? 'text-offwhite/40' : 'text-offwhite/80 hover:bg-white/[0.04]'
              )}
            >
              <span className={cn(
                'w-4 h-4 shrink-0 rounded-full flex items-center justify-center border',
                step.done ? 'border-glow-500/60 bg-glow-500/20 text-glow-400' : 'border-white/[0.15]'
              )}>
                {step.done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
              </span>
              <span className={cn('flex-1', step.done && 'line-through decoration-offwhite/30')}>{step.label}</span>
              {!step.done && <ChevronRight className="w-3.5 h-3.5 text-offwhite/30" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
