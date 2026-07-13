import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export const maxDuration = 120

const SUPERUSER_EMAILS = ['ribeaudb38@gmail.com']

const GARDEN_STYLES: Record<string, string> = {
  'gazon-fleurs': 'a lush green lawn with colorful flowering borders (roses, lavender, peonies, seasonal flowers). Well-maintained grass with clean edges and vibrant flower beds.',
  'mediterraneen': 'a Mediterranean-style garden with olive trees, lavender, rosemary bushes, terracotta pots, white gravel, and natural stone pathways typical of southern France.',
  'contemporain': 'a modern contemporary garden with clean geometric lines, ornamental grasses, structural dark-leafed plants, polished concrete or slate paving, and minimalist design.',
  'naturel': 'a naturalistic wildflower garden with native French plants, tall ornamental grasses, wildflowers, wooden sleeper paths, and an eco-friendly biodiversity-rich design.',
  'zen': 'a Japanese Zen garden with bamboo, mossy stones, raked gravel, stone lanterns, stepping stones, and a serene meditative atmosphere.',
  'potager': 'a beautiful kitchen garden (potager) with raised wooden vegetable beds, abundant vegetables and aromatic herbs (thyme, basil, sage), and neat gravel paths between the beds.',
}

function buildPrompt(styleDesc: string) {
  return `You are an expert landscape architect and photorealistic visualization specialist.

Transform the garden or outdoor space in this photo into a beautifully landscaped area in the following style: ${styleDesc}

STRICT RULES — follow exactly:
1. Keep the EXACT same camera angle, viewpoint, and perspective as the original photo
2. Keep all existing fixed structures in their exact positions: house walls, fences, terraces, buildings, paths, garden furniture
3. ONLY transform the garden ground, plants, lawn, and vegetation
4. The result MUST look photorealistic — like a professional architectural photo, not a render or illustration
5. Maintain the same natural lighting direction and shadows as the original photo
6. Colors, materials and plantings must be realistic for the French climate
7. The transformation must look achievable by a real landscaper

Output a single photorealistic garden visualization image.`
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

  if (!isSuperuser && member.workspace.creditsRemaining < 1) {
    return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 })
  }

  const styleDesc = GARDEN_STYLES[styleSlug] ?? GARDEN_STYLES['gazon-fleurs']

  const photo = await db.photo.create({
    data: {
      workspaceId,
      originalUrl: 'jardin-direct-upload',
      status: 'PROCESSING',
      styleUsed: styleSlug,
      toolsUsed: ['gemini_image_generation'],
      createdById: session.user.id,
    },
  })

  const startMs = Date.now()

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY absent')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: buildPrompt(styleDesc) },
              { inline_data: { mime_type: mimeType ?? 'image/jpeg', data: imageData } },
            ],
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const parts = (data?.candidates?.[0]?.content?.parts ?? []) as Array<{
      text?: string
      inlineData?: { data: string; mimeType: string }
    }>
    const imgPart = parts.find(p => p.inlineData?.data)

    if (!imgPart?.inlineData) throw new Error('Gemini n\'a renvoyé aucune image')

    const resultB64   = imgPart.inlineData.data
    const resultMime  = imgPart.inlineData.mimeType ?? 'image/png'
    const enhancedUrl = `data:${resultMime};base64,${resultB64}`
    const processingMs = Date.now() - startMs

    await db.photo.update({
      where: { id: photo.id },
      data: { enhancedUrl, thumbnailUrl: enhancedUrl, status: 'ENHANCED', processingMs },
    })

    if (!isSuperuser) {
      await db.$transaction([
        db.workspace.update({
          where: { id: workspaceId },
          data: { creditsRemaining: { decrement: 1 } },
        }),
        db.creditTransaction.create({
          data: {
            workspaceId,
            delta: -1,
            balanceAfter: member.workspace.creditsRemaining - 1,
            reason: 'ENHANCEMENT',
            photoId: photo.id,
          },
        }),
      ])
    }

    console.log(`[generate] done in ${processingMs}ms style=${styleSlug}`)
    return NextResponse.json({ photoId: photo.id, enhancedUrl, processingMs })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[generate]', msg)
    await db.photo.update({
      where: { id: photo.id },
      data: { status: 'FAILED', errorMessage: msg },
    })
    return NextResponse.json(
      { error: 'Génération échouée, veuillez réessayer.', detail: msg },
      { status: 500 },
    )
  }
}
