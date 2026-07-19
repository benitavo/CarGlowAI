import type { MetadataRoute } from 'next'
import { getAllArticles, SITE_URL } from '@/lib/blog'
import { getGuide } from '@/lib/guide'

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles()
  const guide = getGuide()

  // /solutions/* is deliberately excluded — leftover car-dealership marketing content
  // from before the pivot to landscapers, mismatched to the current product.
  const marketingPages: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/features', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/book-a-demo', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/help', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/docs', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/careers', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/changelog', changeFrequency: 'weekly', priority: 0.3 },
    { path: '/legal/terms', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/legal/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/legal/cookies', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/legal/mentions', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/legal/dpa', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/legal/sla', changeFrequency: 'yearly', priority: 0.2 },
  ]

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    {
      url: `${SITE_URL}${guide.frontmatter.canonical}`,
      lastModified: guide.frontmatter.updated,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...marketingPages.map((page) => ({
      url: `${SITE_URL}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...articles.map((article) => ({
      url: `${SITE_URL}/blog/${article.frontmatter.slug}`,
      lastModified: article.frontmatter.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
