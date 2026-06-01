/**
 * Creates a fully populated demo user with workspace, vehicles, photos,
 * brand kit and tags so the whole app is navigable immediately.
 *
 * Run:  npx tsx scripts/seed-test-user.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db      = new PrismaClient({ adapter })

const DEMO_EMAIL    = 'demo@carglow.dev'
const DEMO_NAME     = 'Marcus Hill'
const ENHANCED_IMG  = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=85'
const ORIGINAL_IMGS = [
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1400&q=85',
  'https://images.unsplash.com/photo-1555353540-64580b51c258?w=1400&q=85',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1400&q=85',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1400&q=85',
  'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=1400&q=85',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1400&q=85',
]

async function main() {
  console.log('Creating demo user…')

  // ── 1. User ───────────────────────────────────────────────────────────────
  const user = await db.user.upsert({
    where:  { email: DEMO_EMAIL },
    update: { name: DEMO_NAME, emailVerified: new Date() },
    create: {
      email:         DEMO_EMAIL,
      name:          DEMO_NAME,
      emailVerified: new Date(),
    },
  })
  console.log(`  ✓ User           ${user.email}  (id: ${user.id})`)

  // ── 2. Workspace ──────────────────────────────────────────────────────────
  let workspace = await db.workspace.findFirst({ where: { slug: 'summit-auto-group' } })

  if (!workspace) {
    workspace = await db.workspace.create({
      data: {
        name:             'Summit Auto Group',
        slug:             'summit-auto-group',
        plan:             'GROWTH',
        creditsRemaining: 2847,
        creditsPerMonth:  3000,
        planRenewsAt:     new Date('2026-06-30'),
        billingEmail:     'billing@summitauto.com',
      },
    })
  }
  console.log(`  ✓ Workspace      ${workspace.name}  (id: ${workspace.id})`)

  // ── 3. WorkspaceMember ────────────────────────────────────────────────────
  await db.workspaceMember.upsert({
    where:  { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' },
  })
  console.log('  ✓ Member         OWNER')

  // ── 4. BrandKit ───────────────────────────────────────────────────────────
  const existingKit = await db.brandKit.findFirst({ where: { workspaceId: workspace.id } })
  if (!existingKit) {
    await db.brandKit.create({
      data: {
        workspaceId:    workspace.id,
        name:           'Default',
        primaryColor:   '#FF8A3D',
        defaultPlateMask: true,
        isDefault:      true,
      },
    })
  }
  console.log('  ✓ BrandKit       Default')

  // ── 5. Tags ───────────────────────────────────────────────────────────────
  const tagNames = ['Premium', 'Featured', 'Sports', 'SUV', 'Electric']
  const tags: { id: string; name: string }[] = []
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where:  { workspaceId_name: { workspaceId: workspace.id, name } },
      update: {},
      create: { workspaceId: workspace.id, name, color: '#FF8A3D' },
    })
    tags.push(tag)
  }
  console.log(`  ✓ Tags           ${tagNames.join(', ')}`)

  // ── 6. Vehicles + Photos ──────────────────────────────────────────────────
  const vehicles = [
    {
      name: '2023 BMW M3 Competition',
      make: 'BMW', model: 'M3', year: 2023,
      mileage: 8400, price: 89500,
      status: 'LISTED' as const,
      description: 'Sanremo Green · Manual · Full BMW Individual spec',
      photos: [ORIGINAL_IMGS[0], ORIGINAL_IMGS[1]],
      tagIdx: [0, 2],
    },
    {
      name: '2024 Porsche 911 Turbo S',
      make: 'Porsche', model: '911', year: 2024,
      mileage: 1200, price: 231000,
      status: 'READY' as const,
      description: 'GT Silver Metallic · PDK · Burmester sound system',
      photos: [ORIGINAL_IMGS[2], ORIGINAL_IMGS[3]],
      tagIdx: [0, 1, 2],
    },
    {
      name: '2022 Mercedes-AMG GT 63 S',
      make: 'Mercedes-Benz', model: 'AMG GT 63 S', year: 2022,
      mileage: 22000, price: 154900,
      status: 'DRAFT' as const,
      description: 'Obsidian Black · 4MATIC+ · Night Package',
      photos: [ORIGINAL_IMGS[4]],
      tagIdx: [0, 2],
    },
    {
      name: '2024 Tesla Model S Plaid',
      make: 'Tesla', model: 'Model S Plaid', year: 2024,
      mileage: 5600, price: 108000,
      status: 'LISTED' as const,
      description: 'Midnight Silver · 21" Arachnid Wheels · FSD',
      photos: [ORIGINAL_IMGS[5]],
      tagIdx: [1, 4],
    },
    {
      name: '2023 Lamborghini Urus S',
      make: 'Lamborghini', model: 'Urus S', year: 2023,
      mileage: 3100, price: 289000,
      status: 'LISTED' as const,
      description: 'Grigio Lynx · Pearl Capsule · Carbon exterior package',
      photos: [ORIGINAL_IMGS[0], ORIGINAL_IMGS[2]],
      tagIdx: [0, 1, 3],
    },
  ]

  let photoCount = 0
  for (const v of vehicles) {
    const existing = await db.vehicle.findFirst({
      where: { workspaceId: workspace.id, name: v.name },
    })

    const vehicle = existing ?? await db.vehicle.create({
      data: {
        workspaceId: workspace.id,
        name:        v.name,
        make:        v.make,
        model:       v.model,
        year:        v.year,
        mileage:     v.mileage,
        price:       v.price,
        status:      v.status,
        description: v.description,
      },
    })

    // Photos for this vehicle
    for (const origUrl of v.photos) {
      const photo = await db.photo.create({
        data: {
          workspaceId:  workspace.id,
          vehicleId:    vehicle.id,
          originalUrl:  origUrl,
          enhancedUrl:  ENHANCED_IMG,
          thumbnailUrl: ENHANCED_IMG,
          status:       'ENHANCED',
          styleUsed:    'White Studio',
          toolsUsed:    ['background_swap', 'plate_mask'],
          processingMs: 820,
          createdById:  user.id,
        },
      })
      photoCount++

      // Tag some photos
      for (const idx of v.tagIdx.slice(0, 2)) {
        await db.photoTag.upsert({
          where:  { photoId_tagId: { photoId: photo.id, tagId: tags[idx].id } },
          update: {},
          create: { photoId: photo.id, tagId: tags[idx].id },
        })
      }
    }
    console.log(`  ✓ Vehicle        ${v.name}  [${v.status}]  — ${v.photos.length} photo(s)`)
  }

  // ── 7. Credit transaction ─────────────────────────────────────────────────
  const txExists = await db.creditTransaction.findFirst({ where: { workspaceId: workspace.id } })
  if (!txExists) {
    await db.creditTransaction.create({
      data: {
        workspaceId:  workspace.id,
        delta:        3000,
        balanceAfter: 3000,
        reason:       'MONTHLY_GRANT',
        notes:        'Initial GROWTH plan grant',
      },
    })
    // Reflect photo deductions
    await db.creditTransaction.create({
      data: {
        workspaceId:  workspace.id,
        delta:        -photoCount,
        balanceAfter: 3000 - photoCount,
        reason:       'ENHANCEMENT',
        notes:        `Seed: ${photoCount} photos enhanced`,
      },
    })
    await db.workspace.update({
      where: { id: workspace.id },
      data:  { creditsRemaining: 3000 - photoCount },
    })
  }
  console.log(`  ✓ Credits        ${3000 - photoCount} / 3000 (${photoCount} used by seed photos)`)

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  Demo user ready                                             ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  Email     ${DEMO_EMAIL.padEnd(50)}║`)
  console.log('║  Password  (none — magic link)                               ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log('║  1. Go to  http://localhost:3000/signin                      ║')
  console.log(`║  2. Enter  ${DEMO_EMAIL.padEnd(50)}║`)
  console.log('║  3. Copy the magic link from this terminal                   ║')
  console.log('║  4. Open it in the browser → you\'re in                      ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
