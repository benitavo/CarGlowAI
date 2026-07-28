import { cn } from '@/lib/utils'

// Real customers, quoted with their permission — but we don't have an actual photo of
// them, and a stock/generated face crop isn't a picture of that person either. Initials
// are the honest option: recognizable as a person without implying a real photo exists.
export function TestimonialAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')

  return (
    <div className={cn(
      'rounded-full bg-sage-100 text-sage-700 font-display font-semibold flex items-center justify-center text-sm',
      className,
    )}>
      {initials}
    </div>
  )
}
