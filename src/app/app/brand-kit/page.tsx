'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Check } from 'lucide-react'
import { currentWorkspace } from '@/lib/mock-data'

export default function BrandKitPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState<string | null>(null)
  const [color, setColor] = useState('#FF8A3D')
  const [position, setPosition] = useState<'tl' | 'tr' | 'bl' | 'br'>('br')
  const [saved, setSaved] = useState(false)

  function handleFile(file: File) {
    const url = URL.createObjectURL(file)
    setLogo(url)
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const POSITIONS = [
    { id: 'tl', label: 'Top left' },
    { id: 'tr', label: 'Top right' },
    { id: 'bl', label: 'Bottom left' },
    { id: 'br', label: 'Bottom right' },
  ] as const

  return (
    <div className="pb-24 lg:pb-12">
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[900px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">Brand kit</div>
          <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">Your brand.</h1>
          <p className="text-offwhite/55 mt-2 text-[15px]">Applied automatically to every enhanced photo.</p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[900px] space-y-6">

        {/* Logo */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
          <h2 className="font-display font-semibold text-base mb-4">Dealership logo</h2>
          <div className="flex items-center gap-5">
            <button onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-glow-500/40 flex items-center justify-center bg-white/[0.02] hover:bg-glow-500/[0.04] transition-all shrink-0">
              {logo
                ? <Image src={logo} alt="" width={80} height={80} className="max-w-[80px] max-h-[80px] object-contain" unoptimized />
                : <Upload className="w-6 h-6 text-offwhite/40" strokeWidth={1.5} />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div>
              <button onClick={() => fileRef.current?.click()} className="text-sm font-medium text-glow-400 hover:text-glow-300">
                {logo ? 'Replace logo' : 'Upload logo'}
              </button>
              <p className="text-xs text-offwhite/40 mt-1">PNG with transparent background recommended · min 512×512</p>
              {logo && (
                <button onClick={() => setLogo(null)} className="text-xs text-offwhite/45 hover:text-offwhite mt-2 block">Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
          <h2 className="font-display font-semibold text-base mb-4">Brand color</h2>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0" />
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              className="w-32 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-glow-500/50" />
            <span className="text-sm text-offwhite/45">Used in watermarks and plate frames</span>
          </div>
        </div>

        {/* Watermark position */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
          <h2 className="font-display font-semibold text-base mb-4">Logo position</h2>
          <div className="grid grid-cols-2 gap-2 max-w-[200px]">
            {POSITIONS.map(p => (
              <button key={p.id} onClick={() => setPosition(p.id)}
                className={`h-12 rounded-xl border text-xs font-medium transition-all ${
                  position === p.id
                    ? 'border-glow-500/50 bg-glow-500/15 text-glow-300'
                    : 'border-white/[0.08] text-offwhite/55 hover:border-white/[0.16] hover:text-offwhite'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
          <h2 className="font-display font-semibold text-base mb-4">Preview</h2>
          <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/[0.08] max-w-lg">
            <Image src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80" alt="" fill className="object-cover" />
            <div className={`absolute flex items-center gap-2 px-3 py-1.5 rounded-md bg-midnight-900/80 backdrop-blur ring-1 ring-white/10 ${
              position === 'tl' ? 'top-3 left-3' :
              position === 'tr' ? 'top-3 right-3' :
              position === 'bl' ? 'bottom-3 left-3' :
              'bottom-3 right-3'
            }`}>
              {logo
                ? <Image src={logo} alt="" width={16} height={16} className="w-4 h-4 object-contain" unoptimized />
                : <div className="w-4 h-4 rounded-sm" style={{ background: color }} />
              }
              <span className="text-[10px] font-semibold tracking-wider uppercase text-white">{currentWorkspace.name}</span>
            </div>
          </div>
        </div>

        <button onClick={save}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm shadow-glow-sm transition-all">
          {saved ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Saved!</> : 'Save brand kit'}
        </button>
      </div>
    </div>
  )
}
