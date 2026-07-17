// One-off, hand-written migration for the credit-system redesign.
// `prisma migrate dev` is unsafe on this dev DB (pre-existing drift makes it want to `migrate reset`),
// so renames are done here as raw, non-destructive Postgres SQL. Additive changes (new tables/columns)
// are left to `prisma db push` afterwards. Run once: npx tsx scripts/migrate-credits-schema.ts
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

// Each statement runs on its own so a Postgres enum ADD VALUE (which cannot be used in the
// same transaction it was added in) never shares a transaction with a statement that needs it.
const statements = [
  // Plan enum: rename old PRO -> BUSINESS first so the name "PRO" is free for GROWTH to take.
  `ALTER TYPE "Plan" RENAME VALUE 'PRO' TO 'BUSINESS'`,
  `ALTER TYPE "Plan" RENAME VALUE 'GROWTH' TO 'PRO'`,
  `ALTER TYPE "Plan" RENAME VALUE 'STARTER' TO 'ESSENTIAL'`,
  `ALTER TYPE "Plan" RENAME VALUE 'TRIAL' TO 'FREE'`,

  // CreditReason enum: additive only.
  `ALTER TYPE "CreditReason" ADD VALUE IF NOT EXISTS 'MONTHLY_RESET'`,
  `ALTER TYPE "CreditReason" ADD VALUE IF NOT EXISTS 'PACK_PURCHASE'`,

  // Workspace column renames (values preserved).
  `ALTER TABLE "Workspace" RENAME COLUMN "planRenewsAt" TO "renewalDate"`,
  `ALTER TABLE "Workspace" RENAME COLUMN "creditsRemaining" TO "monthlyCredits"`,
]

async function main() {
  for (const sql of statements) {
    console.log('Running:', sql)
    await prisma.$executeRawUnsafe(sql)
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
