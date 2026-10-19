<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  error: { type: String, default: '' },
  id: { type: String, required: true },
})
defineEmits(['update:modelValue'])

const reveal = ref(false)
const isPassword = props.type === 'password'
</script>

<template>
  <div>
    <label v-if="label" class="label" :for="id">{{ label }}</label>
    <div class="relative">
      <AppIcon v-if="icon" :name="icon" :size="17"
               class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        :id="id"
        :value="modelValue"
        :type="isPassword ? (reveal ? 'text' : 'password') : type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="input"
        :class="[icon && 'pl-11', isPassword && 'pr-11', error && 'input-error']"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-[5px] p-2 text-muted transition hover:text-ink"
        :aria-label="reveal ? 'Hide password' : 'Show password'"
        @click="reveal = !reveal"
      >
        <AppIcon :name="reveal ? 'eye' : 'lock'" :size="16" />
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-rose-600">{{ error }}</p>
  </div>
</template>
