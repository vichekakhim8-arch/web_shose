<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useCatalogStore } from '@/stores/catalog.js'
import StoreLayout from '@/layouts/StoreLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ToastHost from '@/components/ToastHost.vue'

const route = useRoute()
const ui = useUiStore()
const settings = useSettingsStore()
const catalog = useCatalogStore()

const layouts = { store: StoreLayout, dashboard: DashboardLayout, auth: AuthLayout }
const layout = computed(() => layouts[route.meta.layout] || StoreLayout)

onMounted(() => {
  ui.applyTheme()
  settings.init()
  catalog.init()
})

/**
 * Re-read the catalogue when leaving the dashboard, so any price/stock edit an
 * admin just made is reflected in the storefront, cart and wishlist.
 */
watch(
  () => route.path.startsWith('/admin'),
  (inAdmin, wasInAdmin) => {
    if (wasInAdmin && !inAdmin) catalog.invalidate()
  },
)
</script>

<template>
  <component :is="layout">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </component>
  <ToastHost />
</template>
