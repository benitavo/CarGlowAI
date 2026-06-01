import { Link } from '@/i18n/routing'
import {
  MapPin, Briefcase, Heart, Zap, Globe, Users, Award, TrendingUp, ArrowRight,
} from 'lucide-react'

const ROLES = [
  { team: 'Engineering', title: 'Senior Backend Engineer (Rust/Go)',    location: 'Remote · EU',         type: 'Full-time' },
  { team: 'Engineering', title: 'ML Research Engineer — Computer Vision', location: 'London or Berlin',  type: 'Full-time' },
  { team: 'Engineering', title: 'Frontend Engineer (React/Next.js)',    location: 'Remote · EU',         type: 'Full-time' },
  { team: 'Engineering', title: 'Site Reliability Engineer',            location: 'Remote · Europe',     type: 'Full-time' },
  { team: 'Design',      title: 'Senior Product Designer',              location: 'Lisbon or Remote',    type: 'Full-time' },
  { team: 'Sales',       title: 'Account Executive — DACH region',      location: 'Munich, Germany',     type: 'Full-time' },
  { team: 'Sales',       title: 'Solutions Engineer — Enterprise',      location: 'Remote · EU',         type: 'Full-time' },
  { team: 'Customer',    title: 'Customer Success Manager',             location: 'Lisbon, Portugal',    type: 'Full-time' },
]

const VALUES = [
  { icon: Heart,  title: 'Care about the work',  desc: 'We sweat the small details. Dealers trust us with their inventory; that\'s a real responsibility.' },
  { icon: Zap,    title: 'Move fast, ship often', desc: 'Small teams, short feedback loops. We ship to production every day.' },
  { icon: Users,  title: 'Default to candor',    desc: 'Disagree openly, commit fully. We don\'t do politics or status games.' },
  { icon: Award,  title: 'Hire owners',          desc: 'We trust you to figure out what matters and do it. No micromanagement, no theatre.' },
]

const PERKS = [
  'Competitive salary + meaningful equity',
  'Fully remote within EU, or hubs in Lisbon, London, Berlin',
  '40 days paid time off (incl. local holidays)',
  '€2,500/year learning & conference budget',
  'Latest MacBook Pro + €1,000 home office setup',
  'Private health insurance in your country',
  'Twice-a-year team offsites (last two: Porto, Tallinn)',
  'Sabbatical month after 4 years',
]

const TEAMS_BY_REGION = [
  { region: 'EU',  count: 38 },
  { region: 'UK',  count: 9 },
  { region: 'US',  count: 4 },
]

export default function CareersPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center mb-20">
        <p className="eyebrow mb-4">Careers</p>
        <h1 className="text-[clamp(2rem,4vw,3.75rem)] font-display font-bold text-offwhite mb-4 leading-[1.05]">
          Build the future of <span className="text-gradient">automotive listings.</span>
        </h1>
        <p className="text-offwhite/55 text-[15px] max-w-xl mx-auto">
          51 humans across 11 countries. We make AI tools that help dealers sell cars faster.
          We&apos;re hiring across engineering, design, sales, and customer success.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-offwhite/55">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-glow-400" strokeWidth={1.75} />
            <span><span className="text-offwhite font-semibold">11</span> countries</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-glow-400" strokeWidth={1.75} />
            <span><span className="text-offwhite font-semibold">51</span> teammates</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-glow-400" strokeWidth={1.75} />
            <span>Series B · <span className="text-offwhite font-semibold">€42M</span> raised</span>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto mb-20">
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-6 text-center">
          How we work
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v) => {
            const Icon = v.icon
            return (
              <div key={v.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] card-noise p-5">
                <div className="w-9 h-9 rounded-lg bg-glow-500/15 border border-glow-500/25 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-glow-300" strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-semibold">{v.title}</h3>
                <p className="text-sm text-offwhite/55 mt-1.5">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Open roles */}
      <section className="max-w-4xl mx-auto mb-20">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-display font-bold text-offwhite">Open roles</h2>
          <div className="text-sm text-offwhite/55">
            <span className="text-offwhite font-semibold tabular-nums">{ROLES.length}</span> positions
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] overflow-hidden">
          {ROLES.map((r, i) => (
            <a
              key={r.title}
              href="#"
              className={`group flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-glow-300 bg-glow-500/15 border border-glow-500/30 px-1.5 py-0.5 rounded">
                    {r.team}
                  </span>
                  <span className="text-[11px] text-offwhite/45">{r.type}</span>
                </div>
                <h3 className="font-medium text-offwhite group-hover:text-glow-300 transition-colors">{r.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-offwhite/55 mt-1">
                  <MapPin className="w-3 h-3" strokeWidth={1.75} />
                  {r.location}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-offwhite/35 group-hover:text-glow-400 group-hover:translate-x-1 transition-all flex-shrink-0" strokeWidth={1.75} />
            </a>
          ))}
        </div>

        <p className="text-center text-sm text-offwhite/45 mt-6">
          Don&apos;t see your role? <Link href="/contact" className="text-glow-400 hover:text-glow-300">Pitch us anyway</Link> — we hire great people opportunistically.
        </p>
      </section>

      {/* Perks */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-display font-bold text-offwhite mb-6 text-center">
          The fine print
        </h2>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] card-noise p-6 lg:p-8">
          <div className="grid sm:grid-cols-2 gap-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-start gap-2.5 text-sm text-offwhite/80">
                <div className="w-4 h-4 rounded-full bg-glow-500/20 border border-glow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-glow-400" />
                </div>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
