import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

// Uploads a generated image/video buffer to fal.ai's CDN and returns a permanent public
// URL — used instead of embedding the result as a base64 data URI. A data URI bloats the
// API response and the database row by ~33% over the raw bytes, can't be cached by the
// browser the way a real URL can, and can't be run through next/image's optimizer at all.
export async function uploadBufferToFal(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const file = new File([new Uint8Array(buffer)], filename, { type: mimeType })
  return fal.storage.upload(file)
}
