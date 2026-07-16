import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { getAllArticles, getArticleBySlug, SITE_URL } from '@/lib/blog'
import { BlogImage } from '@/components/blog/BlogImage'
import { ArticleBody } from '@/components/blog/ArticleBody'

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.frontmatter.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}

  const { title, description, image, imageAlt, date, updated } = article.frontmatter
  const url = `${SITE_URL}/blog/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      publishedTime: date,
      modifiedTime: updated,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const { frontmatter, segments, faqItems } = article
  const { title, description, author, authorRole, date, updated, readingTime, image, imageAlt, category } = frontmatter
  const url = `${SITE_URL}/blog/${slug}`

  const blogPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: date,
    dateModified: updated,
    author: { '@type': 'Person', name: author },
    image: `${SITE_URL}${image}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
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

  return (
    <article className="pt-32 pb-20 bg-cream-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqPageLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd) }} />
      )}

      <div className="page-container max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-midnight/40 mb-6" aria-label="Fil d'ariane">
          <Link href="/" className="hover:text-midnight/70">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-midnight/70">Blog</Link>
          <span>/</span>
          <span className="text-midnight/60 truncate">{title}</span>
        </nav>

        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-midnight/50 hover:text-midnight mb-8">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          Tous les articles
        </Link>

        <span className="inline-block px-2.5 py-1 rounded-md bg-sage-50 border border-sage-200/60 text-sage-700 text-xs font-semibold mb-4">
          {category}
        </span>

        <h1 className="font-display font-bold text-midnight leading-[1.15] mb-5" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
          {title}
        </h1>
        <p className="text-lg text-midnight/50 leading-relaxed mb-8">{description}</p>

        <div className="flex items-center justify-between py-5 border-y border-midnight/[0.08] mb-10">
          <div>
            <p className="text-sm font-semibold text-midnight">{author}</p>
            <p className="text-xs text-midnight/45">{authorRole}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-midnight/45">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
              {formatDate(date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              {readingTime} min
            </span>
          </div>
        </div>

        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-midnight/[0.08] mb-10">
          <BlogImage src={image} alt={imageAlt} title={title} priority />
        </div>

        <ArticleBody segments={segments} />

        <div className="mt-12 pt-6 border-t border-midnight/[0.08]">
          <p className="text-sm text-midnight/45">
            Écrit par <span className="font-semibold text-midnight/70">{author}</span> — {authorRole}
          </p>
        </div>
      </div>
    </article>
  )
}
