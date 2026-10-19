<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { buildKhqr } from '@/services/khqr.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  amount: { type: Number, required: true },
  settings: { type: Object, required: true },
  billNumber: { type: String, default: '' },
  /** When false the QR stays hidden until the shopper asks for it. */
  auto: { type: Boolean, default: false },
})

const toast = useToastStore()
const { t } = useI18n()

const shown = ref(props.auto)
const dataUrl = ref('')
const busy = ref(false)
const copied = ref(false)
const secondsLeft = ref(180)
let tick = null

const payload = computed(() =>
  buildKhqr({
    bakongAccount: props.settings.bakongAccount,
    merchantName: props.settings.merchantName,
    merchantCity: props.settings.merchantCity,
    amount: props.amount / 100,
    currency: props.settings.currency || 'USD',
    billNumber: props.billNumber,
  }),
)

async function render() {
  busy.value = true
  try {
    dataUrl.value = await QRCode.toDataURL(payload.value, {
      errorCorrectionLevel: 'M', margin: 1, width: 560,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } finally {
    busy.value = false
  }
}

function startTimer() {
  clearInterval(tick)
  secondsLeft.value = 180
  tick = setInterval(() => secondsLeft.value > 0 && secondsLeft.value--, 1000)
}
onBeforeUnmount(() => clearInterval(tick))

async function show() {
  shown.value = true
  await render()
  startTimer()
}
function hide() {
  shown.value = false
  clearInterval(tick)
}
// Keep an already-visible QR in sync with amount/merchant changes.
watch(payload, () => shown.value && render())
if (props.auto) show()

const mmss = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  return `${m}:${String(secondsLeft.value % 60).padStart(2, '0')}`
})

/** Composites the KHQR card onto a canvas so the saved PNG is self-explanatory. */
async function download() {
  if (!dataUrl.value) return
  const W = 620, H = 860
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const c = cv.getContext('2d')

  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H)
  c.fillStyle = '#e21a23'; c.fillRect(0, 0, W, 96)
  c.fillStyle = '#ffffff'
  c.font = 'italic 800 46px Outfit, sans-serif'
  c.fillText('KHQR', 34, 64)

  c.fillStyle = '#111111'
  c.font = '600 26px "Plus Jakarta Sans", sans-serif'
  c.textAlign = 'center'
  c.fillText(String(props.settings.merchantName || 'VKS'), W / 2, 158)
  c.font = '800 44px Outfit, sans-serif'
  c.fillText(`${formatPrice(props.amount)} ${props.settings.currency || 'USD'}`, W / 2, 214)

  c.strokeStyle = '#d4d4d8'; c.setLineDash([7, 7]); c.beginPath()
  c.moveTo(34, 248); c.lineTo(W - 34, 248); c.stroke(); c.setLineDash([])

  const img = new Image()
  img.src = dataUrl.value
  await new Promise((r) => (img.onload = r))
  c.drawImage(img, (W - 460) / 2, 282, 460, 460)

  c.fillStyle = '#6b7280'
  c.font = '400 18px "Plus Jakarta Sans", sans-serif'
  c.fillText('Scan with any Cambodian bank app', W / 2, 790)
  if (props.billNumber) {
    c.font = '600 18px "Plus Jakarta Sans", sans-serif'
    c.fillStyle = '#111111'
    c.fillText(props.billNumber, W / 2, 822)
  }

  const a = document.createElement('a')
  a.href = cv.toDataURL('image/png')
  a.download = `KHQR-${props.billNumber || 'payment'}.png`
  a.click()
  toast.success(t('pay.downloaded'))
}

async function copy() {
  await navigator.clipboard?.writeText(payload.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}
</script>

<template>
  <div>
    <!-- Collapsed: nothing renders until the shopper asks for the code -->
    <button v-if="!shown" type="button" class="btn btn-outline w-full !py-3" :disabled="busy" @click="show">
      <AppIcon name="qr" :size="18" /> {{ busy ? t('common.loading') : t('pay.showQr') }}
    </button>

    <Transition name="dd">
      <div v-if="shown" class="origin-top">
        <div class="mx-auto w-full max-w-[320px] overflow-hidden rounded-[5px] bg-white shadow-lg">
          <div class="relative bg-[#e21a23] px-4 py-3">
            <p class="font-display text-xl font-extrabold italic tracking-tight text-white">KHQR</p>
            <div class="absolute bottom-0 right-0 h-0 w-0 border-b-[18px] border-l-[18px] border-b-white border-l-transparent"></div>
          </div>

          <div class="px-5 pb-5 pt-4 text-center">
            <p class="truncate text-sm font-semibold text-neutral-800">{{ settings.merchantName }}</p>
            <p class="mt-2 font-display text-2xl font-extrabold text-neutral-900">
              {{ formatPrice(amount) }}
              <span class="text-sm font-semibold text-neutral-500">{{ settings.currency || 'USD' }}</span>
            </p>

            <div class="my-3 border-t border-dashed border-neutral-300"></div>

            <div class="relative mx-auto w-[210px]">
              <img v-if="dataUrl" :src="dataUrl" alt="KHQR payment code" class="w-full" />
              <div v-else class="aspect-square w-full animate-pulse bg-neutral-100"></div>
              <div class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border-2 border-white bg-[#e21a23]">
                <span class="text-[9px] font-extrabold leading-none text-white">KHQR</span>
              </div>
            </div>

            <p class="mt-3 text-[11px] text-neutral-500">{{ t('checkout.scanToPay') }}</p>
            <p class="mt-1 text-[11px] font-semibold text-neutral-700">
              {{ t('checkout.expires') }} <span class="tabular text-[#e21a23]">{{ mmss }}</span>
            </p>
          </div>
        </div>

        <div class="mx-auto mt-3 flex max-w-[320px] flex-wrap justify-center gap-2">
          <button type="button" class="btn btn-outline btn-sm" @click="download">
            <AppIcon name="download" :size="14" /> {{ t('pay.download') }}
          </button>
          <button type="button" class="btn btn-outline btn-sm" @click="copy">
            <AppIcon :name="copied ? 'check' : 'qr'" :size="14" /> {{ copied ? t('common.copied') : t('common.copy') }}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click="hide">{{ t('pay.hideQr') }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>
