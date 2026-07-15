import { GardenStyle, buildImagePrompt } from './gardenPrompts'

export interface StyledImage {
  base64: string
  mimeType: string
}

export async function generateStyledImage(
  apiKey: string,
  imageData: string,
  mimeType: string,
  style: GardenStyle,
  characteristics?: string,
): Promise<StyledImage> {
  const prompt = buildImagePrompt(style, characteristics)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageData } },
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

  return {
    base64: imgPart.inlineData.data,
    mimeType: imgPart.inlineData.mimeType ?? 'image/png',
  }
}
