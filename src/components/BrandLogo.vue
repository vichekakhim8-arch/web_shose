<script setup>
// VKS monogram: a forward-leaning "V" chevron cut from a rounded tile,
// suggesting motion/speed — then the wordmark. Uses currentColor so it works
// on dark sidebars and light headers alike.
defineProps({
  size: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg'
  showText: { type: Boolean, default: true },
})
const DIM = { sm: 26, md: 32, lg: 40 }
const TEXT = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <svg
      :width="DIM[size]" :height="DIM[size]" viewBox="0 0 40 40"
      fill="none" aria-hidden="true" class="shrink-0"
    >
      <rect x="1" y="1" width="38" height="38" rx="5" fill="var(--c-ink)" />
      <!-- V chevron -->
      <path d="M9 11.5h6.2l5 13.2 5-13.2H31L22.6 31h-5.2L9 11.5z" fill="var(--c-primary)" />
      <!-- speed accent -->
      <path d="M5.5 33.5h12" stroke="var(--c-primary)" stroke-width="2.4" stroke-linecap="round" opacity=".85" />
    </svg>
    <span v-if="showText" class="font-display font-extrabold tracking-[0.14em]" :class="TEXT[size]">VKS</span>
  </span>
</template>
