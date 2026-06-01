import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import PhotoGrid from './_components/PhotoGrid'

export default async function LibraryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  // Resolve workspace — use token cache first, fall back to DB
  const wsId = session.user.workspaceId ?? await db.workspaceMember
    .findFirst({
      where:   { userId: session.user.id },
      orderBy: { joinedAt: 'asc' },
      select:  { workspaceId: true },
    })
    .then(m => m?.workspaceId ?? null)

  if (!wsId) redirect('/signin')

  const photos = await db.photo.findMany({
    where: {
      workspaceId: wsId,
      status: { in: ['ENHANCED', 'PROCESSING', 'FAILED', 'UPLOADED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { vehicle: { select: { name: true } } },
  })

  const enhancedCount = photos.filter(p => p.status === 'ENHANCED').length

  return (
    <div className="pb-24 lg:pb-12">
      {/* Hero */}
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[1480px]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">Library</div>
              <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">Your photos.</h1>
              <p className="text-offwhite/55 mt-2 text-[15px]">
                {photos.length === 0
                  ? 'No photos yet — enhance your first car'
                  : `${enhancedCount} enhanced photo${enhancedCount !== 1 ? 's' : ''}${photos.length > enhancedCount ? ` · ${photos.length - enhancedCount} processing` : ''}`
                }
              </p>
            </div>
            <Link
              href="/app/editor"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-glow-500 hover:bg-glow-400 text-midnight font-semibold text-sm shadow-glow-sm transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} /> New enhancement
            </Link>
          </div>
        </div>
      </section>

      <PhotoGrid photos={photos.map(p => ({
        id:          p.id,
        thumbnailUrl: p.thumbnailUrl ?? p.enhancedUrl ?? p.originalUrl,
        fullUrl:      p.enhancedUrl ?? p.thumbnailUrl ?? p.originalUrl,
        vehicleName:  p.vehicle?.name ?? null,
        styleUsed:    p.styleUsed ?? null,
        status:       p.status,
        createdAt:    p.createdAt.toISOString(),
        processingMs: p.processingMs ?? null,
      }))} />
    </div>
  )
}
