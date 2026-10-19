<script setup>
import { useUiStore } from '@/stores/ui.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from './AppIcon.vue'

const ui = useUiStore()
const { t } = useI18n()
</script>

<template>
  <button
    class="relative flex h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-2 hover:text-ink"
    :aria-label="ui.dark ? t('common.lightMode') : t('common.darkMode')"
    :aria-pressed="ui.dark"
    @click="ui.toggleDark()"
  >
    <Transition name="dd" mode="out-in">
      <AppIcon :key="ui.dark ? 'moon' : 'sun'" :name="ui.dark ? 'moon' : 'sun'" :size="18" />
    </Transition>
  </button>
</template>
