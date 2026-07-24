import { put } from '@vercel/blob'

export async function uploadBuffer(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const blob = await put(filename, buffer, { access: 'public', contentType: mimeType, addRandomSuffix: true })
  return blob.url
}

// Uploads to Vercel Blob but never throws — on failure it degrades to the current base64
// data-URI behavior instead, so a storage outage can never break core image/video generation
// (a prior fal.ai-based version of this migration regressed production for exactly that reason).
export async function uploadBufferWithFallback(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  try {
    return await uploadBuffer(buffer, mimeType, filename)
  } catch (err) {
    console.warn(`[blob-storage] upload failed for ${filename}, falling back to data URI`, err)
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  }
}

export async function uploadBase64WithFallback(base64: string, mimeType: string, filename: string): Promise<string> {
  return uploadBufferWithFallback(Buffer.from(base64, 'base64'), mimeType, filename)
}
