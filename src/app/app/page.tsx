import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Image as ImageIcon, ArrowRight, AlertCircle, CreditCard, Leaf } from 'lucide-react'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const userId      = session.user.id
  const workspaceId = session.user.workspaceId

  let workspace = workspaceId
    ? await db.workspace.findUnique({ where: { id: workspaceId } })
    : await db.workspaceMember
        .findFirst({ where: { userId }, include: { workspace: true }, orderBy: { joinedAt: 'asc' } })
        .then(m => m?.workspace ?? null)

  if (!workspace) redirect('/signin')

  const wsId = workspace.id

  const recentPhotos = await db.photo.findMany({
    where:   { workspaceId: wsId, status: 'ENHANCED' },
    orderBy: { createdAt: 'desc' },
    take:    12,
    select:  { id: true, thumbnailUrl: true, enhancedUrl: true, styleUsed: true, createdAt: true },
  })

  const creditsRemaining = workspace.creditsRemaining

  return (
    <div className="pb-24 lg:pb-12 bg-cream-50 min-h-screen">

      {/* No-credits banner */}
      {creditsRemaining === 0 && (
        <div className="mx-6 lg:mx-10 mt-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">Plus de crédits disponibles</p>
            <p className="text-xs text-rose-600/70 mt-0.5">
              Vous avez utilisé tous vos crédits. Rechargez pour continuer.
            </p>
          </div>
          <Link
            href="/app/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5" /> Recharger
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
        {/* Library */}
        <section className="rounded-2xl border border-sage-100 bg-white overflow-hidden shadow-sm">
          <header className="flex items-center justify-between px-5 py-4 border-b border-sage-100">
            <h2 className="font-display font-semibold text-[15px] text-midnight">Mes rendus de jardin</h2>
            <Link href="/app/library" className="text-[12px] text-sage-600 hover:text-sage-700 inline-flex items-center gap-1 font-medium">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </header>

          {recentPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-sage-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-midnight/45 mb-4">Vos rendus de jardin apparaîtront ici</p>
              <Link
                href="/app/editor"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm transition-all"
              >
                <Leaf className="w-4 h-4" /> Générer mon premier rendu
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-sage-50">
              {recentPhotos.map((p) => (
                <div key={p.id} className="relative group bg-white aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnailUrl ?? p.enhancedUrl ?? ''}
                    alt={p.styleUsed ?? 'rendu jardin'}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
