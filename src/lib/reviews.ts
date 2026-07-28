import { db } from '@/lib/db'
import { TESTIMONIALS as SEED_TESTIMONIALS } from './testimonials'

export interface PublicTestimonial {
  quote: string
  name: string
  role: string | null
  location: string | null
  stars: number
}

// Real, admin-approved customer reviews (see /app/review + /app/admin/reviews), padded with
// the original 3 seed testimonials until there are enough real ones to stand on their own —
// once 3+ are approved, the seed set stops appearing at all.
export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  const approved = await db.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    select: { quote: true, displayName: true, role: true, location: true, stars: true },
  })

  const mapped = approved.map(r => ({ quote: r.quote, name: r.displayName, role: r.role, location: r.location, stars: r.stars }))

  if (mapped.length >= 3) return mapped
  return [...mapped, ...SEED_TESTIMONIALS]
}
