<script setup>
import { computed } from 'vue'
import { useQuickAddStore } from '@/stores/quickAdd.js'
import { useWishlistStore } from '@/stores/wishlist.js'
import { useCartStore } from '@/stores/cart.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import StarRating from './StarRating.vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  product: { type: Object, required: true },
  layout: { type: String, default: 'grid' },
})

const quick = useQuickAddStore()
const wishlist = useWishlistStore()
const cart = useCartStore()
const toast = useToastStore()
const { t } = useI18n()

const soldOut = computed(() => (props.product.stock ?? 0) <= 0)
// Everything left after what is already sitting in the cart (all sizes).
const available = computed(() => cart.availableFor(props.product))
const maxed = computed(() => !soldOut.value && available.value === 0)

const discount = computed(() =>
  props.product.compareAtPrice > props.product.price
    ? Math.round((1 - props.product.price / props.product.compareAtPrice) * 100)
    : 0,
)
const faved = computed(() => wishlist.has(props.product.id))

function openPicker() {
  if (soldOut.value) return toast.error(t('common.outOfStock'))
  if (maxed.value) return toast.error(t('picker.allInCart'))
  quick.show(props.product)
}

function toggleFav() {
  toast.success(wishlist.toggle(props.product) ? t('toast.faved') : t('toast.unfaved'))
}
</script>

<template>
  <article
    class="card group relative overflow-hidden"
    :class="[soldOut ? 'opacity-95' : 'card-hover', layout === 'list' && 'flex gap-4']"
  >
    <RouterLink
      :to="{ name: 'product', params: { slug: product.slug } }"
      class="relative block overflow-hidden bg-surface-2"
      :class="layout === 'list' ? 'aspect-square w-32 shrink-0 sm:w-40' : 'aspect-square w-full'"
    >
      <!-- Sold-out imagery is blurred + desaturated so it reads as unavailable -->
      <img
        :src="product.image" :alt="product.name" loading="lazy"
        class="h-full w-full object-cover transition duration-500"
        :class="soldOut ? 'scale-105 blur-[3px] grayscale' : 'group-hover:scale-105'"
      />
      <div v-if="soldOut" class="absolute inset-0 grid place-items-center bg-canvas/45 backdrop-blur-[2px]">
        <span class="rounded-[5px] bg-ink/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-canvas">
          {{ t('common.outOfStock') }}
        </span>
      </div>

      <div v-else class="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
        <span v-if="discount" class="rounded-[5px] bg-primary px-2 py-1 text-[11px] font-semibold text-primary-ink">-{{ discount }}%</span>
        <span v-if="product.stock <= 5" class="rounded-[5px] bg-amber-400 px-2 py-1 text-[11px] font-semibold text-amber-950">
          {{ t('product.onlyLeft', { n: product.stock }) }}
        </span>
      </div>
    </RouterLink>

    <button
      class="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-[5px] border border-line bg-surface/90 backdrop-blur transition hover:scale-110"
      :class="faved ? 'text-rose-500' : 'text-muted hover:text-ink'"
      :aria-label="faved ? t('fav.remove') : t('fav.add')" :aria-pressed="faved"
      @click.prevent="toggleFav"
    >
      <AppIcon name="heart" :size="17" :class="faved && 'fill-rose-500'" />
    </button>

    <div class="flex flex-1 flex-col p-3.5 sm:p-4">
      <p class="text-[11px] font-medium uppercase tracking-wider text-muted">{{ product.brand }}</p>
      <RouterLink :to="{ name: 'product', params: { slug: product.slug } }"
                  class="font-display mt-1 line-clamp-2 leading-snug transition hover:text-primary">
        {{ product.name }}
      </RouterLink>

      <div v-if="product.colors?.length > 1" class="mt-2 flex items-center gap-1.5">
        <span v-for="c in product.colors.slice(0, 4)" :key="c.name"
              class="h-3.5 w-3.5 rounded-[5px] border border-line" :style="{ background: c.hex }" :title="c.name"></span>
        <span v-if="product.colors.length > 4" class="text-[10px] text-muted">+{{ product.colors.length - 4 }}</span>
      </div>
      <p v-else class="mt-0.5 truncate text-xs text-muted">{{ product.colorway }}</p>

      <StarRating v-if="product.reviewCount" class="mt-2" :rating="product.rating" :count="product.reviewCount" />
      <p v-if="layout === 'list'" class="mt-2 line-clamp-2 text-sm text-muted">{{ product.description }}</p>

      <div class="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div class="flex items-baseline gap-2">
          <span class="font-display text-lg">{{ formatPrice(product.price) }}</span>
          <span v-if="discount" class="text-sm text-muted line-through">{{ formatPrice(product.compareAtPrice) }}</span>
        </div>
        <button class="btn btn-outline btn-sm shrink-0" :disabled="soldOut" @click="openPicker">
          <AppIcon name="bag" :size="14" />
          <span class="hidden sm:inline">{{ maxed ? t('picker.allInCart') : t('product.addToCart') }}</span>
        </button>
      </div>
    </div>
  </article>
</template>
