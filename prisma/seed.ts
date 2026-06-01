import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

const GLOBAL_STYLES = [
  {
    name: 'White Studio',
    slug: 'white-studio',
    category: 'Studio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555353540-64580b51c258?w=400&q=80',
    prompt: 'Clean white studio background, professional automotive photography, soft diffused lighting, subtle ground reflection, high-end car dealership setting',
    popularity: 100,
  },
  {
    name: 'City Night',
    slug: 'city-night',
    category: 'Lifestyle',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e6785?w=400&q=80',
    prompt: 'Urban night cityscape background, bokeh city lights, dramatic evening atmosphere, luxury automotive photography, wet asphalt reflection',
    popularity: 90,
  },
  {
    name: 'Mountain Road',
    slug: 'mountain-road',
    category: 'Outdoor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
    prompt: 'Scenic mountain road background, dramatic sky, winding road, adventure lifestyle automotive photography, golden hour lighting',
    popularity: 85,
  },
  {
    name: 'Sunset Coast',
    slug: 'sunset-coast',
    category: 'Outdoor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    prompt: 'Coastal sunset background, ocean view, golden hour light, luxury automotive photography, warm tones, dramatic sky',
    popularity: 80,
  },
  {
    name: 'Dark Studio',
    slug: 'dark-studio',
    category: 'Studio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80',
    prompt: 'Dark dramatic studio background, cinematic lighting, spotlight effect, premium automotive photography, deep shadows, luxury atmosphere',
    popularity: 75,
  },
  {
    name: 'Forest Trail',
    slug: 'forest-trail',
    category: 'Outdoor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80',
    prompt: 'Lush forest trail background, dappled sunlight through trees, nature automotive photography, green tones, adventurous atmosphere',
    popularity: 65,
  },
  {
    name: 'Desert Dunes',
    slug: 'desert-dunes',
    category: 'Outdoor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80',
    prompt: 'Sand desert dunes background, vast landscape, clear blue sky, premium automotive photography, warm earth tones, dramatic light',
    popularity: 60,
  },
  {
    name: 'Showroom Floor',
    slug: 'showroom-floor',
    category: 'Premium',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=400&q=80',
    prompt: 'Luxury car showroom interior background, polished floor reflection, modern architectural elements, premium automotive photography, soft warm lighting',
    popularity: 70,
  },
]

async function main() {
  console.log('Seeding global styles…')

  for (const style of GLOBAL_STYLES) {
    const existing = await prisma.style.findFirst({ where: { slug: style.slug, workspaceId: null } })
    if (existing) {
      await prisma.style.update({ where: { id: existing.id }, data: style })
    } else {
      await prisma.style.create({ data: { ...style, workspaceId: null } })
    }
  }

  console.log(`✅ Seeded ${GLOBAL_STYLES.length} global styles.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
