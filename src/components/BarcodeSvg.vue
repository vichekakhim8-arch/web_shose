<script setup>
import { computed } from 'vue'
import { code39 } from '@/services/barcode.js'

const props = defineProps({
  value: { type: String, required: true },
  height: { type: Number, default: 54 },
  showText: { type: Boolean, default: true },
})

// Code 39 requires a quiet zone of at least 10 narrow modules on each side,
// otherwise many scanners refuse to read it. We give it 14.
const QUIET = 14

const bc = computed(() => code39(props.value))
const totalWidth = computed(() => bc.value.width + QUIET * 2)
</script>

<template>
  <figure class="mx-auto w-full max-w-[320px] text-center">
    <svg
      :viewBox="`0 0 ${totalWidth} ${height}`"
      :height="height"
      class="w-full"
      role="img"
      :aria-label="`Barcode ${bc.value}`"
    >
      <rect :width="totalWidth" :height="height" fill="#ffffff" />
      <g shape-rendering="crispEdges" fill="#111111">
        <rect
          v-for="(b, i) in bc.bars"
          :key="i"
          :x="b.x + QUIET"
          y="2"
          :width="b.w"
          :height="height - 4"
        />
      </g>
    </svg>
    <figcaption v-if="showText" class="mt-1.5 text-center font-mono text-[13px] font-medium tracking-[0.35em] text-neutral-800">
      {{ bc.value }}
    </figcaption>
  </figure>
</template>
