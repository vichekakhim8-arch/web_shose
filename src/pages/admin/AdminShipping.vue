<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { SHIPPING_ZONES } from '@/assets/brand.js'
import { FREE_SHIPPING_THRESHOLD } from '@/services/domain.js'
import { useToastStore } from '@/stores/toast.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice, formatDate, STATUS_STYLES } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import AppIcon from '@/components/AppIcon.vue'

const toast = useToastStore()
const catalog = useCatalogStore()
const { t } = useI18n()

const orders = ref([])
const loading = ref(true)
const filter = ref('')

const FLOW = ['paid', 'packed', 'shipped', 'delivered']
const NEXT = { paid: 'packed', packed: 'shipped', shipped: 'delivered' }
const NEXT_LABEL = { paid: 'Pack', packed: 'Ship', shipped: 'Deliver' }

onMounted(async () => {
  try {
    orders.value = await api.orders.all()
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
})

const zoneStats = computed(() =>
  SHIPPING_ZONES.map((z) => {
    const list = orders.value.filter((o) => o.shipping?.zoneId === z.id || o.shipping?.city === z.name)
    const pending = list.filter((o) => FLOW.slice(0, 3).includes(o.status)).length
    return { ...z, count: list.length, pending, revenue: list.reduce((s, o) => s + o.total, 0) }
  }),
)

const queue = computed(() =>
  orders.value
    .filter((o) => FLOW.slice(0, 3).includes(o.status))
    .filter((o) => !filter.value || o.status === filter.value),
)

const stageCounts = computed(() =>
  Object.fromEntries(FLOW.slice(0, 3).map((s) => [s, orders.value.filter((o) => o.status === s).length])),
)

async function advance(o) {
  const next = NEXT[o.status]
  if (!next) return
  try {
    Object.assign(o, await api.orders.updateStatus(o.id, next))
    toast.success(`${o.id} → ${next}`)
    catalog.invalidate()
  } catch (e) { toast.error(e.message) }
}

const zoneName = (o) =>
  SHIPPING_ZONES.find((z) => z.id === o.shipping?.zoneId)?.name || o.shipping?.city || '—'

const cols = [
  { key: 'id', label: 'Order' }, { key: 'customerName', label: 'Customer' },
  { key: 'city', label: 'Zone' }, { key: 'status', label: 'Status' },
  { key: 'shippingCost', label: 'Fee', align: 'right', format: (v) => formatPrice(v) },
]
const rows = computed(() => queue.value.map((o) => ({ ...o, city: zoneName(o) })))
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.shipping')" :subtitle="`Free delivery over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`" :count="queue.length">
      <template #actions>
        <ExportMenu filename="vks-shipping" :title="t('nav2.shipping')" :columns="cols" :rows="rows" />
      </template>
    </PageHeader>

    <!-- Delivery zones -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="z in zoneStats" :key="z.id" class="card p-4">
        <div class="flex items-start justify-between">
          <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-primary-soft text-primary">
            <AppIcon name="pin" :size="17" />
          </span>
          <span class="rounded-[5px] bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">{{ z.eta }}</span>
        </div>
        <p class="font-display mt-3 leading-tight">{{ z.name }}</p>
        <p class="mt-0.5 text-xs text-muted">{{ z.count }} orders · {{ formatPrice(z.revenue) }}</p>
        <div class="mt-3 flex items-baseline justify-between border-t border-line-soft pt-2.5">
          <span class="font-display tabular">{{ formatPrice(z.fee) }}</span>
          <span v-if="z.pending" class="rounded-[5px] bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
            {{ z.pending }} pending
          </span>
          <span v-else class="text-[10px] text-muted">fee</span>
        </div>
      </div>
    </div>

    <!-- Stage filter -->
    <div class="scroll-x no-scrollbar -mx-1 mt-5 flex gap-1.5 px-1">
      <button v-for="s in ['', ...FLOW.slice(0, 3)]" :key="s"
              class="shrink-0 rounded-[5px] px-3 py-1.5 text-xs font-medium capitalize transition"
              :class="filter === s ? 'bg-primary text-primary-ink' : 'bg-surface text-muted hover:text-ink'"
              @click="filter = s">
        {{ s || t('common.all') }}
        <span v-if="s" class="opacity-60">{{ stageCounts[s] || 0 }}</span>
      </button>
    </div>

    <!-- Fulfilment queue -->
    <section class="card mt-3 overflow-x-auto">
      <table class="w-full min-w-[820px]">
        <thead class="border-b border-line bg-surface-2">
          <tr>
            <th class="th">Order</th><th class="th">Deliver to</th><th class="th">Zone</th>
            <th class="th">Progress</th><th class="th">{{ t('common.date') }}</th>
            <th class="th text-right">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line-soft">
          <tr v-if="loading"><td colspan="6" class="td py-12 text-center text-muted">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!queue.length">
            <td colspan="6" class="td py-12 text-center">
              <span class="inline-flex items-center gap-2 text-emerald-600">
                <AppIcon name="checkCircle" :size="18" /> Nothing waiting to ship
              </span>
            </td>
          </tr>
          <tr v-for="o in queue" v-else :key="o.id" class="transition hover:bg-surface-2">
            <td class="td font-semibold">{{ o.id }}</td>
            <td class="td">
              <p class="leading-tight">{{ o.customerName }} · {{ o.customerPhone }}</p>
              <p class="max-w-56 truncate text-[11px] text-muted">{{ o.shipping?.address }}</p>
            </td>
            <td class="td text-muted">{{ zoneName(o) }}</td>
            <td class="td">
              <div class="flex items-center gap-1" :aria-label="o.status">
                <span v-for="(s, i) in FLOW" :key="s"
                      class="h-1.5 w-6 rounded-[5px] transition-all duration-300"
                      :class="FLOW.indexOf(o.status) >= i ? 'bg-primary' : 'bg-line'"></span>
              </div>
              <span class="mt-1 inline-block rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold uppercase" :class="STATUS_STYLES[o.status]">
                {{ o.status }}
              </span>
            </td>
            <td class="td whitespace-nowrap text-muted">{{ formatDate(o.createdAt) }}</td>
            <td class="td text-right">
              <button class="btn btn-primary btn-sm" @click="advance(o)">
                {{ NEXT_LABEL[o.status] }} <AppIcon name="arrowRight" :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <p class="mt-4 text-xs leading-relaxed text-muted">
      Zones, fees and ETAs live in <code>src/assets/brand.js</code> and drive the checkout selector, order totals and this queue.
    </p>
  </div>
</template>
