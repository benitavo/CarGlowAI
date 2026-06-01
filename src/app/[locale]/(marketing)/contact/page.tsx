'use client'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-2xl mx-auto">
        <p className="eyebrow mb-4">Contact</p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4">
          We'd love to<br /><span className="text-gradient">hear from you.</span>
        </h1>
        <p className="text-offwhite/50 mb-10">Sales enquiry, technical support, or press? We'll get back within one business day.</p>

        {sent ? (
          <div className="card-noise rounded-3xl p-10 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-display font-semibold text-offwhite mb-2">Message sent!</h2>
            <p className="text-offwhite/50 text-sm">We'll reply within one business day.</p>
          </div>
        ) : (
          <div className="card-noise rounded-3xl p-8">
            <div className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-offwhite/40 uppercase tracking-widest font-semibold mb-2 block">First name</label>
                  <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-offwhite focus:outline-none focus:border-glow-500/50" placeholder="Alex" />
                </div>
                <div>
                  <label className="text-xs text-offwhite/40 uppercase tracking-widest font-semibold mb-2 block">Last name</label>
                  <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-offwhite focus:outline-none focus:border-glow-500/50" placeholder="Moreau" />
                </div>
              </div>
              <div>
                <label className="text-xs text-offwhite/40 uppercase tracking-widest font-semibold mb-2 block">Email</label>
                <input type="email" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-offwhite focus:outline-none focus:border-glow-500/50" placeholder="alex@dealership.com" />
              </div>
              <div>
                <label className="text-xs text-offwhite/40 uppercase tracking-widest font-semibold mb-2 block">Topic</label>
                <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-offwhite/70 focus:outline-none focus:border-glow-500/50">
                  <option value="">Select a topic…</option>
                  <option>Sales enquiry</option>
                  <option>Technical support</option>
                  <option>Enterprise / OEM</option>
                  <option>Press & media</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-offwhite/40 uppercase tracking-widest font-semibold mb-2 block">Message</label>
                <textarea rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-offwhite focus:outline-none focus:border-glow-500/50 resize-none" placeholder="Tell us how we can help…" />
              </div>
              <button onClick={() => setSent(true)} className="w-full py-3.5 rounded-2xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm transition-all flex items-center justify-center gap-2">
                Send message <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
