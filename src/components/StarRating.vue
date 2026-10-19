<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  rating: { type: Number, default: 0 },
  count: { type: Number, default: null },
  size: { type: Number, default: 14 },
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:rating'])
</script>

<template>
  <div class="flex items-center gap-1.5">
    <div class="flex" :class="editable && 'gap-0.5'">
      <component
        :is="editable ? 'button' : 'span'"
        v-for="i in 5"
        :key="i"
        :type="editable ? 'button' : undefined"
        :aria-label="editable ? `Rate ${i} of 5` : undefined"
        :class="[
          i <= Math.round(rating) ? 'text-amber-400' : 'text-line',
          editable && 'transition hover:scale-125',
        ]"
        @click="editable && emit('update:rating', i)"
      >
        <AppIcon name="star" :size="size" :class="i <= Math.round(rating) ? 'fill-amber-400' : 'fill-transparent'" />
      </component>
    </div>
    <span v-if="count !== null" class="text-xs text-muted">{{ rating.toFixed(1) }} ({{ count }})</span>
  </div>
</template>
