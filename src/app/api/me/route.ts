import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { getPricingConfig, monthlyCreditsForPlan } from '@/lib/pricing'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const member = await db.workspaceMember.findFirst({
    where:   { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' },
  })

  if (!member) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  }

  const { workspace } = member

  // Superusers have unlimited credits — surfaced to the UI as a flag plus a
  // very large number so existing credit displays still render sensibly.
  const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']
  const isSuperuser = !!session.user.email &&
    SUPERUSER_EMAILS.includes(session.user.email.toLowerCase())

  const config = await getPricingConfig()

  return NextResponse.json({
    userId:             session.user.id,
    email:              session.user.email,
    name:               session.user.name,
    workspaceId:        workspace.id,
    workspaceName:      workspace.name,
    plan:               isSuperuser ? 'UNLIMITED' : workspace.plan,
    monthlyCredits:     isSuperuser ? 999999 : workspace.monthlyCredits,
    bonusCredits:       isSuperuser ? 0 : workspace.bonusCredits,
    creditsRemaining:   isSuperuser ? 999999 : workspace.monthlyCredits + workspace.bonusCredits,
    creditsPerMonth:    isSuperuser ? 999999 : monthlyCreditsForPlan(config, workspace.plan),
    subscriptionStatus: workspace.subscriptionStatus,
    renewalDate:        workspace.renewalDate,
    isSuperuser,
    role:               member.role,
  })
}
