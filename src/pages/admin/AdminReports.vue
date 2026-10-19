<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { resolveRange, eachDay, iso } from '@/services/dateRanges.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import DateRangeMenu from '@/components/ui/DateRangeMenu.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import AppIcon from '@/components/AppIcon.vue'

const { t } = useI18n()
const orders = ref([])
const products = ref([])
const loading = ref(true)
const rangeId = ref('last30')
const custom = ref({ from: '', to: '' })

onMounted(async () => {
  try {
    const [o, p] = await Promise.all([api.orders.all(), api.products.list({ pageSize: 500 })])
    orders.value = o
    products.value = p.items
  } finally {
    loading.value = false
  }
})

const range = computed(() => resolveRange(rangeId.value, custom.value))

/** Orders inside the selected window, excluding cancellations. */
const scoped = computed(() =>
  orders.value.filter((o) => {
    if (o.status === 'cancelled') return false
    const d = new Date(o.createdAt)
    return d >= range.value.from && d <= range.value.to
  }),
)

const kpis = computed(() => {
  const revenue = scoped.value.reduce((s, o) => s + o.total, 0)
  const units = scoped.value.reduce((s, o) => s + o.lines.reduce((n, l) => n + l.quantity, 0), 0)
  return {
    revenue, units,
    orders: scoped.value.length,
    aov: scoped.value.length ? Math.round(revenue / scoped.value.length) : 0,
    ipo: scoped.value.length ? (units / scoped.value.length).toFixed(1) : '0',
  }
})

const series = computed(() => {
  const buckets = Object.fromEntries(eachDay(range.value.from, range.value.to).map((d) => [d, 0]))
  scoped.value.forEach((o) => {
    const k = o.createdAt.slice(0, 10)
    if (k in buckets) buckets[k] += o.total
  })
  return Object.entries(buckets).map(([date, total]) => ({ date, total }))
})

function groupBy(field) {
  const map = {}
  scoped.value.forEach((o) =>
    o.lines.forEach((l) => {
      const p = products.value.find((x) => x.id === l.productId)
      if (p) map[p[field]] = (map[p[field]] || 0) + l.price * l.quantity
    }),
  )
  return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
}
const byCategory = computed(() => groupBy('category'))
const byBrand = computed(() => groupBy('brand'))

const topProducts = computed(() => {
  const map = {}
  scoped.value.forEach((o) =>
    o.lines.forEach((l) => {
      map[l.productId] ||= { name: l.name, qty: 0, revenue: 0 }
      map[l.productId].qty += l.quantity
      map[l.productId].revenue += l.price * l.quantity
    }),
  )
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
})

const cols = [
  { key: 'date', label: 'Date' },
  { key: 'total', label: 'Revenue', align: 'right', format: (v) => formatPrice(v) },
]
const subtitle = computed(() => `${iso(range.value.from)} → ${iso(range.value.to)}`)
</script>

<template>
  <div>
    <PageHeader :title="t('rep.title')" :subtitle="subtitle">
      <template #actions>
        <DateRangeMenu v-model="rangeId" v-model:custom="custom" />
        <ExportMenu filename="vks-report" :title="t('rep.title')" :subtitle="subtitle" :columns="cols" :rows="series" />
      </template>
    </PageHeader>

    <div class="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <div v-for="c in [
        { k: 'rep.revenue', v: kpis.revenue, money: true, icon: 'chart' },
        { k: 'rep.orders', v: kpis.orders, icon: 'receipt' },
        { k: 'rep.units', v: kpis.units, icon: 'box' },
        { k: 'rep.aov', v: kpis.aov, money: true, icon: 'wallet' },
      ]" :key="c.k" class="card p-4">
        <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-primary-soft text-primary"><AppIcon :name="c.icon" :size="17" /></span>
        <p class="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{{ t(c.k) }}</p>
        <p class="font-display text-2xl font-extrabold">
          <AnimatedNumber :value="c.v" :format="c.money ? (n) => formatPrice(n) : undefined" />
        </p>
      </div>
      <div class="card p-4">
        <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-primary-soft text-primary"><AppIcon name="layers" :size="17" /></span>
        <p class="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{{ t('rep.conversion') }}</p>
        <p class="font-display text-2xl font-extrabold tabular">{{ kpis.ipo }}</p>
      </div>
    </div>

    <section class="card mt-5 p-5">
      <h2 class="font-display font-bold">{{ t('rep.trend') }}</h2>
      <div v-if="loading" class="skel mt-4 h-52"></div>
      <p v-else-if="!scoped.length" class="mt-6 text-sm text-muted">{{ t('rep.noData') }}</p>
      <LineChart v-else class="mt-4" :data="series" :format="formatPrice" />
    </section>

    <div class="mt-5 grid gap-5 xl:grid-cols-3">
      <section class="card p-5">
        <h2 class="font-display font-bold">{{ t('rep.byCategory') }}</h2>
        <p v-if="!byCategory.length" class="mt-4 text-sm text-muted">{{ t('rep.noData') }}</p>
        <BarChart v-else class="mt-4" :data="byCategory" :format="formatPrice" />
      </section>
      <section class="card p-5">
        <h2 class="font-display font-bold">{{ t('rep.byBrand') }}</h2>
        <p v-if="!byBrand.length" class="mt-4 text-sm text-muted">{{ t('rep.noData') }}</p>
        <BarChart v-else class="mt-4" :data="byBrand" :format="formatPrice" />
      </section>
      <section class="card overflow-hidden">
        <h2 class="border-b border-line p-4 font-display font-bold">{{ t('rep.topProducts') }}</h2>
        <p v-if="!topProducts.length" class="p-5 text-sm text-muted">{{ t('rep.noData') }}</p>
        <ol v-else class="divide-y divide-line-soft">
          <li v-for="(p, i) in topProducts" :key="p.name" class="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span class="w-4 text-xs text-muted">{{ i + 1 }}</span>
            <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
            <span class="text-xs text-muted">×{{ p.qty }}</span>
            <span class="font-semibold tabular">{{ formatPrice(p.revenue) }}</span>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
