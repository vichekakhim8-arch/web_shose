<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api.js'
import { useI18n } from '@/i18n/index.js'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import ReceiptCard from '@/components/ReceiptCard.vue'

const route = useRoute()
const { t } = useI18n()
const order = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    order.value = await api.orders.get(route.params.id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container-x max-w-2xl py-8">
    <div v-if="loading" class="skel h-96"></div>
    <EmptyState v-else-if="error" icon="alert" :title="t('common.noResults')" :description="error">
      <RouterLink to="/account" class="btn btn-primary">{{ t('common.myOrders') }}</RouterLink>
    </EmptyState>

    <template v-else-if="order">
      <div v-if="route.query.placed" class="no-print mb-6 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-emerald-500/15 text-emerald-600">
          <AppIcon name="checkCircle" :size="30" />
        </div>
        <h1 class="font-display mt-3 text-2xl font-extrabold">{{ t('receipt.thanks') }}</h1>
        <p class="mt-1 text-sm text-muted">{{ order.customerEmail }}</p>
      </div>

      <ReceiptCard :order="order" />

      <div class="no-print mt-5 flex justify-center gap-3">
        <RouterLink to="/account?tab=orders" class="btn btn-outline">{{ t('common.myOrders') }}</RouterLink>
        <RouterLink to="/shop" class="btn btn-primary">{{ t('cart.continue') }}</RouterLink>
      </div>
    </template>
  </div>
</template>
