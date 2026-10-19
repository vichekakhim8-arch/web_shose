<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/services/api.js'
import { CATEGORIES, CATEGORY_IMAGES } from '@/services/seed.js'
import { useI18n } from '@/i18n/index.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useCatalogStore } from '@/stores/catalog.js'
import HeroCarousel from '@/components/HeroCarousel.vue'
import ProductCard from '@/components/ProductCard.vue'
import CategoryCard from '@/components/CategoryCard.vue'
import AppIcon from '@/components/AppIcon.vue'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const catalog = useCatalogStore()

const newest = ref([])
const loading = ref(true)

const PERKS = [
  { icon: 'shield', title: 'home.authentic', sub: 'home.authenticSub' },
  { icon: 'truck', title: 'home.delivery', sub: 'home.deliverySub' },
  { icon: 'qr', title: 'home.khqr', sub: 'home.khqrSub' },
  { icon: 'refresh', title: 'home.returns', sub: 'home.returnsSub' },
]

const s = computed(() => settings.settings)

/**
 * Hero slides are derived from the live catalogue using the admin's chosen
 * strategy, so editing a product or switching the source updates the hero
 * without any extra wiring.
 */
const heroSlides = computed(() => {
  const all = catalog.products
  if (!all.length) return []
  const n = Math.max(1, Number(s.value.heroCount) || 5)

  switch (s.value.heroSource) {
    case 'manual': {
      const picked = (s.value.heroIds || []).map((id) => all.find((p) => p.id === id)).filter(Boolean)
      return (picked.length ? picked : all).slice(0, n)
    }
    case 'newest':
      return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, n)
    case 'sale':
      return all.filter((p) => p.compareAtPrice > p.price).slice(0, n)
    default:
      return [...all].sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating).slice(0, n)
  }
})

const bestSellers = computed(() =>
  [...catalog.products].sort((a, b) => b.rating - a.rating).slice(0, 4),
)
// Category tiles show live counts rather than a static list.
const categoryCounts = computed(() =>
  Object.fromEntries(CATEGORIES.map((c) => [c, catalog.products.filter((p) => p.category === c).length])),
)

onMounted(async () => {
  try {
    await catalog.init()
    newest.value = (await api.products.list({ sort: 'newest', pageSize: 4 })).items
  } finally {
    loading.value = false
  }
})
watch(() => catalog.products, () => (loading.value = false))
</script>

<template>
  <div>
    <HeroCarousel
      :slides="heroSlides"
      :loading="loading && !heroSlides.length"
      :eyebrow="locale === 'km' ? s.heroEyebrowKm : s.heroEyebrowEn"
      :cta-label="locale === 'km' ? s.heroCtaKm : s.heroCtaEn"
      :autoplay="s.heroAutoplay !== false"
      :interval="Number(s.heroInterval) || 5"
    />

    <!-- Perks: 2-up on phones, 4-up from large -->
    <section class="container-x mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      <div v-for="p in PERKS" :key="p.title" class="card flex items-center gap-3 p-3 sm:p-4">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-primary-soft text-primary sm:h-11 sm:w-11">
          <AppIcon :name="p.icon" :size="18" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-xs font-medium sm:text-sm">{{ t(p.title) }}</span>
          <span class="block truncate text-[11px] text-muted">{{ t(p.sub) }}</span>
        </span>
      </div>
    </section>

    <!-- Promo banner -->
    <section class="container-x mt-10 sm:mt-12">
      <div class="relative overflow-hidden rounded-[5px] border border-line">
        <img :src="s.bannerImage" alt="" class="h-44 w-full object-cover sm:h-60 lg:h-72" />
        <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent"></div>
        <div class="absolute inset-y-0 left-0 flex max-w-[92%] flex-col justify-center p-5 sm:max-w-lg sm:p-10">
          <span class="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-[5px] bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-ink sm:text-[11px]">
            <AppIcon name="percent" :size="12" />
            {{ locale === 'km' ? s.bannerSubKm : s.bannerSubEn }}
          </span>
          <h2 class="font-display h-page text-white">
            {{ locale === 'km' ? s.bannerHeadingKm : s.bannerHeadingEn }}
          </h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <RouterLink :to="{ name: 'shop', query: { onSale: '1' } }" class="btn btn-primary !px-5 !py-2.5 text-xs sm:text-sm">
              {{ t('nav.sale') }} <AppIcon name="arrowRight" :size="15" />
            </RouterLink>
            <RouterLink :to="{ name: 'shop', query: { sort: 'newest' } }"
                        class="btn border border-white/35 !px-5 !py-2.5 text-xs text-white backdrop-blur hover:bg-white/10 sm:text-sm">
              {{ t('nav.new') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories: horizontal scroll on phones, grid from md -->
    <section class="container-x mt-12 sm:mt-16">
      <div class="flex items-end justify-between gap-3">
        <h2 class="font-display h-sect">{{ t('home.categories') }}</h2>
        <RouterLink to="/shop" class="shrink-0 text-sm font-medium text-primary hover:underline">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="scroll-x no-scrollbar -mx-4 mt-5 flex gap-3 px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:px-0">
        <CategoryCard v-for="c in CATEGORIES" :key="c" :name="c" :image="CATEGORY_IMAGES[c]"
                      :count="categoryCounts[c]" class="w-[46%] shrink-0 md:w-auto" />
      </div>
    </section>

    <section class="container-x mt-12 sm:mt-16">
      <div class="flex items-end justify-between gap-3">
        <h2 class="font-display h-sect">{{ t('home.bestSellers') }}</h2>
        <RouterLink :to="{ name: 'shop', query: { sort: 'rating' } }" class="shrink-0 text-sm font-medium text-primary hover:underline">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <template v-if="!bestSellers.length"><div v-for="i in 4" :key="i" class="skel aspect-[3/4]"></div></template>
        <ProductCard v-for="p in bestSellers" v-else :key="p.id" :product="p" />
      </div>
    </section>

    <section class="container-x mt-12 sm:mt-16">
      <div class="flex items-end justify-between gap-3">
        <h2 class="font-display h-sect">{{ t('home.newArrivals') }}</h2>
        <RouterLink :to="{ name: 'shop', query: { sort: 'newest' } }" class="shrink-0 text-sm font-medium text-primary hover:underline">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <template v-if="loading"><div v-for="i in 4" :key="i" class="skel aspect-[3/4]"></div></template>
        <ProductCard v-for="p in newest" v-else :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
