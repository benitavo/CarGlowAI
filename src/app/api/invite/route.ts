import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, workspaceId, role = 'EDITOR' } = await req.json()

  if (!email || !workspaceId) {
    return NextResponse.json({ error: 'email and workspaceId are required' }, { status: 400 })
  }

  const member = await db.workspaceMember.findUnique({
    where:   { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  })

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token     = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invite = await db.invite.create({
    data: { workspaceId, email, role, token, expiresAt, invitedBy: session.user.id },
  })

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`

  // DEV MODE — log the invite link to the console instead of sending an email.
  console.log('\n─────────────────────────────────────────────')
  console.log('  📧  Invite link for', email)
  console.log(' ', inviteUrl)
  console.log('─────────────────────────────────────────────\n')

  return NextResponse.json({ id: invite.id })
}
