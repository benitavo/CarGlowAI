import { Sprout } from 'lucide-react'

export function Callout({ label, html }: { label: string; html: string }) {
  return (
    <div className="not-prose flex gap-3 items-start rounded-2xl border border-sage-200 bg-sage-50 px-5 py-4 my-7">
      <div className="w-8 h-8 rounded-xl bg-white border border-sage-200 flex items-center justify-center shrink-0 mt-0.5">
        <Sprout className="w-4 h-4 text-sage-600" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-700 mb-1">{label}</p>
        <div
          className="text-[15px] text-midnight/75 leading-relaxed [&_em]:italic [&_strong]:font-semibold [&_strong]:text-midnight"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
