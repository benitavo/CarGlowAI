'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, MoreHorizontal, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vehicles, type Vehicle } from '@/lib/mock-data'

const STATUS_CLS: Record<Vehicle['status'], string> = {
  Draft:  'bg-white/[0.04] text-offwhite/70 border-white/15',
  Ready:  'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Listed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Sold:   'bg-glow-500/15 text-glow-300 border-glow-500/30',
}

export default function VehiclesPage() {
  const [menu, setMenu] = useState<string | null>(null)

  return (
    <div className="pb-24 lg:pb-12">
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">Vehicles</div>
              <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">Your inventory.</h1>
              <p className="text-offwhite/55 mt-2 text-[15px]">{vehicles.length} vehicles</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm shadow-glow-sm transition-all">
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Add vehicle
            </button>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] overflow-hidden">
          {vehicles.map((v, i) => (
            <div key={v.id}
              className={cn('flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors',
                i < vehicles.length - 1 && 'border-b border-white/[0.04]'
              )}>
              <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/[0.08]">
                <Image src={v.coverUrl} alt="" width={64} height={48} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-offwhite text-sm truncate">{v.name}</div>
                <div className="text-xs text-offwhite/45 mt-0.5">{v.photoCount} photos · updated {v.updatedAt}</div>
              </div>
              <div className="hidden sm:block text-sm font-medium text-offwhite tabular-nums">
                €{v.price.toLocaleString()}
              </div>
              <span className={cn('hidden md:inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border', STATUS_CLS[v.status])}>
                {v.status}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/app/editor?vehicle=${v.id}`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-offwhite/50 hover:text-glow-400 hover:bg-white/[0.05] transition-colors"
                  title="Enhance photos">
                  <Wand2 className="w-4 h-4" strokeWidth={1.75} />
                </Link>
                <div className="relative">
                  <button onClick={() => setMenu(menu === v.id ? null : v.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-offwhite/50 hover:text-offwhite hover:bg-white/[0.05] transition-colors">
                    <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  {menu === v.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-white/[0.08] bg-midnight-800 shadow-card py-1">
                        {['View photos', 'Edit details', 'Share listing', 'Delete'].map(opt => (
                          <button key={opt} onClick={() => setMenu(null)}
                            className={cn('w-full text-left px-3 py-1.5 text-sm hover:bg-white/[0.05]',
                              opt === 'Delete' ? 'text-rose-300 hover:bg-rose-500/10' : 'text-offwhite/80'
                            )}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
