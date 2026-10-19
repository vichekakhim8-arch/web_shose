<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { CATEGORIES, BRANDS, CATEGORY_IMAGES } from '@/services/seed.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import BarChart from '@/components/charts/BarChart.vue'
import AppIcon from '@/components/AppIcon.vue'

const { t } = useI18n()
const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    products.value = (await api.products.list({ pageSize: 500 })).items
  } finally {
    loading.value = false
  }
})

const byKey = (key, list) =>
  list.map((name) => {
    const items = products.value.filter((p) => p[key] === name)
    return {
      name,
      count: items.length,
      stock: items.reduce((s, p) => s + p.stock, 0),
      value: items.reduce((s, p) => s + p.stock * p.price, 0),
      avg: items.length ? Math.round(items.reduce((s, p) => s + p.price, 0) / items.length) : 0,
    }
  })

const categories = computed(() => byKey('category', CATEGORIES))
const brands = computed(() => byKey('brand', BRANDS))

const cols = [
  { key: 'name', label: 'Name' }, { key: 'count', label: 'Products', align: 'right' },
  { key: 'stock', label: 'Stock', align: 'right' },
  { key: 'value', label: 'Stock value', align: 'right', format: (v) => formatPrice(v) },
]
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.catalog')" :subtitle="`${CATEGORIES.length} categories · ${BRANDS.length} brands`">
      <template #actions>
        <ExportMenu filename="vks-catalog" :title="t('nav2.catalog')" :columns="cols" :rows="[...categories, ...brands]" />
      </template>
    </PageHeader>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Categories -->
      <section class="card overflow-hidden">
        <h2 class="flex items-center gap-2 border-b border-line p-4 font-display font-bold">
          <AppIcon name="layers" :size="18" /> {{ t('shop.category') }}
        </h2>
        <ul class="divide-y divide-line-soft">
          <li v-for="c in categories" :key="c.name" class="flex items-center gap-3 p-4">
            <img :src="CATEGORY_IMAGES[c.name]" :alt="c.name" class="h-12 w-12 rounded-[5px] object-cover" />
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{{ c.name }}</p>
              <p class="text-xs text-muted">{{ c.count }} products · {{ c.stock }} units</p>
            </div>
            <div class="text-right">
              <p class="font-display font-bold tabular">{{ formatPrice(c.value) }}</p>
              <p class="text-[11px] text-muted">avg {{ formatPrice(c.avg) }}</p>
            </div>
            <RouterLink :to="{ name: 'shop', query: { category: c.name } }" class="rounded-[5px] p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="View">
              <AppIcon name="arrowUpRight" :size="15" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <div class="space-y-5">
        <!-- Brands -->
        <section class="card overflow-hidden">
          <h2 class="flex items-center gap-2 border-b border-line p-4 font-display font-bold">
            <AppIcon name="tag" :size="18" /> {{ t('shop.brand') }}
          </h2>
          <ul class="divide-y divide-line-soft">
            <li v-for="b in brands" :key="b.name" class="flex items-center gap-3 p-4">
              <span class="flex h-10 w-10 items-center justify-center rounded-[5px] bg-primary-soft font-display text-sm font-extrabold text-primary">
                {{ b.name.charAt(0) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold">{{ b.name }}</p>
                <p class="text-xs text-muted">{{ b.count }} products · {{ b.stock }} units</p>
              </div>
              <p class="font-display font-bold tabular">{{ formatPrice(b.value) }}</p>
            </li>
          </ul>
        </section>

        <section class="card p-5">
          <h2 class="font-display font-bold">Stock value by category</h2>
          <div v-if="loading" class="skel mt-4 h-32"></div>
          <BarChart v-else class="mt-4" :data="categories.map((c) => ({ name: c.name, total: c.value }))" :format="formatPrice" />
        </section>
      </div>
    </div>

    <p class="mt-4 text-xs text-muted">
      Categories and brands are defined in <code>src/services/seed.js</code>; add one there and it appears across the
      storefront filters, product form and these reports automatically.
    </p>
  </div>
</template>
