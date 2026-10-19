import { ref, shallowRef } from 'vue'

/**
 * Small helper for loading data with loading/error state.
 * const { data, loading, error, run } = useAsync(() => api.products.list())
 */
export function useAsync(fn, { immediate = false, initial = null } = {}) {
  const data = shallowRef(initial)
  const loading = ref(false)
  const error = ref(null)

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (e) {
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  if (immediate) run()
  return { data, loading, error, run }
}

export function useDebounce(fn, wait = 300) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}
