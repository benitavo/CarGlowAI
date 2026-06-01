import { Link } from '@/i18n/routing'
import {
  Search, Sparkles, CreditCard, Users, Image as ImageIcon, Zap, Settings,
  MessageCircle, BookOpen, ArrowRight, HelpCircle,
} from 'lucide-react'

const CATEGORIES = [
  {
    icon: Sparkles, title: 'Getting started',
    desc: 'Account setup, your first enhancement, brand kit basics',
    articleCount: 12,
  },
  {
    icon: ImageIcon, title: 'Photos & editor',
    desc: 'Upload guidelines, background swap, plate & logo',
    articleCount: 28,
  },
  {
    icon: CreditCard, title: 'Plans & billing',
    desc: 'Credits, plan changes, invoices, VAT, payment methods',
    articleCount: 16,
  },
  {
    icon: Users, title: 'Team & workspaces',
    desc: 'Inviting members, roles, multiple workspaces, SSO',
    articleCount: 9,
  },
  {
    icon: Zap, title: 'Integrations',
    desc: 'API keys, webhooks, marketplace connections, CSV import',
    articleCount: 19,
  },
  {
    icon: Settings, title: 'Settings & security',
    desc: '2FA, GDPR, data exports, audit log, account deletion',
    articleCount: 11,
  },
]

const POPULAR = [
  'How do credits work?',
  'Why did my enhancement fail?',
  'Can I cancel anytime and keep my photos?',
  'How to integrate with AutoTrader',
  'GDPR plate masking — what\'s automatic vs manual?',
  'Enhancing many photos for one vehicle',
  'Sharing a vehicle gallery with a customer',
  'Switching between multiple brand kits',
]

export default function HelpPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-4xl mx-auto">
        {/* Hero with search */}
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">Help center</p>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4 leading-[1.1]">
            How can we <span className="text-gradient">help?</span>
          </h1>
          <p className="text-offwhite/55 text-[15px] mb-8">
            Answers, guides, and how-tos for every part of CarGlow.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 text-offwhite/40 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search articles, guides, or paste an error message…"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-[15px] placeholder:text-offwhite/35 focus:outline-none focus:border-glow-500/50 focus:bg-white/[0.05] transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <section className="mb-14">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-5">
            Browse by topic
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <a
                  key={c.title}
                  href="#"
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.025] transition-colors p-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-glow-400" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display font-semibold">{c.title}</h3>
                  <p className="text-sm text-offwhite/55 mt-1 line-clamp-2">{c.desc}</p>
                  <div className="text-xs text-offwhite/40 mt-3 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" strokeWidth={1.75} />
                    <span className="tabular-nums">{c.articleCount}</span> articles
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* Popular */}
        <section className="mb-14">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-5">
            Popular this week
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] overflow-hidden">
            {POPULAR.map((q, i) => (
              <a
                key={q}
                href="#"
                className={`group flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.025] transition-colors ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <HelpCircle className="w-3.5 h-3.5 text-offwhite/35 flex-shrink-0" strokeWidth={1.75} />
                  <span className="text-sm text-offwhite/85 truncate">{q}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-offwhite/30 group-hover:text-glow-400 group-hover:translate-x-0.5 transition-all" strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-glow-500/20 bg-glow-500/[0.04] p-6 text-center">
          <MessageCircle className="w-7 h-7 text-glow-400 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-display font-semibold text-lg">Can&apos;t find what you need?</h3>
          <p className="text-sm text-offwhite/65 mt-1 mb-5 max-w-md mx-auto">
            Our support team responds within an hour during EU business hours. Pro+ plans get priority.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              href="/contact"
              className="rounded-lg bg-glow-500 hover:bg-glow-400 text-midnight px-5 py-2 text-sm font-semibold"
            >
              Contact support
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] text-offwhite px-5 py-2 text-sm"
            >
              Read the docs
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
