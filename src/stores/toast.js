import { defineStore } from 'pinia'
import { ref } from 'vue'

let seq = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function push(message, type = 'success', timeout = 3200) {
    const id = ++seq
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), timeout)
  }
  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    push,
    dismiss,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 4500),
    info: (m) => push(m, 'info'),
  }
})
