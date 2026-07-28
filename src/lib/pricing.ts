// Single source of truth for every pricing number in the app. Nothing outside this file
// (and the admin page that edits the underlying rows) should ever hardcode a credit cost,
// a plan's monthly credit allotment, or a price — read it from here instead.
import { db } from './db'
import type { PricingConfig, AiFeature, Plan } from '@/generated/prisma/client'

let cachedConfig: PricingConfig | null = null
let cachedAt = 0
const CACHE_TTL_MS = 15_000 // short TTL: keeps DB load low but lets admin edits take effect quickly

export async function getPricingConfig(): Promise<PricingConfig> {
  const now = Date.now()
  if (cachedConfig && now - cachedAt < CACHE_TTL_MS) return cachedConfig

  const config = await db.pricingConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  })
  cachedConfig = config
  cachedAt = now
  return config
}

// Call after any admin write to PricingConfig so the new values are visible immediately.
export function invalidatePricingCache() {
  cachedConfig = null
}

export async function getAiFeature(key: string): Promise<AiFeature | null> {
  return db.aiFeature.findUnique({ where: { key } })
}

export async function listAiFeatures(): Promise<AiFeature[]> {
  return db.aiFeature.findMany({ orderBy: { key: 'asc' } })
}

// Monthly recurring allotment for a plan, including FREE (1 credit/month by default).
// Paid plans reset via the Stripe renewal webhook; FREE has no subscription to key off, so
// it's reset by the /api/cron/reset-free-credits job instead — see that route for the cadence.
export function monthlyCreditsForPlan(config: PricingConfig, plan: Plan): number {
  switch (plan) {
    case 'FREE':
      return config.freeCredits
    case 'ESSENTIAL':
      return config.essentialCredits
    case 'PRO':
      return config.proCredits
    case 'BUSINESS':
      return config.businessCredits
    case 'ENTERPRISE':
      return config.businessCredits // custom tier: real allotment is set per-workspace by an admin
  }
}

export function priceForPlan(config: PricingConfig, plan: Plan): number {
  switch (plan) {
    case 'FREE':
      return 0
    case 'ESSENTIAL':
      return config.essentialPrice
    case 'PRO':
      return config.proPrice
    case 'BUSINESS':
      return config.businessPrice
    case 'ENTERPRISE':
      return config.businessPrice
  }
}

export interface CreditPack {
  id: 'pack1' | 'pack2' | 'pack3'
  credits: number
  price: number
}

export function creditPacks(config: PricingConfig): CreditPack[] {
  return [
    { id: 'pack1', credits: config.pack1Credits, price: config.pack1Price },
    { id: 'pack2', credits: config.pack2Credits, price: config.pack2Price },
    { id: 'pack3', credits: config.pack3Credits, price: config.pack3Price },
  ]
}

export interface ActivePromo {
  label: string
  plan: string
  originalPrice: number
  discountedPrice: number
  code: string
  endDate: string // ISO date, for display ("jusqu'au ...") — not used for the active check itself
}

// The single place that decides whether the promo is actually live right now — reused by the
// public pricing API (banner, pricing cards) and the checkout route (auto-applying the Stripe
// code), so none of them can drift out of sync with each other about whether it's still on.
// Toggling promoEnabled off (or letting promoEndDate pass) turns it off everywhere at once,
// no redeploy needed.
export function activePromo(config: PricingConfig): ActivePromo | null {
  if (!config.promoEnabled) return null
  if (!config.promoPlan || config.promoDiscountedPrice == null || !config.promoCode || !config.promoLabel) return null
  if (config.promoEndDate && config.promoEndDate.getTime() < Date.now()) return null

  const originalPrice = config.promoPlan === 'ESSENTIAL' ? config.essentialPrice
    : config.promoPlan === 'PRO' ? config.proPrice
    : config.promoPlan === 'BUSINESS' ? config.businessPrice
    : null
  if (originalPrice == null) return null

  return {
    label: config.promoLabel,
    plan: config.promoPlan,
    originalPrice,
    discountedPrice: config.promoDiscountedPrice,
    code: config.promoCode,
    endDate: config.promoEndDate?.toISOString() ?? '',
  }
}
