import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Quote } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-midnight grain text-offwhite flex">
      {/* ── Form column ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top: logo */}
        <header className="px-6 lg:px-10 py-6">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-glow-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
              <Sparkles className="w-4 h-4 text-midnight" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">CarGlow</span>
          </Link>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center px-6 lg:px-10 py-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-offwhite/45">
          <div>© {new Date().getFullYear()} CarGlow AI</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-offwhite/70">Terms</Link>
            <Link href="/privacy" className="hover:text-offwhite/70">Privacy</Link>
            <Link href="/support" className="hover:text-offwhite/70">Support</Link>
          </div>
        </footer>
      </div>

      {/* ── Visual column ───────────────────────────────────────────── */}
      <aside className="hidden lg:block lg:w-[44%] xl:w-[48%] relative overflow-hidden border-l border-white/[0.05]">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=85"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* Gradient + tint overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-midnight/85 via-midnight/65 to-midnight/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/95 via-transparent to-transparent" />

        {/* Glow orb */}
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-glow-500/20 blur-[100px]" />
        <div className="absolute bottom-1/3 -left-20 w-72 h-72 rounded-full bg-glow-500/10 blur-[80px]" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
          {/* Top: feature claim */}
          <div className="max-w-md">
            <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-3">
              For dealers, by people who&apos;ve sold cars
            </div>
            <h2 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1]">
              Inventory photos that{' '}
              <span className="text-gradient">close faster.</span>
            </h2>
            <p className="text-offwhite/65 mt-3 text-[15px] leading-relaxed">
              Studio-grade backgrounds, plate masking, and brand watermarks — applied to every photo in seconds.
            </p>
          </div>

          {/* Bottom: testimonial */}
          <div className="glass rounded-2xl border border-white/[0.08] p-5 max-w-md">
            <Quote className="w-5 h-5 text-glow-400/80 mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-offwhite/85 leading-relaxed">
              We replaced three lighting setups and a half-day of editing per vehicle with one upload.
              Listings go live the same afternoon now.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Image
                src="https://i.pravatar.cc/100?img=14"
                alt=""
                width={36}
                height={36}
                className="rounded-full ring-1 ring-white/15"
              />
              <div>
                <div className="text-sm font-medium">Marcus Hill</div>
                <div className="text-xs text-offwhite/55">Sales Director, Summit Auto Group</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
