<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 900 },
  format: { type: Function, default: (n) => Math.round(n).toLocaleString() },
})

const display = ref(0)
let frame = null

function animate(to) {
  cancelAnimationFrame(frame)
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    display.value = to
    return
  }
  const from = display.value
  const start = performance.now()
  const step = (now) => {
    const p = Math.min(1, (now - start) / props.duration)
    // easeOutExpo for a snappy settle
    const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
    display.value = from + (to - from) * eased
    if (p < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => animate(props.value))
watch(() => props.value, (v) => animate(v))
</script>

<template>
  <span class="tabular">{{ format(display) }}</span>
</template>
