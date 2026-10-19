<script setup>
import { computed, ref, watch } from 'vue'
import { api } from '@/services/api.js'
import { resolveRange, iso } from '@/services/dateRanges.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { useFormat } from '@/composables/useFormat.js'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import AppIcon from '@/components/AppIcon.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DateRangeMenu from '@/components/ui/DateRangeMenu.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'

const toast = useToastStore()
const { t } = useI18n()
const { formatPrice, formatDate, STATUS_STYLES } = useFormat()

const stats = ref(null)
const loading = ref(true)
const rangeId = ref('last14')
const custom = ref({ from: '', to: '' })

/** The stats endpoint takes a day count, so derive it from the chosen window. */
const days = computed(() => {
  const { from, to } = resolveRange(rangeId.value, custom.value)
  return Math.max(1, Math.round((to - from) / 86400000) + 1)
})
const subtitle = computed(() => {
  const { from, to } = resolveRange(rangeId.value, custom.value)
  return `${iso(from)} → ${iso(to)}`
})

async function load() {
  loading.value = true
  try {
    stats.value = await api.admin.stats(days.value)
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
watch(days, load, { immediate: true })

const exportCols = [
  { key: 'date', label: 'Date' },
  { key: 'orders', label: 'Orders', align: 'right' },
  { key: 'total', label: 'Revenue', align: 'right', format: (v) => formatPrice(v) },
]

const cards = computed(() => [
  { k: 'admin.revenue', value: stats.value?.revenue || 0, icon: 'chart', money: true, tint: 'bg-emerald-500/15 text-emerald-600' },
  { k: 'admin.ordersCount', value: stats.value?.orderCount || 0, icon: 'receipt', tint: 'bg-sky-500/15 text-sky-600' },
  { k: 'admin.customersCount', value: stats.value?.customerCount || 0, icon: 'users', tint: 'bg-violet-500/15 text-violet-600' },
  { k: 'admin.productsCount', value: stats.value?.productCount || 0, icon: 'box', tint: 'bg-amber-500/15 text-amber-600' },
])

</script>

<template>
  <div class="space-y-5">
    <PageHeader :title="t('nav2.dashboard')" :subtitle="subtitle">
      <template #actions>
        <DateRangeMenu v-model="rangeId" v-model:custom="custom" />
        <ExportMenu filename="vks-overview" :title="t('nav2.dashboard')" :subtitle="subtitle"
                    :columns="exportCols" :rows="stats?.revenueByDay || []" />
      </template>
    </PageHeader>

    <!-- KPI cards with animated numbers -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="c in cards" :key="c.k" class="card p-5">
        <div class="flex items-center justify-between">
          <span class="flex h-10 w-10 items-center justify-center rounded-[5px]" :class="c.tint"><AppIcon :name="c.icon" :size="19" /></span>
        </div>
        <p class="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{{ t(c.k) }}</p>
        <p class="font-display mt-1 text-3xl font-extrabold">
          <AnimatedNumber v-if="!loading" :value="c.value" :format="c.money ? (n) => formatPrice(n) : undefined" />
          <span v-else class="skel inline-block h-8 w-24 align-middle"></span>
        </p>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-3">
      <!-- Revenue line chart -->
      <section class="card p-5 xl:col-span-2">
        <div class="flex items-center justify-between">
          <h2 class="font-display font-bold">{{ t('admin.revenueChart') }}</h2>
          <span class="text-xs text-muted">{{ t('common.total') }}: {{ formatPrice(stats?.revenue || 0) }}</span>
        </div>
        <div v-if="loading" class="skel mt-5 h-52"></div>
        <LineChart v-else class="mt-4" :data="stats.revenueByDay" :format="formatPrice" />
      </section>

      <!-- Category split -->
      <section class="card p-5">
        <h2 class="font-display font-bold">{{ t('shop.category') }}</h2>
        <div v-if="loading" class="skel mt-5 h-40"></div>
        <p v-else-if="!stats.byCategory.length" class="mt-4 text-sm text-muted">{{ t('common.noResults') }}</p>
        <BarChart v-else class="mt-5" :data="stats.byCategory" :format="formatPrice" />
      </section>
    </div>

    <div class="grid gap-5 xl:grid-cols-3">
      <!-- Recent orders -->
      <section class="card overflow-hidden xl:col-span-2">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h2 class="font-display font-bold">{{ t('admin.recentOrders') }}</h2>
          <RouterLink to="/admin/orders" class="text-sm font-semibold text-primary hover:underline">{{ t('common.viewAll') }}</RouterLink>
        </div>
        <p v-if="!loading && !stats.recentOrders.length" class="p-6 text-sm text-muted">{{ t('common.noResults') }}</p>
        <table v-else class="w-full text-sm">
          <tbody class="divide-y divide-line">
            <tr v-for="o in stats?.recentOrders || []" :key="o.id" class="transition hover:bg-surface-2">
              <td class="td font-semibold">{{ o.id }}</td>
              <td class="td">{{ o.customerName }}</td>
              <td class="td text-muted">{{ formatDate(o.createdAt) }}</td>
              <td class="td"><span class="rounded-[5px] px-2 py-0.5 text-[11px] font-bold uppercase" :class="STATUS_STYLES[o.status]">{{ o.status }}</span></td>
              <td class="td text-right font-semibold tabular">{{ formatPrice(o.total) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Low stock -->
      <section class="card p-5">
        <h2 class="font-display font-bold">{{ t('admin.lowStockTitle') }}</h2>
        <p v-if="!loading && !stats.lowStock.length" class="mt-4 text-sm text-muted">✓ All good</p>
        <ul class="mt-4 space-y-3">
          <li v-for="p in (stats?.lowStock || []).slice(0, 6)" :key="p.id" class="flex items-center gap-3">
            <img :src="p.image" :alt="p.name" class="h-10 w-10 rounded-[5px] object-cover" />
            <span class="min-w-0 flex-1 truncate text-sm">{{ p.name }}</span>
            <span class="rounded-[5px] px-2 py-0.5 text-[11px] font-bold"
                  :class="p.stock === 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600'">{{ p.stock }}</span>
          </li>
        </ul>
        <RouterLink to="/admin/products" class="mt-4 inline-block text-sm font-semibold text-primary hover:underline">{{ t('admin.manageStock') }}</RouterLink>
      </section>
    </div>


  </div>
</template>
