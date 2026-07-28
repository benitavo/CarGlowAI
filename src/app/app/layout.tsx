import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getWorkspaceSummary } from '@/lib/workspace-summary'
import AppLayoutClient from '@/components/AppLayoutClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  // Unverified accounts are deliberately allowed into the app shell (dashboard, editor,
  // library, brand kit) so a brand-new signup can see its first render without leaving
  // the app to click an email link first — that context-switch was the single biggest
  // drop-off point in the signup funnel. Verification is still required for anything
  // past that: a second generation (/api/generate blocks it directly), video/retouch/kit
  // marketing, and billing (each of those routes/pages checks it on its own). This layout
  // just needs a session, and passes verification status down so the shell can show a
  // non-blocking reminder banner.
  const workspaceSummary = await getWorkspaceSummary(session.user.id, session.user.email, session.user.name)

  return (
    <AppLayoutClient initialWorkspace={workspaceSummary} emailVerified={!!workspaceSummary?.emailVerified}>
      {children}
    </AppLayoutClient>
  )
}
