<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import MobileTabBar from '@/components/MobileTabBar.vue'
import SizePickerModal from '@/components/SizePickerModal.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas">
    <AppHeader />
    <!-- Extra bottom padding on mobile so the dock never covers content -->
    <main class="pb-tabbar flex-1 lg:!pb-0"><slot /></main>
    <AppFooter />
    <CartDrawer />
    <SizePickerModal />
    <MobileTabBar />
  </div>
</template>
