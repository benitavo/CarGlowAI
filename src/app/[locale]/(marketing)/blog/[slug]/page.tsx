import { Link } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Share2, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react'

type Post = {
  slug: string
  title: string
  date: string
  tag: string
  mins: number
  author: { name: string; role: string; avatar: string }
  excerpt: string
  body: { h2?: string; p?: string; quote?: string; list?: string[] }[]
}

const POSTS: Record<string, Post> = {
  'ai-car-photos-sell-faster': {
    slug: 'ai-car-photos-sell-faster',
    title: 'AI car photos sell 40% faster — here\'s the data',
    date: 'May 2026',
    tag: 'Research',
    mins: 5,
    author: { name: 'Aïcha Diop', role: 'Head of Product', avatar: 'https://i.pravatar.cc/100?img=44' },
    excerpt: 'We analyzed 2.4M listings from 312 dealerships across Europe. Vehicles photographed with CarGlow sold 40% faster on average — and that\'s before adjusting for price.',
    body: [
      { p: 'For most dealers, time-to-sale is the metric that matters. Every day a car sits on the lot is interest, depreciation, and floor-plan financing burning quietly in the background. So when we say AI-enhanced photos sell faster, we want to back that up with data — not vibes.' },
      { h2: 'The methodology' },
      { p: 'We pulled anonymized listing data from 312 dealerships that started using CarGlow between January 2024 and December 2025. For each dealer, we compared their last 100 listings before adopting CarGlow against their first 100 after — same dealer, same inventory mix, same staff. That removes most of the confounding variables.' },
      { p: 'Then we looked at one number: days-to-sale.' },
      { h2: 'The result' },
      { p: 'Median days-to-sale dropped from 28 to 17. That\'s a 39% reduction, which we\'re rounding to 40% because nobody trusts an odd number in marketing.' },
      { quote: '"We list a car at 9am, get inquiries by lunch. That just didn\'t happen before." — Sales Director, German dealer group, 14 rooftops' },
      { h2: 'Why does this happen?' },
      { p: 'A few mechanisms, in order of how much they seemed to matter:' },
      { list: [
        'Click-through rate on listing thumbnails increased 2.3x. Better hero image = more eyeballs.',
        'Inquiry-to-test-drive conversion improved 18%. Buyers who saw professional photos arrived more committed.',
        'Listings with consistent backgrounds (vs. mixed lot photos) had longer average dwell time — suggesting buyers were more confident comparing across cars.',
      ]},
      { h2: 'What this means for you' },
      { p: 'If you\'re moving 50 cars a month and trimming days-to-sale by 11 days, your floor plan financing alone saves roughly €18,000/year on a €2M inventory book. That\'s before counting the extra inventory turnover.' },
      { p: 'We published the full methodology and anonymized dataset for anyone who wants to dig in. Email us and we\'ll send the link.' },
    ],
  },
  'gdpr-plate-masking-guide': {
    slug: 'gdpr-plate-masking-guide',
    title: 'GDPR and car listings: your plate masking guide',
    date: 'Apr 2026',
    tag: 'Compliance',
    mins: 7,
    author: { name: 'Yuki Tanaka', role: 'Engineering Lead', avatar: 'https://i.pravatar.cc/100?img=33' },
    excerpt: 'License plates are personal data under GDPR. Here\'s a practical guide to staying compliant when listing vehicles online — without making your photos look like surveillance footage.',
    body: [
      { p: 'A license plate identifies a specific vehicle and, through registration records, a specific owner. Under GDPR, that makes it personal data. Publishing it to a public listing site without consent is, technically, a data protection issue.' },
      { p: 'In practice, regulators rarely come after dealers for this. But "rarely" is not "never," and some marketplaces (Mobile.de notably) have started enforcing it directly.' },
      { h2: 'The two options' },
      { p: 'You can either blur the plate (cheap, ugly) or replace it with a dealer plate frame (clean, brand-consistent). We default to the second.' },
      { h2: 'What CarGlow does automatically' },
      { list: [
        'Detects plates on every uploaded photo using a fine-tuned model. Detection accuracy is 99.4% on our internal benchmark.',
        'Masks or replaces them based on your Brand Kit setting.',
        'Records the original plate position in metadata so you can disable masking per-vehicle if needed (e.g. for fleet customers who want the plate visible).',
      ]},
      { quote: '"We just turned on plate masking and stopped thinking about it. Saves us 30 minutes a day across the team." — Operations Manager, French dealer group' },
      { h2: 'Edge cases' },
      { p: 'Vanity plates in specialty/auction settings sometimes shouldn\'t be masked — they\'re part of the value. Our Brand Kit settings let you override per vehicle, per folder, or per workspace.' },
    ],
  },
  'batch-processing-dealerships': {
    slug: 'batch-processing-dealerships',
    title: 'How to process 200 car photos in 5 minutes',
    date: 'Mar 2026',
    tag: 'Guide',
    mins: 4,
    author: { name: 'Sofia Romano', role: 'Customer Success', avatar: 'https://i.pravatar.cc/100?img=47' },
    excerpt: 'A practical walkthrough of the batch upload flow for dealers running 100+ vehicles a week. Includes CSV templates and Mobile.de / AutoTrader webhook setup.',
    body: [
      { p: 'If you\'re photographing 20+ cars in a single session, doing them one at a time in the editor is a waste of your day. Here\'s how to set up a batch pipeline that takes 5 minutes of human time for 200 photos.' },
      { h2: 'Step 1 — Organize uploads by vehicle' },
      { p: 'Drop your raw camera files into folders named by VIN or stock number. CarGlow groups photos by folder automatically when you upload.' },
      { h2: 'Step 2 — Bulk-create vehicles via CSV' },
      { p: 'Download our CSV template from Vehicles → Import. Fill in VIN, year, make, model, mileage, and asking price. Each row becomes a vehicle and gets linked to the photos in the matching folder.' },
      { h2: 'Step 3 — Pick a default style' },
      { p: 'In Brand Kit, set your default style and watermark. Every photo in the batch gets it applied — no per-photo clicks.' },
      { h2: 'Step 4 — Upload and walk away' },
      { p: 'Drop all the folders into the library. Status moves Queued → Processing → Enhanced. You get a webhook (or email) when the batch is done. We benchmark 2.4 seconds per photo on Pro+ plans.' },
      { quote: '"Friday evening upload, Monday morning everything is listed. Game-changer for our team." — General Manager, Belgian dealer group' },
    ],
  },
  'kontext-identity-preservation': {
    slug: 'kontext-identity-preservation',
    title: 'Why we switched to FLUX Kontext for identity preservation',
    date: 'Feb 2026',
    tag: 'Technical',
    mins: 8,
    author: { name: 'Marcus Hill', role: 'CTO & Co-founder', avatar: 'https://i.pravatar.cc/100?img=14' },
    excerpt: 'A deep-dive into why we moved off Stable Diffusion XL and rebuilt our enhancement pipeline on top of Black Forest Labs\' FLUX Kontext model. With benchmarks.',
    body: [
      { p: 'The defining technical problem in vehicle photo enhancement is identity preservation. When you ask an image model to "put this car in a studio," you very much want the same car to come back — same paint, same trim, same wheels, same dent on the rear quarter panel. Most models will give you a different car.' },
      { h2: 'The SDXL problem' },
      { p: 'We ran SDXL with ControlNet for our first 18 months. It was good enough most of the time. But on specialty cars — modified, rare colors, aftermarket wheels — it would silently swap details. A customer\'s widebody M4 would come back as a stock M4. Not acceptable when your business is selling that specific car.' },
      { h2: 'Enter FLUX Kontext' },
      { p: 'FLUX Kontext is built specifically for context-preserving edits. You give it a source image and an instruction; it changes what you asked and keeps everything else identical. For our use case — keep the car, change the background — it\'s a much better primitive.' },
      { quote: '"Our identity preservation benchmark went from 87% to 98.2%. We dropped two whole post-processing steps." — internal eval report, January 2026' },
      { h2: 'The benchmark' },
      { p: 'We built a benchmark of 500 vehicle photos with 12 known modifications each (paint chips, aftermarket wheels, dealer decals, plate frames). Human annotators score each output for whether the modifications are preserved.' },
      { list: [
        'SDXL + ControlNet: 87.1% preservation rate',
        'FLUX dev: 94.3%',
        'FLUX Kontext (fine-tuned on automotive): 98.2%',
        'GPT-Image-1 (for reference): 71.4% — surprisingly bad on this axis',
      ]},
      { h2: 'What we kept' },
      { p: 'The pipeline still includes our own plate detector for the masking step. Kontext does the heavy lifting on the background swap; plate masking and logo watermarking stay as separate, deterministic passes.' },
    ],
  },
}

const RELATED_BY_TAG: Record<string, string[]> = {
  Research:   ['gdpr-plate-masking-guide', 'kontext-identity-preservation'],
  Compliance: ['ai-car-photos-sell-faster', 'batch-processing-dealerships'],
  Guide:      ['ai-car-photos-sell-faster', 'gdpr-plate-masking-guide'],
  Technical:  ['ai-car-photos-sell-faster', 'gdpr-plate-masking-guide'],
}

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = POSTS[slug]
  if (!post) notFound()

  const related = (RELATED_BY_TAG[post.tag] ?? [])
    .map((s) => POSTS[s])
    .filter((p): p is Post => Boolean(p && p.slug !== post.slug))
    .slice(0, 2)

  return (
    <article className="pt-32 pb-20 page-container">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-offwhite/55 hover:text-offwhite mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          All articles
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-0.5 rounded-md bg-glow-500/10 text-glow-400 text-xs font-semibold">{post.tag}</span>
          <span className="text-xs text-offwhite/45 flex items-center gap-1">
            <Calendar className="w-3 h-3" strokeWidth={1.75} />
            {post.date}
          </span>
          <span className="text-xs text-offwhite/45 flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.75} />
            {post.mins} min read
          </span>
        </div>

        <h1 className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-display font-bold text-offwhite leading-[1.15] mb-5">
          {post.title}
        </h1>
        <p className="text-[17px] text-offwhite/65 leading-relaxed mb-8">{post.excerpt}</p>

        {/* Author */}
        <div className="flex items-center justify-between py-5 border-y border-white/[0.06] mb-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.author.avatar} alt={post.author.name} width={36} height={36} className="rounded-full ring-1 ring-white/10" />
            <div>
              <div className="text-sm font-medium">{post.author.name}</div>
              <div className="text-xs text-offwhite/55">{post.author.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ShareLink icon={Twitter}  label="Share on X" />
            <ShareLink icon={Linkedin} label="Share on LinkedIn" />
            <ShareLink icon={LinkIcon} label="Copy link" />
          </div>
        </div>

        {/* Body */}
        <div className="prose-custom">
          {post.body.map((block, i) => {
            if (block.h2)    return <h2 key={i} className="font-display font-bold text-2xl text-offwhite mt-10 mb-4">{block.h2}</h2>
            if (block.quote) return <blockquote key={i} className="my-6 pl-5 border-l-2 border-glow-500/50 text-[17px] text-offwhite/80 italic leading-relaxed">{block.quote}</blockquote>
            if (block.list)  return (
              <ul key={i} className="space-y-2 my-5 text-[16px] text-offwhite/75">
                {block.list.map((li, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span className="text-glow-400 mt-0.5">·</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            )
            return <p key={i} className="text-[16px] text-offwhite/75 leading-[1.7] my-4">{block.p}</p>
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-glow-500/20 bg-glow-500/[0.04] p-6 text-center">
          <h3 className="font-display font-semibold text-lg">Try CarGlow free for 30 days</h3>
          <p className="text-sm text-offwhite/65 mt-1 mb-4">3 free photos. No card required. Cancel anytime.</p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-glow-500 hover:bg-glow-400 text-midnight px-5 py-2 text-sm font-semibold"
          >
            Start free trial
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-4">
              Keep reading
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.025] transition-colors p-5"
                >
                  <span className="px-2 py-0.5 rounded-md bg-glow-500/10 text-glow-400 text-xs font-semibold">{p.tag}</span>
                  <h4 className="font-display font-semibold mt-3 group-hover:text-glow-300 transition-colors">{p.title}</h4>
                  <div className="text-xs text-offwhite/45 mt-2">{p.date} · {p.mins} min read</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

function ShareLink({ icon: Icon, label }: { icon: typeof Twitter; label: string }) {
  return (
    <button
      aria-label={label}
      className="p-2 rounded-md text-offwhite/55 hover:text-offwhite hover:bg-white/[0.05]"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
    </button>
  )
}
