import { Link } from '@/i18n/routing'
import { ArrowRight, Zap } from 'lucide-react'

const TEAM = [
  { name: 'Alex Moreau',   role: 'CEO & Co-founder',      bg: 'from-blue-500 to-indigo-600' },
  { name: 'Clara Fischer', role: 'CTO & Co-founder',      bg: 'from-purple-500 to-pink-600' },
  { name: 'Marco Santos',  role: 'Head of Product',       bg: 'from-glow-500 to-orange-600' },
  { name: 'Yuki Tanaka',   role: 'Head of ML',            bg: 'from-green-500 to-teal-600' },
  { name: 'Priya Nair',    role: 'Head of Sales',         bg: 'from-red-500 to-rose-600' },
  { name: 'Ben Walker',    role: 'Head of Partnerships',  bg: 'from-amber-500 to-yellow-600' },
]

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="page-container max-w-4xl">
        <p className="eyebrow mb-4">About CarGlow</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-offwhite mb-6 leading-tight">
          We started because<br />
          <span className="text-gradient">listings deserved better.</span>
        </h1>
        <p className="text-lg text-offwhite/60 leading-relaxed mb-6 max-w-2xl">
          CarGlow was founded in 2023 by a team with deep roots in automotive and computer vision. We watched dealers lose sales every day because their photos didn't reflect the quality of the cars they were selling.
        </p>
        <p className="text-lg text-offwhite/60 leading-relaxed mb-12 max-w-2xl">
          We built CarGlow to fix that. Today, over 1,200 dealerships across Europe and North America use CarGlow to make every listing look like it was shot in a studio — because it was. An AI studio.
        </p>

        <div className="card-noise rounded-3xl p-8 mb-16">
          <h2 className="text-2xl font-display font-bold text-offwhite mb-6">The team</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TEAM.map((member) => (
              <div key={member.name} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.bg} shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-offwhite">{member.name}</p>
                  <p className="text-xs text-offwhite/40">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/careers" className="px-5 py-2.5 rounded-xl bg-glow-500 text-midnight font-semibold text-sm">Join the team →</Link>
          <Link href="/contact" className="px-5 py-2.5 rounded-xl border border-white/[0.12] text-offwhite/70 text-sm">Contact us</Link>
        </div>
      </div>
    </div>
  )
}
