<script setup>
import { computed, ref, watch } from 'vue'
import { formatPrice } from '@/composables/useFormat.js'

const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 300 },
  step: { type: Number, default: 5 },
  modelValue: { type: Object, default: () => ({ min: '', max: '' }) },
})
const emit = defineEmits(['update:modelValue', 'change'])

const lo = ref(Number(props.modelValue.min) || props.min)
const hi = ref(Number(props.modelValue.max) || props.max)

watch(
  () => props.modelValue,
  (v) => {
    lo.value = v.min === '' || v.min == null ? props.min : Number(v.min)
    hi.value = v.max === '' || v.max == null ? props.max : Number(v.max)
  },
  { deep: true },
)

const pct = (v) => ((v - props.min) / (props.max - props.min)) * 100
const fillStyle = computed(() => ({ left: pct(lo.value) + '%', right: 100 - pct(hi.value) + '%' }))

function onLo(e) {
  lo.value = Math.min(Number(e.target.value), hi.value - props.step)
}
function onHi(e) {
  hi.value = Math.max(Number(e.target.value), lo.value + props.step)
}
function commit() {
  const payload = {
    min: lo.value <= props.min ? '' : String(lo.value),
    max: hi.value >= props.max ? '' : String(hi.value),
  }
  emit('update:modelValue', payload)
  emit('change', payload)
}
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between text-sm">
      <span class="font-semibold tabular">{{ formatPrice(lo * 100) }}</span>
      <span class="text-muted">—</span>
      <span class="font-semibold tabular">{{ hi >= max ? formatPrice(max * 100) + '+' : formatPrice(hi * 100) }}</span>
    </div>

    <div class="relative mt-3 h-6">
      <div class="absolute top-2.5 h-1.5 w-full rounded-[5px] bg-surface-2"></div>
      <div class="absolute top-2.5 h-1.5 rounded-[5px] bg-primary transition-[left,right] duration-150" :style="fillStyle"></div>
      <input class="range-input top-2" type="range" :min="min" :max="max" :step="step" :value="lo"
             aria-label="Minimum price" @input="onLo" @change="commit" />
      <input class="range-input top-2" type="range" :min="min" :max="max" :step="step" :value="hi"
             aria-label="Maximum price" @input="onHi" @change="commit" />
    </div>
  </div>
</template>
