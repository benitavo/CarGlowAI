import Stripe from 'stripe'

let cachedStripe: Stripe | null = null

// Lazily constructed so builds/tests that never touch billing don't require STRIPE_SECRET_KEY.
export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  cachedStripe = new Stripe(key)
  return cachedStripe
}

export type SubscriptionPlan = 'ESSENTIAL' | 'PRO' | 'BUSINESS'
export type CreditPackId = 'pack1' | 'pack2' | 'pack3'

// Maps our internal plan/pack identifiers to Stripe Price IDs. Kept in one place so a plan
// rename or a new Stripe price never has to be hunted down across checkout/webhook code.
export function priceIdForPlan(plan: SubscriptionPlan): string {
  const key = `STRIPE_PRICE_${plan}` as const
  const id = process.env[key]
  if (!id) throw new Error(`${key} is not set`)
  return id
}

const PACK_ENV_KEY: Record<CreditPackId, string> = {
  pack1: 'STRIPE_PRICE_PACK_50',
  pack2: 'STRIPE_PRICE_PACK_150',
  pack3: 'STRIPE_PRICE_PACK_400',
}

export function priceIdForPack(pack: CreditPackId): string {
  const key = PACK_ENV_KEY[pack]
  const id = process.env[key]
  if (!id) throw new Error(`${key} is not set`)
  return id
}
