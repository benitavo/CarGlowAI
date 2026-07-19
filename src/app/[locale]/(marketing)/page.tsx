import Image from 'next/image'
import {
  ArrowRight, Check, Leaf,
  Phone, Wallet, Clock, ScanSearch, Layers, Wand2, PackageCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { GridAvatar } from './_components/GridAvatar'
import { TrackedLink } from './_components/TrackedLink'
import { LandingViewedTracker } from './_components/LandingViewedTracker'
import { GallerySection } from './_components/GallerySection'
import { TabletVideoPlayer } from './_components/TabletVideoPlayer'
import { LazyCalendlyEmbed } from './_components/LazyCalendlyEmbed'
import { TestimonialsSection } from './_components/TestimonialsSection'
import { PricingSection } from './_components/PricingSection'
import { FAQSection } from './_components/FAQSection'
import { StickyMobileCTA } from './_components/StickyMobileCTA'

// PricingSection now reads PricingConfig directly via Prisma instead of a client-side
// fetch to /api/pricing. Since this page is statically prerendered, without a revalidate
// window the prices would freeze at build time until the next deploy — admin-configured
// pricing must still show up without a code change, just within this window instead of instantly.
export const revalidate = 60

// ─── HERO ─────────────────────────────────────────────────────────────────────
// Below a certain count a specific number reads as thin rather than reassuring — the
// fallback copy makes no claim at all rather than showing something unconvincing.
const MIN_RENDER_COUNT_TO_SHOW = 20

function HeroSection({ renderCount }: { renderCount: number }) {
  return (
    <section className="relative flex flex-col items-center justify-center pt-16 pb-16 overflow-hidden bg-cream-50">
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-sage-200/40 rounded-full blur-[140px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-petal-100/50 rounded-full blur-[120px] pointer-events-none translate-y-1/4 -translate-x-1/4" />

      <div className="relative z-10 w-full max-w-[860px] mx-auto px-5 lg:px-8 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-50 border border-sage-200 text-sage-600 text-sm font-medium">
            <Leaf className="w-3.5 h-3.5 text-sage-500" fill="currentColor" />
            Premier rendu offert · Sans engagement
          </div>
        </div>

        <h1 className="font-display font-bold tracking-tight leading-[1.05] text-midnight mb-6"
          style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)' }}>
          Montrez le jardin fini<br />
          <span className="text-gradient">avant de commencer</span><br />
          les travaux.
        </h1>

        <p className="text-lg text-midnight/55 leading-relaxed max-w-[560px] mx-auto mb-10">
          Photographiez le terrain de votre client. Notre IA génère un rendu photoréaliste
          de l&apos;aménagement en 60 secondes. Présentez, convainquez, signez.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <TrackedLink href="/signup" ctaId="hero_primary" label="Recevoir mon rendu offert" location="hero"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
            Recevoir mon rendu offert
            <ArrowRight className="w-5 h-5" />
          </TrackedLink>
          <TrackedLink href="#galerie" ctaId="hero_secondary" label="Voir les exemples" location="hero"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-midnight/[0.12] text-midnight/65 hover:text-midnight hover:bg-midnight/[0.04] text-base font-medium transition-all">
            Voir les exemples
          </TrackedLink>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-midnight/40">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sage-500" /> Sans carte bancaire</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sage-500" /> 60 secondes</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sage-500" /> Styles illimités</span>
        </div>

        {renderCount >= MIN_RENDER_COUNT_TO_SHOW && (
          <p className="mt-6 text-xs text-midnight/35">
            <span className="font-semibold text-midnight/60 tabular-nums">{renderCount.toLocaleString('fr-FR')}</span> rendus déjà générés par des paysagistes
          </p>
        )}
      </div>
    </section>
  )
}

// ─── STATS ────────────────────────────────────────────────────────────────────
const STATS = [
  { icon: Phone,  value: '3x',  title: 'plus de devis signés',
    desc: "Les clients qui voient leur futur jardin avant travaux valident un devis 3 fois plus vite qu'avec un plan seul." },
  { icon: Wallet, value: '90%', title: 'moins cher',
    desc: "À partir de 1,50€ par rendu, contre 500 à 2 000€ pour une maquette 3D ou un architecte paysagiste." },
  { icon: Clock,  value: '60s', title: 'par rendu',
    desc: "Uploadez une photo, choisissez un style, recevez un rendu photoréaliste en 60 secondes." },
]

function StatsSection() {
  return (
    <section className="py-16 md:py-20 bg-cream-50">
      <div className="page-container max-w-4xl">
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-6 text-center">
          {STATS.map(stat => (
            <div key={stat.title}>
              <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
              </div>
              <p className="font-display font-extrabold text-gradient leading-none mb-2" style={{ fontSize: 'clamp(2.25rem,4vw,2.75rem)' }}>
                {stat.value}
              </p>
              <h3 className="font-display font-bold text-midnight text-lg mb-3">{stat.title}</h3>
              <p className="text-midnight/50 text-sm leading-relaxed max-w-[260px] mx-auto">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── VIDEO DEMO ───────────────────────────────────────────────────────────────
function VideoSection() {
  return (
    <section className="section-pad bg-white overflow-hidden">
      <div className="page-container">
        {/* Text */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="eyebrow mb-3">Verdia en action</p>
          <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            60 secondes.<br /><span className="text-gradient">Un jardin transformé.</span>
          </h2>
          <p className="text-midnight/50 text-[15px] leading-relaxed">
            Regardez comment Verdia transforme une simple photo de jardin en rendu photoréaliste.
          </p>
        </div>

        {/* Tablet centré */}
        <div className="flex justify-center px-4">
          <TabletVideoPlayer />
        </div>

        {/* Étapes en dessous */}
        <div className="flex flex-col sm:flex-row justify-center gap-8 mt-10 max-w-2xl mx-auto">
          {['Photographiez votre terrain', 'Choisissez votre style', 'Recevez votre rendu en 60s'].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-midnight/60">
              <div className="w-7 h-7 rounded-full bg-sage-100 border border-sage-200 flex items-center justify-center text-xs font-bold text-sage-600 shrink-0">
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CALENDLY ─────────────────────────────────────────────────────────────────
function CalendlySection() {
  return (
    <section id="rendez-vous" className="section-pad bg-white">
      <div className="page-container max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left: text */}
          <div className="lg:w-[380px] shrink-0">
            <p className="eyebrow mb-3">Démo personnalisée</p>
            <h2 className="font-display font-bold text-midnight mb-5" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
              Parlons de votre<br /><span className="text-gradient">activité.</span>
            </h2>
            <p className="text-midnight/50 text-[15px] leading-relaxed mb-8">
              Réservez 20 minutes avec moi pour découvrir comment Verdia peut transformer votre façon de présenter vos projets paysagers.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                'Démo sur un de vos projets réels',
                'Conseils personnalisés pour votre activité',
                'Sans engagement, sans carte bancaire',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-midnight/60">
                  <Check className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
            <div className="card-light rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <GridAvatar col={0} row={1}
                  className="w-10 h-10 rounded-full shrink-0 bg-sage-200" />
                <div>
                  <p className="text-sm font-semibold text-midnight">Antoine R.</p>
                  <p className="text-xs text-midnight/45">Fondateur de Verdia</p>
                </div>
              </div>
              <p className="text-xs text-midnight/50 leading-relaxed">
                &ldquo;Je réponds personnellement à chaque demande. Montrez-moi votre terrain et on voit ensemble ce que Verdia peut faire.&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Calendly iframe embed */}
          <div className="flex-1 w-full rounded-3xl overflow-hidden border border-midnight/[0.08] shadow-card">
            <LazyCalendlyEmbed />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SCROLLING GALLERY ────────────────────────────────────────────────────────
const SCROLL_GALLERY = [
  { src: '/scroll-garden-1.jpeg', label: 'Terrasse méditerranéenne' },
  { src: '/scroll-garden-2.jpeg', label: 'Prairie fleurie naturelle' },
  { src: '/scroll-garden-3.jpeg', label: 'Jardin zen & mousse' },
  { src: '/scroll-garden-4.jpeg', label: 'Jardin zen minéral' },
  { src: '/scroll-garden-5.jpeg', label: 'Potager surélevé' },
  { src: '/scroll-garden-6.jpeg', label: 'Jardin zen contemporain' },
]

function ScrollingGallerySection() {
  return (
    <section className="py-14 bg-white overflow-hidden">
      <div className="page-container mb-8">
        <p className="eyebrow text-center">Rendus générés par Verdia</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex w-max gap-5 animate-marquee" style={{ animationDuration: '38s' }}>
          {[...SCROLL_GALLERY, ...SCROLL_GALLERY].map((item, i) => (
            <div key={i} className="relative w-[280px] sm:w-[360px] aspect-video rounded-2xl overflow-hidden border border-midnight/[0.08] shadow-card shrink-0">
              <Image src={item.src} alt={item.label} fill className="object-cover" sizes="360px" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/70 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-4 text-white text-sm font-semibold">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { num: '1', title: 'Importez vos photos', img: '/howitworks-import-crop.png',
      desc: "Uploadez les photos du jardin ou du terrain. Jusqu'à 3 photos par projet, tous les formats acceptés." },
    { num: '2', title: "L'IA applique le rendu paysager", img: '/howitworks-generate-crop.png',
      desc: "Choisissez un style parmi nos options. L'IA transforme automatiquement chaque photo en rendu photoréaliste professionnel." },
    { num: '3', title: 'Retouchez à la demande', img: '/howitworks-retouch-crop.png',
      desc: "Affinez chaque rendu dans l'éditeur intégré. Changez de style, ajustez les détails — chaque retouche coûte 1 crédit." },
  ]

  return (
    <section id="comment-ca-marche" className="section-pad bg-cream-50">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow mb-3">Comment ça marche</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Simple comme<br /><span className="text-gradient">prendre une photo.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-sage-500 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-2 translate-x-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-sage-300" strokeWidth={2} />
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold text-midnight text-lg mb-2">{step.title}</h3>
              <p className="text-midnight/50 text-[14px] leading-relaxed mb-6">{step.desc}</p>
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-sage-100 shadow-card bg-white mt-auto">
                <Image
                  src={step.img}
                  alt={step.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── WHY IT CONVINCES ─────────────────────────────────────────────────────────
const ARGUMENTS = [
  { title: '« On a du mal à s’imaginer »', desc: "C'est la première cause de devis sans réponse. Le rendu supprime cette objection avant qu'elle n'existe." },
  { title: 'Deux devis identiques sur la table', desc: 'Celui accompagné du futur jardin en photo gagne. Vos concurrents envoient un PDF de chiffres.' },
  { title: 'Zéro logiciel à apprendre', desc: "Pas de 3D, pas de formation, pas d'abonnement complexe. Vous envoyez une photo, vous recevez une image." },
]

function ArgumentsSection() {
  return (
    <section className="section-pad bg-white">
      <div className="page-container max-w-3xl">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="eyebrow mb-3">Pourquoi ça change la vente</p>
          <h2 className="font-display font-bold text-midnight" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Le rendu qui <span className="text-gradient">fait signer.</span>
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {ARGUMENTS.map(arg => (
            <div key={arg.title} className="pl-5 pr-6 py-4 rounded-r-xl border-l-[3px] border-sage-500 bg-sage-50">
              <p className="text-sm">
                <strong className="text-midnight font-semibold">{arg.title}.</strong>{' '}
                <span className="text-midnight/60">{arg.desc}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── MID-PAGE CTA ─────────────────────────────────────────────────────────────
// Gallery and the final CTA bracket a long stretch (Stats, HowItWorks, Video,
// ScrollingGallery, Styles, Automation, Arguments) with no CTA reminder on desktop —
// mobile has StickyMobileCTA covering that gap, desktop doesn't. One calm banner here,
// not a repeat of every section's ask.
function MidPageCTASection() {
  return (
    <section className="py-14 bg-cream-50">
      <div className="page-container">
        <div className="max-w-4xl mx-auto rounded-3xl border border-sage-200 bg-white shadow-card px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="font-display font-bold text-midnight text-lg mb-1">
              Prêt à essayer sur votre prochain projet ?
            </h3>
            <p className="text-sm text-midnight/50">Premier rendu offert, sans carte bancaire.</p>
          </div>
          <TrackedLink href="/signup" ctaId="midpage" label="Recevoir mon rendu offert" location="midpage"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm shadow-sage-sm hover:shadow-sage-md transition-all shrink-0 whitespace-nowrap">
            Recevoir mon rendu offert
            <ArrowRight className="w-4 h-4" />
          </TrackedLink>
        </div>
      </div>
    </section>
  )
}

// ─── STYLES GRID ──────────────────────────────────────────────────────────────
const GARDEN_STYLES = [
  { image: '/styles/gazon-fleurs.jpg',    name: 'Gazon & Fleurs',    desc: 'Pelouse verte, massifs fleuris et bordures colorées', color: 'bg-petal-50 border-petal-200/60' },
  { image: '/styles/mediterraneen.jpg',   name: 'Méditerranéen',      desc: 'Olivier, lavande, gravier blanc et pierre naturelle', color: 'bg-cream-100 border-cream-300/60' },
  { image: '/styles/contemporain.jpg',    name: 'Contemporain',       desc: 'Lignes épurées, ardoise, végétation structurée',      color: 'bg-midnight/[0.03] border-midnight/[0.08]' },
  { image: '/styles/naturel-sauvage.jpg', name: 'Naturel & Sauvage', desc: 'Prairie fleurie, graminées, plantes indigènes',        color: 'bg-sage-50 border-sage-200/60' },
  { image: '/styles/zen.jpg',             name: 'Zen & Japonais',    desc: 'Bambou, mousse, graviers ratissés, pierres',           color: 'bg-cream-100 border-cream-300/60' },
  { image: '/styles/potager.jpg',         name: 'Potager',           desc: 'Carrés potagers, aromates, arbres fruitiers',          color: 'bg-sage-50 border-sage-200/60' },
]

function StylesSection() {
  return (
    <section className="section-pad bg-cream-50">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="eyebrow mb-3">Styles paysagers</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Chaque projet mérite<br /><span className="text-gradient">son ambiance.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GARDEN_STYLES.map(s => (
            <div key={s.name} className={cn('group p-6 rounded-2xl border transition-all cursor-default hover:shadow-card', s.color)}>
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4">
                <Image src={s.image} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 768px) 300px, 45vw" />
              </div>
              <h3 className="font-display font-semibold text-midnight text-[15px] mb-1.5 group-hover:text-sage-600 transition-colors">{s.name}</h3>
              <p className="text-xs text-midnight/45 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AUTOMATION ───────────────────────────────────────────────────────────────
const AUTOMATION_STEPS = [
  { icon: ScanSearch, title: 'Analyse intelligente', time: '~10 secondes',
    desc: "L'IA détecte le terrain, l'exposition et les éléments existants (murs, arbres, mobilier) et suggère le style le plus adapté au jardin." },
  { icon: Layers, title: 'Génération multi-styles', time: '~60 s pour 3 styles',
    desc: "Générez plusieurs styles en parallèle sur la même photo — méditerranéen, contemporain, zen — pour laisser le client choisir." },
  { icon: Wand2, title: 'Retouche instantanée', time: '~15 secondes',
    desc: "Affinez chaque rendu directement dans l'éditeur : changez de style, précisez un détail, régénérez sans repartir de zéro." },
  { icon: PackageCheck, title: 'Kit client prêt à l’emploi', time: '~5 secondes',
    desc: "Téléchargez le rendu HD et le comparatif avant/après, prêts à présenter à vos clients ou à joindre à votre devis." },
]

function AutomationSection() {
  return (
    <section className="section-pad bg-white">
      <div className="page-container max-w-3xl">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="eyebrow mb-3">Automatisation</p>
          <h2 className="font-display font-bold text-midnight mb-4" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.75rem)' }}>
            Gagnez des heures avec<br /><span className="text-gradient">votre IA paysagère.</span>
          </h2>
          <p className="text-midnight/50 text-[15px] leading-relaxed">
            Verdia traite vos photos automatiquement, suggère le style adapté et prépare vos visuels — vous n&apos;avez plus qu&apos;à présenter.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-6 top-6 bottom-6 w-px hidden sm:block"
            style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(82,183,136,0.45) 0 4px, transparent 4px 9px)' }}
          />
          <div className="flex flex-col gap-4">
            {AUTOMATION_STEPS.map(step => (
              <div key={step.title} className="relative flex gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl bg-sage-50 border border-sage-200/60 flex items-center justify-center shrink-0 z-10">
                  <step.icon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
                </div>
                <div className="card-light rounded-2xl p-5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h3 className="font-display font-semibold text-midnight text-[15px]">{step.title}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-600 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-400" /> {step.time}
                    </span>
                  </div>
                  <p className="text-midnight/50 text-[13.5px] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            { icon: Clock,  text: '60 secondes par rendu' },
            { icon: Layers, text: 'Styles illimités' },
            { icon: Wand2,  text: 'Retouche dès 1 crédit' },
          ].map(pill => (
            <div key={pill.text} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sage-50 border border-sage-200/60 text-sage-700 text-sm font-medium">
              <pill.icon className="w-4 h-4 text-sage-500" strokeWidth={1.75} />
              {pill.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  return (
    <section className="section-pad bg-midnight relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-sage-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="page-container relative text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-500/15 border border-sage-400/25 text-sage-300 text-sm font-medium mb-8">
          <Leaf className="w-3.5 h-3.5" fill="currentColor" />
          Premier rendu offert · Sans carte bancaire
        </div>

        <h2 className="font-display font-bold text-offwhite mb-6 leading-tight" style={{ fontSize: 'clamp(2rem,4.5vw,3.2rem)' }}>
          Convainquez votre prochain client<br /><span className="text-gradient-green">dès aujourd&apos;hui.</span>
        </h2>

        <p className="text-lg text-offwhite/45 mb-10 leading-relaxed">
          Rejoignez les paysagistes qui présentent leurs projets avec des rendus
          photoréalistes avant de commencer les travaux.
        </p>

        <TrackedLink href="/signup" ctaId="final_cta" label="Recevoir mon rendu offert" location="final_cta"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-base shadow-sage-sm hover:shadow-sage-md transition-all">
          Recevoir mon rendu offert
          <ArrowRight className="w-5 h-5" />
        </TrackedLink>
        <p className="mt-4 text-xs text-offwhite/25">
          Aucune carte bancaire · Résultat en 60 secondes · Styles à l&apos;infini
        </p>
      </div>
    </section>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  // Real counts, not invented ones — each section decides for itself whether the number
  // is high enough to be reassuring rather than thin (see MIN_RENDER_COUNT_TO_SHOW and
  // GallerySection's own threshold).
  const [renderCount, landscaperCount] = await Promise.all([
    db.photo.count({ where: { status: { in: ['ENHANCED', 'EXPIRED'] } } }),
    db.workspace.count(),
  ])

  return (
    <>
      <LandingViewedTracker />
      <HeroSection renderCount={renderCount} />
      <GallerySection landscaperCount={landscaperCount} />
      <StatsSection />
      <HowItWorksSection />
      <VideoSection />
      <ScrollingGallerySection />
      <StylesSection />
      <AutomationSection />
      <ArgumentsSection />
      <MidPageCTASection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CalendlySection />
      <FinalCTASection />
      <StickyMobileCTA />
    </>
  )
}
