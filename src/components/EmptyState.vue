<script setup>
import AppIcon from './AppIcon.vue'
defineProps({
  icon: { type: String, default: 'box' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-[5px] border border-dashed border-line bg-surface px-6 py-16 text-center">
    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-[5px] bg-surface-2 text-muted">
      <AppIcon :name="icon" :size="26" />
    </div>
    <h3 class="font-display text-lg font-semibold">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-muted">{{ description }}</p>
    <div class="mt-6"><slot /></div>
  </div>
</template>
