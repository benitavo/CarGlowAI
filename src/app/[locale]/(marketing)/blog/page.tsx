import { Link } from '@/i18n/routing'

const POSTS = [
  { slug: 'ai-car-photos-sell-faster', title: 'AI car photos sell 40% faster — here\'s the data', date: 'May 2025', tag: 'Research', mins: 5 },
  { slug: 'gdpr-plate-masking-guide', title: 'GDPR and car listings: your plate masking guide', date: 'Apr 2025', tag: 'Compliance', mins: 7 },
  { slug: 'batch-processing-dealerships', title: 'How to process 200 car photos in 5 minutes', date: 'Mar 2025', tag: 'Guide', mins: 4 },
  { slug: 'kontext-identity-preservation', title: 'Why we switched to FLUX Kontext for identity preservation', date: 'Feb 2025', tag: 'Technical', mins: 8 },
]

export default function BlogPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow mb-4">Blog</p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4">
          Tips, guides, and<br /><span className="text-gradient">product news.</span>
        </h1>
        <p className="text-offwhite/50 mb-12">The latest from the CarGlow team on AI photography, automotive listings, and product updates.</p>
        <div className="flex flex-col gap-6">
          {POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group card-noise rounded-2xl p-6 hover:border-glow-500/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded-md bg-glow-500/10 text-glow-400 text-xs font-semibold">{post.tag}</span>
                <span className="text-xs text-offwhite/30">{post.date} · {post.mins} min read</span>
              </div>
              <h2 className="text-lg font-display font-semibold text-offwhite group-hover:text-glow-300 transition-colors">{post.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
