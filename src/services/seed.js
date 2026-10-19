// VKS sneaker catalogue. Prices in integer cents.
const px = (id, w = 900, h = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`

export const CATEGORIES = ['Running', 'Basketball', 'Lifestyle', 'Skate', 'Training']
export const BRANDS = ['VKS Pro', 'Velocity', 'Kinetic', 'Summit', 'Core']
export const GENDERS = ['Men', 'Women', 'Unisex']
export const SIZES = [39, 40, 41, 42, 43, 44, 45]
export const ORDER_STATUSES = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']

export const CATEGORY_IMAGES = {
  Running: px(29699313, 600, 750),
  Basketball: px(27100548, 600, 750),
  Lifestyle: px(19869753, 600, 750),
  Skate: px(4296075, 600, 750),
  Training: px(27385022, 600, 750),
}

/** Colour variants per product; `image` is the gallery shot for that colour. */
const COLORWAYS = {
  p_velo1: [
    { name: 'Beluga / Solar', hex: '#c2703d', image: px(19869753) },
    { name: 'Core Black', hex: '#1f2225', image: px(19869759) },
    { name: 'Citrus', hex: '#e4b73c', image: px(19882433) },
  ],
  p_kine1: [
    { name: 'Royal Blue', hex: '#2b4fa2', image: px(27100548) },
    { name: 'Crimson', hex: '#b4332f', image: px(27113470) },
  ],
  p_core1: [
    { name: 'Grey Suede', hex: '#8d8f93', image: px(30755567) },
    { name: 'Sand', hex: '#c9b79a', image: px(8313383) },
    { name: 'Olive', hex: '#6d7351', image: px(19882430) },
  ],
  p_sum1: [
    { name: 'Storm Grey', hex: '#6b7280', image: px(24702077) },
    { name: 'Slate', hex: '#44505f', image: px(30755567) },
  ],
  p_vks1: [
    { name: 'Lilac', hex: '#a98ad1', image: px(29699304) },
    { name: 'Blush', hex: '#dba6ab', image: px(27385022) },
  ],
  p_core2: [
    { name: 'Off White', hex: '#efece4', image: px(4296075) },
    { name: 'Washed Black', hex: '#2c2c2e', image: px(19882424) },
  ],
  p_kine2: [{ name: 'Carbon Black', hex: '#232629', image: px(8313383) }],
  p_velo2: [
    { name: 'Coral', hex: '#e2705f', image: px(27113472) },
    { name: 'Cream', hex: '#ece2d2', image: px(27113470) },
  ],
  p_sum2: [{ name: 'Liquid Silver', hex: '#c6c9ce', image: px(27113471) }],
  p_vks2: [
    { name: 'Varsity Red', hex: '#b32b2b', image: px(27113470) },
    { name: 'Midnight', hex: '#20252e', image: px(27100548) },
  ],
  p_core3: [{ name: 'Multi Stripe', hex: '#7fa7c4', image: px(19882430) }],
  p_kine3: [
    { name: 'Blaze Orange', hex: '#ef6a1f', image: px(29699313) },
    { name: 'Volt', hex: '#c7dc3f', image: px(19882433) },
  ],
}

const raw = [
  {
    id: 'p_velo1', slug: 'velocity-air-350', name: 'Velocity Air 350', brand: 'Velocity',
    category: 'Running', gender: 'Men', price: 18900, compareAtPrice: 24900, stock: 24,
    rating: 4.8, reviewCount: 212, featured: true, colorway: 'Beluga / Solar Orange',
    images: [px(19869753), px(19869759), px(19882433)],
    description:
      'The Air 350 pairs a knitted upper with a full-length responsive foam midsole. Built for long road miles, it stays breathable in Phnom Penh heat while the sculpted heel keeps you locked in through every stride.',
    features: ['Responsive foam midsole', 'Engineered knit upper', 'Rubber outsole with 4mm lugs', 'Weighs 265g (EU 42)'],
    tags: ['running', 'knit', 'orange', 'road'],
  },
  {
    id: 'p_kine1', slug: 'kinetic-court-high', name: 'Kinetic Court High', brand: 'Kinetic',
    category: 'Basketball', gender: 'Unisex', price: 21900, compareAtPrice: null, stock: 12,
    rating: 4.7, reviewCount: 98, featured: true, colorway: 'Royal Blue / White',
    images: [px(27100548), px(27113470), px(19882424)],
    description:
      'A high-top built for the hardwood. Reinforced ankle support, a herringbone traction pattern and a cushioned collar give you confidence on every cut and landing.',
    features: ['High-top ankle support', 'Herringbone traction', 'Padded collar', 'Reinforced toe box'],
    tags: ['basketball', 'high-top', 'blue', 'court'],
  },
  {
    id: 'p_core1', slug: 'core-suede-classic', name: 'Core Suede Classic', brand: 'Core',
    category: 'Lifestyle', gender: 'Unisex', price: 12900, compareAtPrice: 15900, stock: 40,
    rating: 4.6, reviewCount: 340, featured: true, colorway: 'Grey Suede',
    images: [px(30755567), px(8313383), px(19882430)],
    description:
      'Premium grey suede with a vulcanised rubber sole. A timeless silhouette that works with jeans, shorts or chinos — and only looks better with age.',
    features: ['Premium suede upper', 'Vulcanised rubber sole', 'Cotton laces', 'Cushioned OrthoLite insole'],
    tags: ['lifestyle', 'suede', 'grey', 'classic'],
  },
  {
    id: 'p_sum1', slug: 'summit-trail-gtx', name: 'Summit Trail GTX', brand: 'Summit',
    category: 'Running', gender: 'Men', price: 24900, compareAtPrice: null, stock: 8,
    rating: 4.9, reviewCount: 64, featured: true, colorway: 'Storm Grey',
    images: [px(24702077), px(30755567), px(29520198)],
    description:
      'A waterproof trail runner with an aggressive outsole for wet-season terrain. The gusseted tongue keeps grit out on long descents.',
    features: ['Waterproof membrane', '5mm multi-directional lugs', 'Gusseted tongue', 'Rock plate underfoot'],
    tags: ['trail', 'waterproof', 'grey', 'running'],
  },
  {
    id: 'p_vks1', slug: 'vks-pro-react-1', name: 'VKS Pro React 1', brand: 'VKS Pro',
    category: 'Running', gender: 'Women', price: 16900, compareAtPrice: 19900, stock: 18,
    rating: 4.5, reviewCount: 143, featured: true, colorway: 'Lilac / Butterfly',
    images: [px(29699304), px(27385022), px(29699313)],
    description:
      'Our in-house daily trainer, redesigned on a women-specific last. Lightweight, soft underfoot and finished with an embroidered butterfly detail.',
    features: ['Women-specific last', 'Dual-density foam', 'Embroidered detailing', 'Reflective heel tab'],
    tags: ['running', 'women', 'purple', 'daily'],
  },
  {
    id: 'p_core2', slug: 'core-canvas-low', name: 'Core Canvas Low', brand: 'Core',
    category: 'Skate', gender: 'Unisex', price: 7900, compareAtPrice: 9900, stock: 55,
    rating: 4.3, reviewCount: 410, featured: false, colorway: 'Off White',
    images: [px(4296075), px(19882424), px(8313383)],
    description:
      'A skate-ready canvas low with a double-stitched toe cap and grippy waffle outsole. Simple, durable and endlessly wearable.',
    features: ['12oz organic canvas', 'Waffle grip outsole', 'Double-stitched toe cap', 'Unisex sizing'],
    tags: ['skate', 'canvas', 'white', 'budget'],
  },
  {
    id: 'p_kine2', slug: 'kinetic-flux-trainer', name: 'Kinetic Flux Trainer', brand: 'Kinetic',
    category: 'Training', gender: 'Men', price: 14900, compareAtPrice: null, stock: 30,
    rating: 4.4, reviewCount: 86, featured: false, colorway: 'Carbon Black',
    images: [px(8313383), px(24702077), px(29699313)],
    description:
      'A flat, stable platform designed for the gym. Wide base for lifting, flexible forefoot for conditioning work.',
    features: ['Flat stable heel', 'Flexible forefoot', 'Abrasion-resistant panels', 'Breathable mesh tongue'],
    tags: ['training', 'gym', 'black', 'stable'],
  },
  {
    id: 'p_velo2', slug: 'velocity-street-pop', name: 'Velocity Street Pop', brand: 'Velocity',
    category: 'Lifestyle', gender: 'Women', price: 11900, compareAtPrice: 14900, stock: 26,
    rating: 4.5, reviewCount: 177, featured: false, colorway: 'Coral / Cream',
    images: [px(27113472), px(27113470), px(19882433)],
    description:
      'A chunky-soled lifestyle sneaker in a warm coral colourway. Adds height without the weight.',
    features: ['40mm chunky sole', 'Lightweight EVA', 'Padded ankle', 'Vegan materials'],
    tags: ['lifestyle', 'coral', 'chunky', 'women'],
  },
  {
    id: 'p_sum2', slug: 'summit-metro-silver', name: 'Summit Metro Silver', brand: 'Summit',
    category: 'Lifestyle', gender: 'Women', price: 17900, compareAtPrice: null, stock: 4,
    rating: 4.6, reviewCount: 52, featured: false, colorway: 'Liquid Silver',
    images: [px(27113471), px(27113472), px(19869759)],
    description:
      'A metallic-finish sneaker that catches the light. Soft lining, moulded footbed and a slim profile.',
    features: ['Metallic coated upper', 'Moulded footbed', 'Slim silhouette', 'Anti-slip sole'],
    tags: ['lifestyle', 'silver', 'metallic', 'women'],
  },
  {
    id: 'p_vks2', slug: 'vks-pro-dunk-red', name: 'VKS Pro Dunk Red', brand: 'VKS Pro',
    category: 'Basketball', gender: 'Men', price: 19900, compareAtPrice: 23900, stock: 0,
    rating: 4.7, reviewCount: 121, featured: false, colorway: 'Varsity Red',
    images: [px(27113470), px(27100548), px(27113472)],
    description:
      'Our tribute to 80s hoop style, rebuilt with modern cushioning. Full-grain leather panels and a pivot-point outsole.',
    features: ['Full-grain leather', 'Pivot-point outsole', 'Foam-backed collar', 'Classic cupsole'],
    tags: ['basketball', 'red', 'leather', 'retro'],
  },
  {
    id: 'p_core3', slug: 'core-everyday-slip', name: 'Core Everyday Slip-On', brand: 'Core',
    category: 'Lifestyle', gender: 'Unisex', price: 6900, compareAtPrice: null, stock: 48,
    rating: 4.2, reviewCount: 263, featured: false, colorway: 'Multi Stripe',
    images: [px(19882430), px(19882433), px(4296075)],
    description:
      'An easy slip-on for hot days and quick errands. Elastic side panels and a washable footbed.',
    features: ['Elastic side gores', 'Washable footbed', 'No-laces design', 'Weighs 210g'],
    tags: ['lifestyle', 'slip-on', 'summer', 'budget'],
  },
  {
    id: 'p_kine3', slug: 'kinetic-blaze-track', name: 'Kinetic Blaze Track', brand: 'Kinetic',
    category: 'Running', gender: 'Unisex', price: 22900, compareAtPrice: 27900, stock: 6,
    rating: 4.8, reviewCount: 74, featured: true, colorway: 'Blaze Orange',
    images: [px(29699313), px(19882433), px(29520198)],
    description:
      'A race-day shoe with a carbon-infused plate and a rockered geometry that rolls you forward. Built for personal bests.',
    features: ['Carbon-infused plate', 'Rockered geometry', 'Race-weight 198g', 'Grippy track rubber'],
    tags: ['running', 'race', 'orange', 'carbon'],
  },
].map((p, i) => ({
  ...p,
  image: p.images[0],
  sizes: [...SIZES],
  // Each colour maps to one of the product images so picking a swatch swaps
  // the gallery — the colours are derived from the product's own colourway.
  colors: COLORWAYS[p.id] || [{ name: p.colorway, hex: '#9ca3af', image: p.images[0] }],
  sku: 'VKS-' + p.id.slice(2).toUpperCase().padEnd(6, 'X'),
  createdAt: new Date(Date.UTC(2025, 5, 1 + i * 7)).toISOString(),
}))

export const SEED_PRODUCTS = raw

export const SEED_COUPONS = [
  { id: 'c1', code: 'VKS10', type: 'percent', value: 10, minSpend: 5000, active: true, used: 12, limit: 500, expiresAt: '2026-12-31' },
  { id: 'c2', code: 'FREESHIP', type: 'shipping', value: 0, minSpend: 4000, active: true, used: 43, limit: 1000, expiresAt: '2026-06-30' },
  { id: 'c3', code: 'NEWYEAR25', type: 'fixed', value: 2500, minSpend: 15000, active: false, used: 88, limit: 100, expiresAt: '2026-01-15' },
]

export const PERMISSIONS = ['products', 'inventory', 'orders', 'customers', 'discounts', 'reports', 'settings']

export const SEED_STAFF = [
  { id: 's1', name: 'Sophea Lim', email: 'sophea@vks.store', role: 'manager', permissions: ['products', 'inventory', 'orders', 'reports'], active: true },
  { id: 's2', name: 'Rithy Chan', email: 'rithy@vks.store', role: 'staff', permissions: ['orders', 'inventory'], active: true },
  { id: 's3', name: 'Bopha Sok', email: 'bopha@vks.store', role: 'staff', permissions: ['customers'], active: false },
]

export const SEED_REVIEWS = [
  { id: 'r1', productId: 'p_velo1', userName: 'Sokha C.', rating: 5, comment: 'Super comfortable for long runs around Koh Pich. Fits true to size.', createdAt: '2025-08-02T09:00:00.000Z' },
  { id: 'r2', productId: 'p_velo1', userName: 'Dara P.', rating: 4, comment: 'Great cushioning, but the laces are a bit short for my liking.', createdAt: '2025-08-14T09:00:00.000Z' },
  { id: 'r3', productId: 'p_core1', userName: 'Leakhena S.', rating: 5, comment: 'The suede quality is excellent for the price. Delivered in 2 days.', createdAt: '2025-09-01T09:00:00.000Z' },
  { id: 'r4', productId: 'p_kine1', userName: 'Visal K.', rating: 5, comment: 'Great ankle support, I play twice a week and they hold up well.', createdAt: '2025-09-20T09:00:00.000Z' },
]
