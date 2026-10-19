<script setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ name, total }]
  format: { type: Function, default: (v) => v },
})

const shown = ref(false)
onMounted(() => requestAnimationFrame(() => (shown.value = true)))
const max = computed(() => Math.max(1, ...props.data.map((d) => d.total)))
</script>

<template>
  <ul class="space-y-3">
    <li v-for="(d, i) in data" :key="d.name">
      <div class="mb-1 flex items-baseline justify-between text-sm">
        <span class="font-medium">{{ d.name }}</span>
        <span class="tabular text-muted">{{ format(d.total) }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-[5px] bg-surface-2">
        <div class="h-full rounded-[5px] bg-primary"
             :style="{
               width: shown ? (d.total / max) * 100 + '%' : '0%',
               transition: `width .9s cubic-bezier(.16,1,.3,1) ${i * 80}ms`,
             }"></div>
      </div>
    </li>
  </ul>
</template>
