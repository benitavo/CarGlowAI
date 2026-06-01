'use client'

import { useState } from 'react'
import { Check, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { integrations } from '@/lib/mock-data'

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  )

  return (
    <div className="pb-24 lg:pb-12">
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[900px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">Integrations</div>
          <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">Connect your tools.</h1>
          <p className="text-offwhite/55 mt-2 text-[15px]">Publish photos directly to your marketplaces and workflows.</p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[900px]">
        <div className="grid sm:grid-cols-2 gap-3">
          {integrations.map(int => (
            <div key={int.id}
              className={cn('rounded-2xl border p-5 flex items-center gap-4 transition-colors',
                connected[int.id] ? 'border-glow-500/25 bg-glow-500/[0.04]' : 'border-white/[0.06] bg-white/[0.015]'
              )}>
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xl shrink-0">
                {int.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-offwhite">{int.name}</div>
                <div className="text-xs text-offwhite/45 truncate">{int.desc}</div>
                {connected[int.id] && int.lastSync && (
                  <div className="text-[11px] text-glow-400/80 mt-0.5">Synced {int.lastSync}</div>
                )}
              </div>
              <button
                onClick={() => setConnected(prev => ({ ...prev, [int.id]: !prev[int.id] }))}
                className={cn('shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition-all',
                  connected[int.id]
                    ? 'bg-white/[0.05] text-offwhite/60 hover:bg-rose-500/15 hover:text-rose-300'
                    : 'bg-glow-500 hover:bg-glow-400 text-midnight shadow-glow-sm'
                )}>
                {connected[int.id] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-sm">REST API</h2>
            <a href="/docs" className="text-xs text-glow-400 hover:text-glow-300 flex items-center gap-1">
              View docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-sm text-offwhite/50 mb-4">Connect any tool via our API. Your API key is in your account settings.</p>
          <div className="flex items-center gap-2 bg-midnight-900 rounded-lg px-4 py-3 font-mono text-xs text-offwhite/60 border border-white/[0.06]">
            <span className="text-glow-400">POST</span>
            <span>https://api.carglowai.com/v1/enhance</span>
          </div>
        </div>
      </div>
    </div>
  )
}
