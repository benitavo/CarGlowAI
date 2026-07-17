// One-off data backfill for the credit-system redesign. Run once, after
// scripts/migrate-credits-schema.ts and `prisma db push`:
//   npx tsx scripts/backfill-credits.ts
//
// 1. Seeds the PricingConfig singleton row (id="global") with the agreed defaults.
// 2. Seeds the three core AiFeature rows (imageGeneration, imageRetouch, videoGeneration).
// 3. Grandfathers each workspace's pre-migration balance (currently sitting in `monthlyCredits`
//    after the column rename) into `bonusCredits` so nobody loses credits they already paid for,
//    then resets `monthlyCredits` to a fresh allotment for their plan.
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const config = await prisma.pricingConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global' }, // all fields have schema defaults matching the spec
    update: {},
  })
  console.log('PricingConfig:', config)

  const features: Array<{ key: string; label: string; creditCost: number }> = [
    { key: 'imageGeneration', label: 'Image generation', creditCost: 1 },
    { key: 'imageRetouch', label: 'Image retouch', creditCost: 1 },
    { key: 'videoGeneration', label: 'Video generation', creditCost: 15 },
  ]
  for (const f of features) {
    await prisma.aiFeature.upsert({
      where: { key: f.key },
      create: { ...f, enabled: true },
      update: {},
    })
  }
  console.log('AiFeature rows seeded.')

  const creditsForPlan = (plan: string): number => {
    switch (plan) {
      case 'FREE':
        return config.freeCredits
      case 'ESSENTIAL':
        return config.essentialCredits
      case 'PRO':
        return config.proCredits
      case 'BUSINESS':
        return config.businessCredits
      default:
        return config.freeCredits // ENTERPRISE: custom, defaults conservatively until set manually
    }
  }

  const workspaces = await prisma.workspace.findMany({
    select: { id: true, plan: true, monthlyCredits: true, bonusCredits: true },
  })

  for (const ws of workspaces) {
    const freshMonthly = creditsForPlan(ws.plan)
    await prisma.workspace.update({
      where: { id: ws.id },
      data: {
        bonusCredits: ws.bonusCredits + ws.monthlyCredits, // grandfather old balance in, never expires
        monthlyCredits: freshMonthly,
        lastCreditReset: new Date(),
      },
    })
    console.log(
      `Workspace ${ws.id}: plan=${ws.plan} oldBalance=${ws.monthlyCredits} -> bonusCredits+=${ws.monthlyCredits}, monthlyCredits=${freshMonthly}`
    )
  }

  console.log(`Backfilled ${workspaces.length} workspaces.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
