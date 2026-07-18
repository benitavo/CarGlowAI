import { redirect } from 'next/navigation'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import AppLayoutClient from '@/components/AppLayoutClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { emailVerified: true },
  })

  if (!user?.emailVerified) redirect('/check-email')

  return <AppLayoutClient>{children}</AppLayoutClient>
}
