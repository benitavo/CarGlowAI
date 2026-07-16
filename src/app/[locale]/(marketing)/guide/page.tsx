import type { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { Clock, Calendar } from 'lucide-react'
import { getGuide } from '@/lib/guide'
import { SITE_URL, htmlToPlainText } from '@/lib/markdown'
import { GuideTocSidebar, GuideTocMobile } from '@/components/guide/GuideToc'
import { GuideBody } from '@/components/guide/GuideBody'

const HOWTO_SECTION_IDS = ['photographier', 'creer-projet', 'choisir-style', 'caracteristiques', 'generation']

export function generateMetadata(): Metadata {
  const { frontmatter } = getGuide()
  const url = `${SITE_URL}${frontmatter.canonical}`

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: frontmatter.title,
      description: frontmatter.ogDescription,
      url,
      images: [{ url: '/blog/images/rendu-ia-jardin-comparaison.webp', alt: frontmatter.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.ogDescription,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GuidePage() {
  const guide = getGuide()
  const { frontmatter, sections, faqItems } = guide
  const url = `${SITE_URL}${frontmatter.canonical}`

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guide', item: url },
    ],
  }

  const faqPageLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answerText },
    })),
  } : null

  const howToSteps = HOWTO_SECTION_IDS
    .map((id) => sections.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => {
      const text = s.segments
        .filter((seg): seg is { type: 'html'; html: string } => seg.type === 'html')
        .map((seg) => htmlToPlainText(seg.html))
        .join(' ')
      return { '@type': 'HowToStep', name: s.label, text, url: `${url}#${s.id}` }
    })

  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Comment créer un rendu de jardin avec Verdia',
    description: frontmatter.description,
    step: howToSteps,
  }

  return (
    <div className="pt-32 pb-20 bg-cream-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      {faqPageLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd) }} />
      )}

      <div className="page-container max-w-6xl">
        <nav className="flex items-center gap-1.5 text-xs text-midnight/40 mb-6" aria-label="Fil d'ariane">
          <Link href="/" className="hover:text-midnight/70">Accueil</Link>
          <span>/</span>
          <span className="text-midnight/60">Guide</span>
        </nav>

        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-3">Guide utilisateur</p>
          <h1 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
            De la photo au rendu<br /><span className="text-gradient">qui fait signer.</span>
          </h1>
          <p className="text-midnight/50 text-lg leading-relaxed mb-4">{frontmatter.description}</p>
          <div className="flex items-center gap-4 text-xs text-midnight/40">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              {frontmatter.readingTime} min de lecture
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
              Mis à jour le {formatDate(frontmatter.updated)}
            </span>
          </div>
        </div>

        <GuideTocMobile toc={frontmatter.toc} />

        <div className="flex gap-12 items-start">
          <div className="min-w-0 flex-1 max-w-3xl">
            <GuideBody guide={guide} />
          </div>
          <GuideTocSidebar toc={frontmatter.toc} />
        </div>
      </div>
    </div>
  )
}
