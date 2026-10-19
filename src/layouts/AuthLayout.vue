<script setup>
// Centred, single-column auth shell. The viewport itself never scrolls on
// desktop — the card scrolls internally if the form outgrows the screen.
import BrandLogo from '@/components/BrandLogo.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useI18n } from '@/i18n/index.js'
const { t } = useI18n()
</script>

<template>
  <div class="relative flex h-[100dvh] flex-col overflow-hidden bg-canvas px-4">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary-soft to-transparent"></div>

    <div class="relative z-10 mx-auto flex w-full max-w-md shrink-0 items-center justify-between py-4">
      <RouterLink to="/" class="flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
        <AppIcon name="arrowLeft" :size="16" /> {{ t('nav.home') }}
      </RouterLink>
      <div class="flex items-center gap-1"><LanguageSwitcher /><ThemeToggle /></div>
    </div>

    <div class="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center overflow-hidden pb-6">
      <div class="mb-5 flex shrink-0 flex-col items-center gap-2 text-ink">
        <BrandLogo size="lg" />
        <p class="text-xs text-muted">{{ t('hero.tagline') }}</p>
      </div>
      <div class="card overflow-y-auto p-6 shadow-sm sm:p-7">
        <slot />
      </div>
    </div>
  </div>
</template>
