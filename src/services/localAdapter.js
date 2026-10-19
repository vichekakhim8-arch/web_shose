// Browser persistence adapter (localStorage). Used when VITE_API_URL is unset.
// Data survives reloads on THIS DEVICE ONLY — not shared between users.
import { SEED_PRODUCTS, SEED_REVIEWS, SEED_COUPONS, SEED_STAFF, CATEGORIES, BRANDS, GENDERS, SIZES } from './seed.js'
import {
  filterProducts, buildOrder, computeStats, validateProduct, slugify,
  applyBulkDiscount, clearBulkDiscount, DEFAULT_SETTINGS, HttpError, publicUser,
} from './domain.js'

const DB_KEY = 'vks_db_v1'
const TOKEN_KEY = 'vks_token'
const delay = (ms = 140) => new Promise((r) => setTimeout(r, ms))

async function sha(password, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const rid = (p) => p + crypto.getRandomValues(new Uint32Array(2)).join('').slice(0, 14)

let dbPromise = null
function loadDb() {
  if (dbPromise) return dbPromise
  dbPromise = (async () => {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
        // Forward-compatible defaults for databases seeded before these existed
        parsed.coupons ||= SEED_COUPONS
        parsed.staff ||= SEED_STAFF
        parsed.stockMovements ||= []
        return parsed
      } catch {
        /* reseed */
      }
    }
    const mkUser = async (id, name, email, pw, role) => {
      const salt = rid('s_')
      return { id, name, email, role, salt, passwordHash: await sha(pw, salt), phone: '', avatar: '', createdAt: new Date().toISOString() }
    }
    const db = {
      products: SEED_PRODUCTS,
      reviews: SEED_REVIEWS,
      users: [
        await mkUser('u_admin', 'VKS Admin', 'admin@vks.store', 'admin123', 'admin'),
        await mkUser('u_demo', 'Demo Customer', 'demo@vks.store', 'demo123', 'customer'),
      ],
      sessions: {},
      orders: [],
      coupons: SEED_COUPONS,
      staff: SEED_STAFF,
      stockMovements: [],
      settings: { ...DEFAULT_SETTINGS },
    }
    save(db)
    return db
  })()
  return dbPromise
}
const save = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db))

async function currentUser(db) {
  const token = localStorage.getItem(TOKEN_KEY)
  const id = token && db.sessions[token]
  return id ? db.users.find((u) => u.id === id) : null
}
async function requireUser(db) {
  const u = await currentUser(db)
  if (!u) throw new HttpError(401, 'Please sign in to continue')
  return u
}
async function requireAdmin(db) {
  const u = await requireUser(db)
  if (u.role !== 'admin') throw new HttpError(403, 'Admin access required')
  return u
}
function startSession(db, user) {
  const token = rid('t_')
  db.sessions[token] = user.id
  localStorage.setItem(TOKEN_KEY, token)
  save(db)
  return { user: publicUser(user), token }
}

function normalize(input, existing = {}) {
  const images = Array.isArray(input.images) ? input.images.filter(Boolean) : existing.images || []
  return {
    ...existing,
    name: String(input.name ?? existing.name ?? '').trim(),
    brand: input.brand ?? existing.brand,
    category: input.category ?? existing.category,
    gender: input.gender ?? existing.gender ?? 'Unisex',
    colorway: input.colorway ?? existing.colorway ?? '',
    price: Math.round(Number(input.price ?? existing.price)),
    compareAtPrice: input.compareAtPrice ? Math.round(Number(input.compareAtPrice)) : null,
    stock: Math.round(Number(input.stock ?? existing.stock)),
    images,
    image: images[0] || existing.image || '',
    sizes: Array.isArray(input.sizes) && input.sizes.length ? input.sizes.map(Number) : existing.sizes || SIZES,
    description: String(input.description ?? existing.description ?? '').trim(),
    features: Array.isArray(input.features) ? input.features.filter(Boolean) : existing.features || [],
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : existing.tags || [],
    featured: Boolean(input.featured ?? existing.featured),
  }
}

export const localAdapter = {
  mode: 'local',

  auth: {
    async register({ name, email, password }) {
      await delay()
      const db = await loadDb()
      const mail = String(email || '').trim().toLowerCase()
      const f = {}
      if (!name?.trim()) f.name = 'Name is required'
      if (!/^\S+@\S+\.\S+$/.test(mail)) f.email = 'Valid email is required'
      if (!password || password.length < 6) f.password = 'Password must be at least 6 characters'
      if (Object.keys(f).length) throw new HttpError(422, 'Please fix the errors below', f)
      if (db.users.some((u) => u.email === mail)) throw new HttpError(409, 'Email already registered', { email: 'Email already registered' })
      const salt = rid('s_')
      const user = { id: rid('u_'), name: name.trim(), email: mail, role: 'customer', salt, passwordHash: await sha(password, salt), phone: '', avatar: '', createdAt: new Date().toISOString() }
      db.users.push(user)
      return startSession(db, user)
    },
    async login({ email, password }) {
      await delay()
      const db = await loadDb()
      const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase())
      if (!user || (await sha(password || '', user.salt)) !== user.passwordHash) throw new HttpError(401, 'Invalid email or password')
      return startSession(db, user)
    },
    /**
     * Demo social sign-in. There is NO real Google/Facebook OAuth here — doing
     * that requires a client ID and a server-side token exchange. This creates
     * (or reuses) a local account so the flow can be demonstrated end to end.
     */
    async oauth(provider) {
      await delay(400)
      const db = await loadDb()
      const email = `${provider}.user@vks.store`
      let user = db.users.find((u) => u.email === email)
      if (!user) {
        const salt = rid('s_')
        user = {
          id: rid('u_'),
          name: provider === 'google' ? 'Google User' : 'Facebook User',
          email, role: 'customer', salt, passwordHash: await sha(rid('x_'), salt),
          provider, phone: '', avatar: '', createdAt: new Date().toISOString(),
        }
        db.users.push(user)
      }
      return startSession(db, user)
    },
    async me() {
      const db = await loadDb()
      return publicUser(await currentUser(db))
    },
    async logout() {
      const db = await loadDb()
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) delete db.sessions[token]
      localStorage.removeItem(TOKEN_KEY)
      save(db)
    },
    async updateProfile(patch) {
      await delay()
      const db = await loadDb()
      const user = await requireUser(db)
      if (patch.name?.trim()) user.name = patch.name.trim()
      if (patch.phone !== undefined) user.phone = patch.phone
      if (patch.avatar !== undefined) user.avatar = patch.avatar
      if (patch.email?.trim()) {
        const mail = patch.email.trim().toLowerCase()
        if (db.users.some((u) => u.email === mail && u.id !== user.id)) throw new HttpError(409, 'Email already in use', { email: 'Email already in use' })
        user.email = mail
      }
      if (patch.password) {
        if (patch.password.length < 6) throw new HttpError(422, 'Password too short', { password: 'At least 6 characters' })
        user.salt = rid('s_')
        user.passwordHash = await sha(patch.password, user.salt)
      }
      save(db)
      return publicUser(user)
    },
  },

  products: {
    async list(params) {
      await delay(110)
      const db = await loadDb()
      return filterProducts(db.products, params)
    },
    async facets() {
      const db = await loadDb()
      return { categories: CATEGORIES, brands: BRANDS, genders: GENDERS, sizes: SIZES, count: db.products.length }
    },
    async get(slug) {
      await delay(90)
      const db = await loadDb()
      const p = db.products.find((x) => x.slug === slug || x.id === slug)
      if (!p) throw new HttpError(404, 'Product not found')
      return p
    },
    async create(input) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      const p = normalize(input)
      const e = validateProduct(p)
      if (Object.keys(e).length) throw new HttpError(422, 'Please fix the errors below', e)
      let slug = slugify(p.name)
      while (db.products.some((x) => x.slug === slug)) slug += '-' + Math.floor(Math.random() * 99)
      const full = { ...p, id: rid('p_'), slug, sku: 'VKS-' + slug.slice(0, 6).toUpperCase(), rating: 0, reviewCount: 0, createdAt: new Date().toISOString() }
      db.products.unshift(full)
      save(db)
      return full
    },
    async update(id, input) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      const i = db.products.findIndex((p) => p.id === id)
      if (i === -1) throw new HttpError(404, 'Product not found')
      const updated = normalize(input, db.products[i])
      const e = validateProduct(updated)
      if (Object.keys(e).length) throw new HttpError(422, 'Please fix the errors below', e)
      db.products[i] = updated
      save(db)
      return updated
    },
    async remove(id) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      db.products = db.products.filter((p) => p.id !== id)
      save(db)
    },
    async setStock(id, stock) {
      const db = await loadDb()
      await requireAdmin(db)
      const p = db.products.find((x) => x.id === id)
      if (!p) throw new HttpError(404, 'Product not found')
      p.stock = Math.max(0, Math.round(Number(stock) || 0))
      save(db)
      return p
    },
    async bulkDiscount(percent) {
      await delay(300)
      const db = await loadDb()
      await requireAdmin(db)
      db.products = applyBulkDiscount(db.products, percent)
      save(db)
      return db.products.length
    },
    async clearDiscount() {
      await delay(300)
      const db = await loadDb()
      await requireAdmin(db)
      db.products = clearBulkDiscount(db.products)
      save(db)
      return db.products.length
    },
  },

  reviews: {
    async list(productId) {
      await delay(80)
      const db = await loadDb()
      return db.reviews.filter((r) => r.productId === productId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async create({ productId, rating, comment }) {
      await delay()
      const db = await loadDb()
      const user = await requireUser(db)
      if (!comment?.trim()) throw new HttpError(422, 'Please write a comment', { comment: 'Comment is required' })
      const review = {
        id: rid('r_'), productId, userId: user.id, userName: user.name,
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        comment: comment.trim(), createdAt: new Date().toISOString(),
      }
      db.reviews.push(review)
      // Keep the product's aggregate rating honest.
      const all = db.reviews.filter((r) => r.productId === productId)
      const p = db.products.find((x) => x.id === productId)
      if (p) {
        p.reviewCount = all.length
        p.rating = Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10
      }
      save(db)
      return review
    },
  },

  orders: {
    async create(payload) {
      await delay(400)
      const db = await loadDb()
      const user = await requireUser(db)
      const order = buildOrder(payload, db.products, user)
      order.lines.forEach((l) => {
        const p = db.products.find((x) => x.id === l.productId)
        if (p) p.stock -= l.quantity
      })
      db.orders.push(order)
      save(db)
      return order
    },
    async mine() {
      await delay()
      const db = await loadDb()
      const user = await requireUser(db)
      return db.orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async get(id) {
      await delay()
      const db = await loadDb()
      const user = await requireUser(db)
      const o = db.orders.find((x) => x.id === id)
      if (!o || (o.userId !== user.id && user.role !== 'admin')) throw new HttpError(404, 'Order not found')
      return o
    },
    async all() {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      return [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    /** Permanently removes an order; stock goes back unless already cancelled. */
    async remove(id) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      const o = db.orders.find((x) => x.id === id)
      if (!o) throw new HttpError(404, 'Order not found')
      if (o.status !== 'cancelled') {
        o.lines.forEach((l) => {
          const p = db.products.find((x) => x.id === l.productId)
          if (p) p.stock += l.quantity
        })
      }
      db.orders = db.orders.filter((x) => x.id !== id)
      save(db)
    },
    async updateStatus(id, status) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      const o = db.orders.find((x) => x.id === id)
      if (!o) throw new HttpError(404, 'Order not found')
      if (status === 'cancelled' && o.status !== 'cancelled') {
        o.lines.forEach((l) => {
          const p = db.products.find((x) => x.id === l.productId)
          if (p) p.stock += l.quantity
        })
      }
      o.status = status
      save(db)
      return o
    },
  },

  inventory: {
    async movements() {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      return [...db.stockMovements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200)
    },
    /**
     * Records a stock in/out/adjust entry and applies it to the product.
     * Every change is auditable rather than silently overwriting `stock`.
     */
    async record({ productId, type, quantity, reason }) {
      await delay()
      const db = await loadDb()
      const user = await requireAdmin(db)
      const p = db.products.find((x) => x.id === productId)
      if (!p) throw new HttpError(404, 'Product not found')

      const qty = Math.abs(Math.round(Number(quantity) || 0))
      if (!qty) throw new HttpError(422, 'Quantity must be greater than 0', { quantity: 'Required' })

      const before = p.stock
      if (type === 'in') p.stock += qty
      else if (type === 'out') {
        if (qty > p.stock) throw new HttpError(409, `Only ${p.stock} in stock`, { quantity: `Max ${p.stock}` })
        p.stock -= qty
      } else p.stock = qty

      const movement = {
        id: rid('m_'), productId, productName: p.name, sku: p.sku,
        type, quantity: qty, before, after: p.stock,
        reason: reason || '', by: user.name, createdAt: new Date().toISOString(),
      }
      db.stockMovements.push(movement)
      save(db)
      return { movement, product: p }
    },
  },

  coupons: {
    async list() {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      return db.coupons
    },
    async save(coupon) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      const code = String(coupon.code || '').trim().toUpperCase()
      if (!code) throw new HttpError(422, 'Code is required', { code: 'Required' })
      const i = db.coupons.findIndex((c) => c.id === coupon.id)
      const next = {
        ...coupon, code,
        value: Number(coupon.value) || 0,
        minSpend: Math.round(Number(coupon.minSpend) || 0),
        limit: Number(coupon.limit) || 0,
      }
      if (i === -1) db.coupons.unshift({ ...next, id: rid('c_'), used: 0 })
      else db.coupons[i] = { ...db.coupons[i], ...next }
      save(db)
      return db.coupons
    },
    async remove(id) {
      const db = await loadDb()
      await requireAdmin(db)
      db.coupons = db.coupons.filter((c) => c.id !== id)
      save(db)
    },
  },

  staff: {
    async list() {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      return db.staff
    },
    async save(member) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      const i = db.staff.findIndex((s) => s.id === member.id)
      if (i === -1) db.staff.unshift({ ...member, id: rid('s_') })
      else db.staff[i] = { ...db.staff[i], ...member }
      save(db)
      return db.staff
    },
    async remove(id) {
      const db = await loadDb()
      await requireAdmin(db)
      db.staff = db.staff.filter((s) => s.id !== id)
      save(db)
    },
  },

  settings: {
    async get() {
      const db = await loadDb()
      return db.settings
    },
    async update(patch) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      db.settings = { ...db.settings, ...patch }
      save(db)
      return db.settings
    },
  },

  admin: {
    async stats(days = 14) {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      return computeStats(db.products, db.orders, db.users, days)
    },
    async customers() {
      await delay()
      const db = await loadDb()
      await requireAdmin(db)
      return db.users.map((u) => ({
        ...publicUser(u),
        orderCount: db.orders.filter((o) => o.userId === u.id).length,
        spent: db.orders.filter((o) => o.userId === u.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
      }))
    },
    async reset() {
      localStorage.removeItem(DB_KEY)
      localStorage.removeItem(TOKEN_KEY)
      dbPromise = null
      await loadDb()
    },
  },
}
