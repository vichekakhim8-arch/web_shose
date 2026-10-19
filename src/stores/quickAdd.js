import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Holds the product awaiting a size/colour choice.
 *
 * Fixes the earlier bug where the card's "+" button silently guessed a size
 * (sizes[2]) and added it to the cart — shoppers ended up with the wrong size.
 * Now the card opens this picker and nothing is added until a size is chosen.
 */
export const useQuickAddStore = defineStore('quickAdd', () => {
  const product = ref(null)
  const open = ref(false)

  function show(p) {
    product.value = p
    open.value = true
  }
  function close() {
    open.value = false
    // keep product until the transition finishes
    setTimeout(() => !open.value && (product.value = null), 250)
  }

  return { product, open, show, close }
})
