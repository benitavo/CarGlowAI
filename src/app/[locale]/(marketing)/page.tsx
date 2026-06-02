'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import {
  ArrowRight, Play, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Upload, Globe, Layers, Shield,
  Building2, Users, Store, Factory, Star, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── BEFORE / AFTER SLIDER ───────────────────────────────────────────────────
function BeforeAfterSlider() {
  const [pos, setPos]       = useState(50)   // 0–100 %
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((clientX - left) / width) * 100))
    setPos(pct)
  }, [])

  // Mouse
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true); updatePos(e.clientX) }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => updatePos(e.clientX)
    const onUp   = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, updatePos])

  // Touch
  const onTouchStart = (e: React.TouchEvent) => { setDragging(true); updatePos(e.touches[0].clientX) }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: TouchEvent) => updatePos(e.touches[0].clientX)
    const onEnd  = () => setDragging(false)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [dragging, updatePos])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-[4/3] rounded-3xl overflow-hidden select-none',
        'shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] border border-white/[0.08]',
        dragging ? 'cursor-ew-resize' : 'cursor-col-resize',
      )}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* AFTER (clean showroom) — full width base */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ba-after.png"
        alt="After — professional showroom"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* BEFORE (trash lot) — clipped to left side */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${pos}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ba-before.png"
          alt="Before — dirty parking lot"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${10000 / pos}%`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)] pointer-events-none"
        style={{ left: `${pos}%` }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-[0_2px_16px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none z-10"
        style={{ left: `${pos}%` }}
      >
        <ChevronLeft className="w-3.5 h-3.5 text-midnight absolute -left-0.5" strokeWidth={2.5} />
        <ChevronRight className="w-3.5 h-3.5 text-midnight absolute -right-0.5" strokeWidth={2.5} />
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-midnight/75 backdrop-blur-sm text-xs font-semibold text-rose-300 border border-rose-500/30 pointer-events-none">
        Before
      </div>
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-midnight/75 backdrop-blur-sm text-xs font-semibold text-emerald-300 border border-emerald-500/30 pointer-events-none">
        After
      </div>
    </div>
  )
}

// ─── HERO SECTION ────────────────────────────────────────────────────────────
function HeroSection() {
  const t = useTranslations('home.hero')
  const tSocial = useTranslations('home.social')

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden grain">
      {/* Background effects */}
      <div className="absolute inset-0 bg-midnight pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-glow-500/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="page-container relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
        {/* Left — copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glow-500/30 bg-glow-500/[0.06] mb-6">
            <Zap className="w-3 h-3 text-glow-500" fill="currentColor" />
            <span className="eyebrow text-glow-400">{t('eyebrow')}</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-display font-bold leading-[1.05] tracking-tight text-offwhite mb-6">
            {t('headline1')}<br />
            <span className="text-gradient">{t('headline2')}</span>
          </h1>

          <p className="text-lg text-offwhite/60 leading-relaxed max-w-[480px] mb-8">
            {t('subhead')}
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold shadow-glow-md hover:shadow-glow-lg transition-all">
              {t('ctaPrimary')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 text-sm text-offwhite/40">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-glow-400 to-glow-700 border-2 border-midnight" />
                ))}
              </div>
              <span>1,200+ {tSocial('stats.dealers')}</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-glow-500 fill-glow-500" />
              ))}
              <span className="ml-1">4.9/5</span>
            </div>
            <span>10M+ {tSocial('stats.photos')}</span>
          </div>
        </div>

        {/* Right — Before/After slider */}
        <div className="relative">
          <BeforeAfterSlider />

          {/* Hint */}
          <p className="text-center text-xs text-offwhite/30 mt-3 flex items-center justify-center gap-1.5">
            <ChevronLeft className="w-3 h-3" />
            Drag to compare
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── TRUSTED BY MARQUEE ───────────────────────────────────────────────────────
const MARKETPLACES = [
  'Mobile.de', 'AutoTrader', 'AutoScout24', 'CarGurus',
  'OLX', 'Standvirtual', 'AutoHero', 'LeBonCoin',
  'Autovit', 'Hasznaltauto', 'Otomoto', 'Car.gr',
]

function TrustedBySection() {
  return (
    <section className="section-pad-sm border-y border-white/[0.06] bg-midnight-700/30">
      <div className="page-container text-center mb-8">
        <p className="text-sm text-offwhite/30 uppercase tracking-widest font-semibold">
          Trusted by listings on 150+ marketplaces worldwide
        </p>
      </div>
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-midnight to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-midnight to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARKETPLACES, ...MARKETPLACES].map((name, i) => (
            <div key={i} className="flex items-center mx-8 shrink-0">
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-md bg-white/[0.08]" />
                <span className="text-sm font-semibold text-offwhite/40 tracking-tight">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── INTERACTIVE FEATURE DEMO ─────────────────────────────────────────────────
const DEMO_FEATURES = [
  { id: 'bg',    label: 'Background swap',         desc: 'Swap the messy parking-lot background for a clean studio backdrop.' },
  { id: 'plate', label: 'Plate masking & logo',    desc: 'Mask the plate with your dealer frame and add your logo as a watermark.' },
]

const DEMO_FILTERS: Record<string, string> = {
  bg:    'brightness(1.1) contrast(1.2) saturate(1.1)',
  plate: 'brightness(1.05) contrast(1.18) saturate(1.05)',
}

function DemoSection() {
  const [active, setActive] = useState('bg')

  return (
    <section id="demo" className="section-pad">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow mb-3">Interactive demo</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite mb-4">
            One car. Two <span className="text-gradient">enhancements.</span>
          </h2>
          <p className="text-offwhite/50">
            Click each feature to preview the transformation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo image */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80')`,
                filter: DEMO_FILTERS[active],
              }}
            />
            {/* Active badge */}
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-glow-500/20 border border-glow-500/40 text-glow-400 text-xs font-semibold backdrop-blur-sm">
              ✦ {DEMO_FEATURES.find(f => f.id === active)?.label}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-display font-semibold text-offwhite mb-2">
              Toggle each step
            </h3>
            {DEMO_FEATURES.map((feat) => (
              <button
                key={feat.id}
                onClick={() => setActive(feat.id)}
                className={cn(
                  'flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300',
                  active === feat.id
                    ? 'border-glow-500/50 bg-glow-500/[0.08] shadow-glow-sm'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all',
                  active === feat.id ? 'border-glow-500 bg-glow-500' : 'border-white/20'
                )}>
                  {active === feat.id && <Check className="w-2.5 h-2.5 text-midnight" strokeWidth={3} />}
                </div>
                <div>
                  <p className={cn('font-semibold text-sm mb-0.5 transition-colors',
                    active === feat.id ? 'text-glow-400' : 'text-offwhite/80')}>
                    {feat.label}
                    {active === feat.id && (
                      <span className="ml-2 text-[10px] font-mono bg-glow-500/20 text-glow-500 px-1.5 py-0.5 rounded-md">
                        ACTIVE
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-offwhite/40">{feat.desc}</p>
                </div>
              </button>
            ))}

            <Link href="/features"
              className="inline-flex items-center gap-2 text-sm text-glow-400 hover:text-glow-300 font-medium mt-2 transition-colors">
              See how it works <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const STEPS = [
  { icon: Upload,   num: '01', title: 'Upload',   desc: 'Drop any phone photo — parking lot, street, garage. JPG, PNG, or HEIC.' },
  { icon: Layers,   num: '02', title: 'Pick a background', desc: 'Choose from 15 backgrounds — studio, outdoor, or lifestyle. The car stays exactly as it is.' },
  { icon: Shield,   num: '03', title: 'Mask & brand', desc: 'The license plate is masked with your dealer frame and your logo is added as a watermark — automatically.' },
  { icon: Globe,    num: '04', title: 'Download',  desc: 'Get the finished photo back in seconds, ready to publish to any listing site.' },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-pad bg-midnight-700/20 border-y border-white/[0.04]">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-16">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite mb-4">
            From driveway to dealership,<br /><span className="text-gradient">in 4 steps.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative card-noise rounded-3xl p-7">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-6 border-t border-dashed border-glow-500/20 z-10" />
              )}
              <div className="text-3xl font-display font-bold text-glow-500/20 mb-4">{step.num}</div>
              <div className="w-11 h-11 rounded-2xl bg-glow-500/10 border border-glow-500/20 flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5 text-glow-400" />
              </div>
              <h3 className="text-lg font-display font-semibold text-offwhite mb-2">{step.title}</h3>
              <p className="text-sm text-offwhite/50 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURE GRID ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Layers, title: 'Background swap',  desc: 'Replace the background of any vehicle photo with a clean showroom, outdoor scene, or custom backdrop. 15 curated options.', href: '/features#backgrounds' },
  { icon: Shield, title: 'Plate masking & logo', desc: 'License plates auto-detected and replaced with your dealer plate frame. Your dealership logo overlaid as a watermark — same step.', href: '/features#plate' },
]

function FeatureGridSection() {
  return (
    <section className="section-pad">
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="eyebrow mb-3">Features</p>
            <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite">
              Two things, <span className="text-gradient">done right.</span>
            </h2>
          </div>
          <Link href="/features" className="inline-flex items-center gap-2 text-sm font-medium text-offwhite/60 hover:text-glow-400 transition-colors shrink-0">
            See how it works <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((feat) => (
            <Link key={feat.title} href={feat.href}
              className="group card-noise rounded-3xl p-8 flex flex-col gap-4">
              <div className="w-11 h-11 rounded-2xl bg-glow-500/10 border border-glow-500/20 flex items-center justify-center group-hover:bg-glow-500/15 group-hover:border-glow-500/35 transition-all">
                <feat.icon className="w-5 h-5 text-glow-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-offwhite mb-1.5 group-hover:text-glow-300 transition-colors">{feat.title}</h3>
                <p className="text-[15px] text-offwhite/55 leading-relaxed">{feat.desc}</p>
              </div>
              <span className="text-xs font-medium text-offwhite/30 group-hover:text-glow-500 flex items-center gap-1 mt-auto transition-colors">
                Learn more <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SOLUTIONS TEASER ─────────────────────────────────────────────────────────
const SOLUTIONS = [
  { icon: Building2, title: 'Dealerships',   href: '/solutions/dealerships',   color: 'from-blue-500/20 to-blue-600/5',   desc: 'List more cars, sell them faster. Professional photos for every vehicle on your lot — automatically.' },
  { icon: Users,     title: 'Dealer Groups', href: '/solutions/dealer-groups',  color: 'from-purple-500/20 to-purple-600/5', desc: 'Consistent brand photos across all locations. Central management, local control.' },
  { icon: Store,     title: 'Marketplaces',  href: '/solutions/marketplaces',   color: 'from-glow-500/20 to-glow-600/5',   desc: 'Uplift listing quality across your entire inventory. API-first, scales to millions of photos.' },
  { icon: Factory,   title: 'OEMs',          href: '/solutions/oems',           color: 'from-green-500/20 to-green-600/5',  desc: 'Standardize dealer photography globally. One platform, 150+ country guidelines, zero training.' },
]

function SolutionsTeaserSection() {
  return (
    <section className="section-pad bg-midnight-700/20 border-y border-white/[0.04]">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="eyebrow mb-3">Solutions</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite mb-4">
            Built for every part of<br />
            <span className="text-gradient">the automotive ecosystem.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {SOLUTIONS.map((sol) => (
            <Link key={sol.title} href={sol.href}
              className={cn('group relative card-noise rounded-3xl p-8 overflow-hidden transition-all duration-300')}>
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500', sol.color)} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:border-white/[0.15] transition-all">
                  <sol.icon className="w-5 h-5 text-offwhite/60 group-hover:text-offwhite transition-colors" />
                </div>
                <h3 className="text-xl font-display font-semibold text-offwhite mb-2">{sol.title}</h3>
                <p className="text-sm text-offwhite/50 leading-relaxed mb-4">{sol.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-offwhite/40 group-hover:text-glow-400 transition-colors">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── STATS BAND ───────────────────────────────────────────────────────────────
const STATS = [
  { value: '+40%', label: 'listing views', desc: 'Average increase across our dealer network' },
  { value: '-76%', label: 'editing time',  desc: 'Compared to manual photo editing workflows' },
  { value: '150+', label: 'marketplaces', desc: 'Direct integrations for one-click publishing' },
  { value: '10M+', label: 'photos enhanced', desc: 'And counting — since launch in 2023' },
]

function StatsSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="section-pad-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-glow-500/[0.04] to-transparent pointer-events-none" />
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'text-center transition-all duration-700',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-gradient leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-base font-semibold text-offwhite/80 mb-1">{stat.label}</div>
              <div className="text-xs text-offwhite/35 max-w-[160px] mx-auto leading-relaxed">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS CAROUSEL ────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: 'We process 40 cars a month through CarGlow. Our listings get 2–3× more clicks than before. Best €99 we spend.', name: 'Marcus Weber', title: 'General Manager', company: 'Autohaus Bremer' },
  { quote: 'Sold my Golf in 4 days after using CarGlow photos. Listed for 3 weeks before with the old photos — zero serious offers.', name: 'Michael T.', title: 'Private seller', company: 'Hannover, DE' },
  { quote: 'The API integration took 2 hours. Now every photo in our marketplace is automatically enhanced before going live.', name: 'Sofia Martins', title: 'CTO', company: 'Standvirtual' },
  { quote: 'CarGlow replaced a €150/session photographer. The quality difference is minimal — the cost difference is not.', name: 'James Harrington', title: 'Operations Director', company: 'City Motors Group' },
  { quote: 'Our OEM dealer network went from 40% photo compliance to 94% in one quarter. Nothing else moved that number.', name: 'Chloé Dubois', title: 'Digital Marketing Lead', company: 'AutoFrance' },
  { quote: 'I flip 6–8 cars a quarter. The Pro pack covers all of them. Clients ask if I hired a photographer. I tell them yes — an AI one.', name: 'Farid K.', title: 'Car reseller', company: 'Paris, FR' },
]

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(timer)
  }, [])

  const prev = () => setCurrent(c => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const next = () => setCurrent(c => (c + 1) % TESTIMONIALS.length)

  return (
    <section className="section-pad bg-midnight-700/20 border-y border-white/[0.04]">
      <div className="page-container">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">Testimonials</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite">
            Dealers <span className="text-gradient">love</span> CarGlow.
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main card */}
          <div className="card-noise rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-glow-500 to-transparent" />
            <div className="text-6xl text-glow-500/30 font-serif mb-6 leading-none">"</div>
            <p className="text-lg md:text-xl text-offwhite/80 leading-relaxed mb-8 max-w-2xl mx-auto transition-all duration-500">
              {TESTIMONIALS[current].quote}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-glow-400 to-glow-700" />
              <div className="text-left">
                <p className="text-sm font-semibold text-offwhite">{TESTIMONIALS[current].name}</p>
                <p className="text-xs text-offwhite/40">{TESTIMONIALS[current].title} · {TESTIMONIALS[current].company}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="w-9 h-9 rounded-full border border-white/[0.1] flex items-center justify-center text-offwhite/50 hover:text-offwhite hover:border-white/[0.25] transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={cn('h-1.5 rounded-full transition-all', i === current ? 'bg-glow-500 w-6' : 'bg-white/20 w-1.5')} />
              ))}
            </div>
            <button onClick={next} className="w-9 h-9 rounded-full border border-white/[0.1] flex items-center justify-center text-offwhite/50 hover:text-offwhite hover:border-white/[0.25] transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── DEMO VIDEO ───────────────────────────────────────────────────────────────
function VideoSection() {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="section-pad">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">See it in action</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite">
            30 seconds. That's all it takes.
          </h2>
        </div>

        <div
          className="relative aspect-video rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.6)] cursor-pointer group"
          onClick={() => setPlaying(true)}
        >
          {/* Thumbnail */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80')`, filter: 'brightness(0.5)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent" />

          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-[0_0_40px_rgba(255,138,61,0.3)]">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-sm text-offwhite/60">Watch the 2-minute demo</p>
              </div>
            </div>
          )}

          {playing && (
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              allow="autoplay; fullscreen"
            />
          )}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING TEASER ───────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter', price: '€29', per: '/mo',
    photos: '100 photos / month',
    features: ['Showroom backgrounds', 'Plates auto-blurred'],
    cta: 'Start free trial',
    href: '/signup?plan=starter',
    highlight: false,
  },
  {
    name: 'Growth',  price: '€79', per: '/mo',
    photos: '400 photos / month',
    badge: 'Most popular',
    features: ['Everything in Starter', 'Priority processing'],
    cta: 'Start free trial',
    href: '/signup?plan=growth',
    highlight: true,
  },
  {
    name: 'Pro',     price: '€199', per: '/mo',
    photos: 'Unlimited photos',
    features: ['Everything in Growth', 'Dedicated support'],
    cta: 'Start free trial',
    href: '/signup?plan=pro',
    highlight: false,
  },
]

function PricingTeaserSection() {
  return (
    <section className="section-pad bg-midnight-700/20 border-y border-white/[0.04]">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite mb-4">
            Pay for what you enhance.<br /><span className="text-gradient">Nothing more.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div key={plan.name} className={cn(
              'relative rounded-3xl p-8 flex flex-col',
              plan.highlight
                ? 'bg-gradient-to-b from-glow-500/[0.12] to-transparent border border-glow-500/40 shadow-glow-sm'
                : 'card-noise border border-white/[0.06]'
            )}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-glow-500 text-midnight text-xs font-bold">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display font-semibold text-offwhite mb-1">{plan.name}</h3>
              <p className="text-xs text-offwhite/40 mb-4">{plan.photos}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display font-bold text-offwhite">{plan.price}</span>
                <span className="text-sm text-offwhite/40">{plan.per}</span>
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-offwhite/60">
                    <Check className="w-4 h-4 text-glow-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className={cn(
                  'text-center py-3 rounded-2xl text-sm font-semibold transition-all',
                  plan.highlight
                    ? 'bg-glow-500 hover:bg-glow-400 text-midnight shadow-glow-sm hover:shadow-glow-md'
                    : 'border border-white/[0.12] hover:border-white/[0.25] text-offwhite/80 hover:text-offwhite'
                )}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Does CarGlow change my car?', a: 'Never. We preserve your car\'s exact paint, body shape, wheels, and badges. Only the background changes, and the license plate is masked with your dealer frame. The car itself is untouched.' },
  { q: 'What exactly does CarGlow do?', a: 'Two things. First, it swaps the background of your photo for a clean studio or outdoor scene. Second, it masks the license plate with your dealer plate frame and adds your dealership logo as a watermark. That\'s the whole product — no upscaling, no color changes, no object removal.' },
  { q: 'How long does processing take?', a: 'A few seconds per photo. You upload, pick a background, and the masked-and-branded result comes back ready to download.' },
  { q: 'Can I use CarGlow photos on classified marketplaces?', a: 'Yes. Most marketplaces (AutoScout24, Mobile.de, AutoTrader, etc.) permit edited photos as long as the vehicle isn\'t misrepresented. Since we don\'t alter the car, your listings stay accurate.' },
  { q: 'Is the plate masking GDPR-compliant?', a: 'Yes. License plates are personal data under GDPR. CarGlow detects them automatically and replaces each with your dealer plate frame, so you never publish a readable plate by accident.' },
  { q: 'Is my data secure? Do you train on my photos?', a: 'Your photos are encrypted in transit and at rest, and deleted after 30 days unless saved to your account. We never train our models on customer photos. GDPR compliant, EU data residency.' },
]

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="section-pad">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-display font-bold text-offwhite">
            Questions we get <span className="text-gradient">a lot.</span>
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.06]">
          {FAQS.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <span className={cn('font-display font-medium text-base transition-colors', open === i ? 'text-glow-400' : 'text-offwhite/80 hover:text-offwhite')}>
                  {faq.q}
                </span>
                {open === i
                  ? <ChevronUp className="w-5 h-5 text-glow-400 mt-0.5 shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-offwhite/40 mt-0.5 shrink-0" />
                }
              </button>
              {open === i && (
                <p className="mt-3 text-sm text-offwhite/50 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  const t = useTranslations('home.sections')
  const tCommon = useTranslations('common')
  const tHero = useTranslations('home.hero')
  return (
    <section className="section-pad relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-glow-500/[0.05] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-glow-500/[0.08] rounded-full blur-[100px] pointer-events-none" />

      <div className="page-container relative text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glow-500/30 bg-glow-500/[0.06] mb-6">
          <Zap className="w-3 h-3 text-glow-500" fill="currentColor" />
          <span className="eyebrow text-glow-400">{tHero('noCard')}</span>
        </div>

        <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-bold text-offwhite mb-6 leading-tight">
          {t('finalCtaHeadline')}
        </h2>

        <p className="text-lg text-offwhite/50 mb-10 max-w-xl mx-auto">
          {t('finalCtaSubhead')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-base shadow-glow-lg hover:shadow-glow-xl transition-all">
            {tCommon('startFree')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustedBySection />
      <DemoSection />
      <HowItWorksSection />
      <FeatureGridSection />
      <SolutionsTeaserSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingTeaserSection />
      <FAQSection />
      <FinalCTASection />
    </>
  )
}
