import { redirect } from 'next/navigation'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import EditorClient from './EditorClient'

export default async function EditorPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  return <EditorClient />
}
