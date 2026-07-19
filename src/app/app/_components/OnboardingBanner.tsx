'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  photoCount:  number
  memberCount: number
}

// Only steps with a real, checkable signal end up here — a checklist item that can
// never actually be marked done (no backing data) is worse than not showing one at all.
export default function OnboardingBanner({ photoCount, memberCount }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const steps = [
    { id: 'account', label: 'Créer votre compte',           done: true,            href: null },
    { id: 'first',   label: 'Générer votre premier rendu',  done: photoCount > 0,  href: '/app/editor' },
    { id: 'invite',  label: 'Inviter un collègue',           done: memberCount > 1, href: '/app/team' },
  ]

  const completed = steps.filter(s => s.done).length
  const pct = (completed / steps.length) * 100

  if (dismissed || pct >= 100) return null

  return (
    <div className="rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50 to-white overflow-hidden">
      <header className="flex items-start justify-between p-5 pb-3">
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-sage-600 mb-1">Pour bien démarrer</div>
          <h3 className="font-display font-semibold text-[15px] text-midnight">Finalisez votre configuration</h3>
        </div>
        <button onClick={() => setDismissed(true)} className="text-midnight/35 hover:text-midnight p-1" aria-label="Masquer">
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-midnight/50">{completed} sur {steps.length} terminé{completed > 1 ? 's' : ''}</span>
          <span className="text-sage-600 font-semibold tabular-nums">{Math.round(pct)}%</span>
        </div>
        <div className="h-1 rounded-full bg-sage-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sage-500 to-sage-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="px-2 pb-3">
        {steps.map((step) => {
          const content = (
            <>
              <span className={cn(
                'w-4 h-4 shrink-0 rounded-full flex items-center justify-center border',
                step.done ? 'border-sage-500 bg-sage-500 text-white' : 'border-midnight/[0.18]',
              )}>
                {step.done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
              </span>
              <span className={cn('flex-1', step.done ? 'text-midnight/40 line-through decoration-midnight/20' : 'text-midnight/80')}>
                {step.label}
              </span>
              {!step.done && step.href && <ChevronRight className="w-3.5 h-3.5 text-midnight/30" />}
            </>
          )
          return (
            <li key={step.id}>
              {step.href && !step.done ? (
                <Link href={step.href} className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:bg-sage-50">
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px]">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
