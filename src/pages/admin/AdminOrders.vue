<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { ORDER_STATUSES } from '@/services/seed.js'
import { useToastStore } from '@/stores/toast.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useI18n } from '@/i18n/index.js'
import { useFormat } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import OrderDetailModal from '@/components/admin/OrderDetailModal.vue'
import AppIcon from '@/components/AppIcon.vue'

const toast = useToastStore()
const catalog = useCatalogStore()
const { t } = useI18n()
const { formatPrice, formatDateTime, STATUS_STYLES } = useFormat()

const orders = ref([])
const loading = ref(true)
const status = ref('')
const search = ref('')
const view = ref(localStorage.getItem('vks_orders_view') || 'table')

const detail = ref(null)      // order shown in the detail modal
const toDelete = ref(null)    // order awaiting delete confirmation
const deleting = ref(false)

function setView(v) {
  view.value = v
  localStorage.setItem('vks_orders_view', v)
}

async function load() {
  loading.value = true
  try {
    orders.value = await api.orders.all()
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const counts = computed(() => {
  const c = { '': orders.value.length }
  ORDER_STATUSES.forEach((s) => (c[s] = orders.value.filter((o) => o.status === s).length))
  return c
})

const filtered = computed(() =>
  orders.value.filter((o) => {
    if (status.value && o.status !== status.value) return false
    const q = search.value.trim().toLowerCase()
    return !q || [o.id, o.customerName, o.customerEmail, o.customerPhone].join(' ').toLowerCase().includes(q)
  }),
)

async function change(order, next) {
  if (!order || next === order.status) return
  try {
    const updated = await api.orders.updateStatus(order.id, next)
    Object.assign(order, updated)
    if (detail.value?.id === order.id) detail.value = { ...updated }
    // Cancelling restores stock — keep the storefront in sync.
    catalog.invalidate()
    toast.success(`${order.id} → ${next}`)
  } catch (e) {
    toast.error(e.message)
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await api.orders.remove(toDelete.value.id)
    orders.value = orders.value.filter((o) => o.id !== toDelete.value.id)
    if (detail.value?.id === toDelete.value.id) detail.value = null
    toast.success(`${toDelete.value.id} ${t('common.delete')} ✓`)
    toDelete.value = null
    catalog.invalidate()
  } catch (e) {
    toast.error(e.message)
  } finally {
    deleting.value = false
  }
}

const exportCols = [
  { key: 'id', label: 'Order' },
  { key: 'createdAt', label: 'Date', format: (v) => formatDateTime(v) },
  { key: 'customerName', label: 'Customer' }, { key: 'customerPhone', label: 'Phone' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', align: 'right', format: (v) => formatPrice(v) },
]
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.orders')" :count="orders.length">
      <template #actions>
        <div class="flex rounded-[5px] border border-line p-0.5">
          <button class="rounded-[5px] p-2 transition" :class="view === 'table' ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                  :aria-label="t('admin.tableView')" :aria-pressed="view === 'table'" @click="setView('table')"><AppIcon name="list" :size="16" /></button>
          <button class="rounded-[5px] p-2 transition" :class="view === 'cards' ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                  :aria-label="t('admin.cardView')" :aria-pressed="view === 'cards'" @click="setView('cards')"><AppIcon name="grid" :size="16" /></button>
        </div>
        <ExportMenu filename="vks-orders" :title="t('nav2.orders')" :columns="exportCols" :rows="filtered" />
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <div class="scroll-x no-scrollbar -mx-1 flex gap-1.5 px-1">
        <button v-for="s in ['', ...ORDER_STATUSES]" :key="s"
                class="shrink-0 rounded-[5px] px-3 py-1.5 text-xs font-medium capitalize transition"
                :class="status === s ? 'bg-primary text-primary-ink' : 'bg-surface text-muted hover:text-ink'"
                @click="status = s">
          {{ s || t('common.all') }} <span class="opacity-60">{{ counts[s] }}</span>
        </button>
      </div>
      <div class="relative ml-auto w-full min-w-44 sm:w-60">
        <AppIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input v-model="search" type="search" class="input pl-9" placeholder="Order #, customer, phone…" />
      </div>
    </div>

    <!-- Table -->
    <div v-if="view === 'table'" class="card overflow-x-auto">
      <table class="w-full min-w-[860px]">
        <thead class="border-b border-line bg-surface-2">
          <tr>
            <th class="th">Order</th><th class="th">Customer</th><th class="th">{{ t('common.date') }}</th>
            <th class="th">{{ t('receipt.items') }}</th><th class="th">Pay</th>
            <th class="th">{{ t('common.total') }}</th><th class="th">{{ t('common.status') }}</th>
            <th class="th text-right">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line-soft">
          <tr v-if="loading"><td colspan="8" class="td py-12 text-center text-muted">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="8" class="td py-12 text-center text-muted">{{ t('common.noResults') }}</td></tr>
          <tr v-for="o in filtered" v-else :key="o.id" class="transition hover:bg-surface-2">
            <td class="td">
              <button class="font-semibold text-primary hover:underline" @click="detail = o">{{ o.id }}</button>
            </td>
            <td class="td">
              <p class="leading-tight">{{ o.customerName }}</p>
              <p class="text-xs text-muted">{{ o.customerPhone }}</p>
            </td>
            <td class="td whitespace-nowrap text-muted">{{ formatDateTime(o.createdAt) }}</td>
            <td class="td tabular">{{ o.lines.reduce((s, l) => s + l.quantity, 0) }}</td>
            <td class="td text-xs uppercase text-muted">{{ o.payment?.method }}</td>
            <td class="td font-semibold tabular">{{ formatPrice(o.total) }}</td>
            <td class="td">
              <select :value="o.status" class="rounded-[5px] border-0 px-2 py-1 text-[11px] font-bold uppercase"
                      :class="STATUS_STYLES[o.status]" :aria-label="`Status ${o.id}`"
                      @change="change(o, $event.target.value)">
                <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </td>
            <td class="td">
              <div class="flex justify-end gap-0.5">
                <button class="rounded-[5px] p-2 text-muted transition hover:bg-primary-soft hover:text-primary"
                        :aria-label="`${t('receipt.title')} ${o.id}`" :title="t('receipt.title')" @click="detail = o">
                  <AppIcon name="eye" :size="16" />
                </button>
                <button class="rounded-[5px] p-2 text-muted transition hover:bg-rose-500/10 hover:text-rose-600"
                        :aria-label="`${t('common.delete')} ${o.id}`" :title="t('common.delete')" @click="toDelete = o">
                  <AppIcon name="trash" :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards -->
    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div v-if="loading" class="skel h-44"></div>
      <article v-for="o in filtered" v-else :key="o.id" class="card card-hover p-4">
        <div class="flex items-center justify-between gap-2">
          <button class="font-display truncate text-primary hover:underline" @click="detail = o">{{ o.id }}</button>
          <span class="shrink-0 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" :class="STATUS_STYLES[o.status]">{{ o.status }}</span>
        </div>
        <p class="mt-1 text-xs text-muted">{{ formatDateTime(o.createdAt) }}</p>
        <p class="mt-2.5 truncate text-sm">{{ o.customerName }} · {{ o.customerPhone }}</p>
        <div class="mt-3 flex -space-x-2">
          <img v-for="l in o.lines.slice(0, 4)" :key="l.productId + l.size" :src="l.image" :alt="l.name"
               class="h-10 w-10 rounded-[5px] border-2 border-surface object-cover" />
          <span v-if="o.lines.length > 4" class="flex h-10 w-10 items-center justify-center rounded-[5px] border-2 border-surface bg-surface-2 text-[10px] font-bold text-muted">
            +{{ o.lines.length - 4 }}
          </span>
        </div>
        <div class="mt-3.5 flex items-center justify-between gap-2">
          <p class="font-display tabular">{{ formatPrice(o.total) }}</p>
          <select :value="o.status" class="input !w-auto !py-1 text-xs" :aria-label="`Status ${o.id}`" @change="change(o, $event.target.value)">
            <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="mt-3 flex gap-2 border-t border-line-soft pt-3">
          <button class="btn btn-outline btn-sm flex-1" @click="detail = o">
            <AppIcon name="eye" :size="14" /> {{ t('receipt.title') }}
          </button>
          <button class="btn btn-sm text-rose-600 transition hover:bg-rose-500/10" @click="toDelete = o">
            <AppIcon name="trash" :size="14" /> {{ t('common.delete') }}
          </button>
        </div>
      </article>
    </div>

    <!-- Detail + delete confirmation -->
    <OrderDetailModal :order="detail" @close="detail = null" @status="change" @remove="(o) => (toDelete = o)" />
    <ConfirmModal
      :open="!!toDelete"
      :title="`${t('common.delete')} ${toDelete?.id || ''}`"
      :message="t('confirm.orderMsg')"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>
