import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { RootContent, Paragraph, Blockquote, Heading, PhrasingContent } from 'mdast'
import { parseMarkdown, textContent, nodesToHtml, inlineToHtml, collectLinks, splitLeadingStrong, SITE_URL } from '@/lib/markdown'
import type { ContentSegment, FaqItem } from '@/lib/markdown'

export { SITE_URL }
export type { FaqItem }
const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogFrontmatter {
  title: string
  description: string
  slug: string
  date: string
  updated: string
  author: string
  authorRole: string
  category: string
  tags: string[]
  targetKeyword: string
  secondaryKeywords: string[]
  readingTime: number
  featured: boolean
  image: string
  imageAlt: string
}

const REQUIRED_FIELDS: (keyof BlogFrontmatter)[] = [
  'title', 'description', 'slug', 'date', 'updated', 'author', 'authorRole',
  'category', 'tags', 'targetKeyword', 'secondaryKeywords', 'readingTime',
  'featured', 'image', 'imageAlt',
]

export type BlogSegment = ContentSegment

export interface BlogArticle {
  frontmatter: BlogFrontmatter
  segments: BlogSegment[]
  faqItems: FaqItem[]
}

/** js-yaml parses unquoted YYYY-MM-DD scalars as native Date objects, not strings — normalize back to ISO date strings. */
function toIsoDateString(value: unknown, field: string, file: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value.slice(0, 10)
  throw new Error(`[blog] ${file}: "${field}" invalide`)
}

function validateFrontmatter(data: Record<string, unknown>, file: string): BlogFrontmatter {
  for (const field of REQUIRED_FIELDS) {
    const value = data[field]
    const missing =
      value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0)
    if (missing) {
      throw new Error(`[blog] ${file}: champ de frontmatter manquant ou vide — "${field}"`)
    }
  }
  return {
    ...data,
    date: toIsoDateString(data.date, 'date', file),
    updated: toIsoDateString(data.updated, 'updated', file),
  } as unknown as BlogFrontmatter
}

function isCalloutTerrain(node: RootContent): node is Blockquote {
  if (node.type !== 'blockquote') return false
  const first = node.children[0]
  if (!first || first.type !== 'paragraph') return false
  const firstInline = first.children[0]
  return !!firstInline && firstInline.type === 'strong' && textContent(firstInline).trim() === 'Retour de terrain'
}

function calloutBodyHtml(node: Blockquote): string {
  const paragraph = node.children[0] as Paragraph
  return inlineToHtml(splitLeadingStrong(paragraph).rest)
}

function isFaqHeading(node: RootContent): node is Heading {
  return node.type === 'heading' && node.depth === 2 && textContent(node).trim().toLowerCase() === 'questions fréquentes'
}

function isCtaParagraph(node: RootContent): node is Paragraph {
  return (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    node.children[0].type === 'emphasis'
  )
}

function ctaBodyHtml(node: Paragraph): string {
  const emphasis = node.children[0] as { children: PhrasingContent[] }
  return inlineToHtml(emphasis.children)
}

function assertNoTopLevelH1(nodes: RootContent[], file: string) {
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === 1) {
      throw new Error(`[blog] ${file}: un "# " (H1) a été trouvé dans le corps de l'article — seul le frontmatter "title" doit produire un H1.`)
    }
  }
}

function assertInternalLinksResolve(nodes: RootContent[], file: string, knownSlugs: Set<string>) {
  const links: string[] = []
  for (const node of nodes) collectLinks(node, links)
  for (const url of links) {
    if (!url.startsWith('/blog/')) continue
    const slug = url.replace('/blog/', '').replace(/\/$/, '')
    if (!knownSlugs.has(slug)) {
      throw new Error(`[blog] ${file}: lien interne mort vers "${url}" (slug inconnu: "${slug}")`)
    }
  }
}

function parseBody(body: string, file: string, knownSlugs: Set<string>): { segments: BlogSegment[]; faqItems: FaqItem[] } {
  const tree = parseMarkdown(body)
  const nodes = tree.children

  assertNoTopLevelH1(nodes, file)
  assertInternalLinksResolve(nodes, file, knownSlugs)

  const segments: BlogSegment[] = []
  const allFaqItems: FaqItem[] = []
  let buffer: RootContent[] = []

  const flush = () => {
    if (buffer.length > 0) {
      segments.push({ type: 'html', html: nodesToHtml(buffer) })
      buffer = []
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node.type === 'thematicBreak') {
      // Thematic breaks in this corpus only precede the closing CTA — never rendered standalone.
      continue
    }

    if (isCalloutTerrain(node)) {
      flush()
      segments.push({ type: 'callout', label: 'Retour de terrain', html: calloutBodyHtml(node) })
      continue
    }

    if (isFaqHeading(node)) {
      flush()
      let j = i + 1
      const items: FaqItem[] = []
      // Each Q/A pair is ONE paragraph — "**Question?**\nAnswer text" has no blank line
      // between them, so CommonMark merges them into a single paragraph node.
      while (j < nodes.length) {
        const pair = nodes[j]
        if (pair.type !== 'paragraph' || pair.children[0]?.type !== 'strong') break
        const { label, rest } = splitLeadingStrong(pair)
        items.push({
          question: label,
          answerHtml: inlineToHtml(rest),
          answerText: textContent({ type: 'paragraph', children: rest }).trim(),
        })
        j += 1
      }
      segments.push({ type: 'faq', items })
      allFaqItems.push(...items)
      i = j - 1
      continue
    }

    if (isCtaParagraph(node) && i === nodes.length - 1) {
      flush()
      segments.push({ type: 'cta', html: ctaBodyHtml(node) })
      continue
    }

    buffer.push(node)
  }
  flush()

  return { segments, faqItems: allFaqItems }
}

let cache: BlogArticle[] | null = null

export function getAllArticlesUnfiltered(): BlogArticle[] {
  if (cache) return cache

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))
  const parsed = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const frontmatter = validateFrontmatter(data, file)
    return { file, frontmatter, content }
  })

  const knownSlugs = new Set(parsed.map((p) => p.frontmatter.slug))

  const articles = parsed.map(({ file, frontmatter, content }) => {
    const { segments, faqItems } = parseBody(content, file, knownSlugs)
    return { frontmatter, segments, faqItems }
  })

  articles.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
  cache = articles
  return articles
}

/**
 * Publicly visible articles. Staggered-publishing (hiding posts whose `date` is in the
 * future) is intentionally disabled — all 7 articles are shown regardless of date.
 * To re-enable the SEO rollout calendar from README-strategie-seo.md, filter here on
 * `a.frontmatter.date <= new Date().toISOString().slice(0, 10)`.
 */
export function getAllArticles(): BlogArticle[] {
  return getAllArticlesUnfiltered()
}

export function getArticleBySlug(slug: string): BlogArticle | null {
  return getAllArticles().find((a) => a.frontmatter.slug === slug) ?? null
}
