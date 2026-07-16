import type { FaqItem } from '@/lib/markdown'

export function FaqSection({ items, showHeading = true }: { items: FaqItem[]; showHeading?: boolean }) {
  return (
    <div className="not-prose my-8">
      {showHeading && <h2 className="font-display font-bold text-2xl text-midnight mb-5">Questions fréquentes</h2>}
      <dl className="flex flex-col gap-5">
        {items.map((item) => (
          <div key={item.question} className="rounded-2xl border border-midnight/[0.08] bg-cream-50 px-5 py-4">
            <dt className="font-display font-semibold text-midnight text-[15px] mb-1.5">{item.question}</dt>
            <dd
              className="text-[14.5px] text-midnight/60 leading-relaxed [&_em]:italic [&_strong]:font-semibold [&_strong]:text-midnight"
              dangerouslySetInnerHTML={{ __html: item.answerHtml }}
            />
          </div>
        ))}
      </dl>
    </div>
  )
}
