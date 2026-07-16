import { Link } from '@/i18n/routing'
import { ArrowRight, Leaf } from 'lucide-react'

export function BlogCTA({ html }: { html: string }) {
  return (
    <div className="not-prose rounded-2xl border border-sage-200 bg-sage-50/70 px-6 py-6 my-10">
      <div className="flex items-start gap-3">
        <Leaf className="w-4 h-4 text-sage-500 shrink-0 mt-1" fill="currentColor" />
        <div
          className="text-[15px] text-midnight/70 leading-relaxed [&_strong]:font-semibold [&_strong]:text-midnight"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-sage-700 hover:text-sage-800 transition-colors"
      >
        Essayer Verdia gratuitement <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
