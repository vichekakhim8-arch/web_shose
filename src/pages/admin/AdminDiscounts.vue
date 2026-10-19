<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/services/api.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice, formatDate } from '@/composables/useFormat.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import AppIcon from '@/components/AppIcon.vue'

const toast = useToastStore()
const { t } = useI18n()

const coupons = ref([])
const loading = ref(true)
const busy = ref('')
const discount = ref(20)

const blank = () => ({ id: null, code: '', type: 'percent', value: 10, minSpend: 0, limit: 100, active: true, expiresAt: '' })
const form = reactive(blank())

async function load() {
  loading.value = true
  try {
    coupons.value = await api.coupons.list()
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

function edit(c) {
  Object.assign(form, { ...c, minSpend: c.minSpend / 100 })
}
async function save() {
  busy.value = 'save'
  try {
    coupons.value = await api.coupons.save({ ...form, minSpend: Math.round(form.minSpend * 100) })
    Object.assign(form, blank())
    toast.success(t('admin.saved'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    busy.value = ''
  }
}
const toDelete = ref(null)
const deleting = ref(false)
async function confirmRemoveCoupon() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await api.coupons.remove(toDelete.value.id)
    coupons.value = coupons.value.filter((x) => x.id !== toDelete.value.id)
    toDelete.value = null
  } finally { deleting.value = false }
}
async function toggle(c) {
  coupons.value = await api.coupons.save({ ...c, active: !c.active })
}

const bulkConfirm = ref(false)
async function applyBulk() {
  bulkConfirm.value = false
  busy.value = 'bulk'
  try {
    toast.success(`${await api.products.bulkDiscount(discount.value)} products updated`)
  } catch (e) { toast.error(e.message) } finally { busy.value = '' }
}
async function clearBulk() {
  busy.value = 'clear'
  try {
    toast.success(`${await api.products.clearDiscount()} products restored`)
  } catch (e) { toast.error(e.message) } finally { busy.value = '' }
}

const cols = [
  { key: 'code', label: 'Code' }, { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'used', label: 'Used', align: 'right' }, { key: 'expiresAt', label: 'Expires' },
]
const valueLabel = (c) => (c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? formatPrice(c.value) : t('coupon.shipping'))
</script>

<template>
  <div>
    <PageHeader :title="t('coupon.title')" :count="coupons.length">
      <template #actions>
        <ExportMenu filename="vks-coupons" :title="t('coupon.title')" :columns="cols" :rows="coupons" />
      </template>
    </PageHeader>

    <div class="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div class="space-y-5">
        <!-- Coupon editor -->
        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display font-bold">
            <AppIcon name="ticket" :size="18" /> {{ form.id ? t('common.edit') : t('coupon.newCoupon') }}
          </h2>
          <div class="mt-4 space-y-3">
            <div>
              <label class="label" for="c-code">{{ t('coupon.code') }}</label>
              <input id="c-code" v-model="form.code" class="input font-mono uppercase" placeholder="VKS10" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label" for="c-type">{{ t('coupon.type') }}</label>
                <select id="c-type" v-model="form.type" class="input">
                  <option value="percent">{{ t('coupon.percent') }}</option>
                  <option value="fixed">{{ t('coupon.fixed') }}</option>
                  <option value="shipping">{{ t('coupon.shipping') }}</option>
                </select>
              </div>
              <div>
                <label class="label" for="c-val">{{ t('coupon.value') }}</label>
                <input id="c-val" v-model.number="form.value" type="number" min="0" class="input tabular" :disabled="form.type === 'shipping'" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label" for="c-min">{{ t('coupon.minSpend') }} ($)</label>
                <input id="c-min" v-model.number="form.minSpend" type="number" min="0" class="input tabular" />
              </div>
              <div>
                <label class="label" for="c-lim">{{ t('coupon.limit') }}</label>
                <input id="c-lim" v-model.number="form.limit" type="number" min="0" class="input tabular" />
              </div>
            </div>
            <div>
              <label class="label" for="c-exp">{{ t('coupon.expires') }}</label>
              <input id="c-exp" v-model="form.expiresAt" type="date" class="input" />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.active" type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" /> {{ t('coupon.active') }}
            </label>
            <div class="flex gap-2">
              <button class="btn btn-primary flex-1" :disabled="busy === 'save'" @click="save">{{ t('common.save') }}</button>
              <button v-if="form.id" class="btn btn-outline" @click="Object.assign(form, blank())">{{ t('common.cancel') }}</button>
            </div>
          </div>
        </section>

        <!-- Bulk discount -->
        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display font-bold"><AppIcon name="percent" :size="18" /> {{ t('admin.bulkDiscount') }}</h2>
          <p class="mt-1 text-sm text-muted">{{ t('admin.bulkDiscountSub') }}</p>
          <div class="mt-3 flex items-end gap-2">
            <div class="flex-1">
              <label class="label" for="bd">{{ t('admin.discountPercent') }}</label>
              <input id="bd" v-model.number="discount" type="number" min="1" max="90" class="input tabular" />
            </div>
            <button class="btn btn-primary" :disabled="busy === 'bulk'" @click="bulkConfirm = true">{{ t('admin.applyDiscount') }}</button>
          </div>
          <button class="btn btn-outline mt-2 w-full" :disabled="busy === 'clear'" @click="clearBulk">{{ t('admin.clearDiscount') }}</button>
          <p class="mt-2 text-[11px] text-muted">Original prices are kept in <code>compareAtPrice</code>, so clearing restores them exactly.</p>
        </section>
      </div>

      <!-- Coupon list -->
      <section class="card overflow-x-auto">
        <table class="w-full min-w-[640px]">
          <thead class="border-b border-line bg-surface-2">
            <tr>
              <th class="th">{{ t('coupon.code') }}</th><th class="th">{{ t('coupon.type') }}</th>
              <th class="th">{{ t('coupon.minSpend') }}</th><th class="th">{{ t('coupon.used') }}</th>
              <th class="th">{{ t('coupon.expires') }}</th><th class="th text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line-soft">
            <tr v-if="loading"><td colspan="6" class="td py-10 text-center text-muted">{{ t('common.loading') }}</td></tr>
            <tr v-for="c in coupons" v-else :key="c.id" class="transition hover:bg-surface-2">
              <td class="td">
                <p class="font-mono font-bold">{{ c.code }}</p>
                <span class="rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      :class="c.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-surface-2 text-muted'">
                  {{ c.active ? t('coupon.active') : t('coupon.inactive') }}
                </span>
              </td>
              <td class="td"><span class="font-semibold">{{ valueLabel(c) }}</span><p class="text-[11px] text-muted">{{ c.type }}</p></td>
              <td class="td tabular">{{ formatPrice(c.minSpend) }}</td>
              <td class="td tabular">{{ c.used }} / {{ c.limit || '∞' }}</td>
              <td class="td text-muted">{{ c.expiresAt ? formatDate(c.expiresAt) : '—' }}</td>
              <td class="td text-right">
                <button class="rounded-[5px] p-2 text-muted hover:bg-surface-2 hover:text-ink" :aria-label="t('common.edit')" @click="edit(c)"><AppIcon name="edit" :size="15" /></button>
                <button class="rounded-[5px] p-2 text-muted hover:bg-surface-2 hover:text-ink" :aria-label="t('coupon.active')" @click="toggle(c)"><AppIcon :name="c.active ? 'eye' : 'lock'" :size="15" /></button>
                <button class="rounded-[5px] p-2 text-muted hover:bg-rose-500/10 hover:text-rose-600" :aria-label="t('common.delete')" @click="toDelete = c"><AppIcon name="trash" :size="15" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <ConfirmModal
      :open="!!toDelete"
      :title="`${t('common.delete')} ${toDelete?.code || ''}`"
      :message="t('confirm.generic')"
      :busy="deleting"
      @confirm="confirmRemoveCoupon"
      @cancel="toDelete = null"
    />

    <ConfirmModal
      :open="bulkConfirm"
      icon="percent"
      :danger="false"
      :title="`${t('admin.applyDiscount')} — ${discount}%`"
      :message="t('admin.bulkDiscountSub')"
      :confirm-label="t('admin.applyDiscount')"
      :busy="busy === 'bulk'"
      @confirm="applyBulk"
      @cancel="bulkConfirm = false"
    />
  </div>
</template>
