<script setup>
import { ref } from 'vue'
import { useI18n } from '@/i18n/index.js'
import AppIcon from './AppIcon.vue'
import { onClickOutside } from '@/composables/useClickOutside.js'

const { locale, setLocale, locales, t } = useI18n()
const open = ref(false)
const root = ref(null)
onClickOutside(root, () => (open.value = false))

function pick(code) {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="flex items-center gap-1.5 rounded-[5px] px-2.5 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-ink"
      :aria-expanded="open" aria-haspopup="listbox" :aria-label="t('common.language')"
      @click="open = !open"
    >
      <AppIcon name="globe" :size="18" />
      <span class="hidden sm:inline">{{ locales.find((l) => l.code === locale)?.short }}</span>
      <AppIcon name="chevronDown" :size="14" class="transition-transform duration-200" :class="open && 'rotate-180'" />
    </button>

    <Transition name="dd">
      <ul v-if="open" role="listbox"
          class="absolute right-0 z-50 mt-2 w-44 origin-top overflow-hidden rounded-[5px] border border-line bg-surface p-1 shadow-xl">
        <li v-for="l in locales" :key="l.code">
          <button role="option" :aria-selected="l.code === locale"
                  class="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-sm transition hover:bg-surface-2"
                  :class="l.code === locale && 'bg-primary-soft text-primary'"
                  @click="pick(l.code)">
            <span class="text-base leading-none">{{ l.flag }}</span>
            <span class="flex-1 text-left">{{ l.label }}</span>
            <AppIcon v-if="l.code === locale" name="check" :size="15" />
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>
