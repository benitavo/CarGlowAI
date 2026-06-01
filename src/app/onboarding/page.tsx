'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Building2, Upload, Palette, UserPlus, Sparkles, ArrowRight, ArrowLeft,
  Check, X, Mail, Loader2, ImagePlus, RotateCw, Wand2, ChevronDown, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { styles, currentUser } from '@/lib/mock-data'

// ─────────────────────────────────────────────────────────────────────────────

type StepId = 'workspace' | 'brand' | 'style' | 'team' | 'first-photo'

const STEPS: { id: StepId; label: string; icon: typeof Building2 }[] = [
  { id: 'workspace',   label: 'Workspace',  icon: Building2 },
  { id: 'brand',       label: 'Brand',      icon: Palette },
  { id: 'style',       label: 'Style',      icon: Sparkles },
  { id: 'team',        label: 'Team',       icon: UserPlus },
  { id: 'first-photo', label: 'First photo', icon: ImagePlus },
]

const BUSINESS_TYPES = [
  { id: 'independent', label: 'Independent dealer',   desc: 'Single rooftop, &lt; 200 vehicles/mo' },
  { id: 'group',       label: 'Dealer group',         desc: '2+ rooftops, shared inventory' },
  { id: 'oem',         label: 'OEM / manufacturer',   desc: 'Brand-direct sales & remarketing' },
  { id: 'broker',      label: 'Broker / wholesaler',  desc: 'Auction & B2B inventory flow' },
]

const VOLUME_OPTIONS = ['< 50', '50–200', '200–1,000', '1,000+']

// Initial state for the wizard
type State = {
  workspaceName: string
  businessType: string
  monthlyVolume: string
  primaryColor: string
  logo: { name: string; preview: string } | null
  defaultStyleId: string | null
  invites: string[]
  inviteInput: string
  photoUploaded: boolean
  photoProcessing: boolean
  photoDone: boolean
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const [state, setState] = useState<State>({
    workspaceName: '',
    businessType: '',
    monthlyVolume: '',
    primaryColor: '#FF8A3D',
    logo: null,
    defaultStyleId: null,
    invites: [],
    inviteInput: '',
    photoUploaded: false,
    photoProcessing: false,
    photoDone: false,
  })

  const update = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }))
  const currentStep = STEPS[stepIdx]

  // Per-step gating: when can the user advance?
  const canAdvance = useMemo(() => {
    switch (currentStep.id) {
      case 'workspace':   return state.workspaceName.trim().length > 1 && state.businessType !== ''
      case 'brand':       return true // logo optional
      case 'style':       return state.defaultStyleId !== null
      case 'team':        return true // skippable
      case 'first-photo': return state.photoDone
    }
  }, [currentStep, state])

  const next = () => {
    if (stepIdx === STEPS.length - 1) {
      router.push('/app')
    } else {
      setStepIdx((i) => i + 1)
    }
  }
  const prev = () => setStepIdx((i) => Math.max(0, i - 1))

  const progress = ((stepIdx + 1) / STEPS.length) * 100

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress strip */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-5">
          {/* Step labels */}
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const done = i < stepIdx
              const active = i === stepIdx
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums transition-colors',
                      done && 'bg-glow-500 text-midnight',
                      active && 'bg-glow-500/15 text-glow-300 ring-2 ring-glow-500/40',
                      !done && !active && 'bg-white/[0.04] text-offwhite/40 border border-white/[0.08]',
                    )}>
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                    </div>
                    <div className={cn(
                      'text-xs font-medium whitespace-nowrap hidden sm:block transition-colors',
                      done ? 'text-offwhite/65' : active ? 'text-offwhite' : 'text-offwhite/40',
                    )}>
                      {s.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      'flex-1 h-px mx-3 transition-colors',
                      done ? 'bg-glow-500/40' : 'bg-white/[0.05]',
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar (mobile-friendly fallback) */}
          <div className="sm:hidden h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-glow-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step body */}
      <div className="flex-1 flex">
        <div className="max-w-3xl mx-auto w-full px-6 lg:px-10 py-10 lg:py-14 flex flex-col">
          <div key={currentStep.id} className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {currentStep.id === 'workspace'   && <WorkspaceStep state={state} update={update} />}
            {currentStep.id === 'brand'       && <BrandStep state={state} update={update} />}
            {currentStep.id === 'style'       && <StyleStep state={state} update={update} />}
            {currentStep.id === 'team'        && <TeamStep state={state} update={update} />}
            {currentStep.id === 'first-photo' && <FirstPhotoStep state={state} update={update} />}
          </div>

          {/* Footer nav */}
          <div className="mt-10 pt-6 border-t border-white/[0.04] flex items-center justify-between">
            <button
              onClick={prev}
              disabled={stepIdx === 0}
              className="text-sm text-offwhite/55 hover:text-offwhite disabled:opacity-0 disabled:pointer-events-none flex items-center gap-1.5 py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Back
            </button>

            <div className="flex items-center gap-3">
              {/* Skip for optional steps */}
              {(currentStep.id === 'team' || (currentStep.id === 'brand' && !state.logo)) && (
                <button
                  onClick={next}
                  className="text-sm text-offwhite/55 hover:text-offwhite py-2"
                >
                  Skip this step
                </button>
              )}
              <button
                onClick={next}
                disabled={!canAdvance}
                className={cn(
                  'rounded-lg bg-glow-500 hover:bg-glow-400 disabled:opacity-50 disabled:cursor-not-allowed text-midnight px-5 py-2.5 text-sm font-semibold shadow-glow-md transition-colors flex items-center gap-1.5',
                )}
              >
                {stepIdx === STEPS.length - 1 ? 'Enter CarGlow' : 'Continue'}
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Workspace
// ─────────────────────────────────────────────────────────────────────────────

function WorkspaceStep({ state, update }: StepProps) {
  return (
    <div>
      <StepHeader
        eyebrow="Step 1 of 5"
        title={`Welcome, ${currentUser.firstName}.`}
        description="Let's set up your workspace. You can change any of this later in settings."
      />

      <div className="space-y-6">
        <Field label="Workspace name">
          <div className="relative">
            <Building2 className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={state.workspaceName}
              onChange={(e) => update({ workspaceName: e.target.value })}
              placeholder="Summit Auto Group"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-offwhite/35 focus:outline-none focus:border-glow-500/50"
            />
          </div>
          <div className="text-[11px] text-offwhite/45 mt-1.5">Usually your dealership or company name</div>
        </Field>

        <Field label="What kind of business?">
          <div className="grid sm:grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ businessType: t.id })}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  state.businessType === t.id
                    ? 'border-glow-500/40 bg-glow-500/[0.08]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                )}
              >
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-offwhite/55 mt-0.5" dangerouslySetInnerHTML={{ __html: t.desc }} />
              </button>
            ))}
          </div>
        </Field>

        <Field label="How many vehicles do you photograph per month?" optional>
          <div className="flex flex-wrap gap-2">
            {VOLUME_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => update({ monthlyVolume: v })}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs border transition-colors',
                  state.monthlyVolume === v
                    ? 'border-glow-500/40 bg-glow-500/15 text-glow-300'
                    : 'border-white/[0.08] bg-white/[0.02] text-offwhite/70 hover:border-white/[0.14]',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-offwhite/45 mt-1.5">Helps us recommend the right plan</div>
        </Field>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Brand
// ─────────────────────────────────────────────────────────────────────────────

function BrandStep({ state, update }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      update({ logo: { name: file.name, preview: e.target?.result as string } })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 2 of 5"
        title="Add your brand."
        description="Your logo will appear as a watermark on every enhanced photo. Optional, but recommended."
      />

      <div className="space-y-6">
        {/* Logo */}
        <Field label="Dealership logo" optional>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileRef.current?.click()}
              className={cn(
                'w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors flex-shrink-0',
                state.logo
                  ? 'border-glow-500/30 bg-glow-500/[0.05]'
                  : 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]',
              )}
            >
              {state.logo ? (
                <Image
                  src={state.logo.preview}
                  alt=""
                  width={80}
                  height={80}
                  className="max-w-[80px] max-h-[80px] object-contain"
                  unoptimized
                />
              ) : (
                <Upload className="w-5 h-5 text-offwhite/40" strokeWidth={1.75} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="flex-1">
              {state.logo ? (
                <>
                  <div className="text-sm font-medium truncate">{state.logo.name}</div>
                  <div className="text-xs text-offwhite/55 mt-0.5">Looks good. You can replace it anytime.</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-xs text-glow-400 hover:text-glow-300"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => update({ logo: null })}
                      className="text-xs text-offwhite/45 hover:text-offwhite/70"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-sm text-offwhite/85 hover:text-offwhite"
                  >
                    Click to upload
                  </button>
                  <div className="text-xs text-offwhite/55 mt-0.5">PNG with transparent background. Min 512×512.</div>
                </>
              )}
            </div>
          </div>
        </Field>

        {/* Primary color */}
        <Field label="Primary brand color">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 flex-1 max-w-xs">
              <input
                type="color"
                value={state.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={state.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="flex-1 bg-transparent text-sm font-mono uppercase focus:outline-none"
              />
            </div>
            <div className="text-xs text-offwhite/55 hidden sm:block">Used in watermarks and shareable previews</div>
          </div>
        </Field>

        {/* Live preview */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/45 mb-3">
            Preview
          </div>
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
            <Image
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80"
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/20 to-transparent" />
            {/* Watermark */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-md backdrop-blur-sm bg-midnight-900/70 ring-1 ring-white/10">
              {state.logo ? (
                <Image
                  src={state.logo.preview}
                  alt=""
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain"
                  unoptimized
                />
              ) : (
                <div
                  className="w-4 h-4 rounded-sm flex items-center justify-center"
                  style={{ background: state.primaryColor }}
                >
                  <Sparkles className="w-2.5 h-2.5 text-midnight" strokeWidth={2.5} />
                </div>
              )}
              <span className="text-[10px] font-semibold tracking-wider uppercase text-white">
                {state.workspaceName || 'Your Dealership'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Default style
// ─────────────────────────────────────────────────────────────────────────────

function StyleStep({ state, update }: StepProps) {
  // Show a curated subset for first-time users
  const featured = useMemo(() => styles.filter((s) => !s.isCustom).slice(0, 8), [])

  return (
    <div>
      <StepHeader
        eyebrow="Step 3 of 5"
        title="Pick a default style."
        description="Applied automatically to every new enhancement. You can switch styles per photo anytime."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {featured.map((s) => (
          <button
            key={s.id}
            onClick={() => update({ defaultStyleId: s.id })}
            className={cn(
              'group relative aspect-[4/5] rounded-xl overflow-hidden ring-1 transition-all text-left',
              state.defaultStyleId === s.id
                ? 'ring-glow-500 ring-2'
                : 'ring-white/[0.06] hover:ring-white/[0.14]',
            )}
          >
            <Image
              src={s.thumbnailUrl}
              alt={s.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/20 to-transparent" />

            {state.defaultStyleId === s.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-glow-500 flex items-center justify-center shadow-glow-sm">
                <Check className="w-3 h-3 text-midnight" strokeWidth={3} />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="text-[9px] font-semibold tracking-widest uppercase text-glow-400/80 mb-0.5">
                {s.category}
              </div>
              <div className="font-display font-semibold text-sm leading-tight">{s.name}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 text-center text-xs text-offwhite/45">
        Want more? You&apos;ll find {styles.length - featured.length}+ more styles in the library once you&apos;re in.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Team
// ─────────────────────────────────────────────────────────────────────────────

function TeamStep({ state, update }: StepProps) {
  const addInvite = () => {
    const email = state.inviteInput.trim()
    if (!email || !/\S+@\S+\.\S+/.test(email) || state.invites.includes(email)) return
    update({ invites: [...state.invites, email], inviteInput: '' })
  }
  const removeInvite = (email: string) => {
    update({ invites: state.invites.filter((e) => e !== email) })
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 4 of 5"
        title="Bring your team."
        description="Invite collaborators to share photos, brand kits, and listings. You can do this later too."
      />

      <Field label="Invite by email">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="email"
              value={state.inviteInput}
              onChange={(e) => update({ inviteInput: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInvite())}
              placeholder="teammate@dealership.com"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-offwhite/35 focus:outline-none focus:border-glow-500/50"
            />
          </div>
          <button
            onClick={addInvite}
            disabled={!state.inviteInput.trim()}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2.5 text-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Add
          </button>
        </div>
        <div className="text-[11px] text-offwhite/45 mt-1.5">Everyone gets the Editor role by default. Adjust later in Team settings.</div>
      </Field>

      {/* Invite list */}
      {state.invites.length > 0 && (
        <div className="mt-5">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/55 mb-2">
            To invite ({state.invites.length})
          </div>
          <div className="space-y-2">
            {state.invites.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-dashed border-white/15 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-offwhite/50" strokeWidth={1.75} />
                  </div>
                  <span className="text-sm">{email}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                    Editor
                  </span>
                </div>
                <button
                  onClick={() => removeInvite(email)}
                  className="p-1 rounded hover:bg-white/[0.06] text-offwhite/45 hover:text-offwhite"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.invites.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-6 text-center">
          <UserPlus className="w-6 h-6 text-offwhite/30 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-sm text-offwhite/55">
            Working solo? No worries — skip this step.
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — First photo
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_BEFORE = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=70&sat=-30&blur=10'
const SAMPLE_AFTER  = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85'

function FirstPhotoStep({ state, update }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [sliderPos, setSliderPos] = useState(50)

  const startUpload = () => {
    update({ photoUploaded: true, photoProcessing: true })
    // Mock processing
    setTimeout(() => {
      update({ photoProcessing: false, photoDone: true })
    }, 2400)
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 5 of 5"
        title="Let's enhance your first photo."
        description="Drop a real vehicle photo, or try our sample to see what CarGlow can do."
      />

      {!state.photoUploaded ? (
        <div className="space-y-4">
          {/* Dropzone */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-white/[0.12] hover:border-glow-500/40 hover:bg-glow-500/[0.04] transition-colors flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] group-hover:bg-glow-500/15 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-offwhite/50 group-hover:text-glow-300" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-medium">Drop a photo or click to upload</div>
              <div className="text-xs text-offwhite/55 mt-0.5">JPG, PNG, or HEIC · up to 25MB</div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => startUpload()}
          />

          {/* OR try sample */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-white/[0.05]" />
            <span className="px-3 text-[11px] uppercase tracking-widest text-offwhite/40">or</span>
            <div className="flex-1 border-t border-white/[0.05]" />
          </div>

          <button
            onClick={startUpload}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4 text-glow-400" strokeWidth={1.75} />
            Try with our sample photo
          </button>
        </div>
      ) : state.photoProcessing ? (
        // Processing state
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-white/[0.08] mb-6">
            <Image src={SAMPLE_BEFORE} alt="" fill className="object-cover blur-sm" />
            <div className="absolute inset-0 bg-midnight-900/60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-glow-400 animate-spin" strokeWidth={1.75} />
              <div className="text-sm font-medium">Enhancing your photo…</div>
              <div className="text-xs text-offwhite/55">Removing background, balancing lighting, adding watermark</div>
            </div>
          </div>
        </div>
      ) : (
        // Done state — before/after slider
        <div className="rounded-2xl border border-glow-500/30 bg-glow-500/[0.04] p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-glow-500 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-midnight" strokeWidth={3} />
              </div>
              <div>
                <div className="font-display font-semibold text-sm">Enhanced in 2.4s</div>
                <div className="text-[11px] text-offwhite/55">Drag the slider to compare</div>
              </div>
            </div>
            <button
              onClick={() => update({ photoUploaded: false, photoDone: false })}
              className="text-xs text-offwhite/55 hover:text-offwhite flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" strokeWidth={1.75} />
              Try another
            </button>
          </div>

          {/* Before/after slider */}
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-white/[0.08] select-none">
            <Image src={SAMPLE_AFTER} alt="Enhanced" fill className="object-cover" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <Image src={SAMPLE_BEFORE} alt="Original" fill className="object-cover" />
            </div>
            {/* Labels */}
            <div className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-midnight-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded">
              Before
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider bg-glow-500 text-midnight px-2 py-0.5 rounded">
              After
            </div>
            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-glow-500 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-glow-500 shadow-glow-md flex items-center justify-center">
                <div className="flex items-center text-midnight">
                  <ArrowLeft className="w-3 h-3" strokeWidth={3} />
                  <ArrowRight className="w-3 h-3 -ml-1" strokeWidth={3} />
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-offwhite/65">
              <Sparkles className="w-3.5 h-3.5 text-glow-400" strokeWidth={1.75} />
              You&apos;ve got <span className="text-offwhite font-medium">3 free photos</span> to start.
            </div>
            <div className="text-glow-400 font-medium">You&apos;re ready →</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────

type StepProps = {
  state: State
  update: (patch: Partial<State>) => void
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">
        {eyebrow}
      </div>
      <h1 className="font-display font-bold tracking-tight text-[clamp(1.7rem,3.5vw,2.2rem)] leading-[1.1]">
        {title}
      </h1>
      <p className="text-offwhite/65 mt-2 text-[15px] max-w-xl">
        {description}
      </p>
    </div>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/55">
          {label}
        </label>
        {optional && <span className="text-[10px] text-offwhite/40 uppercase tracking-wider">Optional</span>}
      </div>
      {children}
    </div>
  )
}
