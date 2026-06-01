import { Link } from '@/i18n/routing'
import {
  Zap, Key, Webhook, Code2, Book, Cpu, ArrowRight, ExternalLink,
  Image as ImageIcon, Building2, Folder, CreditCard,
} from 'lucide-react'

const QUICK_START = [
  { step: '1', title: 'Get your API key', desc: 'Create a key in Integrations → API keys. Use a Test key while you build, Live for production.' },
  { step: '2', title: 'Make your first call', desc: 'POST a photo to /v1/enhance with a style slug. You get back a job ID and a webhook callback.' },
  { step: '3', title: 'Subscribe to events',  desc: 'Configure a webhook for photo.enhanced and you\'re done — listings update in real time.' },
]

const SECTIONS = [
  { icon: Cpu,         title: 'API reference',     desc: 'Every endpoint, parameter, and response shape — with curl, Node, and Python examples.', href: '#api' },
  { icon: Webhook,     title: 'Webhooks',          desc: 'Event payloads, signing secrets, retry policy, and how to verify HMAC-SHA256 signatures.', href: '#webhooks' },
  { icon: ImageIcon,   title: 'Photos',            desc: 'Upload, enhance, list, and delete photos. Batch endpoints up to 200 at a time.', href: '#photos' },
  { icon: Building2,   title: 'Vehicles',          desc: 'Create, update, and query vehicle records. CRUD plus CSV import.', href: '#vehicles' },
  { icon: Folder,      title: 'Backgrounds & brand kits', desc: 'List available backgrounds and apply a brand kit (logo watermark + plate frame) to a photo.', href: '#styles' },
  { icon: CreditCard,  title: 'Billing',           desc: 'Credit balance, top-ups, and invoice history. Stripe Customer Portal for self-serve.', href: '#billing' },
]

const SDKS = [
  { lang: 'Node.js',  pkg: 'npm install @carglow/sdk',     ver: '2.4.1' },
  { lang: 'Python',   pkg: 'pip install carglow',          ver: '2.4.0' },
  { lang: 'Ruby',     pkg: 'gem install carglow',          ver: '2.3.2' },
  { lang: 'PHP',      pkg: 'composer require carglow/sdk', ver: '2.3.0' },
]

export default function DocsPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="max-w-3xl mb-16">
          <p className="eyebrow mb-4">Documentation</p>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4 leading-[1.1]">
            Build with <span className="text-gradient">CarGlow.</span>
          </h1>
          <p className="text-offwhite/55 text-[15px] max-w-xl">
            A REST API and real-time webhooks for photo enhancement. Process inventory at scale,
            push to your DMS, or embed CarGlow into your dealership workflow.
          </p>
        </div>

        {/* Quick start */}
        <section className="mb-16">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-5">
            Quick start
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {QUICK_START.map((q) => (
              <div key={q.step} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] card-noise p-5">
                <div className="text-glow-400 font-display font-bold text-3xl mb-2">{q.step}</div>
                <h3 className="font-display font-semibold text-base mb-1">{q.title}</h3>
                <p className="text-sm text-offwhite/55">{q.desc}</p>
              </div>
            ))}
          </div>

          {/* Code sample */}
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-midnight-900 p-5 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3 text-xs text-offwhite/45">
              <Code2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="font-mono">curl</span>
            </div>
            <pre className="text-xs font-mono text-offwhite/85 leading-relaxed">
{`curl -X POST https://api.carglow.ai/v1/enhance \\
  -H "Authorization: Bearer cg_live_8KqR4mP2_xR2pK9mL5nQ" \\
  -F "image=@./inventory/911.jpg" \\
  -F "style=studio-white" \\
  -F "vehicle_id=v_001" \\
  -F "watermark=true"

# 202 Accepted
# {
#   "job_id": "job_a4f8c2",
#   "status": "queued",
#   "estimated_ms": 2400,
#   "webhook_event": "photo.enhanced"
# }`}
            </pre>
          </div>
        </section>

        {/* Section grid */}
        <section className="mb-16">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-5">
            Browse the reference
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <a
                  key={s.title}
                  href={s.href}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.025] transition-colors p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-glow-400" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold flex items-center gap-1.5">
                      {s.title}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-glow-400" strokeWidth={2} />
                    </h3>
                    <p className="text-sm text-offwhite/55 mt-1">{s.desc}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* SDKs */}
        <section className="mb-16">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-5">
            Official SDKs
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] overflow-hidden">
            {SDKS.map((s, i) => (
              <div key={s.lang} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                <div className="flex items-center gap-3">
                  <Book className="w-3.5 h-3.5 text-offwhite/45" strokeWidth={1.75} />
                  <span className="text-sm font-medium w-20">{s.lang}</span>
                  <code className="text-xs font-mono text-offwhite/65 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-0.5">{s.pkg}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-offwhite/45 tabular-nums">v{s.ver}</span>
                  <a href="#" className="text-xs text-glow-400 hover:text-glow-300 flex items-center gap-1">
                    GitHub <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Help CTA */}
        <section className="rounded-2xl border border-glow-500/20 bg-glow-500/[0.04] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-lg">Need a hand?</h3>
            <p className="text-sm text-offwhite/65 mt-0.5">
              We typically reply within an hour during business days.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/help"
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] text-offwhite px-4 py-2 text-sm"
            >
              Help center
            </Link>
            <Link
              href="/contact"
              className="rounded-lg bg-glow-500 hover:bg-glow-400 text-midnight px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
              Talk to support
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
