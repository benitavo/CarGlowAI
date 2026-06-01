import "dotenv/config"
import { PrismaClient } from "./src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

// Real automotive Unsplash photos mapped per slug
// All photos sourced from the project mock-data — already confirmed to show CARS in context
const THUMBNAILS: Record<string, string> = {
  "white-studio":   "https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&q=80",
  "dark-studio":    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&sat=-80",
  "showroom-floor": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
  "city-night":     "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80",
  "mountain-road":  "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&q=80",
  "sunset-coast":   "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
  "forest-trail":   "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&q=80",
  "desert-dunes":   "https://images.unsplash.com/photo-1617469767053-3f1d2b3ec1f1?w=600&q=80",
}

async function main() {
  for (const [slug, thumbnailUrl] of Object.entries(THUMBNAILS)) {
    const r = await db.style.updateMany({ where: { slug }, data: { thumbnailUrl } })
    console.log(`  ${slug}: ${r.count} updated`)
  }
  console.log("Done.")
}

main().catch(console.error).finally(() => db.$disconnect())
