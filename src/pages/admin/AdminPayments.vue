<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice, formatDateTime, STATUS_STYLES } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import KhqrPay from '@/components/KhqrPay.vue'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const toast = useToastStore()
const { t } = useI18n()

const orders = ref([])
const loading = ref(true)
const saving = ref(false)
const method = ref('')
const form = ref({ ...settings.settings })

onMounted(async () => {
  try {
    orders.value = await api.orders.all()
    form.value = { ...settings.settings }
  } finally {
    loading.value = false
  }
})

const paid = computed(() => orders.value.filter((o) => o.status !== 'cancelled'))
const byMethod = computed(() => {
  const m = { khqr: { count: 0, total: 0 }, cod: { count: 0, total: 0 } }
  paid.value.forEach((o) => {
    const k = o.payment?.method === 'cod' ? 'cod' : 'khqr'
    m[k].count++
    m[k].total += o.total
  })
  return m
})
const filtered = computed(() =>
  method.value ? orders.value.filter((o) => (o.payment?.method || 'khqr') === method.value) : orders.value,
)

async function save() {
  saving.value = true
  try {
    await settings.update({ ...form.value })
    toast.success(t('admin.saved'))
  } catch (e) { toast.error(e.message) } finally { saving.value = false }
}

const cols = [
  { key: 'id', label: 'Order' }, { key: 'customerName', label: 'Customer' },
  { key: 'method', label: 'Method' }, { key: 'reference', label: 'Reference' },
  { key: 'total', label: 'Amount', align: 'right', format: (v) => formatPrice(v) },
]
const rows = computed(() =>
  filtered.value.map((o) => ({ ...o, method: o.payment?.method || '—', reference: o.payment?.reference || '—' })),
)
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.payments')" :count="orders.length">
      <template #actions>
        <ExportMenu filename="vks-payments" :title="t('nav2.payments')" :columns="cols" :rows="rows" />
      </template>
    </PageHeader>

    <!-- Method summary: click a card to filter the table -->
    <div class="grid gap-3 sm:grid-cols-3">
      <button class="card p-4 text-left transition" :class="method === 'khqr' && 'border-primary ring-1 ring-primary/30'" @click="method = method === 'khqr' ? '' : 'khqr'">
        <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-[#e21a23]/12 text-[#e21a23]"><AppIcon name="qr" :size="17" /></span>
        <p class="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">KHQR</p>
        <p class="font-display text-2xl"><AnimatedNumber :value="byMethod.khqr.total" :format="(n) => formatPrice(n)" /></p>
        <p class="text-xs text-muted">{{ byMethod.khqr.count }} orders</p>
      </button>
      <button class="card p-4 text-left transition" :class="method === 'cod' && 'border-primary ring-1 ring-primary/30'" @click="method = method === 'cod' ? '' : 'cod'">
        <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-amber-500/15 text-amber-600"><AppIcon name="truck" :size="17" /></span>
        <p class="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{{ t('checkout.payCod') }}</p>
        <p class="font-display text-2xl"><AnimatedNumber :value="byMethod.cod.total" :format="(n) => formatPrice(n)" /></p>
        <p class="text-xs text-muted">{{ byMethod.cod.count }} orders</p>
      </button>
      <div class="card p-4">
        <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-emerald-500/15 text-emerald-600"><AppIcon name="wallet" :size="17" /></span>
        <p class="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{{ t('common.total') }}</p>
        <p class="font-display text-2xl">
          <AnimatedNumber :value="byMethod.khqr.total + byMethod.cod.total" :format="(n) => formatPrice(n)" />
        </p>
        <p class="text-xs text-muted">{{ paid.length }} orders</p>
      </div>
    </div>

    <!-- Transactions: full width, nothing beside it -->
    <section class="card mt-4 overflow-x-auto">
      <div class="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <h2 class="font-display">Transactions</h2>
        <span v-if="method" class="rounded-[5px] bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-primary">{{ method }}</span>
        <button v-if="method" class="ml-auto text-xs font-medium text-primary hover:underline" @click="method = ''">{{ t('common.clear') }}</button>
      </div>
      <table class="w-full min-w-[680px]">
        <thead class="border-b border-line bg-surface-2">
          <tr>
            <th class="th">Order</th><th class="th">Customer</th><th class="th">Method</th>
            <th class="th">Reference</th><th class="th">{{ t('common.status') }}</th>
            <th class="th text-right">{{ t('common.total') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line-soft">
          <tr v-if="loading"><td colspan="6" class="td py-12 text-center text-muted">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="6" class="td py-12 text-center text-muted">{{ t('common.noResults') }}</td></tr>
          <tr v-for="o in filtered" v-else :key="o.id" class="transition hover:bg-surface-2">
            <td class="td"><p class="font-semibold">{{ o.id }}</p><p class="text-[11px] text-muted">{{ formatDateTime(o.createdAt) }}</p></td>
            <td class="td">{{ o.customerName }}</td>
            <td class="td">
              <span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase"
                    :class="o.payment?.method === 'cod' ? 'bg-amber-500/15 text-amber-600' : 'bg-[#e21a23]/12 text-[#e21a23]'">
                {{ o.payment?.method }}
              </span>
            </td>
            <td class="td max-w-44 truncate font-mono text-xs text-muted">{{ o.payment?.reference || '—' }}</td>
            <td class="td"><span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" :class="STATUS_STYLES[o.status]">{{ o.status }}</span></td>
            <td class="td text-right font-semibold tabular">{{ formatPrice(o.total) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- KHQR / Bakong settings below the table -->
    <section class="card mt-4 p-4 sm:p-5">
      <h2 class="flex items-center gap-2 font-display"><AppIcon name="qr" :size="18" /> {{ t('admin.khqrSettings') }}</h2>
      <div class="mt-4 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div class="grid content-start gap-3 sm:grid-cols-2">
          <div>
            <label class="label" for="p-acc">{{ t('admin.bakongAccount') }}</label>
            <input id="p-acc" v-model="form.bakongAccount" class="input font-mono text-sm" placeholder="name@bank" />
          </div>
          <div>
            <label class="label" for="p-mn">{{ t('admin.merchantName') }}</label>
            <input id="p-mn" v-model="form.merchantName" class="input" maxlength="25" />
          </div>
          <div>
            <label class="label" for="p-mc">{{ t('admin.merchantCity') }}</label>
            <input id="p-mc" v-model="form.merchantCity" class="input" maxlength="15" />
          </div>
          <div>
            <label class="label" for="p-cur">Currency</label>
            <select id="p-cur" v-model="form.currency" class="input"><option>USD</option><option>KHR</option></select>
          </div>
          <div class="sm:col-span-2">
            <button class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? t('common.loading') : t('common.save') }}
            </button>
            <p class="mt-3 text-[11px] leading-relaxed text-muted">
              The QR is a valid EMVCo/Bakong payload, but VKS cannot confirm a transfer happened.
              Verify with the Bakong Open API (<code>check_transaction_by_md5</code>) before treating an order as paid.
            </p>
          </div>
        </div>
        <div>
          <p class="label">Preview</p>
          <KhqrPay :amount="2500" :settings="form" bill-number="PREVIEW" :auto="false" />
        </div>
      </div>
    </section>
  </div>
</template>
