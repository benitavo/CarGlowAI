import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import type { Root, RootContent, Paragraph, PhrasingContent } from 'mdast'

/**
 * Splits a paragraph like "**Label**\nRest of the text…" into the label and the
 * remaining inline content. In CommonMark, a single newline (no blank line) never
 * creates a separate node — the label and body are one paragraph with the newline
 * embedded as a leading "\n" in the following text node, not a `break` node.
 */
export function splitLeadingStrong(paragraph: Paragraph): { label: string; rest: PhrasingContent[] } {
  const [first, ...others] = paragraph.children
  const label = textContent(first).trim()
  const rest = others.filter((n) => n.type !== 'break')
  if (rest[0]?.type === 'text') {
    rest[0] = { ...rest[0], value: rest[0].value.replace(/^\n+\s*/, '') }
  }
  return { label, rest }
}

export const SITE_URL = 'https://verdia.fr'

export function parseMarkdown(body: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(body) as Root
}

export function textContent(node: RootContent | PhrasingContent): string {
  if (node.type === 'text') return node.value
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => textContent(child as PhrasingContent)).join('')
  }
  return ''
}

const htmlProcessor = unified().use(remarkRehype).use(rehypeStringify)

export function nodesToHtml(nodes: RootContent[]): string {
  if (nodes.length === 0) return ''
  const root: Root = { type: 'root', children: nodes }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hastTree = htmlProcessor.runSync(root as any)
  return htmlProcessor.stringify(hastTree as any).trim()
}

export function inlineToHtml(nodes: PhrasingContent[]): string {
  const paragraph: Paragraph = { type: 'paragraph', children: nodes }
  return nodesToHtml([paragraph])
}

export function collectLinks(node: RootContent | PhrasingContent, out: string[]) {
  if (node.type === 'link') out.push(node.url)
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) collectLinks(child as PhrasingContent, out)
  }
}

/** Crude tag-stripping for structured-data (JSON-LD) text fields — not for rendering. */
export function htmlToPlainText(html: string, maxLength = 300): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

export interface FaqItem {
  question: string
  answerHtml: string
  answerText: string
}

/** Shared shape for long-form content (blog articles, guide) rendered by <ArticleBody>. */
export type ContentSegment =
  | { type: 'html'; html: string }
  | { type: 'callout'; label: string; html: string }
  | { type: 'faq'; items: FaqItem[] }
  | { type: 'cta'; html: string }
