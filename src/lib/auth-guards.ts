import { db } from '@/lib/db'

export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { emailVerified: true } })
  return !!user?.emailVerified
}
