import { ChevronDown } from 'lucide-react'
import { GuideSignupButton } from './GuideSignupButton'

interface TocEntry { id: string; label: string }

export function GuideTocSidebar({ toc }: { toc: TocEntry[] }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-28">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-midnight/35 mb-3">Sommaire</p>
        <nav className="flex flex-col gap-0.5 mb-6">
          {toc.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-midnight/55 hover:text-sage-700 hover:bg-sage-50 rounded-lg px-3 py-1.5 transition-colors"
            >
              {i + 1}. {item.label}
            </a>
          ))}
        </nav>
        <GuideSignupButton full />
      </div>
    </aside>
  )
}

export function GuideTocMobile({ toc }: { toc: TocEntry[] }) {
  return (
    <details className="lg:hidden not-prose rounded-2xl border border-midnight/[0.08] bg-cream-50 mb-10 group">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-display font-semibold text-midnight text-sm list-none">
        Sommaire
        <ChevronDown className="w-4 h-4 text-midnight/40 transition-transform group-open:rotate-180" />
      </summary>
      <nav className="flex flex-col gap-0.5 px-3 pb-4">
        {toc.map((item, i) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="text-sm text-midnight/60 hover:text-sage-700 hover:bg-white rounded-lg px-3 py-2 transition-colors"
          >
            {i + 1}. {item.label}
          </a>
        ))}
      </nav>
    </details>
  )
}
