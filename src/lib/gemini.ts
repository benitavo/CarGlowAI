import { GardenStyle, buildImagePrompt, buildRetouchPrompt } from './gardenPrompts'

export interface StyledImage {
  base64: string
  mimeType: string
}

async function callGeminiImage(apiKey: string, prompt: string, imageData: string, mimeType: string): Promise<StyledImage> {
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

export async function generateStyledImage(
  apiKey: string,
  imageData: string,
  mimeType: string,
  style: GardenStyle,
  characteristics?: string,
): Promise<StyledImage> {
  return callGeminiImage(apiKey, buildImagePrompt(style, characteristics), imageData, mimeType)
}

export async function retouchImage(
  apiKey: string,
  imageData: string,
  mimeType: string,
  instruction: string,
): Promise<StyledImage> {
  return callGeminiImage(apiKey, buildRetouchPrompt(instruction), imageData, mimeType)
}

// Plain text completion (no image in/out) — used for the Marketing Kit's social-post caption.
export async function generateText(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
  if (!text) throw new Error('Gemini n\'a renvoyé aucun texte')
  return text.trim()
}
