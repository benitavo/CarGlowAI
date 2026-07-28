import { db } from '@/lib/db'
import { getPricingConfig, monthlyCreditsForPlan } from '@/lib/pricing'

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

export interface WorkspaceSummary {
  userId: string
  email: string | null
  name: string | null
  workspaceId: string
  workspaceName: string
  plan: string
  monthlyCredits: number
  bonusCredits: number
  creditsRemaining: number
  creditsPerMonth: number
  subscriptionStatus: string
  renewalDate: Date | null
  isSuperuser: boolean
  role: string
  emailVerified: boolean
}

// Shared by /api/me and the /app layout — having the layout fetch this server-side and
// pass it down means AppLayoutClient's sidebar renders with real data on first paint
// instead of showing "—" placeholders until a client-side round trip to /api/me resolves.
export async function getWorkspaceSummary(
  userId: string,
  email?: string | null,
  name?: string | null,
): Promise<WorkspaceSummary | null> {
  const [member, user] = await Promise.all([
    db.workspaceMember.findFirst({
      where:   { userId },
      include: { workspace: true },
      orderBy: { joinedAt: 'asc' },
    }),
    db.user.findUnique({ where: { id: userId }, select: { emailVerified: true } }),
  ])
  if (!member) return null

  const { workspace } = member
  const isSuperuser = !!email && SUPERUSER_EMAILS.includes(email.toLowerCase())
  const config = await getPricingConfig()

  return {
    userId,
    email: email ?? null,
    name: name ?? null,
    workspaceId:        workspace.id,
    workspaceName:      workspace.name,
    plan:               isSuperuser ? 'UNLIMITED' : workspace.plan,
    monthlyCredits:      isSuperuser ? 999999 : workspace.monthlyCredits,
    bonusCredits:       isSuperuser ? 0 : workspace.bonusCredits,
    creditsRemaining:   isSuperuser ? 999999 : workspace.monthlyCredits + workspace.bonusCredits,
    creditsPerMonth:    isSuperuser ? 999999 : monthlyCreditsForPlan(config, workspace.plan),
    subscriptionStatus: workspace.subscriptionStatus,
    renewalDate:        workspace.renewalDate,
    isSuperuser,
    role: member.role,
    emailVerified: !!user?.emailVerified,
  }
}
