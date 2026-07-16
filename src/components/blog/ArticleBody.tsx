import type { ContentSegment } from '@/lib/markdown'
import { Callout } from './Callout'
import { FaqSection } from './FaqSection'
import { BlogCTA } from './BlogCTA'

export function ArticleBody({ segments }: { segments: ContentSegment[] }) {
  return (
    <div className="article-body">
      {segments.map((segment, i) => {
        switch (segment.type) {
          case 'html':
            return <div key={i} dangerouslySetInnerHTML={{ __html: segment.html }} />
          case 'callout':
            return <Callout key={i} label={segment.label} html={segment.html} />
          case 'faq':
            return <FaqSection key={i} items={segment.items} />
          case 'cta':
            return <BlogCTA key={i} html={segment.html} />
          default:
            return null
        }
      })}
    </div>
  )
}
