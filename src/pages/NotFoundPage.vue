<script setup>
import { useI18n } from '@/i18n/index.js'
const { t } = useI18n()
</script>

<template>
  <div class="container-x flex flex-col items-center py-28 text-center">
    <p class="font-display text-[110px] font-extrabold leading-none text-line">404</p>
    <h1 class="mt-2 font-display text-2xl font-bold">{{ t('common.noResults') }}</h1>
    <div class="mt-8 flex gap-3">
      <RouterLink to="/" class="btn btn-primary">{{ t('nav.home') }}</RouterLink>
      <RouterLink to="/shop" class="btn btn-outline">{{ t('nav.shop') }}</RouterLink>
    </div>
  </div>
</template>
