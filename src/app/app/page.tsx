import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Image as ImageIcon, ArrowRight } from 'lucide-react'
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
    include: { vehicle: { select: { name: true } } },
  })

  const creditsRemaining = workspace.creditsRemaining

  return (
    <div className="pb-24 lg:pb-12">
      {/* Header */}
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1480px]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display font-bold tracking-tight text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">
                Dashboard
              </h1>
              <p className="text-offwhite/55 mt-2 text-[15px]">
                <span className="text-offwhite font-semibold">{creditsRemaining.toLocaleString()}</span> credits remaining
              </p>
            </div>
            <Link
              href="/app/editor"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm shadow-glow-md transition-all"
            >
              <Sparkles className="w-4 h-4" /> Enhance a photo
            </Link>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
        {/* Library */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-display font-semibold text-[15px]">Photo library</h2>
            <Link href="/app/library" className="text-[12px] text-glow-400 hover:text-glow-300 inline-flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </header>

          {recentPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-offwhite/30" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-offwhite/45 mb-4">Your enhanced photos will appear here</p>
              <Link
                href="/app/editor"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm shadow-glow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" /> Enhance your first photo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/[0.04]">
              {recentPhotos.map((p) => (
                <div key={p.id} className="relative group bg-midnight aspect-square overflow-hidden">
                  <img
                    src={p.thumbnailUrl ?? p.enhancedUrl ?? p.originalUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
