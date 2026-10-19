<script setup>
import AppIcon from './AppIcon.vue'
defineProps({
  name: { type: String, required: true },
  image: { type: String, required: true },
  count: { type: Number, default: null },
})
</script>

<template>
  <RouterLink
    :to="{ name: 'shop', query: { category: name } }"
    class="group relative block aspect-[4/5] overflow-hidden rounded-[5px] border border-line bg-surface-2"
  >
    <img :src="image" :alt="name" loading="lazy"
         class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
      <div>
        <p class="font-display text-lg font-bold text-white">{{ name }}</p>
        <p v-if="count !== null" class="text-xs text-white/70">{{ count }} styles</p>
      </div>
      <span class="flex h-8 w-8 items-center justify-center rounded-[5px] bg-white/15 text-white backdrop-blur transition group-hover:bg-primary">
        <AppIcon name="arrowRight" :size="16" />
      </span>
    </div>
  </RouterLink>
</template>
