<script setup>
import { useI18n } from '@/i18n/index.js'
import AppIcon from '@/components/AppIcon.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  icon: { type: String, default: 'trash' },
  danger: { type: Boolean, default: true },
})
const emit = defineEmits(['confirm', 'cancel'])
const { t } = useI18n()
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
         role="alertdialog" aria-modal="true" @click.self="emit('cancel')">
      <Transition name="dd" appear>
        <div class="w-full max-w-sm rounded-[5px] border border-line bg-surface p-6 text-center shadow-2xl">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px]"
               :class="danger ? 'bg-rose-500/12 text-rose-600' : 'bg-primary-soft text-primary'">
            <AppIcon :name="icon" :size="26" />
          </div>
          <h2 class="font-display mt-4 text-lg">{{ title || t('confirm.title') }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted">{{ message || t('confirm.generic') }}</p>
          <div class="mt-6 grid grid-cols-2 gap-2.5">
            <button class="btn btn-outline" :disabled="busy" @click="emit('cancel')">{{ t('common.cancel') }}</button>
            <button class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" :disabled="busy" @click="emit('confirm')">
              <AppIcon :name="icon" :size="15" />
              {{ busy ? t('common.loading') : (confirmLabel || t('confirm.yes')) }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
