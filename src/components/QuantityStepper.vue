<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 },
  size: { type: String, default: 'md' },
})
const emit = defineEmits(['update:modelValue'])

const set = (v) =>
  emit('update:modelValue', Math.max(props.min, Math.min(props.max, Math.floor(Number(v)) || props.min)))
</script>

<template>
  <div class="inline-flex items-center rounded-[5px] border border-line bg-surface" :class="size === 'sm' ? 'h-9' : 'h-11'">
    <button type="button" class="flex h-full w-9 items-center justify-center text-muted transition hover:text-ink disabled:opacity-30"
            :disabled="modelValue <= min" aria-label="Decrease quantity" @click="set(modelValue - 1)">
      <AppIcon name="minus" :size="15" />
    </button>
    <input :value="modelValue" type="number" :min="min" :max="max" aria-label="Quantity"
           class="w-10 border-0 bg-transparent text-center text-sm font-semibold tabular focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
           @change="set($event.target.value)" />
    <button type="button" class="flex h-full w-9 items-center justify-center text-muted transition hover:text-ink disabled:opacity-30"
            :disabled="modelValue >= max" aria-label="Increase quantity" @click="set(modelValue + 1)">
      <AppIcon name="plus" :size="15" />
    </button>
  </div>
</template>
