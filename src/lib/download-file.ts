// Fetches a URL as a blob and triggers a browser download under the given filename — works
// for both `data:` URIs and real hosted URLs (image or video), regardless of CORS headers on
// the source, since the browser already has the bytes once `fetch` resolves.
export async function downloadUrlAsFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
