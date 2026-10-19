<script setup>
import { ref } from 'vue'
import { onClickOutside } from '@/composables/useClickOutside.js'
import AppIcon from '@/components/AppIcon.vue'

defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  align: { type: String, default: 'right' }, // 'left' | 'right'
  width: { type: String, default: 'w-56' },
  variant: { type: String, default: 'outline' }, // 'outline' | 'ghost'
  size: { type: String, default: 'sm' },
})

const open = ref(false)
const root = ref(null)
onClickOutside(root, () => (open.value = false))
const close = () => (open.value = false)
defineExpose({ close })
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="btn"
      :class="[variant === 'ghost' ? 'btn-ghost' : 'btn-outline', size === 'sm' && 'btn-sm']"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <AppIcon v-if="icon" :name="icon" :size="15" />
      <slot name="label"><span class="max-w-[9rem] truncate">{{ label }}</span></slot>
      <AppIcon name="chevronDown" :size="13" class="transition-transform duration-200" :class="open && 'rotate-180'" />
    </button>

    <Transition name="dd">
      <div
        v-if="open"
        role="menu"
        class="dd-panel absolute z-50 mt-2 origin-top overflow-hidden rounded-[5px] border border-line bg-surface p-1 shadow-xl"
        :class="[width, align === 'right' ? 'right-0' : 'left-0']"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
