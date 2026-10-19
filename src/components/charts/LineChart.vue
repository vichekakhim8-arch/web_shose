<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ date, total }]
  height: { type: Number, default: 220 },
  format: { type: Function, default: (v) => v },
})

const W = 600
const P = { t: 12, r: 8, b: 24, l: 8 }
const hover = ref(null)
const drawn = ref(false)

const max = computed(() => Math.max(1, ...props.data.map((d) => d.total)))
const pts = computed(() => {
  const n = props.data.length
  if (!n) return []
  const iw = W - P.l - P.r
  const ih = props.height - P.t - P.b
  return props.data.map((d, i) => ({
    ...d,
    x: P.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw),
    y: P.t + ih - (d.total / max.value) * ih,
  }))
})

/** Smooth Catmull-Rom-ish curve for a clean line. */
const path = computed(() => {
  const p = pts.value
  if (p.length < 2) return ''
  let d = `M${p[0].x},${p[0].y}`
  for (let i = 0; i < p.length - 1; i++) {
    const c = (p[i].x + p[i + 1].x) / 2
    d += ` C${c},${p[i].y} ${c},${p[i + 1].y} ${p[i + 1].x},${p[i + 1].y}`
  }
  return d
})
const area = computed(() => {
  const p = pts.value
  if (p.length < 2) return ''
  return `${path.value} L${p[p.length - 1].x},${props.height - P.b} L${p[0].x},${props.height - P.b} Z`
})

const len = ref(1200)
const lineEl = ref(null)
function measure() {
  drawn.value = false
  requestAnimationFrame(() => {
    if (lineEl.value) len.value = lineEl.value.getTotalLength()
    requestAnimationFrame(() => (drawn.value = true))
  })
}
onMounted(measure)
watch(() => props.data, measure, { deep: true })
</script>

<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${W} ${height}`" class="w-full" :style="{ height: height + 'px' }" role="img" aria-label="Revenue chart">
      <defs>
        <linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--c-primary)" stop-opacity="0.26" />
          <stop offset="100%" stop-color="var(--c-primary)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- gridlines -->
      <line v-for="i in 4" :key="i"
            :x1="P.l" :x2="W - P.r"
            :y1="P.t + ((height - P.t - P.b) / 4) * (i - 1)"
            :y2="P.t + ((height - P.t - P.b) / 4) * (i - 1)"
            stroke="var(--c-line)" stroke-width="1" />

      <path :d="area" fill="url(#lcFill)" :style="{ opacity: drawn ? 1 : 0, transition: 'opacity .6s ease .3s' }" />
      <path ref="lineEl" :d="path" fill="none" stroke="var(--c-primary)" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"
            :style="{ strokeDasharray: len, strokeDashoffset: drawn ? 0 : len, transition: 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)' }" />

      <g v-for="(p, i) in pts" :key="i">
        <circle :cx="p.x" :cy="p.y" r="9" fill="transparent"
                @mouseenter="hover = p" @mouseleave="hover = null" />
        <circle v-if="hover === p" :cx="p.x" :cy="p.y" r="4.5" fill="var(--c-primary)" stroke="var(--c-surface)" stroke-width="2" />
      </g>
    </svg>

    <div v-if="hover"
         class="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-[5px] bg-ink px-2.5 py-1.5 text-xs text-canvas shadow-lg"
         :style="{ left: (hover.x / W) * 100 + '%', top: hover.y - 8 + 'px' }">
      <span class="font-semibold">{{ format(hover.total) }}</span>
      <span class="ml-1 opacity-70">{{ hover.date?.slice(5) }}</span>
    </div>
  </div>
</template>
