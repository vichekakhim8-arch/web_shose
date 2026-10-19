<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { validateShipping } from '@/services/domain.js'
import { SHIPPING_ZONES } from '@/assets/brand.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCartStore } from '@/stores/cart.js'
import { useToastStore } from '@/stores/toast.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import KhqrPay from '@/components/KhqrPay.vue'

const auth = useAuthStore()
const cart = useCartStore()
const toast = useToastStore()
const settings = useSettingsStore()
const router = useRouter()
const { t } = useI18n()

const zone = ref(SHIPPING_ZONES[0])
const method = ref('khqr')
// Stable reference so the QR does not regenerate on every keystroke.
const billNumber = 'VKS' + Date.now().toString(36).toUpperCase()
const errors = ref({})
const serverError = ref('')
const submitting = ref(false)
const locating = ref(false)

const form = reactive({
  fullName: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  address: '',
  city: SHIPPING_ZONES[0].name,
  note: '',
  lat: SHIPPING_ZONES[0].lat,
  lng: SHIPPING_ZONES[0].lng,
})

watch(zone, (z) => {
  form.city = z.name
  form.lat = z.lat
  form.lng = z.lng
  cart.setShippingFee(z.fee)
}, { immediate: true })

// OpenStreetMap embed — a real map, no API key required.
const mapSrc = computed(() => {
  const d = 0.012
  const bbox = [form.lng - d, form.lat - d / 2, form.lng + d, form.lat + d / 2].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${form.lat}%2C${form.lng}`
})

function useMyLocation() {
  if (!navigator.geolocation) return toast.error(t('toast.error'))
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.lat = Number(pos.coords.latitude.toFixed(5))
      form.lng = Number(pos.coords.longitude.toFixed(5))
      locating.value = false
      toast.success(t('checkout.map') + ' ✓')
    },
    () => {
      locating.value = false
      toast.error(t('toast.error'))
    },
    { timeout: 8000 },
  )
}

async function placeOrder() {
  serverError.value = ''
  errors.value = validateShipping(form)
  if (Object.keys(errors.value).length) return toast.error(t('toast.error'))

  submitting.value = true
  try {
    const order = await api.orders.create({
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size })),
      shipping: { ...form, zoneId: zone.value.id, shippingFee: zone.value.fee },
      payment: { method: method.value, reference: method.value === 'khqr' ? billNumber : null },
    })
    cart.clear()
    toast.success(t('toast.orderPlaced'))
    router.replace({ name: 'order', params: { id: order.id }, query: { placed: '1' } })
  } catch (e) {
    serverError.value = e.message
    if (e.fields) errors.value = e.fields
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container-x py-8">
    <h1 class="font-display text-3xl font-extrabold">{{ t('checkout.title') }}</h1>

    <EmptyState v-if="!cart.items.length" class="mt-6" icon="bag" :title="t('cart.empty')">
      <RouterLink to="/shop" class="btn btn-primary">{{ t('nav.shop') }}</RouterLink>
    </EmptyState>

    <form v-else class="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]" novalidate @submit.prevent="placeOrder">
      <!-- LEFT: details + map + payment -->
      <div class="space-y-5">
        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display text-lg font-bold"><AppIcon name="user" :size="18" /> {{ t('checkout.contact') }}</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="fn">{{ t('checkout.fullName') }}</label>
              <input id="fn" v-model="form.fullName" class="input" :class="errors.fullName && 'input-error'" autocomplete="name" />
            </div>
            <div>
              <label class="label" for="ph">{{ t('checkout.phone') }}</label>
              <input id="ph" v-model="form.phone" class="input" :class="errors.phone && 'input-error'" placeholder="012 345 678" autocomplete="tel" />
            </div>
            <div class="sm:col-span-2">
              <label class="label" for="em">{{ t('checkout.email') }}</label>
              <input id="em" v-model="form.email" type="email" class="input" :class="errors.email && 'input-error'" autocomplete="email" />
            </div>
          </div>
        </section>

        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display text-lg font-bold"><AppIcon name="truck" :size="18" /> {{ t('checkout.delivery') }}</h2>

          <p class="label mt-4">{{ t('checkout.zone') }}</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="z in SHIPPING_ZONES" :key="z.id" type="button" class="chip" :class="zone.id === z.id && 'chip-active'" @click="zone = z">
              {{ z.name }} · {{ formatPrice(z.fee) }}
            </button>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="label" for="ad">{{ t('checkout.address') }}</label>
              <input id="ad" v-model="form.address" class="input" :class="errors.address && 'input-error'" placeholder="No. 12, St. 271" autocomplete="street-address" />
            </div>
            <div>
              <label class="label" for="ci">{{ t('checkout.city') }}</label>
              <input id="ci" v-model="form.city" class="input" :class="errors.city && 'input-error'" />
            </div>
            <div>
              <label class="label" for="nt">{{ t('checkout.note') }}</label>
              <input id="nt" v-model="form.note" class="input" :placeholder="t('common.optional')" />
            </div>
          </div>

          <!-- Real map -->
          <div class="mt-5">
            <div class="flex items-center justify-between">
              <p class="label !mb-0">{{ t('checkout.map') }}</p>
              <button type="button" class="btn btn-outline btn-sm" :disabled="locating" @click="useMyLocation">
                <AppIcon name="pin" :size="14" /> {{ locating ? '…' : t('checkout.useMyLocation') }}
              </button>
            </div>
            <div class="mt-2 overflow-hidden rounded-[5px] border border-line">
              <iframe :src="mapSrc" class="h-52 w-full sm:h-60" loading="lazy" title="Delivery location map"></iframe>
            </div>
            <p class="mt-1.5 text-xs text-muted tabular">{{ form.lat }}, {{ form.lng }} · ETA {{ zone.eta }}</p>
          </div>
        </section>

        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display text-lg font-bold"><AppIcon name="card" :size="18" /> {{ t('checkout.payment') }}</h2>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" class="flex items-center gap-3 rounded-[5px] border p-4 text-left transition"
                    :class="method === 'khqr' ? 'border-primary bg-primary-soft' : 'border-line hover:border-muted'"
                    @click="method = 'khqr'">
              <AppIcon name="qr" :size="22" />
              <span><span class="block text-sm font-bold">{{ t('checkout.payKhqr') }}</span>
              <span class="block text-xs text-muted">{{ t('home.khqrSub') }}</span></span>
            </button>
            <button type="button" class="flex items-center gap-3 rounded-[5px] border p-4 text-left transition"
                    :class="method === 'cod' ? 'border-primary bg-primary-soft' : 'border-line hover:border-muted'"
                    @click="method = 'cod'">
              <AppIcon name="truck" :size="22" />
              <span><span class="block text-sm font-bold">{{ t('checkout.payCod') }}</span>
              <span class="block text-xs text-muted">{{ t('checkout.codNote') }}</span></span>
            </button>
          </div>

          <!-- QR stays collapsed until the shopper taps "Show KHQR code" -->
          <div v-if="method === 'khqr'" class="mt-5">
            <KhqrPay :amount="cart.totals.total" :settings="settings.settings" :bill-number="billNumber" :auto="false" />
            <p class="mx-auto mt-3 max-w-sm text-center text-xs text-muted">{{ t('checkout.khqrNote') }}</p>
          </div>
        </section>
      </div>

      <!-- RIGHT: summary -->
      <aside class="card h-fit p-5 lg:sticky lg:top-24">
        <h2 class="font-display text-lg font-bold">{{ t('checkout.summary') }}</h2>
        <ul class="mt-4 max-h-64 space-y-3 overflow-y-auto">
          <li v-for="i in cart.items" :key="i.id" class="flex items-center gap-3">
            <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-[5px] bg-surface-2">
              <img :src="i.image" :alt="i.name" class="h-full w-full object-cover" />
              <span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-[5px] bg-ink text-[10px] font-bold text-canvas">{{ i.quantity }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ i.name }}</p>
              <p class="text-xs text-muted">EU {{ i.size }}</p>
            </div>
            <p class="text-sm font-semibold tabular">{{ formatPrice(i.price * i.quantity) }}</p>
          </li>
        </ul>

        <dl class="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div class="flex justify-between"><dt class="text-muted">{{ t('cart.subtotal') }}</dt><dd class="tabular">{{ formatPrice(cart.totals.subtotal) }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">{{ t('cart.shipping') }}</dt><dd class="tabular">{{ cart.totals.shipping ? formatPrice(cart.totals.shipping) : t('common.free') }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">{{ t('cart.tax') }}</dt><dd class="tabular">{{ formatPrice(cart.totals.tax) }}</dd></div>
          <div class="flex justify-between border-t border-line pt-3 font-display text-lg font-bold"><dt>{{ t('common.total') }}</dt><dd class="tabular">{{ formatPrice(cart.totals.total) }}</dd></div>
        </dl>

        <p v-if="serverError" class="mt-4 rounded-[5px] bg-rose-500/10 p-3 text-sm text-rose-600">{{ serverError }}</p>

        <button type="submit" class="btn btn-primary mt-5 w-full !py-3" :disabled="submitting">
          <AppIcon name="lock" :size="15" />
          {{ submitting ? t('checkout.processing') : (method === 'khqr' ? t('checkout.confirmPaid') : t('checkout.placeOrder')) }}
        </button>
        <p class="mt-3 text-center text-xs text-muted">{{ auth.user?.email }}</p>
      </aside>
    </form>
  </div>
</template>
