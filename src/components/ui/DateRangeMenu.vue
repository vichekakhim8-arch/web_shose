<script setup>
import { computed, ref } from 'vue'
import { RANGE_PRESETS, resolveRange, iso } from '@/services/dateRanges.js'
import { useI18n } from '@/i18n/index.js'
import DropdownMenu from './DropdownMenu.vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: 'last30' },
  custom: { type: Object, default: () => ({ from: '', to: '' }) },
})
const emit = defineEmits(['update:modelValue', 'update:custom', 'change'])
const { t } = useI18n()

const menu = ref(null)
const draft = ref({ from: props.custom.from || '', to: props.custom.to || '' })

const GROUPS = [
  { id: 'day', key: 'range.groupDay' },
  { id: 'week', key: 'range.groupWeek' },
  { id: 'month', key: 'range.groupMonth' },
  { id: 'quarter', key: 'range.groupQuarter' },
  { id: 'year', key: 'range.groupYear' },
  { id: 'rolling', key: 'range.groupRolling' },
]

const label = computed(() => {
  const p = RANGE_PRESETS.find((r) => r.id === props.modelValue)
  if (props.modelValue === 'custom' && props.custom.from && props.custom.to)
    return `${props.custom.from} → ${props.custom.to}`
  return p ? t(p.key) : t('common2.range')
})

const resolved = computed(() => resolveRange(props.modelValue, props.custom))
const sub = computed(() => `${iso(resolved.value.from)} → ${iso(resolved.value.to)}`)

function pick(id) {
  emit('update:modelValue', id)
  emit('change', { id, ...resolveRange(id, props.custom) })
  if (id !== 'custom') menu.value?.close()
}
function applyCustom() {
  if (!draft.value.from || !draft.value.to) return
  emit('update:custom', { ...draft.value })
  emit('update:modelValue', 'custom')
  emit('change', { id: 'custom', ...resolveRange('custom', draft.value) })
  menu.value?.close()
}
</script>

<template>
  <DropdownMenu ref="menu" icon="calendar" :label="label" width="w-[300px]">
    <div class="max-h-[22rem] overflow-y-auto">
      <div v-for="g in GROUPS" :key="g.id" class="px-1 py-1">
        <p class="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted">{{ t(g.key) }}</p>
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="p in RANGE_PRESETS.filter((r) => r.group === g.id)"
            :key="p.id"
            class="flex items-center justify-between rounded-[5px] px-2.5 py-1.5 text-left text-xs transition hover:bg-surface-2"
            :class="modelValue === p.id && 'bg-primary-soft font-semibold text-primary'"
            role="menuitem"
            @click="pick(p.id)"
          >
            {{ t(p.key) }}
            <AppIcon v-if="modelValue === p.id" name="check" :size="13" />
          </button>
        </div>
      </div>

      <div class="mt-1 border-t border-line px-3 py-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">{{ t('range.custom') }}</p>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <label class="text-[11px] text-muted">{{ t('common.from') }}
            <input v-model="draft.from" type="date" class="input mt-1 !py-1.5 text-xs" />
          </label>
          <label class="text-[11px] text-muted">{{ t('common.to') }}
            <input v-model="draft.to" type="date" class="input mt-1 !py-1.5 text-xs" />
          </label>
        </div>
        <button class="btn btn-primary btn-sm mt-2 w-full" :disabled="!draft.from || !draft.to" @click="applyCustom">
          {{ t('range.apply') }}
        </button>
      </div>

      <p class="border-t border-line px-3 py-2 text-[10px] tabular text-muted">{{ sub }}</p>
    </div>
  </DropdownMenu>
</template>
