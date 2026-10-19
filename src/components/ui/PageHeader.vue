<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  count: { type: [Number, String], default: null },
})
</script>

<template>
  <!-- Dashboard page header: title block left, actions right, clean rule below -->
  <header class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
    <div class="min-w-0">
      <div class="flex items-center gap-2.5">
        <h2 class="font-display truncate text-xl font-extrabold">{{ title }}</h2>
        <span v-if="count !== null" class="rounded-[5px] bg-surface-2 px-2 py-0.5 text-xs font-bold tabular text-muted">{{ count }}</span>
      </div>
      <p v-if="subtitle" class="mt-0.5 truncate text-sm text-muted">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
  </header>
</template>
