import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ImageIcon, ArrowRight, AlertCircle, CreditCard, Leaf, Clock3 } from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import PhotoGrid from '@/components/app/PhotoGrid'
import OnboardingBanner from '@/app/app/_components/OnboardingBanner'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const userId      = session.user.id
  const workspaceId = session.user.workspaceId

  const workspace = workspaceId
    ? await db.workspace.findUnique({ where: { id: workspaceId } })
    : await db.workspaceMember
        .findFirst({ where: { userId }, include: { workspace: true }, orderBy: { joinedAt: 'asc' } })
        .then(m => m?.workspace ?? null)

  if (!workspace) redirect('/signin')

  const wsId = workspace.id

  const [recentPhotos, totalRenders] = await Promise.all([
    db.photo.findMany({
      where:   { workspaceId: wsId, status: 'ENHANCED' },
      orderBy: { createdAt: 'desc' },
      take:    3,
      include: { vehicle: { select: { name: true } } },
    }),
    db.photo.count({ where: { workspaceId: wsId, status: { in: ['ENHANCED', 'EXPIRED'] } } }),
  ])

  const creditsRemaining = workspace.monthlyCredits + workspace.bonusCredits

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">

      {/* No-credits banner */}
      {creditsRemaining === 0 && (
        <div className="mx-6 lg:mx-10 mt-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">Plus de crédits disponibles</p>
            <p className="text-xs text-rose-600/70 mt-0.5">
              Vous avez utilisé tous vos crédits. Abonnez-vous pour continuer.
            </p>
          </div>
          <Link
            href="/app/billing?upgrade=1"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5" /> S&apos;abonner
          </Link>
        </div>
      )}

      {/* Header */}
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1480px]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] text-midnight">
                Tableau de bord
              </h1>
              <p className="text-midnight/45 mt-2 text-[15px]">
                <span className="text-sage-700 font-semibold">{creditsRemaining.toLocaleString()}</span> crédits restants
              </p>
            </div>
            <Link
              href="/app/editor"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm transition-all"
            >
              <Leaf className="w-4 h-4" /> Générer un rendu
            </Link>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
        {/* Getting started checklist — hides itself once every real step is done */}
        <div className="mb-6">
          <OnboardingBanner photoCount={totalRenders} />
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-sage-100 bg-white px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-200/60 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-midnight leading-none">{totalRenders}</p>
              <p className="text-xs text-midnight/45 mt-1">Rendu{totalRenders !== 1 ? 's' : ''} généré{totalRenders !== 1 ? 's' : ''} au total</p>
            </div>
          </div>
          <div className="rounded-2xl border border-sage-100 bg-white px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-200/60 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5 text-sage-500" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-midnight leading-none">{creditsRemaining.toLocaleString()}</p>
              <p className="text-xs text-midnight/45 mt-1">Crédits restants</p>
            </div>
          </div>
        </div>

        {/* Library */}
        <section className="rounded-2xl border border-sage-100 bg-white overflow-hidden shadow-sm">
          <header className="flex items-center justify-between px-5 py-4 border-b border-sage-100 gap-3">
            <div>
              <h2 className="font-display font-semibold text-[15px] text-midnight">Mes 3 derniers rendus</h2>
              <p className="text-[11px] text-midnight/40 mt-0.5">
                Un rendu non téléchargé est automatiquement supprimé après 30 jours.
              </p>
            </div>
            <Link href="/app/library" className="text-[12px] text-sage-600 hover:text-sage-700 inline-flex items-center gap-1 font-medium shrink-0">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </header>

          <PhotoGrid photos={recentPhotos.map(p => ({
            id:           p.id,
            thumbnailUrl: p.thumbnailUrl ?? p.enhancedUrl ?? p.originalUrl,
            fullUrl:      p.enhancedUrl ?? p.thumbnailUrl ?? p.originalUrl,
            vehicleName:  p.vehicle?.name ?? null,
            styleUsed:    p.styleUsed ?? null,
            status:       p.status,
            createdAt:    p.createdAt.toISOString(),
            processingMs: p.processingMs ?? null,
            isVideo:      Array.isArray(p.toolsUsed) && p.toolsUsed.includes('veo_video_generation'),
            isRetouch:    Array.isArray(p.toolsUsed) && p.toolsUsed.includes('gemini_image_retouch'),
          }))} />
        </section>
      </div>
    </div>
  )
}
