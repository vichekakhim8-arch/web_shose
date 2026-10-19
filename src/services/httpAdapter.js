// REST adapter for the Node backend in /server (enable with VITE_API_URL).
import { HttpError } from './domain.js'

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'vks_api_token'

async function request(method, path, body) {
  const token = localStorage.getItem(TOKEN_KEY)
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new HttpError(0, 'Cannot reach the store server. Please try again later.')
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new HttpError(res.status, data?.error || res.statusText, data?.fields)
  return data
}

const qs = (p = {}) => {
  const s = new URLSearchParams(
    Object.entries(p).filter(([, v]) => v !== '' && v != null && v !== false),
  ).toString()
  return s ? `?${s}` : ''
}
const withSession = (d) => (localStorage.setItem(TOKEN_KEY, d.token), d)

export const httpAdapter = {
  mode: 'api',
  auth: {
    register: (b) => request('POST', '/auth/register', b).then(withSession),
    login: (b) => request('POST', '/auth/login', b).then(withSession),
    oauth: (provider) => request('POST', '/auth/oauth', { provider }).then(withSession),
    updateProfile: (b) => request('PATCH', '/auth/me', b),
    me: async () => {
      if (!localStorage.getItem(TOKEN_KEY)) return null
      try {
        return (await request('GET', '/auth/me')).user
      } catch (e) {
        if (e.status === 401) localStorage.removeItem(TOKEN_KEY)
        return null
      }
    },
    logout: async () => {
      try {
        await request('POST', '/auth/logout')
      } finally {
        localStorage.removeItem(TOKEN_KEY)
      }
    },
  },
  products: {
    list: (p) => request('GET', '/products' + qs(p)),
    facets: () => request('GET', '/facets'),
    get: (slug) => request('GET', `/products/${encodeURIComponent(slug)}`),
    create: (b) => request('POST', '/products', b),
    update: (id, b) => request('PUT', `/products/${id}`, b),
    remove: (id) => request('DELETE', `/products/${id}`),
    setStock: (id, stock) => request('PATCH', `/products/${id}/stock`, { stock }),
    bulkDiscount: (percent) => request('POST', '/products/discount', { percent }),
    clearDiscount: () => request('POST', '/products/discount/clear'),
  },
  reviews: {
    list: (productId) => request('GET', `/reviews${qs({ productId })}`),
    create: (b) => request('POST', '/reviews', b),
  },
  orders: {
    create: (b) => request('POST', '/orders', b),
    mine: () => request('GET', '/orders/mine'),
    get: (id) => request('GET', `/orders/${id}`),
    all: () => request('GET', '/orders'),
    updateStatus: (id, status) => request('PATCH', `/orders/${id}`, { status }),
    remove: (id) => request('DELETE', `/orders/${id}`),
  },
  inventory: {
    movements: () => request('GET', '/inventory/movements'),
    record: (b) => request('POST', '/inventory/movements', b),
  },
  coupons: {
    list: () => request('GET', '/coupons'),
    save: (b) => request('POST', '/coupons', b),
    remove: (id) => request('DELETE', `/coupons/${id}`),
  },
  staff: {
    list: () => request('GET', '/staff'),
    save: (b) => request('POST', '/staff', b),
    remove: (id) => request('DELETE', `/staff/${id}`),
  },
  settings: {
    get: () => request('GET', '/settings'),
    update: (b) => request('PATCH', '/settings', b),
  },
  admin: {
    stats: (days) => request('GET', '/admin/stats' + qs({ days })),
    customers: () => request('GET', '/admin/customers'),
    reset: () => Promise.reject(new HttpError(400, 'Reset is only available in local mode')),
  },
}
