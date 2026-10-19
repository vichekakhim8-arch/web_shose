import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api.js'
import { useCartStore } from './cart.js'
import { useWishlistStore } from './wishlist.js'

/**
 * Single source of truth for the live catalogue.
 *
 * Every admin change (price, stock, bulk discount, delete) flows through here
 * and is pushed into the cart and wishlist, so a shopper never sees a stale
 * price or buys something that is no longer in stock.
 */
export const useCatalogStore = defineStore('catalog', () => {
  const products = ref([])
  const ready = ref(false)
  let inflight = null

  const byId = computed(() => new Map(products.value.map((p) => [p.id, p])))
  const get = (id) => byId.value.get(id)

  async function refresh() {
    try {
      products.value = (await api.products.list({ pageSize: 500 })).items
      // Cascade into anything holding cached product copies.
      useCartStore().syncWith(products.value)
      useWishlistStore().syncWith(products.value)
    } catch {
      /* offline / unauthorised — keep whatever we have */
    } finally {
      ready.value = true
    }
  }

  /** De-duplicated first load. */
  function init() {
    if (!inflight) inflight = refresh()
    return inflight
  }

  /** Call after any admin mutation so the storefront reflects it immediately. */
  async function invalidate() {
    inflight = refresh()
    return inflight
  }

  return { products, ready, byId, get, init, refresh, invalidate }
})
