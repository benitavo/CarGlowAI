import type { Guide, GuideSegment } from '@/lib/guide'
import { Callout } from '@/components/blog/Callout'
import { FaqSection } from '@/components/blog/FaqSection'
import { GuideCTA } from './GuideCTA'
import { StyleCardsGrid } from './StyleCardsGrid'
import { GuideSignupButton } from './GuideSignupButton'

function Segment({ segment, i }: { segment: GuideSegment; i: number }) {
  switch (segment.type) {
    case 'html':
      return <div key={i} dangerouslySetInnerHTML={{ __html: segment.html }} />
    case 'callout':
      return <Callout key={i} label={segment.label} html={segment.html} />
    case 'faq':
      return <FaqSection key={i} items={segment.items} showHeading={false} />
    case 'cta':
      return <GuideCTA key={i} html={segment.html} />
    case 'style-cards':
      return <StyleCardsGrid key={i} />
    default:
      return null
  }
}

export function GuideBody({ guide }: { guide: Guide }) {
  return (
    <div className="article-body">
      {guide.intro.map((segment, i) => <Segment key={`intro-${i}`} segment={segment} i={i} />)}

      {guide.sections.map((section, si) => (
        <section key={section.id} id={section.id} className="scroll-mt-28">
          <h2>{si + 1}. {section.label}</h2>
          {section.segments.map((segment, i) => <Segment key={i} segment={segment} i={i} />)}

          {section.id === 'regles-metier' && (
            <div className="not-prose rounded-2xl border border-sage-200 bg-sage-50/60 px-6 py-5 my-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[15px] text-midnight/70 font-medium text-center sm:text-left">
                Ces règles s&apos;appliquent automatiquement à chaque rendu Verdia.
              </p>
              <GuideSignupButton className="shrink-0" />
            </div>
          )}
        </section>
      ))}

      {guide.finalCta && <Segment segment={guide.finalCta} i={-1} />}
    </div>
  )
}
