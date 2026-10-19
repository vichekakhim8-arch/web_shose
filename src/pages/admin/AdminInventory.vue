<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '@/services/api.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice, formatDateTime } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import AppIcon from '@/components/AppIcon.vue'

const toast = useToastStore()
const { t } = useI18n()

const products = ref([])
const movements = ref([])
const loading = ref(true)
const search = ref('')
const saving = ref(false)

const form = reactive({ productId: '', type: 'in', quantity: 10, reason: '' })

async function load() {
  loading.value = true
  try {
    const [p, m] = await Promise.all([api.products.list({ pageSize: 500 }), api.inventory.movements()])
    products.value = p.items
    movements.value = m
    if (!form.productId) form.productId = products.value[0]?.id || ''
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() =>
  products.value.filter((p) => !search.value || `${p.name} ${p.sku}`.toLowerCase().includes(search.value.toLowerCase())),
)
const totals = computed(() => ({
  units: products.value.reduce((s, p) => s + p.stock, 0),
  value: products.value.reduce((s, p) => s + p.stock * p.price, 0),
  out: products.value.filter((p) => p.stock === 0).length,
  low: products.value.filter((p) => p.stock > 0 && p.stock <= 5).length,
}))

async function record() {
  saving.value = true
  try {
    const { product } = await api.inventory.record(form)
    toast.success(`${product.name} → ${product.stock}`)
    form.quantity = 10
    form.reason = ''
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

const TYPE_STYLE = {
  in: 'bg-emerald-500/15 text-emerald-600',
  out: 'bg-rose-500/15 text-rose-600',
  adjust: 'bg-sky-500/15 text-sky-600',
}

const exportCols = [
  { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Product' },
  { key: 'stock', label: 'On hand', align: 'right' },
  { key: 'price', label: 'Unit', align: 'right', format: (v) => formatPrice(v) },
  { key: 'value', label: 'Value', align: 'right', format: (v) => formatPrice(v) },
]
const exportRows = computed(() => filtered.value.map((p) => ({ ...p, value: p.stock * p.price })))
</script>

<template>
  <div>
    <PageHeader :title="t('inv.title')" :subtitle="t('inv.movements')" :count="products.length">
      <template #actions>
        <ExportMenu filename="vks-inventory" :title="t('inv.title')" :columns="exportCols" :rows="exportRows" />
      </template>
    </PageHeader>

    <!-- Summary -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="c in [
        { k: 'inv.totalUnits', v: totals.units, icon: 'database', tint: 'bg-sky-500/15 text-sky-600' },
        { k: 'inv.value', v: totals.value, money: true, icon: 'wallet', tint: 'bg-emerald-500/15 text-emerald-600' },
        { k: 'inv.lowCount', v: totals.low, icon: 'alert', tint: 'bg-amber-500/15 text-amber-600' },
        { k: 'inv.outOfStockCount', v: totals.out, icon: 'x', tint: 'bg-rose-500/15 text-rose-600' },
      ]" :key="c.k" class="card p-4">
        <span class="flex h-9 w-9 items-center justify-center rounded-[5px]" :class="c.tint"><AppIcon :name="c.icon" :size="17" /></span>
        <p class="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{{ t(c.k) }}</p>
        <p class="font-display text-2xl font-extrabold">
          <AnimatedNumber :value="c.v" :format="c.money ? (n) => formatPrice(n) : undefined" />
        </p>
      </div>
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
      <!-- Record movement -->
      <section class="card h-fit p-5">
        <h2 class="flex items-center gap-2 font-display font-bold"><AppIcon name="sliders" :size="18" /> {{ t('inv.record') }}</h2>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <button v-for="x in ['in', 'out', 'adjust']" :key="x" type="button"
                  class="rounded-[5px] border py-2.5 text-xs font-bold uppercase tracking-wider transition"
                  :class="form.type === x ? 'border-primary bg-primary text-primary-ink' : 'border-line text-muted hover:border-ink'"
                  @click="form.type = x">
            {{ t(x === 'in' ? 'inv.stockIn' : x === 'out' ? 'inv.stockOut' : 'inv.adjust') }}
          </button>
        </div>

        <label class="label mt-4" for="iv-p">{{ t('inv.product') }}</label>
        <select id="iv-p" v-model="form.productId" class="input">
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.stock }})</option>
        </select>

        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="iv-q">{{ t('inv.quantity') }}</label>
            <input id="iv-q" v-model.number="form.quantity" type="number" min="1" class="input tabular" />
          </div>
          <div>
            <label class="label" for="iv-r">{{ t('inv.reason') }}</label>
            <input id="iv-r" v-model="form.reason" class="input" :placeholder="form.type === 'in' ? t('inv.reasonIn') : t('inv.reasonOut')" />
          </div>
        </div>

        <button class="btn btn-primary mt-4 w-full" :disabled="saving || !form.productId" @click="record">
          <AppIcon :name="form.type === 'in' ? 'arrowDownLeft' : form.type === 'out' ? 'arrowUpRight' : 'refresh'" :size="15" />
          {{ saving ? t('common.loading') : t('inv.record') }}
        </button>
      </section>

      <div class="space-y-5">
        <!-- Stock levels -->
        <section class="card overflow-hidden">
          <div class="flex items-center gap-2 border-b border-line p-4">
            <h2 class="font-display font-bold">{{ t('inv.onHand') }}</h2>
            <div class="relative ml-auto w-48">
              <AppIcon name="search" :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input v-model="search" type="search" class="input !py-1.5 pl-8 text-xs" :placeholder="t('admin.searchProducts')" />
            </div>
          </div>
          <div class="max-h-80 overflow-y-auto">
            <table class="w-full">
              <tbody class="divide-y divide-line-soft">
                <tr v-if="loading"><td class="td py-8 text-center text-muted">{{ t('common.loading') }}</td></tr>
                <tr v-for="p in filtered" v-else :key="p.id" class="transition hover:bg-surface-2">
                  <td class="td">
                    <div class="flex items-center gap-2.5">
                      <img :src="p.image" :alt="p.name" class="h-9 w-9 rounded-[5px] object-cover" />
                      <div class="min-w-0"><p class="truncate text-sm font-medium">{{ p.name }}</p><p class="text-[11px] text-muted">{{ p.sku }}</p></div>
                    </div>
                  </td>
                  <td class="td text-right tabular">{{ formatPrice(p.stock * p.price) }}</td>
                  <td class="td w-20 text-right">
                    <span class="rounded-[5px] px-2 py-0.5 text-xs font-bold tabular"
                          :class="p.stock === 0 ? 'bg-rose-500/15 text-rose-600' : p.stock <= 5 ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'">
                      {{ p.stock }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Movement log -->
        <section class="card overflow-hidden">
          <h2 class="border-b border-line p-4 font-display font-bold">{{ t('inv.movements') }}</h2>
          <p v-if="!movements.length" class="p-6 text-sm text-muted">{{ t('common.noResults') }}</p>
          <div v-else class="max-h-72 overflow-y-auto">
            <table class="w-full text-sm">
              <tbody class="divide-y divide-line-soft">
                <tr v-for="m in movements" :key="m.id">
                  <td class="td"><span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" :class="TYPE_STYLE[m.type]">{{ m.type }}</span></td>
                  <td class="td">{{ m.productName }}</td>
                  <td class="td tabular">{{ m.before }} → <strong>{{ m.after }}</strong></td>
                  <td class="td text-muted">{{ m.reason || '—' }}</td>
                  <td class="td whitespace-nowrap text-right text-xs text-muted">{{ formatDateTime(m.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
