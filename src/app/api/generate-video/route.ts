import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export const maxDuration = 300

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

const VIDEO_STYLE_PROMPTS: Record<string, string> = {
  'gazon-fleurs': 'a beautifully landscaped garden with lush green lawn, colorful rose bushes, lavender, and seasonal flowers gently swaying in a warm breeze. Professional landscape photography.',
  'mediterraneen': 'a stunning Mediterranean-style garden with olive trees, lavender, rosemary, terracotta pots and stone pathways. Warm golden hour light. Professional photography.',
  'contemporain': 'a sleek modern garden with clean geometric lines, ornamental grasses, structural dark plants, polished concrete paving. Cinematic camera movement.',
  'naturel': 'a lush naturalistic wildflower garden with native plants, tall ornamental grasses, wildflowers moving gently in the breeze. Documentary style cinematography.',
  'zen': 'a serene Japanese Zen garden with bamboo, mossy stones, raked gravel, stone lanterns and stepping stones. Calm meditative atmosphere. Cinematic.',
  'potager': 'a beautiful kitchen garden with raised wooden vegetable beds, abundant vegetables, herbs, and neat gravel paths. Warm sunlight. Food & garden photography style.',
}

function buildVideoPrompt(styleDesc: string) {
  return `Transform this garden into the following landscape style: ${styleDesc}. Keep the exact same camera angle and all existing structures (walls, fences, terrace). Only transform the garden vegetation and ground. Photorealistic, professional landscape video. Gentle camera pan. Natural lighting.`
}

async function pollOperation(operationName: string, apiKey: string, maxWaitMs = 240000): Promise<string> {
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
  const start = Date.now()
  const interval = 5000

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, interval))
    const res = await fetch(pollUrl)
    if (!res.ok) throw new Error(`Polling error ${res.status}`)
    const data = await res.json()

    if (data.done) {
      const sample = data.response?.generateVideoResponse?.generatedSamples?.[0]
      const videoUri = sample?.video?.uri
      if (!videoUri) throw new Error('Aucune vidéo dans la réponse')
      return videoUri
    }
  }

  throw new Error('Délai de génération dépassé (240s)')
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const { imageData, mimeType, styleSlug, workspaceId } = body as {
    imageData: string
    mimeType: string
    styleSlug: string
    workspaceId: string
  }

  if (!imageData || !workspaceId) {
    return NextResponse.json({ error: 'imageData et workspaceId sont requis' }, { status: 400 })
  }

  const isSuperuser = !!session.user.email &&
    SUPERUSER_EMAILS.includes(session.user.email.toLowerCase())

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  })

  if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  if (!isSuperuser && member.workspace.creditsRemaining < 2) {
    return NextResponse.json({ error: 'Crédits insuffisants (2 crédits requis pour une vidéo)' }, { status: 402 })
  }

  const styleDesc = VIDEO_STYLE_PROMPTS[styleSlug] ?? VIDEO_STYLE_PROMPTS['gazon-fleurs']
  const startMs = Date.now()

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY absent')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:generateVideo?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'veo-2.0-generate-001',
          contents: [{
            parts: [
              { text: buildVideoPrompt(styleDesc) },
              { inline_data: { mime_type: mimeType ?? 'image/jpeg', data: imageData } },
            ],
          }],
          generationConfig: {
            durationSeconds: 5,
            aspectRatio: '16:9',
          },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Veo API ${response.status}: ${errText}`)
    }

    const opData = await response.json()
    const operationName = opData.name
    if (!operationName) throw new Error('Pas d\'opération retournée par Veo')

    // Poll until done
    const videoUrl = await pollOperation(operationName, apiKey)

    const processingMs = Date.now() - startMs

    if (!isSuperuser) {
      await db.$transaction([
        db.workspace.update({
          where: { id: workspaceId },
          data: { creditsRemaining: { decrement: 2 } },
        }),
        db.creditTransaction.create({
          data: {
            workspaceId,
            delta: -2,
            balanceAfter: member.workspace.creditsRemaining - 2,
            reason: 'ENHANCEMENT',
          },
        }),
      ])
    }

    console.log(`[generate-video] done in ${processingMs}ms style=${styleSlug}`)
    return NextResponse.json({ videoUrl, processingMs })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[generate-video]', msg)
    return NextResponse.json(
      { error: 'Génération vidéo échouée. Vérifiez que votre clé API Gemini supporte Veo 2.', detail: msg },
      { status: 500 },
    )
  }
}
