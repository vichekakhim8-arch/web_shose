<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import { onClickOutside } from '@/composables/useClickOutside.js'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const { t } = useI18n()

const READ_KEY = 'vks_notif_read_v1'
const open = ref(false)
const root = ref(null)
const items = ref([])
const readIds = ref(new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')))
let timer = null

onClickOutside(root, () => (open.value = false))

function persistRead() {
  localStorage.setItem(READ_KEY, JSON.stringify([...readIds.value].slice(-300)))
}

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const s = Math.max(1, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000))
  if (s < 60) return t('notif.justNow')
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/** Notifications are derived live from orders, stock and reviews. */
async function load() {
  try {
    const [orders, products] = await Promise.all([
      api.orders.all(),
      api.products.list({ pageSize: 500 }),
    ])
    const list = products.items

    const orderNotes = orders
      .filter((o) => o.status !== 'cancelled')
      .slice(0, 8)
      .map((o) => ({
        id: `ord:${o.id}`,
        icon: 'receipt',
        tone: 'bg-sky-500/15 text-sky-600',
        title: t('notif.newOrder'),
        desc: `${o.id} · ${o.customerName} · ${formatPrice(o.total)}`,
        time: o.createdAt,
        to: '/admin/orders',
      }))

    let reviewNotes = []
    try {
      const all = await Promise.all(list.slice(0, 20).map((p) => api.reviews.list(p.id)))
      reviewNotes = all.flat()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
        .map((r) => ({
          id: `rev:${r.id}`,
          icon: 'star',
          tone: 'bg-amber-500/15 text-amber-600',
          title: `${t('notif.newReview')} · ${'★'.repeat(r.rating)}`,
          desc: `${r.userName} — ${r.comment.slice(0, 60)}`,
          time: r.createdAt,
          to: '/admin/reviews',
        }))
    } catch { /* reviews are optional */ }

    const stockNotes = list
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((p) => ({
        id: `stk:${p.id}:${p.stock}`,
        icon: 'alert',
        tone: p.stock === 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600',
        title: p.stock === 0 ? t('notif.outStock') : t('notif.lowStock'),
        desc: `${p.name} · ${p.stock} ${t('notif.left')}`,
        time: null,
        to: '/admin/inventory',
      }))

    const timed = [...orderNotes, ...reviewNotes].sort((a, b) => (b.time || '').localeCompare(a.time || ''))
    items.value = [...timed, ...stockNotes]
  } catch {
    /* not signed in as admin — stay silent */
  }
}

const unread = computed(() => items.value.filter((i) => !readIds.value.has(i.id)).length)

function markAll() {
  items.value.forEach((i) => readIds.value.add(i.id))
  persistRead()
}
function openItem(item) {
  readIds.value.add(item.id)
  persistRead()
  open.value = false
  if (item.to) router.push(item.to)
}
function toggle() {
  open.value = !open.value
  if (open.value) load()
}

onMounted(() => {
  load()
  timer = setInterval(load, 60000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div ref="root" class="relative">
    <button class="relative flex h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-2 hover:text-ink"
            :aria-label="t('notif.title')" :aria-expanded="open" @click="toggle">
      <AppIcon name="bell" :size="19" />
      <span v-if="unread"
            class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-rose-600 px-1 text-[10px] font-bold text-white">
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <Transition name="dd">
      <div v-if="open" class="dd-panel absolute right-0 z-50 mt-2 w-[340px] origin-top overflow-hidden rounded-[5px] border border-line bg-surface shadow-xl">
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <p class="font-display text-sm">{{ t('notif.title') }}</p>
          <button v-if="unread" class="text-xs font-medium text-primary hover:underline" @click="markAll">
            {{ t('notif.markRead') }}
          </button>
        </div>

        <div class="max-h-[380px] overflow-y-auto">
          <p v-if="!items.length" class="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted">
            <AppIcon name="checkCircle" :size="26" class="text-emerald-500" />
            {{ t('notif.empty') }}
          </p>
          <button v-for="n in items" :key="n.id"
                  class="flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition last:border-0 hover:bg-surface-2"
                  @click="openItem(n)">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]" :class="n.tone">
              <AppIcon :name="n.icon" :size="17" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-medium" :class="!readIds.has(n.id) && 'font-semibold'">{{ n.title }}</span>
                <span v-if="!readIds.has(n.id)" class="circle h-2 w-2 shrink-0 bg-primary"></span>
              </span>
              <span class="mt-0.5 block truncate text-xs text-muted">{{ n.desc }}</span>
            </span>
            <span v-if="n.time" class="shrink-0 text-[10px] tabular text-muted">{{ timeAgo(n.time) }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
