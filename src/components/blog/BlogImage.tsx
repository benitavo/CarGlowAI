import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'
import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

function imageExists(relativePath: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', relativePath))
  } catch {
    return false
  }
}

/**
 * Renders the blog's static hero/card image, or a branded gradient placeholder
 * when the real asset hasn't been uploaded to /public yet (see integration TODO).
 * Must be used inside a `relative` positioned parent — behaves like `fill`.
 */
export function BlogImage({
  src, alt, title, priority, className,
}: { src: string; alt: string; title: string; priority?: boolean; className?: string }) {
  if (!imageExists(src)) {
    return (
      <div className={cn('absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-sage-600 to-midnight', className)}>
        <div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white, transparent 60%)' }}
        />
        <div className="relative text-center px-6">
          <Leaf className="w-6 h-6 text-offwhite/70 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-offwhite/85 font-display font-semibold text-sm leading-snug line-clamp-3">{title}</p>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      className={cn('object-cover', className)}
      sizes="(min-width: 1024px) 800px, 100vw"
    />
  )
}
