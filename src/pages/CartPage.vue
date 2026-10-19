<script setup>
import { useCartStore } from '@/stores/cart.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import { FREE_SHIPPING_THRESHOLD, TAX_RATE } from '@/services/domain.js'
import QuantityStepper from '@/components/QuantityStepper.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const cart = useCartStore()
const { t } = useI18n()
</script>

<template>
  <div class="container-x py-8">
    <h1 class="font-display text-3xl font-extrabold">{{ t('cart.title') }}</h1>

    <EmptyState v-if="!cart.items.length" class="mt-6" icon="bag" :title="t('cart.empty')" :description="t('cart.emptySub')">
      <RouterLink to="/shop" class="btn btn-primary">{{ t('nav.shop') }}</RouterLink>
    </EmptyState>

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <!-- Left: items -->
      <div class="card divide-y divide-line">
        <div v-for="item in cart.items" :key="item.id" class="flex gap-3 p-3 sm:gap-4 sm:p-4">
          <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="h-20 w-20 shrink-0 overflow-hidden rounded-[5px] bg-surface-2 sm:h-28 sm:w-28">
            <img :src="item.image" :alt="item.name" class="h-full w-full object-cover" />
          </RouterLink>
          <div class="flex min-w-0 flex-1 flex-col">
            <div class="flex flex-wrap justify-between gap-2">
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">{{ item.brand }}</p>
                <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="font-display font-bold hover:text-primary">{{ item.name }}</RouterLink>
                <p class="text-sm text-muted">EU {{ item.size }} · {{ formatPrice(item.price) }}</p>
              </div>
              <p class="font-display text-lg font-bold">{{ formatPrice(item.price * item.quantity) }}</p>
            </div>
            <div class="mt-auto flex items-center justify-between pt-3">
              <QuantityStepper :model-value="item.quantity" :max="item.stock" @update:model-value="cart.setQuantity(item.id, $event)" />
              <button class="flex items-center gap-1.5 text-sm text-muted transition hover:text-rose-600" @click="cart.remove(item.id)">
                <AppIcon name="trash" :size="15" /> {{ t('cart.remove') }}
              </button>
            </div>
            <p v-if="item.quantity >= item.stock" class="mt-2 text-xs text-amber-600">{{ t('common.lowStock') }}</p>
          </div>
        </div>
      </div>

      <!-- Right: summary -->
      <aside class="card h-fit p-5 lg:sticky lg:top-24">
        <h2 class="font-display text-lg font-bold">{{ t('checkout.summary') }}</h2>
        <dl class="mt-4 space-y-2.5 text-sm">
          <div class="flex justify-between"><dt class="text-muted">{{ t('cart.subtotal') }}</dt><dd class="tabular">{{ formatPrice(cart.totals.subtotal) }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">{{ t('cart.shipping') }}</dt><dd class="tabular">{{ cart.totals.shipping ? formatPrice(cart.totals.shipping) : t('common.free') }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">{{ t('cart.tax') }} ({{ TAX_RATE * 100 }}%)</dt><dd class="tabular">{{ formatPrice(cart.totals.tax) }}</dd></div>
          <div class="flex justify-between border-t border-line pt-3 font-display text-lg font-bold"><dt>{{ t('common.total') }}</dt><dd class="tabular">{{ formatPrice(cart.totals.total) }}</dd></div>
        </dl>

        <p v-if="cart.totals.subtotal < FREE_SHIPPING_THRESHOLD" class="mt-4 rounded-[5px] bg-primary-soft p-3 text-xs text-primary">
          Add {{ formatPrice(FREE_SHIPPING_THRESHOLD - cart.totals.subtotal) }} for free delivery
        </p>

        <RouterLink to="/checkout" class="btn btn-primary mt-5 w-full !py-3">
          {{ t('cart.checkout') }} <AppIcon name="arrowRight" :size="16" />
        </RouterLink>
        <RouterLink to="/shop" class="mt-3 block text-center text-sm text-muted hover:text-ink">{{ t('cart.continue') }}</RouterLink>
        <button class="mt-3 block w-full text-center text-xs text-muted transition hover:text-rose-600" @click="cart.clear()">{{ t('cart.clear') }}</button>
      </aside>
    </div>
  </div>
</template>
