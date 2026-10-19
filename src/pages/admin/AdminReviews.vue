<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { useI18n } from '@/i18n/index.js'
import { formatDate } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import StarRating from '@/components/StarRating.vue'
import AppIcon from '@/components/AppIcon.vue'

const { t } = useI18n()
const products = ref([])
const reviews = ref([])
const loading = ref(true)
const stars = ref(0)
const search = ref('')

onMounted(async () => {
  try {
    products.value = (await api.products.list({ pageSize: 500 })).items
    // Reviews are stored per product, so fan out across the catalogue.
    const all = await Promise.all(products.value.map((p) => api.reviews.list(p.id)))
    reviews.value = all.flat().map((r) => ({
      ...r,
      product: products.value.find((p) => p.id === r.productId)?.name || '—',
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } finally {
    loading.value = false
  }
})

const filtered = computed(() =>
  reviews.value.filter((r) => {
    if (stars.value && r.rating !== stars.value) return false
    const q = search.value.toLowerCase()
    return !q || `${r.userName} ${r.product} ${r.comment}`.toLowerCase().includes(q)
  }),
)

const avg = computed(() =>
  reviews.value.length ? (reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length).toFixed(1) : '0.0',
)
const dist = computed(() =>
  [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.value.filter((r) => r.rating === n).length })),
)

const cols = [
  { key: 'product', label: 'Product' }, { key: 'userName', label: 'Customer' },
  { key: 'rating', label: 'Rating', align: 'right' }, { key: 'comment', label: 'Comment' },
  { key: 'createdAt', label: 'Date' },
]
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.reviews')" :subtitle="`★ ${avg} average`" :count="reviews.length">
      <template #actions>
        <ExportMenu filename="vks-reviews" :title="t('nav2.reviews')" :columns="cols" :rows="filtered" />
      </template>
    </PageHeader>

    <div class="grid gap-5 lg:grid-cols-[280px_1fr]">
      <section class="card h-fit p-5">
        <p class="font-display text-4xl font-extrabold">{{ avg }}</p>
        <StarRating :rating="Number(avg)" :size="18" />
        <p class="mt-1 text-xs text-muted">{{ reviews.length }} reviews</p>

        <ul class="mt-4 space-y-2">
          <li v-for="d in dist" :key="d.n">
            <button class="flex w-full items-center gap-2 text-xs transition hover:text-primary"
                    :class="stars === d.n && 'font-bold text-primary'"
                    @click="stars = stars === d.n ? 0 : d.n">
              <span class="w-6">{{ d.n }}★</span>
              <span class="h-1.5 flex-1 overflow-hidden rounded-[5px] bg-surface-2">
                <span class="block h-full rounded-[5px] bg-primary transition-all duration-500"
                      :style="{ width: (reviews.length ? (d.count / reviews.length) * 100 : 0) + '%' }"></span>
              </span>
              <span class="w-6 text-right tabular">{{ d.count }}</span>
            </button>
          </li>
        </ul>
        <button v-if="stars" class="mt-3 text-xs font-semibold text-primary hover:underline" @click="stars = 0">{{ t('common.clear') }}</button>
      </section>

      <section>
        <div class="relative mb-4 max-w-sm">
          <AppIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input v-model="search" type="search" class="input pl-9" placeholder="Search reviews…" />
        </div>

        <div v-if="loading" class="space-y-3"><div v-for="i in 3" :key="i" class="skel h-24"></div></div>
        <p v-else-if="!filtered.length" class="card p-8 text-center text-sm text-muted">{{ t('common.noResults') }}</p>

        <ul v-else class="space-y-3">
          <li v-for="r in filtered" :key="r.id" class="card p-4">
            <div class="flex flex-wrap items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-surface-2 text-xs font-bold">{{ r.userName.charAt(0) }}</span>
              <div class="min-w-0">
                <p class="text-sm font-semibold">{{ r.userName }}</p>
                <p class="truncate text-[11px] text-muted">{{ r.product }}</p>
              </div>
              <StarRating :rating="r.rating" :size="13" class="ml-auto" />
              <span class="text-[11px] text-muted">{{ formatDate(r.createdAt) }}</span>
            </div>
            <p class="mt-2.5 text-sm leading-relaxed text-muted">{{ r.comment }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
