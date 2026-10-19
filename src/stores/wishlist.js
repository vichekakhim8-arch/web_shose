import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const KEY = 'vks_wishlist_v2'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(load())
  watch(items, (v) => localStorage.setItem(KEY, JSON.stringify(v)), { deep: true })

  const count = computed(() => items.value.length)
  const ids = computed(() => new Set(items.value.map((i) => i.id)))
  const has = (id) => ids.value.has(id)

  const snapshot = (p) => ({
    id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.image,
    price: p.price, compareAtPrice: p.compareAtPrice ?? null,
    stock: p.stock ?? 0, colors: p.colors ?? [], sizes: p.sizes ?? [],
  })

  /** @returns {boolean} true if it is now favourited */
  function toggle(product) {
    if (has(product.id)) {
      items.value = items.value.filter((i) => i.id !== product.id)
      return false
    }
    items.value.push({ ...snapshot(product), addedAt: new Date().toISOString() })
    return true
  }

  /**
   * Re-reads price/stock/image from the live catalogue.
   * Without this a saved item keeps the price it had when it was favourited,
   * so a bulk discount or restock would never show up here.
   */
  function syncWith(products) {
    if (!products?.length) return
    const byId = new Map(products.map((p) => [p.id, p]))
    const next = items.value
      .filter((i) => byId.has(i.id)) // drop deleted products
      .map((i) => ({ ...i, ...snapshot(byId.get(i.id)), addedAt: i.addedAt }))
    if (JSON.stringify(next) !== JSON.stringify(items.value)) items.value = next
  }

  const remove = (id) => (items.value = items.value.filter((i) => i.id !== id))
  const clear = () => (items.value = [])

  return { items, count, has, toggle, syncWith, remove, clear }
})
