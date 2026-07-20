import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getWorkspaceSummary } from '@/lib/workspace-summary'
import AppLayoutClient from '@/components/AppLayoutClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  // Independent queries, run in parallel — the emailVerified gate doesn't depend on
  // workspace data. Fetching the workspace summary here (not just in /api/me) means
  // AppLayoutClient's sidebar renders real numbers on first paint instead of "—"
  // placeholders while waiting on a client-side round trip that used to block on this
  // exact same data.
  const [user, workspaceSummary] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } }),
    getWorkspaceSummary(session.user.id, session.user.email, session.user.name),
  ])

  if (!user?.emailVerified) redirect('/check-email')

  return <AppLayoutClient initialWorkspace={workspaceSummary}>{children}</AppLayoutClient>
}
