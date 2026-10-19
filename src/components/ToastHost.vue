<script setup>
import { useToastStore } from '@/stores/toast.js'
import AppIcon from './AppIcon.vue'

const toast = useToastStore()
const styles = {
  success: 'bg-ink text-canvas',
  error: 'bg-rose-600 text-white',
  info: 'bg-surface text-ink border border-line',
}
const icons = { success: 'checkCircle', error: 'alert', info: 'info' }
</script>

<template>
  <!-- Sits above the mobile dock on small screens, bottom corner on desktop -->
  <div class="pointer-events-none fixed inset-x-0 bottom-[104px] z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-5" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toast.toasts" :key="t.id" :class="styles[t.type]"
           class="pointer-events-auto flex max-w-md items-center gap-3 rounded-[5px] px-5 py-3 text-sm shadow-xl">
        <AppIcon :name="icons[t.type]" :size="18" />
        <span>{{ t.message }}</span>
        <button class="ml-1 opacity-60 transition hover:opacity-100" aria-label="Dismiss" @click="toast.dismiss(t.id)">
          <AppIcon name="x" :size="15" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
