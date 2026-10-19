import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { computeTotals } from '@/services/domain.js'

const KEY = 'vks_cart_v2'
const lineId = (productId, size) => `${productId}__${size ?? 'os'}`

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref(load())
  const drawerOpen = ref(false)
  const shippingFee = ref(0)

  watch(items, (v) => localStorage.setItem(KEY, JSON.stringify(v)), { deep: true })

  const count = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totals = computed(() => computeTotals(items.value, shippingFee.value))

  /**
   * Units of a product already in the cart ACROSS ALL SIZES.
   * Stock is a single pool per product, so size lines must share it —
   * otherwise 5 units of stock could be sold as 5×EU40 + 5×EU41.
   */
  function qtyOf(productId) {
    return items.value.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0)
  }

  /** How many more units of this product may still be added. */
  function availableFor(product) {
    if (!product) return 0
    return Math.max(0, (product.stock ?? 0) - qtyOf(product.id))
  }

  /** @returns {number} units actually added (0 when the pool is exhausted) */
  function add(product, quantity = 1, size = null) {
    const allowed = Math.max(0, Math.min(Math.floor(quantity) || 1, availableFor(product)))
    if (allowed === 0) return 0

    const id = lineId(product.id, size)
    const existing = items.value.find((i) => i.id === id)

    if (existing) {
      existing.quantity += allowed
      existing.stock = product.stock
      existing.price = product.price
    } else {
      items.value.push({
        id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
        stock: product.stock,
        category: product.category,
        size,
        quantity: allowed,
      })
    }
    return allowed
  }

  /** Clamps against the shared pool, not just this line's cached stock. */
  function setQuantity(id, qty) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    const others = items.value
      .filter((i) => i.productId === item.productId && i.id !== id)
      .reduce((s, i) => s + i.quantity, 0)
    const ceiling = Math.max(1, (item.stock ?? 1) - others)
    item.quantity = Math.max(1, Math.min(Math.floor(qty) || 1, ceiling))
  }

  /**
   * Refreshes cached price/stock/image from the live catalogue and trims any
   * line that now exceeds stock. Keeps the cart honest after an admin edits
   * prices, runs a bulk discount, or stock sells out elsewhere.
   */
  function syncWith(products) {
    if (!products?.length) return
    const byId = new Map(products.map((p) => [p.id, p]))
    const kept = []
    const pool = {}

    for (const line of items.value) {
      const p = byId.get(line.productId)
      if (!p) continue // product deleted → drop the line
      if (p.stock <= 0) continue

      const used = pool[p.id] || 0
      const room = Math.max(0, p.stock - used)
      if (room === 0) continue

      const qty = Math.min(line.quantity, room)
      pool[p.id] = used + qty
      kept.push({ ...line, quantity: qty, price: p.price, stock: p.stock, image: p.image, name: p.name })
    }

    // Only commit when something actually changed, to avoid a write loop.
    if (JSON.stringify(kept) !== JSON.stringify(items.value)) items.value = kept
  }

  const remove = (id) => (items.value = items.value.filter((i) => i.id !== id))
  const clear = () => (items.value = [])
  const setShippingFee = (f) => (shippingFee.value = Number(f) || 0)

  return {
    items, drawerOpen, shippingFee, count, totals,
    qtyOf, availableFor, add, setQuantity, syncWith, remove, clear, setShippingFee,
  }
})
