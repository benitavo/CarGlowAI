export interface MusicPreset {
  id: string
  label: string
  /** Hosted MP3 URL — null until a real, license-cleared track is wired in for this slot. */
  url: string | null
}

// Curated, fixed set — no user uploads (avoids unverified/unlicensed audio ending up in
// customer-facing marketing content). Royalty-free (Pixabay Content License, free for
// commercial use), hosted on Vercel Blob under marketing-kit/music/ — see the seed script
// this was uploaded with if these ever need replacing.
export const MUSIC_PRESETS: MusicPreset[] = [
  { id: 'corporate', label: 'Corporate énergique',   url: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/music/corporate.mp3' },
  { id: 'acoustic',  label: 'Acoustique chaleureux',  url: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/music/acoustic.mp3' },
  { id: 'cinematic', label: 'Cinématique inspirant',  url: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/music/cinematic.mp3' },
  { id: 'lofi',      label: 'Lofi détente',           url: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/music/lofi.mp3' },
  { id: 'happy',     label: 'Estival et joyeux',      url: 'https://ntezmlg9oymf1peu.public.blob.vercel-storage.com/marketing-kit/music/happy.mp3' },
]
