import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

async function main() {
  const styleCount     = await prisma.style.count()
  const workspaceCount = await prisma.workspace.count()
  console.log('✅ Connected to Prisma Postgres')
  console.log(`   styles:     ${styleCount}`)
  console.log(`   workspaces: ${workspaceCount}`)
}

main()
  .catch(e => { console.error('❌ Connection failed:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
