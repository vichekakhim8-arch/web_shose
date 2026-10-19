<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { BRANDS, CATEGORIES } from '@/services/seed.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import ProductFormModal from '@/components/admin/ProductFormModal.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import AppIcon from '@/components/AppIcon.vue'

const toast = useToastStore()
const { t } = useI18n()

const products = ref([])
const loading = ref(true)
const search = ref('')
const category = ref('')
const brand = ref('')
const stockFilter = ref('')
const view = ref(localStorage.getItem('vks_admin_view') || 'table')

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const serverErrors = ref({})

function setView(v) {
  view.value = v
  localStorage.setItem('vks_admin_view', v)
}

async function load() {
  loading.value = true
  try {
    products.value = (await api.products.list({ pageSize: 500, sort: 'newest' })).items
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() =>
  products.value.filter((p) => {
    if (search.value && !`${p.name} ${p.sku} ${p.colorway}`.toLowerCase().includes(search.value.toLowerCase())) return false
    if (category.value && p.category !== category.value) return false
    if (brand.value && p.brand !== brand.value) return false
    if (stockFilter.value === 'out' && p.stock !== 0) return false
    if (stockFilter.value === 'low' && (p.stock === 0 || p.stock > 5)) return false
    return true
  }),
)

function openCreate() { editing.value = null; serverErrors.value = {}; modalOpen.value = true }
function openEdit(p) { editing.value = p; serverErrors.value = {}; modalOpen.value = true }

async function save(data) {
  saving.value = true
  try {
    editing.value ? await api.products.update(editing.value.id, data) : await api.products.create(data)
    toast.success(t('admin.saved'))
    modalOpen.value = false
    await load()
  } catch (e) {
    toast.error(e.message)
    serverErrors.value = e.fields || {}
  } finally {
    saving.value = false
  }
}

const toDelete = ref(null)
const deleting = ref(false)
async function confirmRemove() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await api.products.remove(toDelete.value.id)
    products.value = products.value.filter((x) => x.id !== toDelete.value.id)
    toast.success(t('common.delete') + ' ✓')
    toDelete.value = null
  } catch (e) { toast.error(e.message) } finally { deleting.value = false }
}

async function setStock(p, value) {
  try {
    const updated = await api.products.setStock(p.id, value)
    Object.assign(p, updated)
  } catch (e) { toast.error(e.message) }
}

const exportCols = [
  { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Product' },
  { key: 'brand', label: 'Brand' }, { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', align: 'right', format: (v) => formatPrice(v) },
  { key: 'stock', label: 'Stock', align: 'right' },
]
</script>

<template>
  <div>
    <PageHeader :title="t('admin.products')" :count="products.length">
      <template #actions>
        <ExportMenu filename="vks-products" :title="t('admin.products')" :columns="exportCols" :rows="filtered" />
        <button class="btn btn-primary btn-sm" @click="openCreate"><AppIcon name="plus" :size="15" /> {{ t('admin.addProduct') }}</button>
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <div class="relative min-w-44 flex-1">
        <AppIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input v-model="search" type="search" class="input pl-9" :placeholder="t('admin.searchProducts')" />
      </div>
      <select v-model="category" class="input !w-auto"><option value="">{{ t('common.all') }} · {{ t('shop.category') }}</option><option v-for="c in CATEGORIES" :key="c">{{ c }}</option></select>
      <select v-model="brand" class="input !w-auto"><option value="">{{ t('common.all') }} · {{ t('shop.brand') }}</option><option v-for="b in BRANDS" :key="b">{{ b }}</option></select>
      <select v-model="stockFilter" class="input !w-auto">
        <option value="">{{ t('common.all') }} · {{ t('admin.stock') }}</option>
        <option value="low">{{ t('common.lowStock') }}</option>
        <option value="out">{{ t('common.outOfStock') }}</option>
      </select>

      <div class="flex rounded-[5px] border border-line p-0.5">
        <button class="rounded-[5px] p-2 transition" :class="view === 'table' ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                :aria-label="t('admin.tableView')" :aria-pressed="view === 'table'" @click="setView('table')"><AppIcon name="list" :size="16" /></button>
        <button class="rounded-[5px] p-2 transition" :class="view === 'cards' ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                :aria-label="t('admin.cardView')" :aria-pressed="view === 'cards'" @click="setView('cards')"><AppIcon name="grid" :size="16" /></button>
      </div>

    </div>

    <!-- Table -->
    <div v-if="view === 'table'" class="card overflow-x-auto">
      <table class="w-full min-w-[840px]">
        <thead class="border-b border-line bg-surface-2">
          <tr>
            <th class="th">Product</th><th class="th">{{ t('shop.category') }}</th>
            <th class="th">{{ t('admin.price') }}</th><th class="th">{{ t('admin.stock') }}</th>
            <th class="th">{{ t('common.status') }}</th><th class="th text-right">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-if="loading"><td colspan="6" class="td py-10 text-center text-muted">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="6" class="td py-10 text-center text-muted">{{ t('common.noResults') }}</td></tr>
          <tr v-for="p in filtered" v-else :key="p.id" class="transition hover:bg-surface-2">
            <td class="td">
              <div class="flex items-center gap-3">
                <img :src="p.image" :alt="p.name" class="h-11 w-11 rounded-[5px] object-cover" />
                <div class="min-w-0">
                  <RouterLink :to="{ name: 'product', params: { slug: p.slug } }" class="block truncate font-semibold hover:text-primary">{{ p.name }}</RouterLink>
                  <p class="text-xs text-muted">{{ p.brand }} · {{ p.sku }}</p>
                </div>
              </div>
            </td>
            <td class="td text-muted">{{ p.category }}</td>
            <td class="td tabular">
              {{ formatPrice(p.price) }}
              <span v-if="p.compareAtPrice > p.price" class="ml-1 text-xs text-muted line-through">{{ formatPrice(p.compareAtPrice) }}</span>
            </td>
            <td class="td">
              <input type="number" min="0" :value="p.stock" class="input !w-20 !py-1.5 text-center tabular"
                     :aria-label="`${t('admin.setStock')} ${p.name}`" @change="setStock(p, $event.target.value)" />
            </td>
            <td class="td">
              <span v-if="p.stock === 0" class="rounded-[5px] bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600">{{ t('common.outOfStock') }}</span>
              <span v-else-if="p.stock <= 5" class="rounded-[5px] bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">{{ t('common.lowStock') }}</span>
              <span v-else class="rounded-[5px] bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600">{{ t('common.inStock') }}</span>
            </td>
            <td class="td text-right">
              <button class="rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink" :aria-label="t('common.edit')" @click="openEdit(p)"><AppIcon name="edit" :size="16" /></button>
              <button class="rounded-[5px] p-2 text-muted transition hover:bg-rose-500/10 hover:text-rose-600" :aria-label="t('common.delete')" @click="toDelete = p"><AppIcon name="trash" :size="16" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards -->
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-if="loading" class="skel h-64"></div>
      <article v-for="p in filtered" v-else :key="p.id" class="card overflow-hidden">
        <img :src="p.image" :alt="p.name" class="aspect-[4/3] w-full object-cover" />
        <div class="p-4">
          <p class="text-[11px] font-bold uppercase tracking-wider text-muted">{{ p.brand }}</p>
          <p class="font-display font-bold">{{ p.name }}</p>
          <p class="mt-1 text-sm tabular">{{ formatPrice(p.price) }}</p>
          <div class="mt-3 flex items-center gap-2">
            <input type="number" min="0" :value="p.stock" class="input !w-20 !py-1.5 text-center tabular"
                   :aria-label="`${t('admin.setStock')} ${p.name}`" @change="setStock(p, $event.target.value)" />
            <button class="btn btn-outline btn-sm flex-1" @click="openEdit(p)"><AppIcon name="edit" :size="14" /> {{ t('common.edit') }}</button>
            <button class="btn btn-sm text-rose-600 hover:bg-rose-500/10" :aria-label="t('common.delete')" @click="toDelete = p"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
      </article>
    </div>

    <p class="text-xs text-muted">{{ filtered.length }} / {{ products.length }}</p>

    <ProductFormModal :open="modalOpen" :product="editing" :saving="saving" :server-errors="serverErrors"
                      @close="modalOpen = false" @save="save" />

    <ConfirmModal
      :open="!!toDelete"
      :title="`${t('common.delete')} ${toDelete?.name || ''}`"
      :message="t('confirm.productMsg')"
      :busy="deleting"
      @confirm="confirmRemove"
      @cancel="toDelete = null"
    />
  </div>
</template>
