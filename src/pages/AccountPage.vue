<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToastStore } from '@/stores/toast.js'
import { useWishlistStore } from '@/stores/wishlist.js'
import { useI18n } from '@/i18n/index.js'
import { useFormat } from '@/composables/useFormat.js'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import InputField from '@/components/ui/InputField.vue'
import ReceiptCard from '@/components/ReceiptCard.vue'

const auth = useAuthStore()
const toast = useToastStore()
const wishlist = useWishlistStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { formatPrice, formatDate, STATUS_STYLES } = useFormat()

const tab = ref(route.query.tab === 'orders' ? 'orders' : 'profile')
watch(tab, (v) => router.replace({ query: { ...route.query, tab: v } }))

const orders = ref([])
const selected = ref(null)
const loading = ref(true)
const saving = ref(false)
const errors = ref({})

const form = reactive({
  name: auth.user?.name || '', email: auth.user?.email || '',
  phone: auth.user?.phone || '', avatar: auth.user?.avatar || '', password: '',
})

onMounted(async () => {
  try {
    orders.value = await api.orders.mine()
    selected.value = orders.value[0] || null
  } finally {
    loading.value = false
  }
})

function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 400_000) return toast.error('Image must be under 400 KB')
  const reader = new FileReader()
  reader.onload = () => (form.avatar = reader.result)
  reader.readAsDataURL(file)
}

async function save() {
  errors.value = {}
  saving.value = true
  try {
    await auth.updateProfile({ ...form, password: form.password || undefined })
    form.password = ''
    toast.success(t('account.updated'))
  } catch (e) {
    errors.value = e.fields || {}
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

async function logout() {
  await auth.logout()
  router.push('/')
}

const spent = () => orders.value.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
</script>

<template>
  <div class="container-x py-8">
    <div class="page-head">
      <h1 class="font-display text-3xl font-extrabold">{{ t('account.title') }}</h1>
      <div class="ml-auto flex rounded-[5px] border border-line p-0.5">
        <button v-for="x in ['profile', 'orders']" :key="x"
                class="rounded-[5px] px-3.5 py-1.5 text-sm font-semibold transition"
                :class="tab === x ? 'bg-primary text-primary-ink' : 'text-muted hover:text-ink'"
                @click="tab = x">
          {{ x === 'profile' ? t('account.profile') : t('account.orders') }}
        </button>
      </div>
    </div>

    <!-- PROFILE -->
    <div v-if="tab === 'profile'" class="grid gap-5 md:grid-cols-[280px_1fr]">
      <aside class="space-y-4">
        <div class="card p-5 text-center">
          <div class="mx-auto h-20 w-20 overflow-hidden rounded-[5px] bg-surface-2">
            <img v-if="form.avatar" :src="form.avatar" alt="" class="h-full w-full object-cover" />
            <span v-else class="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold text-muted">{{ auth.initials }}</span>
          </div>
          <p class="mt-3 font-display font-bold">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-muted">{{ auth.user?.email }}</p>
          <p class="mt-1.5 text-[11px] text-muted">{{ t('account.memberSince') }} {{ formatDate(auth.user?.createdAt) }}</p>
          <div class="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <div><p class="font-display text-base font-bold">{{ orders.length }}</p><p class="text-[10px] text-muted">{{ t('admin.orders') }}</p></div>
            <div><p class="font-display text-base font-bold">{{ wishlist.count }}</p><p class="text-[10px] text-muted">{{ t('fav.title') }}</p></div>
            <div><p class="font-display text-base font-bold">{{ formatPrice(spent()) }}</p><p class="text-[10px] text-muted">{{ t('account.totalSpent') }}</p></div>
          </div>
        </div>
        <nav class="card p-1.5">
          <RouterLink v-if="auth.isAdmin" to="/admin" class="flex items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2">
            <AppIcon name="grid" :size="17" /> {{ t('common.dashboard') }}
          </RouterLink>
          <RouterLink to="/wishlist" class="flex items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2">
            <AppIcon name="heart" :size="17" /> {{ t('fav.title') }}
          </RouterLink>
          <button class="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10" @click="logout">
            <AppIcon name="logout" :size="17" /> {{ t('common.signOut') }}
          </button>
        </nav>
      </aside>

      <section class="card p-6">
        <h2 class="font-display text-lg font-bold">{{ t('account.profile') }}</h2>
        <div class="mt-5 flex flex-wrap items-center gap-4">
          <div class="h-16 w-16 overflow-hidden rounded-[5px] bg-surface-2">
            <img v-if="form.avatar" :src="form.avatar" alt="" class="h-full w-full object-cover" />
            <span v-else class="flex h-full w-full items-center justify-center text-xl font-bold text-muted">{{ auth.initials }}</span>
          </div>
          <label class="btn btn-outline btn-sm cursor-pointer">
            <AppIcon name="camera" :size="15" /> {{ t('account.changePhoto') }}
            <input type="file" accept="image/*" class="hidden" @change="onFile" />
          </label>
          <button v-if="form.avatar" class="text-xs text-muted hover:text-rose-600" @click="form.avatar = ''">{{ t('common.delete') }}</button>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <InputField id="pn" v-model="form.name" :label="t('account.name')" icon="user" :error="errors.name" />
          <InputField id="pp" v-model="form.phone" :label="t('checkout.phone')" icon="phone" />
          <div class="sm:col-span-2"><InputField id="pe" v-model="form.email" :label="t('auth.email')" icon="mail" type="email" :error="errors.email" /></div>
          <div class="sm:col-span-2"><InputField id="pw" v-model="form.password" :label="t('account.newPassword')" icon="lock" type="password" :placeholder="t('account.leaveBlank')" :error="errors.password" /></div>
        </div>
        <button class="btn btn-primary mt-6" :disabled="saving" @click="save">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </section>
    </div>

    <!-- ORDERS: left list · right receipt -->
    <div v-else>
      <div v-if="loading" class="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div class="space-y-3"><div v-for="i in 3" :key="i" class="skel h-24"></div></div>
        <div class="skel h-96"></div>
      </div>

      <EmptyState v-else-if="!orders.length" icon="receipt" :title="t('account.noOrders')">
        <RouterLink to="/shop" class="btn btn-primary">{{ t('nav.shop') }}</RouterLink>
      </EmptyState>

      <div v-else class="grid gap-5 lg:grid-cols-[1fr_420px]">
        <!-- LEFT: ordered products -->
        <div class="space-y-3">
          <button v-for="o in orders" :key="o.id"
                  class="card w-full p-4 text-left transition"
                  :class="selected?.id === o.id ? 'border-primary ring-1 ring-primary/30' : 'card-hover'"
                  @click="selected = o">
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex -space-x-2">
                <img v-for="l in o.lines.slice(0, 3)" :key="l.productId + l.size" :src="l.image" :alt="l.name"
                     class="h-12 w-12 rounded-[5px] border-2 border-surface object-cover" />
                <span v-if="o.lines.length > 3"
                      class="flex h-12 w-12 items-center justify-center rounded-[5px] border-2 border-surface bg-surface-2 text-xs font-bold text-muted">
                  +{{ o.lines.length - 3 }}
                </span>
              </div>
              <div class="min-w-32 flex-1">
                <p class="font-display font-bold">{{ o.id }}</p>
                <p class="text-xs text-muted">{{ formatDate(o.createdAt) }} · {{ o.lines.reduce((s, l) => s + l.quantity, 0) }} {{ t('receipt.items') }}</p>
              </div>
              <span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" :class="STATUS_STYLES[o.status]">{{ o.status }}</span>
              <p class="font-display font-bold tabular">{{ formatPrice(o.total) }}</p>
            </div>
            <ul class="mt-3 space-y-1 border-t border-line-soft pt-3">
              <li v-for="l in o.lines" :key="l.productId + l.size" class="flex justify-between text-xs text-muted">
                <span class="truncate">{{ l.name }} · EU {{ l.size }}</span>
                <span class="shrink-0 tabular">×{{ l.quantity }}</span>
              </li>
            </ul>
          </button>
        </div>

        <!-- RIGHT: receipt for the selected order -->
        <div class="lg:sticky lg:top-24 lg:self-start">
          <Transition name="fade" mode="out-in">
            <ReceiptCard v-if="selected" :key="selected.id" :order="selected" compact />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
