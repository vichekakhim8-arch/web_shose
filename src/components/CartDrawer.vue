<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import { FREE_SHIPPING_THRESHOLD } from '@/services/domain.js'
import AppIcon from './AppIcon.vue'
import QuantityStepper from './QuantityStepper.vue'

const cart = useCartStore()
const route = useRoute()
const { t } = useI18n()
watch(() => route.fullPath, () => (cart.drawerOpen = false))
</script>

<template>
  <Transition name="fade">
    <div v-if="cart.drawerOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" @click="cart.drawerOpen = false"></div>
  </Transition>
  <Transition name="slide">
    <aside v-if="cart.drawerOpen" class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
           role="dialog" :aria-label="t('cart.title')">
      <div class="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 class="font-display text-lg font-bold">{{ t('cart.title') }} ({{ cart.count }})</h2>
        <button class="rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink" :aria-label="t('common.close')" @click="cart.drawerOpen = false">
          <AppIcon name="x" />
        </button>
      </div>

      <div v-if="cart.items.length" class="border-b border-line px-5 py-3">
        <p class="text-xs text-muted">
          <template v-if="cart.totals.subtotal >= FREE_SHIPPING_THRESHOLD">🎉 Free delivery unlocked</template>
          <template v-else>Add {{ formatPrice(FREE_SHIPPING_THRESHOLD - cart.totals.subtotal) }} for free delivery</template>
        </p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-[5px] bg-surface-2">
          <div class="h-full rounded-[5px] bg-primary transition-all duration-500"
               :style="{ width: Math.min(100, (cart.totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100) + '%' }"></div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-3">
        <div v-if="!cart.items.length" class="flex h-full flex-col items-center justify-center text-center">
          <AppIcon name="bag" :size="40" class="text-line" />
          <p class="mt-4 font-semibold">{{ t('cart.empty') }}</p>
          <p class="mt-1 text-sm text-muted">{{ t('cart.emptySub') }}</p>
          <RouterLink to="/shop" class="btn btn-primary mt-6">{{ t('nav.shop') }}</RouterLink>
        </div>

        <TransitionGroup v-else name="list" tag="ul" class="relative divide-y divide-line">
          <li v-for="item in cart.items" :key="item.id" class="flex gap-3 py-3">
            <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="h-20 w-20 shrink-0 overflow-hidden rounded-[5px] bg-surface-2">
              <img :src="item.image" :alt="item.name" class="h-full w-full object-cover" />
            </RouterLink>
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="flex justify-between gap-2">
                <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="truncate text-sm font-semibold hover:text-primary">{{ item.name }}</RouterLink>
                <span class="shrink-0 text-sm font-bold">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
              <p class="text-xs text-muted">EU {{ item.size }} · {{ formatPrice(item.price) }}</p>
              <div class="mt-auto flex items-center justify-between pt-2">
                <QuantityStepper size="sm" :model-value="item.quantity" :max="item.stock"
                                 @update:model-value="cart.setQuantity(item.id, $event)" />
                <button class="rounded-[5px] p-1.5 text-muted transition hover:text-rose-600" :aria-label="t('cart.remove')" @click="cart.remove(item.id)">
                  <AppIcon name="trash" :size="16" />
                </button>
              </div>
            </div>
          </li>
        </TransitionGroup>
      </div>

      <div v-if="cart.items.length" class="space-y-3 border-t border-line px-5 py-4">
        <div class="flex justify-between text-sm">
          <span class="text-muted">{{ t('cart.subtotal') }}</span>
          <span class="font-display text-lg font-bold">{{ formatPrice(cart.totals.subtotal) }}</span>
        </div>
        <RouterLink to="/checkout" class="btn btn-primary w-full !py-3">{{ t('cart.checkout') }}</RouterLink>
        <RouterLink to="/cart" class="btn btn-outline w-full">{{ t('cart.title') }}</RouterLink>
      </div>
    </aside>
  </Transition>
</template>
