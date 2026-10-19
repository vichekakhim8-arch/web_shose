<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart.js'
import { useWishlistStore } from '@/stores/wishlist.js'
import { useAuthStore } from '@/stores/auth.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const cart = useCartStore()
const wishlist = useWishlistStore()
const auth = useAuthStore()
const { t } = useI18n()

// Two tabs either side of a raised centre action, matching the reference dock.
const left = [
  { to: '/', icon: 'store', key: 'tab.home', exact: true },
  { to: '/shop', icon: 'search', key: 'tab.shop' },
]
const right = computed(() => [
  { to: '/wishlist', icon: 'heart', key: 'tab.fav', badge: wishlist.count },
  { to: auth.isAuthenticated ? '/account' : '/login', icon: 'user', key: 'tab.account' },
])

const isActive = (item) => (item.exact ? route.path === item.to : route.path.startsWith(item.to))
</script>

<template>
  <nav class="safe-bottom fixed inset-x-0 bottom-0 z-40 lg:hidden" aria-label="Primary">
    <div class="relative mx-3 mb-3">
      <!-- Dock with a notch punched out behind the centre button -->
      <div class="tabbar-notch flex items-end justify-between rounded-[5px] border border-line bg-surface/95 px-2 pb-1.5 pt-2 shadow-[0_8px_30px_rgba(0,0,0,.14)] backdrop-blur-md">
        <RouterLink v-for="item in left" :key="item.to" :to="item.to"
                    class="flex w-[22%] flex-col items-center gap-0.5 rounded-[5px] py-1 text-[10px] font-semibold transition"
                    :class="isActive(item) ? 'text-primary' : 'text-muted'">
          <AppIcon :name="item.icon" :size="20" />
          <span>{{ t(item.key) }}</span>
        </RouterLink>

        <span class="w-[18%]" aria-hidden="true"></span>

        <RouterLink v-for="item in right" :key="item.to" :to="item.to"
                    class="relative flex w-[22%] flex-col items-center gap-0.5 rounded-[5px] py-1 text-[10px] font-semibold transition"
                    :class="isActive(item) ? 'text-primary' : 'text-muted'">
          <span class="relative">
            <AppIcon :name="item.icon" :size="20" />
            <span v-if="item.badge"
                  class="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-[5px] bg-primary px-1 text-[9px] font-bold text-primary-ink">
              {{ item.badge }}
            </span>
          </span>
          <span>{{ t(item.key) }}</span>
        </RouterLink>
      </div>

      <!-- Raised centre action: open the cart -->
      <button
        class="circle absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center bg-primary text-primary-ink shadow-[0_8px_22px_rgba(0,0,0,.25)] transition active:scale-95"
        :aria-label="t('tab.cart')"
        @click="cart.drawerOpen = true"
      >
        <AppIcon name="bag" :size="23" />
        <span v-if="cart.count"
              class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-[5px] border-2 border-surface bg-ink px-1 text-[10px] font-bold text-canvas">
          {{ cart.count }}
        </span>
      </button>
      <span class="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted">
        {{ t('tab.cart') }}
      </span>
    </div>
  </nav>
</template>
