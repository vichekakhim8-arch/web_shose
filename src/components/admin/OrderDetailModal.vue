<script setup>
import { ORDER_STATUSES } from '@/services/seed.js'
import { useI18n } from '@/i18n/index.js'
import { useFormat } from '@/composables/useFormat.js'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  order: { type: Object, default: null },
})
const emit = defineEmits(['close', 'status', 'remove'])

const { t } = useI18n()
const { formatPrice, formatDateTime, STATUS_STYLES } = useFormat()
const STEPS = ['paid', 'packed', 'shipped', 'delivered']
const NEXT = { paid: 'packed', packed: 'shipped', shipped: 'delivered' }
</script>

<template>
  <Transition name="fade">
    <div v-if="order" class="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
         @click.self="emit('close')">
      <Transition name="dd" appear>
        <div class="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-[5px] border border-line bg-surface shadow-2xl">
          <!-- Header -->
          <header class="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface px-4 py-3.5 sm:px-5">
            <div class="min-w-0">
              <p class="font-display truncate text-base leading-tight">{{ order.id }}</p>
              <p class="text-[11px] text-muted">{{ formatDateTime(order.createdAt) }}</p>
            </div>
            <span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" :class="STATUS_STYLES[order.status]">
              {{ order.status }}
            </span>
            <button class="ml-auto rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
                    :aria-label="t('common.close')" @click="emit('close')">
              <AppIcon name="x" :size="18" />
            </button>
          </header>

          <!-- Progress -->
          <div v-if="order.status !== 'cancelled'" class="border-b border-line px-4 py-4 sm:px-5">
            <ol class="flex items-center">
              <li v-for="(s, i) in STEPS" :key="s" class="flex flex-1 items-center last:flex-none">
                <span class="flex h-7 w-7 items-center justify-center rounded-[5px] text-[10px] font-bold transition"
                      :class="STEPS.indexOf(order.status) >= i ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-muted'">{{ i + 1 }}</span>
                <span class="ml-1.5 hidden text-[11px] capitalize sm:inline">{{ s }}</span>
                <span v-if="i < STEPS.length - 1" class="mx-1.5 h-0.5 flex-1 rounded-[5px]"
                      :class="STEPS.indexOf(order.status) > i ? 'bg-primary' : 'bg-line'"></span>
              </li>
            </ol>
          </div>

          <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <!-- Customer -->
            <section class="rounded-[5px] bg-surface-2 p-3.5 text-sm">
              <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <AppIcon name="user" :size="13" /> {{ t('receipt.customer') }}
              </p>
              <p class="mt-2 font-medium">{{ order.customerName }}</p>
              <p class="text-muted">{{ order.customerPhone }}</p>
              <p class="break-all text-muted">{{ order.customerEmail }}</p>
            </section>
            <!-- Delivery -->
            <section class="rounded-[5px] bg-surface-2 p-3.5 text-sm">
              <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <AppIcon name="pin" :size="13" /> {{ t('checkout.delivery') }}
              </p>
              <p class="mt-2">{{ order.shipping.address }}</p>
              <p class="text-muted">{{ order.shipping.city }}<span v-if="order.shipping.zoneId"> · {{ order.shipping.zoneId }}</span></p>
              <p v-if="order.shipping.note" class="mt-1 text-xs italic text-muted">"{{ order.shipping.note }}"</p>
            </section>
          </div>

          <!-- Items -->
          <div class="px-4 sm:px-5">
            <ul class="divide-y divide-line-soft rounded-[5px] border border-line">
              <li v-for="l in order.lines" :key="l.productId + l.size" class="flex items-center gap-3 p-3">
                <img :src="l.image" :alt="l.name" class="h-12 w-12 shrink-0 rounded-[5px] object-cover" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ l.name }}</p>
                  <p class="text-[11px] text-muted">EU {{ l.size }} · {{ l.sku }}</p>
                </div>
                <span class="text-sm text-muted tabular">{{ l.quantity }} × {{ formatPrice(l.price) }}</span>
                <span class="w-20 text-right text-sm font-semibold tabular">{{ formatPrice(l.price * l.quantity) }}</span>
              </li>
            </ul>
          </div>

          <!-- Totals + payment -->
          <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <section class="text-sm">
              <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <AppIcon name="wallet" :size="13" /> {{ t('receipt.paidWith') }}
              </p>
              <p class="mt-2 font-medium uppercase">{{ order.payment.method }}</p>
              <p v-if="order.payment.reference" class="break-all font-mono text-xs text-muted">{{ order.payment.reference }}</p>
            </section>
            <dl class="space-y-1.5 text-sm">
              <div class="flex justify-between"><dt class="text-muted">{{ t('cart.subtotal') }}</dt><dd class="tabular">{{ formatPrice(order.subtotal) }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted">{{ t('cart.shipping') }}</dt><dd class="tabular">{{ order.shippingCost ? formatPrice(order.shippingCost) : t('common.free') }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted">{{ t('cart.tax') }}</dt><dd class="tabular">{{ formatPrice(order.tax) }}</dd></div>
              <div class="flex justify-between border-t border-line pt-2 font-display text-base">
                <dt>{{ t('common.total') }}</dt><dd class="tabular">{{ formatPrice(order.total) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Actions -->
          <footer class="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-line bg-surface px-4 py-3.5 sm:px-5">
            <select :value="order.status" class="input !w-auto !py-2 text-xs font-semibold uppercase"
                    :aria-label="t('common.status')"
                    @change="emit('status', order, $event.target.value)">
              <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
            <button v-if="NEXT[order.status]" class="btn btn-primary btn-sm" @click="emit('status', order, NEXT[order.status])">
              <AppIcon name="arrowRight" :size="14" />
              {{ { paid: 'Pack order', packed: 'Mark shipped', shipped: 'Mark delivered' }[order.status] }}
            </button>
            <div class="ml-auto flex gap-2">
              <RouterLink :to="{ name: 'order', params: { id: order.id } }" class="btn btn-outline btn-sm">
                <AppIcon name="printer" :size="14" /> {{ t('receipt.title') }}
              </RouterLink>
              <button class="btn btn-sm text-rose-600 transition hover:bg-rose-500/10" @click="emit('remove', order)">
                <AppIcon name="trash" :size="14" /> {{ t('common.delete') }}
              </button>
            </div>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
