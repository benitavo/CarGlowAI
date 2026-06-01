import { Check, Layers, Shield } from 'lucide-react'

const FEATURE_SECTIONS = [
  {
    id: 'backgrounds',
    icon: Layers,
    title: 'Background swap',
    desc:
      'Replace the background of any vehicle photo with a clean showroom, an outdoor setting, or a custom scene. Pick from a curated library of 15 backgrounds — applied in seconds, with the car kept exactly as it is.',
    details: [
      'Studio backgrounds (white, black, bronze, soft grey)',
      'Outdoor scenes (coastal, mountain, forest, desert)',
      'Lifestyle and premium settings',
      'One-click apply — same style across all your listings',
      'Original photo always preserved for re-edits',
    ],
  },
  {
    id: 'plate',
    icon: Shield,
    title: 'Plate masking & logo watermark',
    desc:
      'License plates are personal data under GDPR. CarGlow detects them automatically and replaces each with your dealer plate frame, then overlays your dealership logo as a watermark. Both happen in the same step.',
    details: [
      'Automatic plate detection on every photo',
      'Replace with your branded dealer plate frame, or blur',
      'Logo watermark from your Brand Kit (position + opacity controls)',
      'GDPR-compliant by default',
      'Works on multi-country plates (EU, UK)',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="page-container text-center max-w-2xl mx-auto mb-20">
        <p className="eyebrow mb-3">Features</p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-offwhite mb-5">
          Two things, done right.<br />
          <span className="text-gradient">Background and brand.</span>
        </h1>
        <p className="text-lg text-offwhite/50">
          CarGlow does two jobs: it swaps the background of your vehicle photo, and it masks the
          license plate while overlaying your dealership logo. That&apos;s it. Nothing else gets in the way.
        </p>
      </div>

      <div className="page-container">
        <div className="flex flex-col gap-24">
          {FEATURE_SECTIONS.map((feat, i) => (
            <div
              key={feat.id}
              id={feat.id}
              className={`grid lg:grid-cols-2 gap-16 items-center ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-glow-500/10 border border-glow-500/20 flex items-center justify-center mb-6">
                  <feat.icon className="w-5 h-5 text-glow-400" />
                </div>
                <h2 className="text-3xl font-display font-bold text-offwhite mb-4">{feat.title}</h2>
                <p className="text-offwhite/60 leading-relaxed mb-6">{feat.desc}</p>
                <ul className="flex flex-col gap-2.5">
                  {feat.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm text-offwhite/60">
                      <Check className="w-4 h-4 text-glow-500 mt-0.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Visual placeholder */}
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-glow-500/[0.08] to-midnight-600/50 border border-white/[0.06] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-offwhite/20">
                  <feat.icon className="w-12 h-12" />
                  <span className="text-sm font-medium">{feat.title} demo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
