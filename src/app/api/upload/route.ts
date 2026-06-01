import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Upload to fal.ai's CDN — returns a permanent public URL
  const url = await fal.storage.upload(file)
  return NextResponse.json({ url })
}
