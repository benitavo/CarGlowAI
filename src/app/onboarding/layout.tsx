import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-midnight grain text-offwhite flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/[0.04] bg-midnight/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-glow-500 flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-3.5 h-3.5 text-midnight" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-base tracking-tight">CarGlow</span>
          </Link>
          <Link
            href="/app"
            className="text-xs text-offwhite/55 hover:text-offwhite px-2 py-1"
          >
            Skip for now →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex">
        {children}
      </main>
    </div>
  )
}
