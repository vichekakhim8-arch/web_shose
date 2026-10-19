import { onBeforeUnmount, onMounted } from 'vue'

/** Calls `handler` when a pointer event lands outside the given template ref. */
export function onClickOutside(elRef, handler) {
  const listener = (e) => {
    const el = elRef.value
    if (el && !el.contains(e.target)) handler(e)
  }
  const esc = (e) => e.key === 'Escape' && handler(e)

  onMounted(() => {
    document.addEventListener('pointerdown', listener)
    document.addEventListener('keydown', esc)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', listener)
    document.removeEventListener('keydown', esc)
  })
}
