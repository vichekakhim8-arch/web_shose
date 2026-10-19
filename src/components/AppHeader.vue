<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useCartStore } from '@/stores/cart.js'
import { useWishlistStore } from '@/stores/wishlist.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { NAV } from '@/assets/brand.js'
import { CATEGORIES } from '@/services/seed.js'
import { onClickOutside } from '@/composables/useClickOutside.js'
import AppIcon from './AppIcon.vue'
import BrandLogo from './BrandLogo.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'
import SearchDialog from './SearchDialog.vue'

const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const searchOpen = ref(false)
const mobileOpen = ref(false)
const menuOpen = ref(false)
const menuRef = ref(null)
onClickOutside(menuRef, () => (menuOpen.value = false))

watch(() => route.fullPath, () => {
  mobileOpen.value = false
  menuOpen.value = false
})

function isActive(item) {
  if (route.name !== 'shop') return false
  if (item.query.category) return String(route.query.category || '').split(',').includes(item.query.category)
  if (item.query.gender) return route.query.gender === item.query.gender
  if (item.query.onSale) return route.query.onSale === '1'
  return route.query.sort === item.query.sort && !route.query.category && !route.query.gender
}

async function logout() {
  await auth.logout()
  toast.info(t('toast.signedOut'))
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
    <p class="bg-ink px-4 py-2 text-center text-[11px] font-medium leading-snug tracking-wide text-canvas">
      {{ t('banner.announce') }}
    </p>

    <div class="container-x flex h-[68px] items-center gap-3">
      <button class="-ml-2 rounded-[5px] p-2 text-ink transition hover:bg-surface-2 lg:hidden"
              :aria-expanded="mobileOpen" :aria-label="t('nav.shop')" @click="mobileOpen = !mobileOpen">
        <AppIcon :name="mobileOpen ? 'x' : 'menu'" />
      </button>

      <RouterLink to="/" class="shrink-0 text-ink" aria-label="VKS home"><BrandLogo /></RouterLink>

      <nav class="ml-6 hidden items-center gap-7 lg:flex">
        <RouterLink v-for="item in NAV" :key="item.key"
                    :to="{ name: 'shop', query: item.query }"
                    class="nav-link" :class="isActive(item) && 'nav-link-active'">
          {{ t(item.key) }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-0.5">
        <button class="flex h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-2 hover:text-ink"
                :aria-label="t('common.search')" @click="searchOpen = true">
          <AppIcon name="search" :size="19" />
        </button>

        <!-- Favourites (hidden on mobile — the dock covers it there) -->
        <RouterLink to="/wishlist"
                    class="relative hidden h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-2 hover:text-ink lg:flex"
                    :aria-label="t('fav.title')">
          <AppIcon name="heart" :size="19" :class="wishlist.count && 'fill-rose-500 text-rose-500'" />
          <span v-if="wishlist.count"
                class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-ink px-1 text-[10px] font-bold text-canvas">
            {{ wishlist.count }}
          </span>
        </RouterLink>

        <LanguageSwitcher />
        <ThemeToggle />

        <div ref="menuRef" class="relative">
          <button v-if="auth.isAuthenticated"
                  class="flex h-9 items-center gap-2 rounded-[5px] px-1.5 transition hover:bg-surface-2"
                  :aria-expanded="menuOpen" :aria-label="t('common.account')" @click="menuOpen = !menuOpen">
            <span class="flex h-7 w-7 items-center justify-center rounded-[5px] bg-primary text-[11px] font-bold text-primary-ink">
              {{ auth.initials }}
            </span>
            <AppIcon name="chevronDown" :size="13" class="text-muted transition-transform duration-200" :class="menuOpen && 'rotate-180'" />
          </button>
          <RouterLink v-else :to="{ name: 'login', query: { redirect: route.fullPath } }"
                      class="flex h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-2 hover:text-ink"
                      :aria-label="t('common.signIn')">
            <AppIcon name="user" :size="19" />
          </RouterLink>

          <Transition name="dd">
            <div v-if="menuOpen"
                 class="absolute right-0 z-50 mt-2 w-60 origin-top overflow-hidden rounded-[5px] border border-line bg-surface p-1 shadow-xl">
              <div class="border-b border-line px-3 pb-2.5 pt-2">
                <p class="truncate text-sm font-semibold">{{ auth.user.name }}</p>
                <p class="truncate text-xs text-muted">{{ auth.user.email }}</p>
              </div>
              <RouterLink v-if="auth.isAdmin" to="/admin" class="flex items-center gap-2.5 rounded-[5px] px-3 py-2 text-sm transition hover:bg-surface-2">
                <AppIcon name="grid" :size="16" /> {{ t('common.dashboard') }}
              </RouterLink>
              <RouterLink to="/account" class="flex items-center gap-2.5 rounded-[5px] px-3 py-2 text-sm transition hover:bg-surface-2">
                <AppIcon name="user" :size="16" /> {{ t('common.profile') }}
              </RouterLink>
              <RouterLink to="/account?tab=orders" class="flex items-center gap-2.5 rounded-[5px] px-3 py-2 text-sm transition hover:bg-surface-2">
                <AppIcon name="receipt" :size="16" /> {{ t('common.myOrders') }}
              </RouterLink>
              <button class="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-500/10" @click="logout">
                <AppIcon name="logout" :size="16" /> {{ t('common.signOut') }}
              </button>
            </div>
          </Transition>
        </div>

        <button class="relative flex h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-2 hover:text-ink"
                :aria-label="t('common.cart')" @click="cart.drawerOpen = true">
          <AppIcon name="bag" :size="19" />
          <span v-if="cart.count"
                class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-primary px-1 text-[10px] font-bold text-primary-ink">
            {{ cart.count }}
          </span>
        </button>
      </div>
    </div>

    <Transition name="dd">
      <nav v-if="mobileOpen" class="origin-top border-t border-line bg-surface lg:hidden">
        <div class="container-x grid gap-0.5 py-3">
          <RouterLink v-for="item in NAV" :key="item.key" :to="{ name: 'shop', query: item.query }"
                      class="rounded-[5px] px-3 py-2.5 text-sm font-medium transition hover:bg-surface-2">
            {{ t(item.key) }}
          </RouterLink>
          <div class="my-1 border-t border-line"></div>
          <RouterLink v-for="c in CATEGORIES" :key="c" :to="{ name: 'shop', query: { category: c } }"
                      class="rounded-[5px] px-3 py-2 text-sm text-muted transition hover:bg-surface-2">{{ c }}</RouterLink>
        </div>
      </nav>
    </Transition>

    <SearchDialog :open="searchOpen" @close="searchOpen = false" />
  </header>
</template>
