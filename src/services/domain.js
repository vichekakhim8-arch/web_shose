// Pure business rules shared by the browser adapter and the Node backend.
// NOTE: no `@/` alias imports here — Node runs this file directly.

export const FREE_SHIPPING_THRESHOLD = 10000 // $100 in cents
export const TAX_RATE = 0.1

export const DEFAULT_SETTINGS = {
  colorPreset: 'flame',
  primaryColor: '#f26b1d',
  bannerImage:
    'https://images.pexels.com/photos/19882433/pexels-photo-19882433.jpeg?auto=compress&cs=tinysrgb&w=1600&h=600&fit=crop',
  bannerHeadingEn: 'Step into the new season',
  bannerHeadingKm: 'ចូលរួមរដូវកាលថ្មី',
  bannerSubEn: 'Up to 30% off selected sneakers',
  bannerSubKm: 'បញ្ចុះតម្លៃរហូតដល់ ៣០%',

  // Hero carousel — fully admin controlled
  heroSource: 'featured', // 'featured' | 'newest' | 'sale' | 'manual'
  heroIds: [],            // used when heroSource === 'manual'
  heroCount: 5,
  heroAutoplay: true,
  heroInterval: 5,        // seconds
  heroEyebrowEn: 'New season drop',
  heroEyebrowKm: 'ទំនិញថ្មីប្រចាំរដូវ',
  heroCtaEn: 'Buy now',
  heroCtaKm: 'ទិញឥឡូវនេះ',
  bakongAccount: 'vks_store@wing',
  merchantName: 'VKS SNEAKERS',
  merchantCity: 'PHNOM PENH',
  currency: 'USD',
}

export function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function filterProducts(products, params = {}) {
  const {
    q = '', category = '', brand = '', gender = '', size = '',
    minPrice = '', maxPrice = '', inStock = false, onSale = false,
    sort = 'featured', page = 1, pageSize = 12,
  } = params

  const multi = (v) => String(v).split(',').filter(Boolean)
  let list = [...products]

  const query = String(q).trim().toLowerCase()
  if (query) {
    list = list.filter((p) =>
      [p.name, p.brand, p.category, p.colorway, p.description, ...(p.tags || [])]
        .join(' ').toLowerCase().includes(query),
    )
  }
  if (category) list = list.filter((p) => multi(category).includes(p.category))
  if (brand) list = list.filter((p) => multi(brand).includes(p.brand))
  if (gender) list = list.filter((p) => multi(gender).includes(p.gender))
  if (size) list = list.filter((p) => (p.sizes || []).some((s) => multi(size).includes(String(s))))
  if (minPrice !== '' && !Number.isNaN(Number(minPrice))) list = list.filter((p) => p.price >= Number(minPrice) * 100)
  if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) list = list.filter((p) => p.price <= Number(maxPrice) * 100)
  if (inStock === true || inStock === 'true' || inStock === '1') list = list.filter((p) => p.stock > 0)
  if (onSale === true || onSale === 'true' || onSale === '1') list = list.filter((p) => p.compareAtPrice > p.price)

  const sorters = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    name: (a, b) => a.name.localeCompare(b.name),
  }
  list.sort(sorters[sort] || sorters.featured)

  const total = list.length
  const sz = Math.max(1, Number(pageSize) || 12)
  const cur = Math.max(1, Number(page) || 1)
  return { items: list.slice((cur - 1) * sz, cur * sz), total, page: cur, pageSize: sz, pages: Math.max(1, Math.ceil(total / sz)) }
}

export function computeTotals(lines, shippingFee = 0) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shippingFee
  const tax = Math.round(subtotal * TAX_RATE)
  return { subtotal, shipping, tax, total: subtotal + shipping + tax }
}

export function validateProduct(d) {
  const e = {}
  if (!d.name || String(d.name).trim().length < 2) e.name = 'Name is required'
  if (!d.category) e.category = 'Category is required'
  if (!d.brand) e.brand = 'Brand is required'
  if (!Number.isInteger(d.price) || d.price <= 0) e.price = 'Price must be greater than 0'
  if (!Number.isInteger(d.stock) || d.stock < 0) e.stock = 'Stock must be 0 or more'
  if (!d.image) e.image = 'At least one image is required'
  if (!d.description || String(d.description).trim().length < 10) e.description = 'Description must be at least 10 characters'
  return e
}

export function validateShipping(s = {}) {
  const e = {}
  if (!s.fullName?.trim()) e.fullName = 'Full name is required'
  if (!/^[0-9+\-\s()]{8,15}$/.test(s.phone || '')) e.phone = 'Valid phone number is required'
  if (!/^\S+@\S+\.\S+$/.test(s.email || '')) e.email = 'Valid email is required'
  if (!s.address?.trim()) e.address = 'Address is required'
  if (!s.city?.trim()) e.city = 'City / province is required'
  return e
}

export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export function publicUser(u) {
  if (!u) return null
  const { passwordHash, salt, ...rest } = u
  return rest
}

export function buildOrder({ items, shipping, payment }, products, user) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty')
  const errs = validateShipping(shipping)
  if (Object.keys(errs).length) throw new HttpError(422, 'Please check your delivery details', errs)

  const lines = items.map(({ productId, quantity, size }) => {
    const p = products.find((x) => x.id === productId)
    if (!p) throw new HttpError(404, 'A product in your cart no longer exists')
    const qty = Math.floor(Number(quantity))
    if (!qty || qty < 1) throw new HttpError(400, 'Invalid quantity')
    if (p.stock < qty) throw new HttpError(409, `Only ${p.stock} left of "${p.name}"`)
    return { productId: p.id, name: p.name, image: p.image, price: p.price, quantity: qty, size: size || null, sku: p.sku }
  })

  const t = computeTotals(lines, Number(shipping.shippingFee) || 0)
  const method = payment?.method === 'cod' ? 'cod' : 'khqr'
  return {
    id: 'VKS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
    userId: user.id,
    customerName: shipping.fullName,
    customerEmail: shipping.email,
    customerPhone: shipping.phone,
    lines,
    subtotal: t.subtotal,
    shippingCost: t.shipping,
    tax: t.tax,
    total: t.total,
    shipping,
    payment: { method, reference: payment?.reference || null },
    status: method === 'cod' ? 'pending' : 'paid',
    createdAt: new Date().toISOString(),
  }
}

export function computeStats(products, orders, users, days = 14) {
  const valid = orders.filter((o) => o.status !== 'cancelled')
  const revenue = valid.reduce((s, o) => s + o.total, 0)

  const byDay = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    byDay[d.toISOString().slice(0, 10)] = { total: 0, orders: 0 }
  }
  valid.forEach((o) => {
    const k = o.createdAt.slice(0, 10)
    if (byDay[k]) {
      byDay[k].total += o.total
      byDay[k].orders += 1
    }
  })

  const sold = {}
  valid.forEach((o) => o.lines.forEach((l) => (sold[l.productId] = (sold[l.productId] || 0) + l.quantity)))

  const byCategory = {}
  valid.forEach((o) =>
    o.lines.forEach((l) => {
      const p = products.find((x) => x.id === l.productId)
      if (p) byCategory[p.category] = (byCategory[p.category] || 0) + l.price * l.quantity
    }),
  )

  return {
    revenue,
    orderCount: orders.length,
    customerCount: users.filter((u) => u.role === 'customer').length,
    productCount: products.length,
    avgOrder: valid.length ? Math.round(revenue / valid.length) : 0,
    lowStock: products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock),
    revenueByDay: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
    byCategory: Object.entries(byCategory).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total),
    topProducts: Object.entries(sold)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
      .filter((x) => x.product),
    recentOrders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
  }
}

/** Bulk discount: remembers the original price in compareAtPrice so it can be undone. */
export function applyBulkDiscount(products, percent) {
  const pct = Math.max(1, Math.min(90, Number(percent) || 0))
  return products.map((p) => {
    const original = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : p.price
    return { ...p, compareAtPrice: original, price: Math.max(100, Math.round(original * (1 - pct / 100))) }
  })
}

export function clearBulkDiscount(products) {
  return products.map((p) =>
    p.compareAtPrice && p.compareAtPrice > p.price ? { ...p, price: p.compareAtPrice, compareAtPrice: null } : p,
  )
}

export function toCsv(rows) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
}
