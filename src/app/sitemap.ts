import type { MetadataRoute } from 'next'
import { getAllArticles, SITE_URL } from '@/lib/blog'
import { getGuide } from '@/lib/guide'

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles()
  const guide = getGuide()

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    {
      url: `${SITE_URL}${guide.frontmatter.canonical}`,
      lastModified: guide.frontmatter.updated,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...articles.map((article) => ({
      url: `${SITE_URL}/blog/${article.frontmatter.slug}`,
      lastModified: article.frontmatter.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
