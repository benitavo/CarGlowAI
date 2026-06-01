// ─────────────────────────────────────────────────────────────────────────────
// Mock fixtures for the CarGlow demo app.
// In production these come from Prisma queries; here we hard-code so the UI
// renders without a database. Photos use Unsplash placeholders.
// ─────────────────────────────────────────────────────────────────────────────

export type Vehicle = {
  id: string
  name: string
  vin: string
  make: string
  model: string
  year: number
  mileage: number
  price: number
  status: 'Draft' | 'Ready' | 'Listed' | 'Sold'
  coverUrl: string
  photoCount: number
  updatedAt: string
}

export type Photo = {
  id: string
  vehicleId: string
  vehicleName: string
  originalUrl: string
  enhancedUrl: string
  thumbnailUrl: string
  status: 'Enhanced' | 'Processing' | 'Queued' | 'Failed' | 'Uploaded'
  styleUsed: string
  toolsUsed: string[]
  processingMs: number
  createdBy: string
  createdByAvatar: string
  createdAt: string
  tags: string[]
  folder?: string
}

export type Style = {
  id: string
  name: string
  slug: string
  category: 'Studio' | 'Outdoor' | 'Lifestyle' | 'Premium' | 'Minimal'
  thumbnailUrl: string
  isCustom: boolean
  usageCount: number
  isFavorite?: boolean
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer'
  avatar: string
  lastActive: string
  seatStatus: 'Active' | 'Pending' | 'Suspended'
}

// ── Vehicles ────────────────────────────────────────────────────────────────

export const vehicles: Vehicle[] = [
  {
    id: 'v_001',
    name: '2022 Porsche 911 Carrera S',
    vin: 'WP0AB2A99NS220148',
    make: 'Porsche', model: '911 Carrera S', year: 2022,
    mileage: 12_400, price: 138_900,
    status: 'Listed',
    coverUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    photoCount: 24, updatedAt: '2h ago',
  },
  {
    id: 'v_002',
    name: '2021 BMW M4 Competition',
    vin: 'WBS43AY03MFK21849',
    make: 'BMW', model: 'M4 Competition', year: 2021,
    mileage: 18_900, price: 79_500,
    status: 'Ready',
    coverUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80',
    photoCount: 18, updatedAt: '5h ago',
  },
  {
    id: 'v_003',
    name: '2023 Mercedes-AMG GT 63',
    vin: 'W1KCV8KB1PA118372',
    make: 'Mercedes-Benz', model: 'AMG GT 63', year: 2023,
    mileage: 6_200, price: 168_000,
    status: 'Listed',
    coverUrl: 'https://images.unsplash.com/photo-1617469767053-3f1d2b3ec1f1?w=1200&q=80',
    photoCount: 31, updatedAt: 'Yesterday',
  },
  {
    id: 'v_004',
    name: '2020 Audi RS6 Avant',
    vin: 'WUAPCBF24LN902184',
    make: 'Audi', model: 'RS6 Avant', year: 2020,
    mileage: 28_400, price: 112_000,
    status: 'Ready',
    coverUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80',
    photoCount: 22, updatedAt: '2d ago',
  },
  {
    id: 'v_005',
    name: '2019 Ford Mustang GT',
    vin: '1FA6P8CF8K5118947',
    make: 'Ford', model: 'Mustang GT', year: 2019,
    mileage: 41_200, price: 32_500,
    status: 'Sold',
    coverUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80',
    photoCount: 16, updatedAt: '4d ago',
  },
  {
    id: 'v_006',
    name: '2022 Tesla Model S Plaid',
    vin: '5YJSA1E68NF477283',
    make: 'Tesla', model: 'Model S Plaid', year: 2022,
    mileage: 9_800, price: 98_900,
    status: 'Draft',
    coverUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&q=80',
    photoCount: 8, updatedAt: '1w ago',
  },
  {
    id: 'v_007',
    name: '2021 Range Rover Sport SVR',
    vin: 'SALWR2RE5MA771230',
    make: 'Land Rover', model: 'Range Rover Sport SVR', year: 2021,
    mileage: 22_100, price: 96_400,
    status: 'Listed',
    coverUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80',
    photoCount: 19, updatedAt: '2w ago',
  },
]

// ── Photos ──────────────────────────────────────────────────────────────────

const PHOTO_URLS = [
  'photo-1503376780353-7e6692767b70', // 911
  'photo-1555215695-3004980ad54e',    // M4
  'photo-1617469767053-3f1d2b3ec1f1', // AMG GT
  'photo-1606664515524-ed2f786a0bd6', // RS6
  'photo-1494976388531-d1058494cdd8', // Mustang
  'photo-1617788138017-80ad40651399', // Tesla
  'photo-1544636331-e26879cd4d9b',    // generic
  'photo-1583121274602-3e2820c69888', // generic
  'photo-1552519507-da3b142c6e3d',    // generic
  'photo-1502877338535-766e1452684a', // generic
  'photo-1542362567-b07e54358753',    // generic
  'photo-1568605117036-5fe5e7bab0b7', // generic
]

const STYLE_NAMES = ['Studio White', 'Showroom Bronze', 'Coastal Drive', 'Urban Sunset', 'Mountain Pass', 'Pure Grey']
const TOOLS = [
  ['Background swap', 'Plate & logo'],
  ['Background swap'],
  ['Background swap', 'Plate & logo'],
  ['Plate & logo'],
  ['Background swap', 'Plate & logo'],
  ['Background swap'],
]
const PEOPLE = [
  { name: 'Marcus Hill',  avatar: 'https://i.pravatar.cc/100?img=14' },
  { name: 'Aïcha Diop',   avatar: 'https://i.pravatar.cc/100?img=44' },
  { name: 'Yuki Tanaka',  avatar: 'https://i.pravatar.cc/100?img=33' },
  { name: 'Sofia Romano', avatar: 'https://i.pravatar.cc/100?img=47' },
]
const RELATIVE_TIMES = ['Just now', '12m ago', '34m ago', '1h ago', '2h ago', '4h ago', 'Yesterday', '2d ago', '3d ago', '1w ago']

function makePhoto(i: number): Photo {
  const veh = vehicles[i % vehicles.length]
  const status: Photo['status'] = i === 2 ? 'Processing' : i === 5 ? 'Failed' : i === 11 ? 'Queued' : 'Enhanced'
  const person = PEOPLE[i % PEOPLE.length]
  return {
    id: `p_${String(i).padStart(3, '0')}`,
    vehicleId: veh.id,
    vehicleName: veh.name,
    originalUrl: `https://images.unsplash.com/${PHOTO_URLS[i % PHOTO_URLS.length]}?w=1600&q=80`,
    enhancedUrl: `https://images.unsplash.com/${PHOTO_URLS[i % PHOTO_URLS.length]}?w=1600&q=85&sat=-30`,
    thumbnailUrl: `https://images.unsplash.com/${PHOTO_URLS[i % PHOTO_URLS.length]}?w=400&q=70`,
    status,
    styleUsed: STYLE_NAMES[i % STYLE_NAMES.length],
    toolsUsed: TOOLS[i % TOOLS.length],
    processingMs: 1800 + (i * 137) % 1200,
    createdBy: person.name,
    createdByAvatar: person.avatar,
    createdAt: RELATIVE_TIMES[i % RELATIVE_TIMES.length],
    tags: i % 3 === 0 ? ['hero shot', 'website'] : i % 3 === 1 ? ['marketplace'] : ['social'],
    folder: i % 4 === 0 ? 'Q1 Inventory' : i % 4 === 1 ? 'Used Cars' : undefined,
  }
}

export const photos: Photo[] = Array.from({ length: 32 }, (_, i) => makePhoto(i))

// ── Styles ──────────────────────────────────────────────────────────────────

export const styles: Style[] = [
  // Studio
  { id: 's_01', name: 'Studio White',     slug: 'studio-white',     category: 'Studio',    thumbnailUrl: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&q=80', isCustom: false, usageCount: 14_802, isFavorite: true },
  { id: 's_02', name: 'Studio Black',     slug: 'studio-black',     category: 'Studio',    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&sat=-100', isCustom: false, usageCount: 9_412 },
  { id: 's_03', name: 'Showroom Bronze',  slug: 'showroom-bronze',  category: 'Studio',    thumbnailUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80', isCustom: false, usageCount: 12_088 },
  { id: 's_04', name: 'Soft Grey Cyc',    slug: 'soft-grey-cyc',    category: 'Studio',    thumbnailUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80&sat=-50', isCustom: false, usageCount: 7_233 },
  // Outdoor
  { id: 's_05', name: 'Coastal Drive',    slug: 'coastal-drive',    category: 'Outdoor',   thumbnailUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80', isCustom: false, usageCount: 8_440, isFavorite: true },
  { id: 's_06', name: 'Mountain Pass',    slug: 'mountain-pass',    category: 'Outdoor',   thumbnailUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&q=80', isCustom: false, usageCount: 6_120 },
  { id: 's_07', name: 'Forest Road',      slug: 'forest-road',      category: 'Outdoor',   thumbnailUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&q=80', isCustom: false, usageCount: 4_330 },
  { id: 's_08', name: 'Desert Highway',   slug: 'desert-highway',   category: 'Outdoor',   thumbnailUrl: 'https://images.unsplash.com/photo-1617469767053-3f1d2b3ec1f1?w=600&q=80', isCustom: false, usageCount: 3_902 },
  // Lifestyle
  { id: 's_09', name: 'Urban Sunset',     slug: 'urban-sunset',     category: 'Lifestyle', thumbnailUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80', isCustom: false, usageCount: 11_204 },
  { id: 's_10', name: 'City at Night',    slug: 'city-night',       category: 'Lifestyle', thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80', isCustom: false, usageCount: 7_882 },
  { id: 's_11', name: 'Rooftop Garage',   slug: 'rooftop-garage',   category: 'Lifestyle', thumbnailUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80', isCustom: false, usageCount: 5_640 },
  // Premium
  { id: 's_12', name: 'Marble Showroom',  slug: 'marble-showroom',  category: 'Premium',   thumbnailUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80', isCustom: false, usageCount: 4_211 },
  { id: 's_13', name: 'Estate Driveway',  slug: 'estate-driveway',  category: 'Premium',   thumbnailUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80', isCustom: false, usageCount: 3_104 },
  // Minimal
  { id: 's_14', name: 'Pure Grey',        slug: 'pure-grey',        category: 'Minimal',   thumbnailUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80&sat=-100', isCustom: false, usageCount: 6_900 },
  { id: 's_15', name: 'Off-White Fade',   slug: 'off-white',        category: 'Minimal',   thumbnailUrl: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&q=80', isCustom: false, usageCount: 4_500 },
]

// ── Team ────────────────────────────────────────────────────────────────────

export const teamMembers: TeamMember[] = [
  { id: 'u_1', name: 'Marcus Hill',     email: 'marcus@summitauto.com',  role: 'Owner',  avatar: 'https://i.pravatar.cc/100?img=14', lastActive: 'Now',         seatStatus: 'Active' },
  { id: 'u_2', name: 'Aïcha Diop',      email: 'aicha@summitauto.com',   role: 'Admin',  avatar: 'https://i.pravatar.cc/100?img=44', lastActive: '12m ago',     seatStatus: 'Active' },
  { id: 'u_3', name: 'Yuki Tanaka',     email: 'yuki@summitauto.com',    role: 'Editor', avatar: 'https://i.pravatar.cc/100?img=33', lastActive: '2h ago',      seatStatus: 'Active' },
  { id: 'u_4', name: 'Sofia Romano',    email: 'sofia@summitauto.com',   role: 'Editor', avatar: 'https://i.pravatar.cc/100?img=47', lastActive: 'Yesterday',   seatStatus: 'Active' },
  { id: 'u_5', name: 'James Park',      email: 'james@summitauto.com',   role: 'Editor', avatar: 'https://i.pravatar.cc/100?img=12', lastActive: '3d ago',      seatStatus: 'Active' },
  { id: 'u_6', name: 'Priya Sharma',    email: 'priya@summitauto.com',   role: 'Viewer', avatar: 'https://i.pravatar.cc/100?img=23', lastActive: '1w ago',      seatStatus: 'Active' },
]

export const pendingInvites = [
  { id: 'inv_1', email: 'lukas@summitauto.com', role: 'Editor' as const, sentAt: '2d ago' },
  { id: 'inv_2', email: 'mei@summitauto.com',   role: 'Viewer' as const, sentAt: '5d ago' },
]

// ── Workspace / user ────────────────────────────────────────────────────────

export const currentUser = {
  id: 'u_1',
  name: 'Marcus Hill',
  firstName: 'Marcus',
  email: 'marcus@summitauto.com',
  avatar: 'https://i.pravatar.cc/100?img=14',
}

export const currentWorkspace = {
  id: 'w_1',
  name: 'Summit Auto Group',
  logoUrl: undefined as string | undefined,
  plan: 'Growth' as const,
  planRenewsAt: 'May 28, 2026',
  daysUntilRenewal: 3,
  creditsRemaining: 1840,
  creditsPerMonth: 3000,
  memberCount: 6,
}

export const workspaces = [
  { id: 'w_1', name: 'Summit Auto Group',  plan: 'Growth',   memberCount: 6 },
  { id: 'w_2', name: 'Coastal Motors',     plan: 'Starter',  memberCount: 2 },
  { id: 'w_3', name: 'Demo Workspace',     plan: 'Trial',    memberCount: 1 },
]

// ── Usage / KPIs ────────────────────────────────────────────────────────────

export function usageSeries(days = 90): { date: string; photos: number; credits: number }[] {
  const out: { date: string; photos: number; credits: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // smooth-ish wave with weekend dips
    const base = 35 + Math.sin(i / 6) * 12 + Math.cos(i / 11) * 8
    const weekend = (d.getDay() === 0 || d.getDay() === 6) ? 0.35 : 1
    const photos = Math.max(0, Math.round((base + (i % 7) * 2) * weekend))
    out.push({
      date: d.toISOString().slice(0, 10),
      photos,
      credits: photos,
    })
  }
  return out
}

export const sparkline = (n = 14) =>
  Array.from({ length: n }, (_, i) => ({
    i,
    v: 20 + Math.sin(i / 2) * 8 + Math.cos(i / 3) * 6 + (i % 5),
  }))

// ── Activity feed ───────────────────────────────────────────────────────────

export const activity = [
  { id: 'a_1', who: 'Aïcha Diop',   avatar: 'https://i.pravatar.cc/100?img=44', verb: 'enhanced',         what: '14 photos for 2022 Porsche 911',     when: '12m ago' },
  { id: 'a_2', who: 'Yuki Tanaka',  avatar: 'https://i.pravatar.cc/100?img=33', verb: 'invited',          what: 'lukas@summitauto.com as Editor',     when: '34m ago' },
  { id: 'a_3', who: 'Sofia Romano', avatar: 'https://i.pravatar.cc/100?img=47', verb: 'published',        what: 'AMG GT 63 listing to AutoTrader',    when: '1h ago' },
  { id: 'a_4', who: 'Marcus Hill',  avatar: 'https://i.pravatar.cc/100?img=14', verb: 'created',          what: 'new brand kit "Showroom Munich"',    when: '2h ago' },
  { id: 'a_5', who: 'James Park',   avatar: 'https://i.pravatar.cc/100?img=12', verb: 'updated',          what: 'default background to Showroom Bronze', when: 'Yesterday' },
  { id: 'a_6', who: 'Aïcha Diop',   avatar: 'https://i.pravatar.cc/100?img=44', verb: 'enhanced',         what: '47 photos in Q1 Inventory',          when: 'Yesterday' },
]

// ── Integrations ────────────────────────────────────────────────────────────

export const integrations = [
  { id: 'wordpress',  name: 'WordPress',    desc: 'Push photos straight into post galleries',     icon: '🌐', connected: true,  lastSync: '12m ago' },
  { id: 'autotrader', name: 'AutoTrader',   desc: 'One-click upload to listings',                  icon: '🚗', connected: true,  lastSync: '1h ago' },
  { id: 'mobile-de',  name: 'Mobile.de',    desc: 'European #1 vehicle marketplace',              icon: '🇩🇪', connected: false },
  { id: 'autoscout',  name: 'AutoScout24',  desc: 'Cross-border European listings',                icon: '🇪🇺', connected: true,  lastSync: '4h ago' },
  { id: 'lacentrale', name: 'La Centrale',  desc: 'France\'s leading auto marketplace',           icon: '🇫🇷', connected: false },
  { id: 'leboncoin',  name: 'Leboncoin',    desc: 'French classifieds platform',                  icon: '🛒', connected: false },
  { id: 'cargurus',   name: 'CarGurus',     desc: 'US & international shopper traffic',           icon: '🚙', connected: true,  lastSync: 'Yesterday' },
  { id: 'zapier',     name: 'Zapier',       desc: '7,000+ app automation triggers',               icon: '⚡', connected: false },
  { id: 'make',       name: 'Make',         desc: 'Visual workflow automation',                   icon: '🔧', connected: false },
  { id: 'webhook',    name: 'Webhooks',     desc: 'Real-time event delivery to any HTTPS URL',    icon: '🪝', connected: true,  lastSync: '8m ago' },
  { id: 'api',        name: 'REST API',     desc: 'Programmatic access to everything',            icon: '⚙️', connected: true,  lastSync: '2m ago' },
]

export const apiKeys = [
  { id: 'k_1', label: 'Production',  prefix: 'cg_live_8KqR4mP2',   scopes: ['photos:read', 'photos:write', 'vehicles:*'], lastUsed: '2m ago',  createdAt: 'Jan 12, 2026' },
  { id: 'k_2', label: 'Staging',     prefix: 'cg_test_3FfN9wXc',   scopes: ['photos:read', 'photos:write'],               lastUsed: '3h ago',  createdAt: 'Feb 04, 2026' },
  { id: 'k_3', label: 'Zapier',      prefix: 'cg_live_7AbT2sLp',   scopes: ['photos:read'],                               lastUsed: 'Yesterday', createdAt: 'Mar 18, 2026' },
]

export const webhooks = [
  { id: 'w_1', url: 'https://api.summitauto.com/hooks/carglow',           events: ['photo.enhanced', 'batch.completed'],          active: true,  lastFired: '12m ago' },
  { id: 'w_2', url: 'https://hooks.zapier.com/hooks/catch/482/abc123',     events: ['photo.enhanced'],                              active: true,  lastFired: '1h ago' },
  { id: 'w_3', url: 'https://staging.summitauto.com/webhook',              events: ['credits.low', 'vehicle.created'],              active: false, lastFired: '3d ago' },
]

// ── Billing ─────────────────────────────────────────────────────────────────

export const invoices = [
  { id: 'in_001', number: 'CG-2026-0042', date: 'Apr 28, 2026', amount: 'Eur 249.00', status: 'Paid'   },
  { id: 'in_002', number: 'CG-2026-0028', date: 'Mar 28, 2026', amount: 'Eur 249.00', status: 'Paid'   },
  { id: 'in_003', number: 'CG-2026-0014', date: 'Feb 28, 2026', amount: 'Eur 249.00', status: 'Paid'   },
  { id: 'in_004', number: 'CG-2026-0007', date: 'Jan 28, 2026', amount: 'Eur 49.00',  status: 'Paid'   },
  { id: 'in_005', number: 'CG-2026-0001', date: 'Jan 12, 2026', amount: 'Eur 0.00',   status: 'Trial' },
]

export const creditPacks = [
  { id: 'cp_500',  credits:   500, price:  39, perPhoto: '0.078' },
  { id: 'cp_2000', credits: 2_000, price: 129, perPhoto: '0.065', popular: true },
  { id: 'cp_5000', credits: 5_000, price: 279, perPhoto: '0.056' },
  { id: 'cp_15k',  credits: 15_000, price: 699, perPhoto: '0.047' },
]

