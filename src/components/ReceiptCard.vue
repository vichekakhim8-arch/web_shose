<script setup>
import { BRAND } from '@/assets/brand.js'
import { useI18n } from '@/i18n/index.js'
import { useFormat } from '@/composables/useFormat.js'
import BarcodeSvg from './BarcodeSvg.vue'
import BrandLogo from './BrandLogo.vue'
import AppIcon from './AppIcon.vue'

defineProps({
  order: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const { t } = useI18n()
const { formatPrice, formatDateTime, STATUS_STYLES } = useFormat()
const STEPS = ['paid', 'packed', 'shipped', 'delivered']
const printReceipt = () => window.print()
</script>

<template>
  <!-- Paper receipt: always white like real thermal paper; --c-ink is pinned
       dark so the logo and text stay readable even in dark mode. -->
  <article
    class="overflow-hidden rounded-[5px] border border-line bg-white text-neutral-800 shadow-sm print:border-0 print:shadow-none"
    style="--c-ink: #14171c"
  >
    <!-- Centered masthead -->
    <header class="px-5 pb-4 pt-6 text-center">
      <div class="flex justify-center text-neutral-900"><BrandLogo :size="compact ? 'sm' : 'md'" /></div>
      <p class="mt-2 text-[11px] leading-relaxed text-neutral-500">
        {{ BRAND.address }}<br />{{ BRAND.phone }} · {{ BRAND.email }}
      </p>
      <p class="mt-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
        {{ t('receipt.title') }}
      </p>
    </header>

    <div class="border-t border-dashed border-neutral-300"></div>

    <!-- Meta -->
    <dl class="space-y-1.5 px-5 py-4 text-xs">
      <div class="flex justify-between gap-4">
        <dt class="text-neutral-500">{{ t('receipt.orderNo') }}</dt>
        <dd class="font-mono font-semibold text-neutral-900">{{ order.id }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-neutral-500">{{ t('common.date') }}</dt>
        <dd class="tabular">{{ formatDateTime(order.createdAt) }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-neutral-500">{{ t('common.status') }}</dt>
        <dd>
          <span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" :class="STATUS_STYLES[order.status]">
            {{ order.status }}
          </span>
        </dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-neutral-500">{{ t('receipt.customer') }}</dt>
        <dd class="text-right font-medium text-neutral-900">{{ order.customerName }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-neutral-500">{{ t('checkout.phone') }}</dt>
        <dd class="tabular">{{ order.customerPhone }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-neutral-500">{{ t('checkout.address') }}</dt>
        <dd class="max-w-[60%] text-right">{{ order.shipping.address }}, {{ order.shipping.city }}</dd>
      </div>
    </dl>

    <!-- Tracker (full view only — a paper receipt doesn't carry this) -->
    <div v-if="!compact && order.status !== 'cancelled'" class="px-5 pb-4">
      <ol class="flex items-center rounded-[5px] bg-neutral-50 px-3 py-3">
        <li v-for="(s, i) in STEPS" :key="s" class="flex flex-1 items-center last:flex-none">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-[5px] text-[10px] font-bold transition"
            :class="STEPS.indexOf(order.status) >= i ? 'bg-primary text-primary-ink' : 'bg-neutral-200 text-neutral-500'"
          >{{ i + 1 }}</span>
          <span class="ml-1.5 hidden text-[10px] capitalize text-neutral-600 sm:inline">{{ s }}</span>
          <span v-if="i < STEPS.length - 1" class="mx-1.5 h-0.5 flex-1 rounded-[5px]"
                :class="STEPS.indexOf(order.status) > i ? 'bg-primary' : 'bg-neutral-200'"></span>
        </li>
      </ol>
    </div>

    <div class="border-t border-dashed border-neutral-300"></div>

    <!-- Items: text only, no product images -->
    <div class="px-5 py-4">
      <div class="flex text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        <span class="flex-1">{{ t('receipt.items') }}</span>
        <span class="w-14 text-center">{{ t('cart.qty') }}</span>
        <span class="w-20 text-right">{{ t('common.total') }}</span>
      </div>
      <ul class="mt-2 divide-y divide-neutral-100">
        <li v-for="l in order.lines" :key="l.productId + l.size" class="flex py-2.5 text-sm">
          <div class="min-w-0 flex-1 pr-2">
            <p class="font-medium leading-snug text-neutral-900">{{ l.name }}</p>
            <p class="mt-0.5 text-[11px] text-neutral-500">
              EU {{ l.size }} · {{ l.sku }} · {{ formatPrice(l.price) }}
            </p>
          </div>
          <span class="w-14 text-center tabular text-neutral-600">×{{ l.quantity }}</span>
          <span class="w-20 text-right font-semibold tabular text-neutral-900">{{ formatPrice(l.price * l.quantity) }}</span>
        </li>
      </ul>
    </div>

    <div class="border-t border-dashed border-neutral-300"></div>

    <!-- Totals -->
    <dl class="space-y-1.5 px-5 py-4 text-sm">
      <div class="flex justify-between">
        <dt class="text-neutral-500">{{ t('cart.subtotal') }}</dt>
        <dd class="tabular">{{ formatPrice(order.subtotal) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-neutral-500">{{ t('cart.shipping') }}</dt>
        <dd class="tabular">{{ order.shippingCost ? formatPrice(order.shippingCost) : t('common.free') }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-neutral-500">{{ t('cart.tax') }}</dt>
        <dd class="tabular">{{ formatPrice(order.tax) }}</dd>
      </div>
      <div class="mt-1 flex items-baseline justify-between border-t border-neutral-200 pt-2.5">
        <dt class="font-display text-base font-bold text-neutral-900">{{ t('common.total') }}</dt>
        <dd class="font-display text-lg font-bold tabular text-neutral-900">{{ formatPrice(order.total) }}</dd>
      </div>
      <div class="flex justify-between pt-1 text-xs">
        <dt class="text-neutral-500">{{ t('receipt.paidWith') }}</dt>
        <dd class="text-right">
          <span class="font-semibold uppercase">{{ order.payment.method }}</span>
          <span v-if="order.payment.reference" class="block font-mono text-[10px] text-neutral-400">{{ order.payment.reference }}</span>
        </dd>
      </div>
    </dl>

    <div class="border-t border-dashed border-neutral-300"></div>

    <!-- Barcode -->
    <footer class="px-6 py-5">
      <BarcodeSvg :value="order.id" :height="compact ? 40 : 52" />
      <p class="mt-2.5 text-center text-[11px] text-neutral-500">{{ t('receipt.thanks') }}</p>
      <p class="mt-0.5 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-400">vks.store</p>
    </footer>

    <div v-if="!compact" class="no-print border-t border-line bg-surface p-3">
      <button class="btn btn-primary w-full" @click="printReceipt">
        <AppIcon name="printer" :size="15" /> {{ t('receipt.print') }}
      </button>
    </div>
  </article>
</template>
