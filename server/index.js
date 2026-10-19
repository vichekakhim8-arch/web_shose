// VKS REST API — zero-dependency Node.js server (Node 18+).
//   node server/index.js            → http://localhost:4000/api
//   VITE_API_URL=/api npm run dev   → Vite proxies /api to this server
//
// Persistence: JSON file at server/data/db.json. Swap readDb/writeDb for a real
// database (PostgreSQL/Mongo) in production — every route goes through them.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SEED_PRODUCTS, SEED_REVIEWS, CATEGORIES, BRANDS, GENDERS, SIZES, ORDER_STATUSES } from '../src/services/seed.js'
import {
  filterProducts, buildOrder, computeStats, validateProduct, slugify,
  applyBulkDiscount, clearBulkDiscount, DEFAULT_SETTINGS, HttpError, publicUser,
} from '../src/services/domain.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, 'data', 'db.json')
const PORT = Number(process.env.PORT) || 4000
const ORIGIN = process.env.CORS_ORIGIN || '*'

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex')
const rid = (p) => p + crypto.randomBytes(6).toString('hex')

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
    const mk = (id, name, email, pw, role) => {
      const salt = crypto.randomBytes(16).toString('hex')
      return { id, name, email, role, salt, passwordHash: hash(pw, salt), phone: '', avatar: '', createdAt: new Date().toISOString() }
    }
    const db = {
      products: SEED_PRODUCTS,
      reviews: SEED_REVIEWS,
      users: [
        mk('u_admin', 'VKS Admin', process.env.ADMIN_EMAIL || 'admin@vks.store', process.env.ADMIN_PASSWORD || 'admin123', 'admin'),
        mk('u_demo', 'Demo Customer', 'demo@vks.store', 'demo123', 'customer'),
      ],
      sessions: {}, orders: [], settings: { ...DEFAULT_SETTINGS },
    }
    writeDb(db)
    return db
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) }
  return db
}
function writeDb(db) {
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  })
  res.end(status === 204 ? undefined : JSON.stringify(data))
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > 2e6) reject(new HttpError(413, 'Payload too large'))
    })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch { reject(new HttpError(400, 'Invalid JSON')) }
    })
  })

function authUser(req, db) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const id = token && db.sessions[token]
  return { token, user: id ? db.users.find((u) => u.id === id) : null }
}
function requireUser(req, db) {
  const { user } = authUser(req, db)
  if (!user) throw new HttpError(401, 'Please sign in to continue')
  return user
}
function requireAdmin(req, db) {
  const u = requireUser(req, db)
  if (u.role !== 'admin') throw new HttpError(403, 'Admin access required')
  return u
}
function session(db, user) {
  const token = crypto.randomBytes(32).toString('hex')
  db.sessions[token] = user.id
  writeDb(db)
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
    images, image: images[0] || existing.image || '',
    sizes: Array.isArray(input.sizes) && input.sizes.length ? input.sizes.map(Number) : existing.sizes || SIZES,
    description: String(input.description ?? existing.description ?? '').trim(),
    features: Array.isArray(input.features) ? input.features.filter(Boolean) : existing.features || [],
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : existing.tags || [],
    featured: Boolean(input.featured ?? existing.featured),
  }
}

const routes = []
const route = (method, pattern, handler) => {
  const keys = []
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$')
  routes.push({ method, regex, keys, handler })
}

route('GET', '/api/health', () => ({ ok: true }))
route('GET', '/api/facets', ({ db }) => ({ categories: CATEGORIES, brands: BRANDS, genders: GENDERS, sizes: SIZES, count: db.products.length }))
route('GET', '/api/products', ({ db, query }) => filterProducts(db.products, query))
route('GET', '/api/products/:slug', ({ db, params }) => {
  const p = db.products.find((x) => x.slug === params.slug || x.id === params.slug)
  if (!p) throw new HttpError(404, 'Product not found')
  return p
})
route('POST', '/api/products', ({ db, req, body }) => {
  requireAdmin(req, db)
  const p = normalize(body)
  const e = validateProduct(p)
  if (Object.keys(e).length) throw new HttpError(422, 'Please fix the errors below', e)
  let slug = slugify(p.name)
  while (db.products.some((x) => x.slug === slug)) slug += '-' + crypto.randomInt(99)
  const full = { ...p, id: rid('p_'), slug, sku: 'VKS-' + slug.slice(0, 6).toUpperCase(), rating: 0, reviewCount: 0, createdAt: new Date().toISOString() }
  db.products.unshift(full)
  writeDb(db)
  return [201, full]
})
route('PUT', '/api/products/:id', ({ db, req, body, params }) => {
  requireAdmin(req, db)
  const i = db.products.findIndex((p) => p.id === params.id)
  if (i === -1) throw new HttpError(404, 'Product not found')
  const updated = normalize(body, db.products[i])
  const e = validateProduct(updated)
  if (Object.keys(e).length) throw new HttpError(422, 'Please fix the errors below', e)
  db.products[i] = updated
  writeDb(db)
  return updated
})
route('PATCH', '/api/products/:id/stock', ({ db, req, body, params }) => {
  requireAdmin(req, db)
  const p = db.products.find((x) => x.id === params.id)
  if (!p) throw new HttpError(404, 'Product not found')
  p.stock = Math.max(0, Math.round(Number(body.stock) || 0))
  writeDb(db)
  return p
})
route('DELETE', '/api/products/:id', ({ db, req, params }) => {
  requireAdmin(req, db)
  db.products = db.products.filter((p) => p.id !== params.id)
  writeDb(db)
  return [204, null]
})
route('POST', '/api/products/discount', ({ db, req, body }) => {
  requireAdmin(req, db)
  db.products = applyBulkDiscount(db.products, body.percent)
  writeDb(db)
  return db.products.length
})
route('POST', '/api/products/discount/clear', ({ db, req }) => {
  requireAdmin(req, db)
  db.products = clearBulkDiscount(db.products)
  writeDb(db)
  return db.products.length
})

route('GET', '/api/reviews', ({ db, query }) =>
  db.reviews.filter((r) => r.productId === query.productId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
route('POST', '/api/reviews', ({ db, req, body }) => {
  const user = requireUser(req, db)
  if (!body.comment?.trim()) throw new HttpError(422, 'Please write a comment', { comment: 'Comment is required' })
  const review = {
    id: rid('r_'), productId: body.productId, userId: user.id, userName: user.name,
    rating: Math.max(1, Math.min(5, Number(body.rating) || 5)),
    comment: body.comment.trim(), createdAt: new Date().toISOString(),
  }
  db.reviews.push(review)
  const all = db.reviews.filter((r) => r.productId === body.productId)
  const p = db.products.find((x) => x.id === body.productId)
  if (p) {
    p.reviewCount = all.length
    p.rating = Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10
  }
  writeDb(db)
  return [201, review]
})

route('POST', '/api/auth/register', ({ db, body }) => {
  const email = String(body.email || '').trim().toLowerCase()
  const f = {}
  if (!body.name?.trim()) f.name = 'Name is required'
  if (!/^\S+@\S+\.\S+$/.test(email)) f.email = 'Valid email is required'
  if (!body.password || body.password.length < 6) f.password = 'Password must be at least 6 characters'
  if (Object.keys(f).length) throw new HttpError(422, 'Please fix the errors below', f)
  if (db.users.some((u) => u.email === email)) throw new HttpError(409, 'Email already registered', { email: 'Email already registered' })
  const salt = crypto.randomBytes(16).toString('hex')
  const user = { id: rid('u_'), name: body.name.trim(), email, role: 'customer', salt, passwordHash: hash(body.password, salt), phone: '', avatar: '', createdAt: new Date().toISOString() }
  db.users.push(user)
  return [201, session(db, user)]
})
route('POST', '/api/auth/login', ({ db, body }) => {
  const user = db.users.find((u) => u.email === String(body.email || '').trim().toLowerCase())
  if (!user) throw new HttpError(401, 'Invalid email or password')
  const ok = crypto.timingSafeEqual(Buffer.from(hash(body.password || '', user.salt), 'hex'), Buffer.from(user.passwordHash, 'hex'))
  if (!ok) throw new HttpError(401, 'Invalid email or password')
  return session(db, user)
})
// Demo social sign-in. Replace with a real OAuth code exchange in production.
route('POST', '/api/auth/oauth', ({ db, body }) => {
  const provider = body.provider === 'facebook' ? 'facebook' : 'google'
  const email = `${provider}.user@vks.store`
  let user = db.users.find((u) => u.email === email)
  if (!user) {
    const salt = crypto.randomBytes(16).toString('hex')
    user = { id: rid('u_'), name: provider === 'google' ? 'Google User' : 'Facebook User', email, role: 'customer', salt, passwordHash: hash(rid('x'), salt), provider, phone: '', avatar: '', createdAt: new Date().toISOString() }
    db.users.push(user)
  }
  return session(db, user)
})
route('GET', '/api/auth/me', ({ db, req }) => ({ user: publicUser(requireUser(req, db)) }))
route('PATCH', '/api/auth/me', ({ db, req, body }) => {
  const user = requireUser(req, db)
  if (body.name?.trim()) user.name = body.name.trim()
  if (body.phone !== undefined) user.phone = body.phone
  if (body.avatar !== undefined) user.avatar = body.avatar
  if (body.email?.trim()) {
    const email = body.email.trim().toLowerCase()
    if (db.users.some((u) => u.email === email && u.id !== user.id)) throw new HttpError(409, 'Email already in use', { email: 'Email already in use' })
    user.email = email
  }
  if (body.password) {
    if (body.password.length < 6) throw new HttpError(422, 'Password too short', { password: 'At least 6 characters' })
    user.salt = crypto.randomBytes(16).toString('hex')
    user.passwordHash = hash(body.password, user.salt)
  }
  writeDb(db)
  return publicUser(user)
})
route('POST', '/api/auth/logout', ({ db, req }) => {
  const { token } = authUser(req, db)
  if (token) delete db.sessions[token]
  writeDb(db)
  return [204, null]
})

route('POST', '/api/orders', ({ db, req, body }) => {
  const user = requireUser(req, db)
  // NOTE: verify the KHQR payment with the Bakong API before trusting
  // payment.reference. Right now the client asserts it has paid.
  const order = buildOrder(body, db.products, user)
  order.lines.forEach((l) => {
    const p = db.products.find((x) => x.id === l.productId)
    if (p) p.stock -= l.quantity
  })
  db.orders.push(order)
  writeDb(db)
  return [201, order]
})
route('GET', '/api/orders/mine', ({ db, req }) => {
  const user = requireUser(req, db)
  return db.orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})
route('GET', '/api/orders', ({ db, req }) => {
  requireAdmin(req, db)
  return [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})
route('GET', '/api/orders/:id', ({ db, req, params }) => {
  const user = requireUser(req, db)
  const o = db.orders.find((x) => x.id === params.id)
  if (!o || (o.userId !== user.id && user.role !== 'admin')) throw new HttpError(404, 'Order not found')
  return o
})
route('DELETE', '/api/orders/:id', ({ db, req, params }) => {
  requireAdmin(req, db)
  const o = db.orders.find((x) => x.id === params.id)
  if (!o) throw new HttpError(404, 'Order not found')
  if (o.status !== 'cancelled') {
    o.lines.forEach((l) => {
      const p = db.products.find((x) => x.id === l.productId)
      if (p) p.stock += l.quantity
    })
  }
  db.orders = db.orders.filter((x) => x.id !== params.id)
  writeDb(db)
  return [204, null]
})
route('PATCH', '/api/orders/:id', ({ db, req, params, body }) => {
  requireAdmin(req, db)
  if (!ORDER_STATUSES.includes(body.status)) throw new HttpError(422, 'Invalid status')
  const o = db.orders.find((x) => x.id === params.id)
  if (!o) throw new HttpError(404, 'Order not found')
  if (body.status === 'cancelled' && o.status !== 'cancelled') {
    o.lines.forEach((l) => {
      const p = db.products.find((x) => x.id === l.productId)
      if (p) p.stock += l.quantity
    })
  }
  o.status = body.status
  writeDb(db)
  return o
})

route('GET', '/api/settings', ({ db }) => db.settings)
route('PATCH', '/api/settings', ({ db, req, body }) => {
  requireAdmin(req, db)
  db.settings = { ...db.settings, ...body }
  writeDb(db)
  return db.settings
})

route('GET', '/api/admin/stats', ({ db, req, query }) => {
  requireAdmin(req, db)
  return computeStats(db.products, db.orders, db.users, Number(query.days) || 14)
})
route('GET', '/api/admin/customers', ({ db, req }) => {
  requireAdmin(req, db)
  return db.users.map((u) => ({
    ...publicUser(u),
    orderCount: db.orders.filter((o) => o.userId === u.id).length,
    spent: db.orders.filter((o) => o.userId === u.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  }))
})

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, null)
  const url = new URL(req.url, `http://${req.headers.host}`)
  const match = routes.find((r) => r.method === req.method && r.regex.test(url.pathname))
  if (!match) return send(res, 404, { error: 'Not found' })
  try {
    const values = url.pathname.match(match.regex).slice(1)
    const params = Object.fromEntries(match.keys.map((k, i) => [k, decodeURIComponent(values[i])]))
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {}
    const result = await match.handler({ req, db: readDb(), body, params, query: Object.fromEntries(url.searchParams) })
    if (Array.isArray(result) && typeof result[0] === 'number' && result.length === 2) send(res, result[0], result[1])
    else send(res, 200, result)
  } catch (err) {
    const status = err.status || 500
    if (status === 500) console.error(err)
    send(res, status, { error: status === 500 ? 'Internal server error' : err.message, fields: err.fields })
  }
})

server.listen(PORT, () => console.log(`VKS API → http://localhost:${PORT}/api`))
