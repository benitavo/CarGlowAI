import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const RETENTION_DAYS = 30

// Scheduled daily via vercel.json (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  const result = await db.photo.updateMany({
    where: {
      status: 'ENHANCED',
      downloadedAt: null,
      createdAt: { lt: cutoff },
    },
    data: {
      status:       'EXPIRED',
      enhancedUrl:  null,
      thumbnailUrl: null,
    },
  })

  return NextResponse.json({ purged: result.count })
}
