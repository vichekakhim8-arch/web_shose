<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { BRANDS, CATEGORIES, GENDERS, SIZES } from '@/services/seed.js'
import { useI18n } from '@/i18n/index.js'
import { useDebounce } from '@/composables/useAsync.js'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import PriceRange from '@/components/ui/PriceRange.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const result = ref({ items: [], total: 0, page: 1, pages: 1 })
const loading = ref(true)
const filtersOpen = ref(false)
const view = ref(localStorage.getItem('vks_shop_view') || 'grid')
const q = ref('')

watch(view, (v) => localStorage.setItem('vks_shop_view', v))

const sel = (key) => String(route.query[key] || '').split(',').filter(Boolean)
const sort = computed(() => route.query.sort || 'featured')
const page = computed(() => Number(route.query.page) || 1)

const SORTS = [
  { v: 'featured', k: 'shop.featured' }, { v: 'newest', k: 'shop.newest' },
  { v: 'price-asc', k: 'shop.priceAsc' }, { v: 'price-desc', k: 'shop.priceDesc' },
  { v: 'rating', k: 'shop.rating' },
]

function update(patch, resetPage = true) {
  const next = { ...route.query, ...patch }
  if (resetPage) delete next.page
  Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null) && delete next[k])
  router.push({ name: 'shop', query: next })
}
function toggle(key, value) {
  const s = new Set(sel(key))
  s.has(String(value)) ? s.delete(String(value)) : s.add(String(value))
  update({ [key]: [...s].join(',') })
}
const search = useDebounce((v) => update({ q: v }), 350)

const activeCount = computed(
  () => sel('category').length + sel('brand').length + sel('gender').length + sel('size').length +
    (route.query.minPrice ? 1 : 0) + (route.query.maxPrice ? 1 : 0) +
    (route.query.inStock ? 1 : 0) + (route.query.onSale ? 1 : 0) + (route.query.q ? 1 : 0),
)

const heading = computed(() => {
  if (route.query.q) return `“${route.query.q}”`
  if (sel('category').length === 1) return sel('category')[0]
  if (route.query.gender) return route.query.gender
  if (route.query.onSale) return t('nav.sale')
  return t('shop.title')
})

async function load() {
  loading.value = true
  try {
    result.value = await api.products.list({
      q: route.query.q || '', category: route.query.category || '', brand: route.query.brand || '',
      gender: route.query.gender || '', size: route.query.size || '',
      minPrice: route.query.minPrice || '', maxPrice: route.query.maxPrice || '',
      inStock: route.query.inStock === '1', onSale: route.query.onSale === '1',
      sort: sort.value, page: page.value, pageSize: 9,
    })
  } finally {
    loading.value = false
  }
}

watch(() => route.query, (query) => {
  if (route.name !== 'shop') return
  q.value = query.q || ''
  load()
}, { immediate: true })
</script>

<template>
  <div class="container-x py-8">
    <nav class="text-sm text-muted">
      <RouterLink to="/" class="hover:text-primary">{{ t('nav.home') }}</RouterLink> /
      <span class="text-ink">{{ t('nav.shop') }}</span>
    </nav>

    <div class="page-head mt-4">
      <div>
        <h1 class="font-display text-3xl font-extrabold">{{ heading }}</h1>
        <p class="mt-1 text-sm text-muted">{{ result.total }} {{ t('shop.results') }}</p>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button class="btn btn-outline btn-sm lg:hidden" @click="filtersOpen = !filtersOpen">
          <AppIcon name="filter" :size="15" /> {{ t('shop.filters') }}
          <span v-if="activeCount" class="rounded-[5px] bg-primary px-1.5 text-[10px] text-primary-ink">{{ activeCount }}</span>
        </button>

        <div class="hidden items-center rounded-[5px] border border-line p-0.5 sm:flex">
          <button class="rounded-[5px] p-1.5 transition" :class="view === 'grid' ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                  :aria-label="t('shop.grid')" :aria-pressed="view === 'grid'" @click="view = 'grid'"><AppIcon name="grid" :size="16" /></button>
          <button class="rounded-[5px] p-1.5 transition" :class="view === 'list' ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                  :aria-label="t('shop.list')" :aria-pressed="view === 'list'" @click="view = 'list'"><AppIcon name="list" :size="16" /></button>
        </div>

        <select :value="sort" class="input max-w-[44vw] !w-auto !py-2 text-sm sm:max-w-none" :aria-label="t('shop.sort')" @change="update({ sort: $event.target.value })">
          <option v-for="o in SORTS" :key="o.v" :value="o.v">{{ t(o.k) }}</option>
        </select>
      </div>
    </div>

    <div class="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
      <!-- Mobile backdrop -->
      <Transition name="fade">
        <div v-if="filtersOpen" class="fixed inset-0 z-40 bg-black/50 lg:hidden" @click="filtersOpen = false"></div>
      </Transition>

      <!-- Filters: slide-over drawer on mobile, sticky card on desktop -->
      <aside
        class="card fixed inset-y-0 left-0 z-50 w-[86vw] max-w-xs space-y-6 overflow-y-auto p-4 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-none lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100vh-7rem)]"
        :class="filtersOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex items-center justify-between lg:hidden">
          <p class="font-display flex items-center gap-2"><AppIcon name="filter" :size="17" /> {{ t('shop.filters') }}</p>
          <button class="rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
                  :aria-label="t('common.close')" @click="filtersOpen = false">
            <AppIcon name="x" :size="18" />
          </button>
        </div>
        <div>
          <label class="label" for="sq">{{ t('common.search') }}</label>
          <div class="relative">
            <AppIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="sq" v-model="q" type="search" class="input pl-9" :placeholder="t('common.searchPlaceholder')" @input="search(q)" />
          </div>
        </div>

        <fieldset>
          <legend class="label">{{ t('shop.category') }}</legend>
          <div class="space-y-1.5">
            <label v-for="c in CATEGORIES" :key="c" class="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" :checked="sel('category').includes(c)" @change="toggle('category', c)" />{{ c }}
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label">{{ t('shop.brand') }}</legend>
          <div class="space-y-1.5">
            <label v-for="b in BRANDS" :key="b" class="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" :checked="sel('brand').includes(b)" @change="toggle('brand', b)" />{{ b }}
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label">{{ t('shop.size') }}</legend>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="s in SIZES" :key="s" class="chip !px-2.5 !py-1" :class="sel('size').includes(String(s)) && 'chip-active'" @click="toggle('size', s)">{{ s }}</button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label">{{ t('shop.gender') }}</legend>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="g in GENDERS" :key="g" class="chip" :class="route.query.gender === g && 'chip-active'"
                    @click="update({ gender: route.query.gender === g ? '' : g })">{{ g }}</button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label">{{ t('shop.price') }}</legend>
          <PriceRange
            :min="0" :max="300" :step="5"
            :model-value="{ min: route.query.minPrice || '', max: route.query.maxPrice || '' }"
            @change="update({ minPrice: $event.min, maxPrice: $event.max })"
          />
        </fieldset>

        <div class="space-y-2">
          <label class="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" :checked="route.query.inStock === '1'"
                   @change="update({ inStock: route.query.inStock === '1' ? '' : '1' })" />{{ t('shop.inStockOnly') }}
          </label>
          <label class="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" :checked="route.query.onSale === '1'"
                   @change="update({ onSale: route.query.onSale === '1' ? '' : '1' })" />{{ t('shop.onSale') }}
          </label>
        </div>

        <button v-if="activeCount" class="text-sm font-semibold text-primary hover:underline" @click="router.push({ name: 'shop' })">
          {{ t('shop.clearAll') }}
        </button>

        <button class="btn btn-primary w-full lg:hidden" @click="filtersOpen = false">
          {{ result.total }} {{ t('shop.results') }}
        </button>
      </aside>

      <!-- Results -->
      <section>
        <div v-if="loading" class="grid gap-3 sm:gap-4" :class="view === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'">
          <div v-for="i in 6" :key="i" class="skel" :class="view === 'grid' ? 'aspect-[3/4]' : 'h-40'"></div>
        </div>

        <EmptyState v-else-if="!result.items.length" icon="search" :title="t('common.noResults')">
          <button class="btn btn-primary" @click="router.push({ name: 'shop' })">{{ t('shop.clearAll') }}</button>
        </EmptyState>

        <template v-else>
          <TransitionGroup name="list" tag="div" class="grid gap-3 sm:gap-4"
                           :class="view === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'">
            <ProductCard v-for="p in result.items" :key="p.id" :product="p" :layout="view" />
          </TransitionGroup>

          <nav v-if="result.pages > 1" class="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
            <button class="btn btn-outline !px-3" :disabled="page <= 1" aria-label="Previous" @click="update({ page: page - 1 }, false)">
              <AppIcon name="chevronLeft" :size="16" />
            </button>
            <button v-for="n in result.pages" :key="n" class="h-10 w-10 rounded-[5px] text-sm font-semibold transition"
                    :class="n === page ? 'bg-primary text-primary-ink' : 'text-muted hover:bg-surface-2'"
                    @click="update({ page: n }, false)">{{ n }}</button>
            <button class="btn btn-outline !px-3" :disabled="page >= result.pages" aria-label="Next" @click="update({ page: page + 1 }, false)">
              <AppIcon name="chevronRight" :size="16" />
            </button>
          </nav>
        </template>
      </section>
    </div>
  </div>
</template>
