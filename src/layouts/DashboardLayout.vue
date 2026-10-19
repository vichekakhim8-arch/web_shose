<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useUiStore } from '@/stores/ui.js'
import { api } from '@/services/api.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from '@/components/AppIcon.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import NotificationBell from '@/components/NotificationBell.vue'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const mobileOpen = ref(false)
watch(() => route.fullPath, () => (mobileOpen.value = false))
const wide = computed(() => ui.sidebarOpen)
const showLabels = computed(() => wide.value || mobileOpen.value)

const GROUPS = [
  {
    key: 'nav2.groupSell',
    items: [
      { to: '/admin', key: 'nav2.dashboard', icon: 'grid' },
      { to: '/admin/orders', key: 'nav2.orders', icon: 'receipt' },
      { to: '/admin/customers', key: 'nav2.customers', icon: 'users' },
      { to: '/admin/payments', key: 'nav2.payments', icon: 'wallet' },
      { to: '/admin/shipping', key: 'nav2.shipping', icon: 'truck' },
    ],
  },
  {
    key: 'nav2.groupCatalog',
    items: [
      { to: '/admin/products', key: 'nav2.products', icon: 'box' },
      { to: '/admin/catalog', key: 'nav2.catalog', icon: 'layers' },
      { to: '/admin/inventory', key: 'nav2.inventory', icon: 'database' },
      { to: '/admin/reviews', key: 'nav2.reviews', icon: 'star' },
    ],
  },
  {
    key: 'nav2.groupGrow',
    items: [
      { to: '/admin/discounts', key: 'nav2.discounts', icon: 'ticket' },
      { to: '/admin/banners', key: 'nav2.banners', icon: 'megaphone' },
      { to: '/admin/reports', key: 'nav2.reports', icon: 'chart' },
    ],
  },
  {
    key: 'nav2.groupAdmin',
    items: [
      { to: '/admin/staff', key: 'nav2.staff', icon: 'shieldUser' },
      { to: '/admin/settings', key: 'nav2.settings', icon: 'settings' },
    ],
  },
]

const groupActive = (g) => g.items.some((i) => i.to === route.path)

/** Live counts shown as badges in the sidebar. */
const badges = ref({})
async function loadBadges() {
  try {
    const [orders, products] = await Promise.all([
      api.orders.all(),
      api.products.list({ pageSize: 500 }),
    ])
    badges.value = {
      '/admin/orders': orders.filter((o) => ['pending', 'paid', 'packed'].includes(o.status)).length,
      '/admin/inventory': products.items.filter((p) => p.stock <= 5).length,
    }
  } catch { /* silent */ }
}
onMounted(loadBadges)
watch(() => route.path, loadBadges)

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-[272px] max-w-[86vw] flex-col border-r border-line bg-surface transition-[width,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] lg:translate-x-0"
      :class="[wide ? 'lg:w-64' : 'lg:w-[76px]', mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full']"
    >
      <!-- Brand -->
      <div class="flex h-[68px] shrink-0 items-center gap-2 border-b border-line px-4 text-ink"
           :class="!showLabels && 'justify-center px-0'">
        <RouterLink to="/admin" class="overflow-hidden"><BrandLogo size="sm" :show-text="showLabels" /></RouterLink>
        <span v-if="showLabels" class="rounded-[5px] bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Admin</span>
        <button v-if="mobileOpen" class="ml-auto rounded-[5px] p-2 text-muted transition hover:bg-surface-2 lg:hidden" aria-label="Close" @click="mobileOpen = false">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 space-y-1 overflow-y-auto scroll-smooth p-3">
        <div v-for="g in GROUPS" :key="g.key" class="pb-1">
          <button
            v-if="showLabels"
            class="flex w-full items-center gap-2 rounded-[5px] px-3 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-ink"
            :class="groupActive(g) ? 'text-primary' : 'text-muted'"
            :aria-expanded="ui.isGroupOpen(g.key)"
            @click="ui.toggleGroup(g.key)"
          >
            <span class="flex-1 truncate text-left">{{ t(g.key) }}</span>
            <AppIcon name="chevronDown" :size="13"
                     class="shrink-0 transition-transform duration-300"
                     :class="!ui.isGroupOpen(g.key) && '-rotate-90'" />
          </button>
          <div v-else class="mx-auto my-2.5 h-px w-7 bg-line"></div>

          <Transition name="acc">
            <div v-show="ui.isGroupOpen(g.key) || !showLabels" class="grid" style="grid-template-rows: 1fr">
              <div class="space-y-0.5 overflow-hidden">
                <RouterLink
                  v-for="item in g.items" :key="item.to" :to="item.to"
                  class="relative flex items-center gap-3 rounded-[5px] py-2.5 text-sm transition-all duration-200"
                  :class="[
                    showLabels ? 'px-3' : 'justify-center px-0',
                    route.path === item.to
                      ? 'bg-primary font-medium text-primary-ink shadow-sm shadow-primary/25'
                      : 'text-muted hover:translate-x-0.5 hover:bg-surface-2 hover:text-ink',
                  ]"
                  :title="showLabels ? '' : t(item.key)"
                  :aria-current="route.path === item.to ? 'page' : undefined"
                >
                  <span class="relative shrink-0">
                    <AppIcon :name="item.icon" :size="18" />
                    <span v-if="!showLabels && badges[item.to]"
                          class="circle absolute -right-1.5 -top-1.5 h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span v-if="showLabels" class="min-w-0 flex-1 truncate">{{ t(item.key) }}</span>
                  <span v-if="showLabels && badges[item.to]"
                        class="shrink-0 rounded-[5px] bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular text-rose-600">
                    {{ badges[item.to] }}
                  </span>
                </RouterLink>
              </div>
            </div>
          </Transition>
        </div>
      </nav>

      <!-- Footer actions -->
      <div class="shrink-0 space-y-0.5 border-t border-line p-3">
        <RouterLink to="/" class="flex items-center gap-3 rounded-[5px] py-2.5 text-sm text-muted transition hover:bg-surface-2 hover:text-ink"
                    :class="showLabels ? 'px-3' : 'justify-center px-0'" :title="t('admin.viewStore')">
          <AppIcon name="store" :size="18" /><span v-if="showLabels">{{ t('admin.viewStore') }}</span>
        </RouterLink>
        <button class="flex w-full items-center gap-3 rounded-[5px] py-2.5 text-sm text-rose-600 transition hover:bg-rose-500/10"
                :class="showLabels ? 'px-3' : 'justify-center px-0'" @click="logout">
          <AppIcon name="logout" :size="18" /><span v-if="showLabels">{{ t('common.signOut') }}</span>
        </button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="mobileOpen = false"></div>

    <div class="transition-[padding] duration-300 ease-[cubic-bezier(.16,1,.3,1)]" :class="wide ? 'lg:pl-64' : 'lg:pl-[76px]'">
      <header class="sticky top-0 z-20 flex h-[68px] items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:px-6">
        <button class="rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink lg:hidden" aria-label="Menu" @click="mobileOpen = true">
          <AppIcon name="menu" />
        </button>
        <button class="hidden rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink lg:block"
                :aria-label="wide ? 'Collapse sidebar' : 'Expand sidebar'" :aria-pressed="!wide" @click="ui.toggleSidebar()">
          <AppIcon name="panelLeft" :size="19" />
        </button>

        <h1 class="font-display truncate text-base sm:text-lg">{{ t(route.meta.titleKey || 'nav2.dashboard') }}</h1>

        <div class="ml-auto flex items-center gap-0.5 sm:gap-1">
          <RouterLink to="/" class="hidden rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink sm:block" :aria-label="t('admin.viewStore')">
            <AppIcon name="store" :size="18" />
          </RouterLink>
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell />
          <RouterLink to="/admin/settings" class="flex items-center gap-2.5 rounded-[5px] p-1.5 transition hover:bg-surface-2">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-primary text-xs font-semibold text-primary-ink">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" class="h-full w-full object-cover" />
              <template v-else>{{ auth.initials }}</template>
            </span>
            <span class="hidden text-left xl:block">
              <span class="block text-xs font-medium leading-tight">{{ auth.user?.name }}</span>
              <span class="block text-[11px] leading-tight text-muted">{{ auth.user?.email }}</span>
            </span>
          </RouterLink>
        </div>
      </header>

      <main class="mx-auto w-full max-w-[1440px] p-3 sm:p-5 lg:p-6"><slot /></main>
    </div>
  </div>
</template>
