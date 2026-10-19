<script setup>
import { downloadCsv, exportPdf } from '@/services/exporters.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import DropdownMenu from './DropdownMenu.vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  filename: { type: String, default: 'export' },
  title: { type: String, default: 'Report' },
  subtitle: { type: String, default: '' },
  /** [{ key, label, align?, format? }] */
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
})

const toast = useToastStore()
const { t } = useI18n()

function csv(close) {
  const flat = props.rows.map((r) =>
    Object.fromEntries(props.columns.map((c) => [c.label, c.format ? c.format(r[c.key], r) : r[c.key]])),
  )
  downloadCsv(`${props.filename}.csv`, flat)
  toast.success(t('common2.exportCsv') + ' ✓')
  close()
}

function pdf(close) {
  const ok = exportPdf({ title: props.title, subtitle: props.subtitle, columns: props.columns, rows: props.rows })
  ok ? toast.info(t('common2.exportPdf')) : toast.error('Please allow pop-ups to export PDF')
  close()
}
</script>

<template>
  <DropdownMenu icon="download" :label="t('common.export').replace(' CSV', '')" width="w-52">
    <template #default="{ close }">
      <button class="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-left text-sm transition hover:bg-surface-2"
              role="menuitem" :disabled="!rows.length" @click="csv(close)">
        <AppIcon name="fileText" :size="16" class="text-emerald-600" />
        <span class="flex-1">{{ t('common2.exportCsv') }}</span>
        <span class="text-[10px] text-muted">.csv</span>
      </button>
      <button class="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-left text-sm transition hover:bg-surface-2"
              role="menuitem" :disabled="!rows.length" @click="pdf(close)">
        <AppIcon name="printer" :size="16" class="text-rose-600" />
        <span class="flex-1">{{ t('common2.exportPdf') }}</span>
        <span class="text-[10px] text-muted">.pdf</span>
      </button>
      <p class="border-t border-line px-3 py-2 text-[10px] leading-snug text-muted">
        PDF opens the print dialog — choose “Save as PDF”. This keeps Khmer text rendering correctly.
      </p>
    </template>
  </DropdownMenu>
</template>
