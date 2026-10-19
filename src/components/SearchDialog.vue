<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import { useDebounce } from '@/composables/useAsync.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const router = useRouter()
const { t } = useI18n()

const q = ref('')
const results = ref([])
const loading = ref(false)
const active = ref(0)
const field = ref(null)

const run = useDebounce(async (term) => {
  if (!term.trim()) {
    results.value = []
    loading.value = false
    return
  }
  try {
    const res = await api.products.list({ q: term, pageSize: 6 })
    results.value = res.items
    active.value = 0
  } finally {
    loading.value = false
  }
}, 250)

watch(q, (v) => {
  loading.value = !!v.trim()
  run(v)
})

watch(
  () => props.open,
  async (o) => {
    if (o) {
      await nextTick()
      field.value?.focus()
    } else {
      q.value = ''
      results.value = []
    }
  },
)

function go(p) {
  emit('close')
  router.push({ name: 'product', params: { slug: p.slug } })
}
function submitAll() {
  if (!q.value.trim()) return
  emit('close')
  router.push({ name: 'shop', query: { q: q.value } })
}
function onKey(e) {
  if (!results.value.length) return
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = (active.value + 1) % results.value.length }
  if (e.key === 'ArrowUp') { e.preventDefault(); active.value = (active.value - 1 + results.value.length) % results.value.length }
  if (e.key === 'Enter') { e.preventDefault(); go(results.value[active.value]) }
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" @click.self="emit('close')">
      <div class="container-x pt-[10vh]">
        <div class="mx-auto max-w-2xl overflow-hidden rounded-[5px] border border-line bg-surface shadow-2xl" role="dialog" aria-label="Search">
          <form class="flex items-center gap-3 border-b border-line px-4" @submit.prevent="submitAll">
            <AppIcon name="search" :size="20" class="text-muted" />
            <input ref="field" v-model="q" type="search" :placeholder="t('common.searchPlaceholder')"
                   class="w-full bg-transparent py-4 text-base text-ink placeholder:text-muted/70 focus:outline-none"
                   @keydown="onKey" />
            <button type="button" class="rounded-[5px] p-2 text-muted hover:text-ink" :aria-label="t('common.close')" @click="emit('close')">
              <AppIcon name="x" :size="18" />
            </button>
          </form>

          <div class="max-h-[55vh] overflow-y-auto">
            <div v-if="loading" class="space-y-2 p-3">
              <div v-for="i in 3" :key="i" class="flex items-center gap-3">
                <div class="skel h-14 w-14"></div>
                <div class="flex-1 space-y-2"><div class="skel h-3 w-1/2"></div><div class="skel h-3 w-1/4"></div></div>
              </div>
            </div>

            <p v-else-if="q && !results.length" class="p-8 text-center text-sm text-muted">{{ t('common.noResults') }}</p>

            <ul v-else-if="results.length" class="p-2">
              <li v-for="(p, i) in results" :key="p.id">
                <button class="flex w-full items-center gap-3 rounded-[5px] p-2 text-left transition"
                        :class="i === active ? 'bg-primary-soft' : 'hover:bg-surface-2'"
                        @mouseenter="active = i" @click="go(p)">
                  <img :src="p.image" :alt="p.name" class="h-14 w-14 rounded-[5px] object-cover" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-medium">{{ p.name }}</span>
                    <span class="block text-xs text-muted">{{ p.brand }} · {{ p.category }}</span>
                  </span>
                  <span class="font-semibold">{{ formatPrice(p.price) }}</span>
                </button>
              </li>
              <li class="px-2 pt-1">
                <button class="w-full rounded-[5px] py-2 text-center text-sm font-medium text-primary hover:bg-primary-soft" @click="submitAll">
                  {{ t('common.viewAll') }} →
                </button>
              </li>
            </ul>

            <p v-else class="p-8 text-center text-sm text-muted">{{ t('common.searchPlaceholder') }}</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
