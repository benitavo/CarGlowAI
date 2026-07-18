'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'lg:hidden fixed left-0 right-0 bottom-0 z-40 px-4 pt-3',
        'bg-white/95 backdrop-blur-sm border-t border-midnight/[0.08] shadow-[0_-8px_24px_-8px_rgba(13,31,17,0.12)]',
        'transition-transform duration-300',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-midnight leading-tight">1er rendu offert</p>
          <p className="text-[11px] text-midnight/45 leading-tight">Sans carte bancaire · 60 secondes</p>
        </div>
        <Link href="/signup"
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-sm whitespace-nowrap transition-all shadow-sage-sm">
          Recevoir <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
