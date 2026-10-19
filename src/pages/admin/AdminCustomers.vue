<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice, formatDate } from '@/composables/useFormat.js'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

const toast = useToastStore()
const { t } = useI18n()
const customers = ref([])
const loading = ref(true)
const search = ref('')

onMounted(async () => {
  try {
    customers.value = await api.admin.customers()
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return customers.value
    .filter((c) => !q || `${c.name} ${c.email}`.toLowerCase().includes(q))
    .sort((a, b) => b.spent - a.spent)
})

const exportCols = [
  { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' }, { key: 'createdAt', label: 'Joined', format: (v) => formatDate(v) },
  { key: 'orderCount', label: 'Orders', align: 'right' },
  { key: 'spent', label: 'Spent', align: 'right', format: (v) => formatPrice(v) },
]
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.customers')" :count="customers.length">
      <template #actions>
        <ExportMenu filename="vks-customers" :title="t('nav2.customers')" :columns="exportCols" :rows="filtered" />
      </template>
    </PageHeader>

    <div class="mb-4 relative w-full sm:max-w-sm">
      <AppIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input v-model="search" type="search" class="input pl-9" placeholder="Search customers…" />
    </div>

    <div class="card overflow-x-auto">
      <table class="w-full min-w-[680px]">
        <thead class="border-b border-line bg-surface-2">
          <tr>
            <th class="th">Customer</th><th class="th">Role</th><th class="th">Joined</th>
            <th class="th">{{ t('admin.orders') }}</th><th class="th text-right">{{ t('account.totalSpent') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-if="loading"><td colspan="5" class="td py-10 text-center text-muted">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="5" class="td py-10 text-center text-muted">{{ t('common.noResults') }}</td></tr>
          <tr v-for="c in filtered" v-else :key="c.id" class="transition hover:bg-surface-2">
            <td class="td">
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[5px] bg-surface-2 text-xs font-bold">
                  <img v-if="c.avatar" :src="c.avatar" alt="" class="h-full w-full object-cover" />
                  <template v-else>{{ c.name.charAt(0) }}</template>
                </span>
                <div><p class="font-semibold">{{ c.name }}</p><p class="text-xs text-muted">{{ c.email }}</p></div>
              </div>
            </td>
            <td class="td">
              <span class="rounded-[5px] px-2 py-0.5 text-[11px] font-bold uppercase"
                    :class="c.role === 'admin' ? 'bg-ink text-canvas' : 'bg-surface-2 text-muted'">{{ c.role }}</span>
            </td>
            <td class="td text-muted">{{ formatDate(c.createdAt) }}</td>
            <td class="td tabular">{{ c.orderCount }}</td>
            <td class="td text-right font-semibold tabular">{{ formatPrice(c.spent) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
