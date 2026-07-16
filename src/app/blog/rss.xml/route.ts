import { getAllArticles, SITE_URL } from '@/lib/blog'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET() {
  const articles = getAllArticles()

  const items = articles.map((article) => {
    const { title, description, slug, date } = article.frontmatter
    const url = `${SITE_URL}/blog/${slug}`
    return `
    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(description)}</description>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Verdia — Blog</title>
    <description>Conseils terrain pour paysagistes indépendants.</description>
    <link>${SITE_URL}/blog</link>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
