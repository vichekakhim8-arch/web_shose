<script setup>
import { ref } from 'vue'
import { BRAND, SOCIAL_LINKS } from '@/assets/brand.js'
import { CATEGORIES } from '@/services/seed.js'
import { backendMode } from '@/services/api.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from './AppIcon.vue'
import BrandLogo from './BrandLogo.vue'

const toast = useToastStore()
const { t } = useI18n()
const email = ref('')
const done = ref(localStorage.getItem('vks_newsletter') || '')

function subscribe() {
  if (!/^\S+@\S+\.\S+$/.test(email.value)) return toast.error(t('toast.error'))
  localStorage.setItem('vks_newsletter', email.value)
  done.value = email.value
  email.value = ''
  toast.success(t('footer.subscribe') + ' ✓')
}
</script>

<template>
  <!-- Extra bottom padding on mobile so the floating dock never covers it -->
  <footer class="mt-16 border-t border-line bg-surface pb-24 sm:mt-20 lg:pb-0">
    <div class="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <BrandLogo size="lg" />
        <p class="mt-4 max-w-xs text-sm leading-relaxed text-muted">{{ t('hero.tagline') }}</p>

        <p class="mt-6 text-xs font-bold uppercase tracking-wider text-muted">{{ t('footer.follow') }}</p>
        <ul class="mt-3 flex items-center gap-2">
          <li v-for="s in SOCIAL_LINKS" :key="s.name">
            <a :href="s.href" target="_blank" rel="noopener noreferrer" :aria-label="s.name"
               class="flex h-10 w-10 items-center justify-center rounded-[5px] border border-line text-muted transition hover:border-primary hover:bg-primary hover:text-primary-ink">
              <AppIcon :name="s.icon" :size="18" />
            </a>
          </li>
        </ul>
      </div>

      <div>
        <p class="text-sm font-bold">{{ t('footer.shop') }}</p>
        <ul class="mt-3 space-y-2 text-sm text-muted">
          <li v-for="c in CATEGORIES" :key="c">
            <RouterLink :to="{ name: 'shop', query: { category: c } }" class="transition hover:text-primary">{{ c }}</RouterLink>
          </li>
        </ul>
      </div>

      <div>
        <p class="text-sm font-bold">{{ t('footer.contact') }}</p>
        <ul class="mt-3 space-y-2.5 text-sm text-muted">
          <li class="flex items-start gap-2"><AppIcon name="pin" :size="16" class="mt-0.5" /><span>{{ BRAND.address }}</span></li>
          <li><a :href="`tel:${BRAND.phone}`" class="flex items-center gap-2 transition hover:text-primary"><AppIcon name="phone" :size="16" />{{ BRAND.phone }}</a></li>
          <li><a :href="`mailto:${BRAND.email}`" class="flex items-center gap-2 transition hover:text-primary"><AppIcon name="mail" :size="16" />{{ BRAND.email }}</a></li>
          <li class="flex items-center gap-2"><AppIcon name="clock" :size="16" />{{ BRAND.hours }}</li>
        </ul>
      </div>

      <div>
        <p class="text-sm font-bold">{{ t('footer.newsletter') }}</p>
        <p class="mt-3 text-sm text-muted">{{ t('footer.newsletterSub') }}</p>
        <p v-if="done" class="mt-3 flex items-center gap-1.5 text-sm text-emerald-600"><AppIcon name="checkCircle" :size="16" /> {{ done }}</p>
        <form v-else class="mt-3 flex gap-2" @submit.prevent="subscribe">
          <input v-model="email" type="email" placeholder="you@example.com" class="input" aria-label="Email" />
          <button class="btn btn-primary shrink-0">{{ t('footer.subscribe') }}</button>
        </form>
      </div>
    </div>

    <div class="border-t border-line">
      <div class="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
        <p>© {{ new Date().getFullYear() }} {{ BRAND.fullName }}. {{ t('footer.rights') }}</p>
        <p class="flex items-center gap-1.5">
          <AppIcon name="database" :size="13" />
          {{ backendMode === 'api' ? 'REST API backend' : 'Browser storage (this device only)' }}
        </p>
      </div>
    </div>
  </footer>
</template>
