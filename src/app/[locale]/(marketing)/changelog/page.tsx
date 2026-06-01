import { Link } from '@/i18n/routing'
import { Sparkles, Wrench, Zap, Shield, Plus } from 'lucide-react'

const ENTRIES = [
  {
    version: '2.4',
    date: 'May 22, 2026',
    tag: 'Major',
    title: 'Multiple brand kits',
    items: [
      { icon: Sparkles, text: 'New: store multiple brand kits per workspace. Switch the active kit per vehicle or folder.' },
      { icon: Sparkles, text: 'Logo watermark now has per-kit position and opacity controls.' },
      { icon: Wrench,   text: 'Editor: history scrubber now persists across page reloads.' },
      { icon: Shield,   text: 'Security: SCIM 2.0 provisioning for Okta and Azure AD.' },
    ],
  },
  {
    version: '2.3',
    date: 'Apr 30, 2026',
    tag: 'Minor',
    title: 'Webhook signing & delivery log',
    items: [
      { icon: Plus,   text: 'Webhooks now sign every payload with HMAC-SHA256. Rotate signing secrets without downtime.' },
      { icon: Plus,   text: 'New delivery log in Integrations → Webhooks with retry-on-failure controls.' },
      { icon: Wrench, text: 'Bulk re-enhance now respects per-vehicle background overrides.' },
      { icon: Zap,    text: 'Performance: editor cold-start down 40% (1.8s → 1.1s p50).' },
    ],
  },
  {
    version: '2.2',
    date: 'Apr 12, 2026',
    tag: 'Minor',
    title: 'Library smart folders',
    items: [
      { icon: Plus,   text: 'Smart folders auto-group photos by status (Pending, Failed, This week, Favorites).' },
      { icon: Plus,   text: 'Multi-select bulk actions: re-enhance, move, tag, share, delete.' },
      { icon: Wrench, text: 'Fixed: tag chips occasionally disappeared after editing on Safari 17.' },
    ],
  },
  {
    version: '2.1',
    date: 'Mar 28, 2026',
    tag: 'Minor',
    title: 'Stronger plate masking',
    items: [
      { icon: Plus, text: 'Plate detection now covers more EU and UK plate formats.' },
      { icon: Plus, text: 'Plate masking applies automatically on every enhancement — no per-photo toggle needed.' },
    ],
  },
  {
    version: '2.0',
    date: 'Mar 03, 2026',
    tag: 'Major',
    title: 'The new editor',
    items: [
      { icon: Sparkles, text: 'Rebuilt editor focused on two tools: background swap and plate & logo, with a before/after slider and live history scrubber.' },
      { icon: Sparkles, text: 'New background library with 15 curated options across Studio, Outdoor, Lifestyle, Premium, and Minimal categories.' },
    ],
  },
]

const TAG_STYLES: Record<string, string> = {
  Major: 'bg-glow-500/15 text-glow-300 border-glow-500/30',
  Minor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Patch: 'bg-white/[0.04] text-offwhite/65 border-white/[0.1]',
}

export default function ChangelogPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow mb-4">Changelog</p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4 leading-[1.1]">
          What&apos;s new at <span className="text-gradient">CarGlow.</span>
        </h1>
        <p className="text-offwhite/55 mb-14 text-[15px]">
          Product updates, every two weeks. Follow us on{' '}
          <a href="https://twitter.com/carglowai" className="text-glow-400 hover:text-glow-300">X</a>{' '}
          to get notified.
        </p>

        <div className="space-y-12 relative">
          {/* Vertical timeline */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-glow-500/30 via-white/[0.06] to-transparent" />

          {ENTRIES.map((e) => (
            <article key={e.version} className="relative pl-12">
              {/* Dot */}
              <div className="absolute left-2 top-2 w-3 h-3 rounded-full bg-glow-500 ring-4 ring-midnight shadow-glow-sm" />

              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono text-sm text-offwhite/45">v{e.version}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${TAG_STYLES[e.tag]}`}>
                  {e.tag}
                </span>
                <span className="text-xs text-offwhite/35 tabular-nums">{e.date}</span>
              </div>

              <h2 className="font-display font-bold text-2xl text-offwhite mt-2 mb-4">{e.title}</h2>

              <ul className="space-y-2.5">
                {e.items.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <li key={i} className="flex items-start gap-2.5 text-[15px] text-offwhite/75">
                      <Icon className="w-4 h-4 text-glow-400 mt-1 flex-shrink-0" strokeWidth={1.75} />
                      <span>{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-offwhite/45">
          Want something next? <Link href="/contact" className="text-glow-400 hover:text-glow-300">Tell us</Link>.
        </div>
      </div>
    </div>
  )
}
