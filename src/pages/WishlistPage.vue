<script setup>
import { onMounted } from 'vue'
import { useWishlistStore } from '@/stores/wishlist.js'
import { useQuickAddStore } from '@/stores/quickAdd.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { api } from '@/services/api.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const wishlist = useWishlistStore()
const quick = useQuickAddStore()
const catalog = useCatalogStore()
const toast = useToastStore()
const { t } = useI18n()

// Pull fresh prices/stock before rendering — saved items must not show a
// price that a bulk discount has since changed.
onMounted(() => catalog.init())

/** Fetch the live product so stock/sizes are current before adding. */
async function move(item) {
  try {
    quick.show(await api.products.get(item.slug))
  } catch (e) {
    toast.error(e.message)
  }
}
</script>

<template>
  <div class="container-x py-8">
    <div class="page-head">
      <div>
        <h1 class="font-display text-3xl font-extrabold">{{ t('fav.title') }}</h1>
        <p class="mt-1 text-sm text-muted">{{ wishlist.count }} {{ t('shop.results') }}</p>
      </div>
      <button v-if="wishlist.count" class="btn btn-outline btn-sm ml-auto" @click="wishlist.clear()">
        <AppIcon name="trash" :size="14" /> {{ t('common.clear') }}
      </button>
    </div>

    <EmptyState v-if="!wishlist.count" class="mt-6" icon="heart" :title="t('fav.empty')" :description="t('fav.emptySub')">
      <RouterLink to="/shop" class="btn btn-primary">{{ t('nav.shop') }}</RouterLink>
    </EmptyState>

    <TransitionGroup v-else name="list" tag="div" class="relative mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <article v-for="item in wishlist.items" :key="item.id" class="card overflow-hidden"
               :class="item.stock > 0 && 'card-hover'">
        <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="relative block aspect-square overflow-hidden bg-surface-2">
          <img :src="item.image" :alt="item.name" loading="lazy"
               class="h-full w-full object-cover transition duration-500"
               :class="item.stock > 0 ? 'hover:scale-105' : 'scale-105 blur-[3px] grayscale'" />
          <div v-if="item.stock <= 0" class="absolute inset-0 grid place-items-center bg-canvas/45 backdrop-blur-[2px]">
            <span class="rounded-[5px] bg-ink/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-canvas">
              {{ t('common.outOfStock') }}
            </span>
          </div>
        </RouterLink>
        <div class="p-3.5">
          <p class="text-[11px] font-medium uppercase tracking-wider text-muted">{{ item.brand }}</p>
          <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="font-display line-clamp-2 hover:text-primary">
            {{ item.name }}
          </RouterLink>
          <p class="font-display mt-1.5 flex items-baseline gap-1.5">
            {{ formatPrice(item.price) }}
            <span v-if="item.compareAtPrice > item.price" class="text-xs font-normal text-muted line-through">
              {{ formatPrice(item.compareAtPrice) }}
            </span>
          </p>
          <div class="mt-3 flex gap-2">
            <button class="btn btn-primary btn-sm min-w-0 flex-1" :disabled="item.stock <= 0" @click="move(item)">
              <AppIcon name="bag" :size="14" /> <span class="truncate">{{ t('fav.moveToCart') }}</span>
            </button>
            <button class="btn btn-outline btn-sm !px-2.5" :aria-label="t('fav.remove')" @click="wishlist.remove(item.id)">
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
      </article>
    </TransitionGroup>
  </div>
</template>
