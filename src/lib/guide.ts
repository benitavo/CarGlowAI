import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { RootContent, Paragraph, Blockquote } from 'mdast'
import { parseMarkdown, textContent, nodesToHtml, inlineToHtml, collectLinks, splitLeadingStrong } from '@/lib/markdown'
import type { ContentSegment, FaqItem } from '@/lib/markdown'
import { getAllArticlesUnfiltered } from '@/lib/blog'

const GUIDE_FILE = path.join(process.cwd(), 'content/guide/guide-utilisateur-verdia.md')

export interface GuideFrontmatter {
  title: string
  description: string
  slug: string
  canonical: string
  ogDescription: string
  updated: string
  readingTime: number
  toc: { id: string; label: string }[]
}

const REQUIRED_FIELDS: (keyof GuideFrontmatter)[] = [
  'title', 'description', 'slug', 'canonical', 'ogDescription', 'updated', 'readingTime', 'toc',
]

export type GuideSegment = ContentSegment | { type: 'style-cards' }

export interface GuideSection {
  id: string
  label: string
  segments: GuideSegment[]
}

export interface Guide {
  frontmatter: GuideFrontmatter
  intro: ContentSegment[]
  sections: GuideSection[]
  finalCta: ContentSegment | null
  faqItems: FaqItem[]
}

function toIsoDateString(value: unknown, field: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value.slice(0, 10)
  throw new Error(`[guide] "${field}" invalide`)
}

function validateFrontmatter(data: Record<string, unknown>): GuideFrontmatter {
  for (const field of REQUIRED_FIELDS) {
    const value = data[field]
    const missing =
      value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0)
    if (missing) {
      throw new Error(`[guide] champ de frontmatter manquant ou vide — "${field}"`)
    }
  }
  return {
    ...data,
    updated: toIsoDateString(data.updated, 'updated'),
  } as unknown as GuideFrontmatter
}

function isLabelledCallout(node: RootContent): node is Blockquote {
  if (node.type !== 'blockquote') return false
  const first = node.children[0]
  if (!first || first.type !== 'paragraph') return false
  return first.children[0]?.type === 'strong'
}

function calloutLabelAndHtml(node: Blockquote): { label: string; html: string } {
  const { label, rest } = splitLeadingStrong(node.children[0] as Paragraph)
  // Guide callouts additionally use a " — Label — body" em-dash separator on the same line.
  if (rest[0]?.type === 'text') {
    rest[0] = { ...rest[0], value: rest[0].value.replace(/^\s*[—–-]\s*/, '') }
  }
  return { label, html: inlineToHtml(rest) }
}

function isBoldLinkParagraph(node: RootContent): node is Paragraph {
  if (node.type !== 'paragraph' || node.children.length !== 1) return false
  const child = node.children[0]
  return child.type === 'strong' && child.children.length === 1 && child.children[0].type === 'link'
}

function assertNoTopLevelH1(nodes: RootContent[]) {
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === 1) {
      throw new Error('[guide] un "# " (H1) a été trouvé dans le corps du contenu — seul le frontmatter "title" doit produire un H1.')
    }
  }
}

function assertInternalLinksResolve(nodes: RootContent[]) {
  const blogSlugs = new Set(getAllArticlesUnfiltered().map((a) => a.frontmatter.slug))
  const links: string[] = []
  for (const node of nodes) collectLinks(node, links)
  for (const url of links) {
    if (url.startsWith('/blog/')) {
      const slug = url.replace('/blog/', '').replace(/\/$/, '')
      if (!blogSlugs.has(slug)) {
        throw new Error(`[guide] lien interne mort vers "${url}" (slug de blog inconnu: "${slug}")`)
      }
    }
  }
}

let cache: Guide | null = null

export function getGuide(): Guide {
  if (cache) return cache

  const raw = fs.readFileSync(GUIDE_FILE, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatter = validateFrontmatter(data)

  // `{#anchor-id}` heading attributes aren't standard CommonMark — strip them; each
  // "## " heading is matched positionally against the frontmatter `toc` array instead.
  const cleanedContent = content.replace(/\s*\{#[\w-]+\}/g, '')
  const tree = parseMarkdown(cleanedContent)
  const nodes = tree.children

  assertNoTopLevelH1(nodes)
  assertInternalLinksResolve(nodes)

  const depth2Count = nodes.filter((n) => n.type === 'heading' && n.depth === 2).length
  if (depth2Count !== frontmatter.toc.length) {
    throw new Error(`[guide] ${depth2Count} sections ("## ") trouvées dans le contenu mais ${frontmatter.toc.length} entrées dans le frontmatter "toc" — les deux doivent correspondre.`)
  }

  const intro: ContentSegment[] = []
  const sections: GuideSection[] = frontmatter.toc.map((t) => ({ id: t.id, label: t.label, segments: [] }))
  const finalCtaNodes: RootContent[] = []
  const allFaqItems: FaqItem[] = []

  let sectionIndex = -1
  let inFinalCta = false
  let buffer: RootContent[] = []

  const flush = () => {
    if (buffer.length === 0) return
    if (inFinalCta) {
      finalCtaNodes.push(...buffer)
    } else if (sectionIndex === -1) {
      intro.push({ type: 'html', html: nodesToHtml(buffer) })
    } else {
      sections[sectionIndex].segments.push({ type: 'html', html: nodesToHtml(buffer) })
    }
    buffer = []
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node.type === 'thematicBreak') continue

    if (node.type === 'heading' && node.depth === 2) {
      flush()
      sectionIndex += 1

      if (sectionIndex === frontmatter.toc.length - 1) {
        // Last section is the FAQ. Each Q/A pair is ONE paragraph — "**Question?**\nAnswer"
        // has no blank line between them, so CommonMark merges them into a single paragraph
        // node (children: [strong, text]) rather than two separate ones. Whatever follows
        // once pairs stop matching (the closing "### Prêt à transformer…" block) is the CTA.
        let j = i + 1
        const items: FaqItem[] = []
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
        sections[sectionIndex].segments.push({ type: 'faq', items })
        allFaqItems.push(...items)
        i = j - 1
        inFinalCta = true
      }
      continue
    }

    if (isLabelledCallout(node)) {
      flush()
      const { label, html } = calloutLabelAndHtml(node)
      if (sectionIndex === -1) intro.push({ type: 'callout', label, html })
      else sections[sectionIndex].segments.push({ type: 'callout', label, html })
      continue
    }

    if (isBoldLinkParagraph(node)) {
      // The closing "**[Créer mon compte](/signup)**" line — GuideCTA renders its own fixed link instead.
      continue
    }

    buffer.push(node)
  }
  flush()

  // Section 4 ("choisir-style") re-renders its style comparison as <StyleCardsGrid> to
  // mirror the product UI (per integration note) — drop the raw markdown table.
  const styleSection = sections.find((s) => s.id === 'choisir-style')
  if (styleSection) {
    styleSection.segments = styleSection.segments.flatMap((seg): GuideSegment[] =>
      seg.type === 'html' && seg.html.includes('<table') ? [{ type: 'style-cards' }] : [seg])
  }

  const finalCtaHtml = finalCtaNodes.length > 0 ? nodesToHtml(finalCtaNodes) : null

  cache = {
    frontmatter,
    intro,
    sections,
    finalCta: finalCtaHtml ? { type: 'cta', html: finalCtaHtml } : null,
    faqItems: allFaqItems,
  }
  return cache
}
