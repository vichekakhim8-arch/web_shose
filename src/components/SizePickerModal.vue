<script setup>
import { computed, ref, watch } from 'vue'
import { useQuickAddStore } from '@/stores/quickAdd.js'
import { useCartStore } from '@/stores/cart.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import AppIcon from './AppIcon.vue'
import QuantityStepper from './QuantityStepper.vue'

const quick = useQuickAddStore()
const cart = useCartStore()
const toast = useToastStore()
const { t } = useI18n()

const size = ref(null)
const colorIndex = ref(0)
const qty = ref(1)

const product = computed(() => quick.product)
const colors = computed(() => product.value?.colors || [])
const image = computed(() => colors.value[colorIndex.value]?.image || product.value?.image)
// Shared stock pool minus whatever is already in the cart in any size.
const available = computed(() => (product.value ? cart.availableFor(product.value) : 0))

watch(() => quick.open, (o) => {
  if (o) {
    size.value = null
    colorIndex.value = 0
    qty.value = 1
  }
})
// Never let the stepper exceed what is actually left.
watch(available, (n) => { if (qty.value > n) qty.value = Math.max(1, n) })

function confirm() {
  if (!size.value) return toast.error(t('product.chooseSizeFirst'))
  const added = cart.add(product.value, qty.value, size.value)
  if (!added) return toast.error(t('picker.allInCart'))
  if (added < qty.value) toast.info(t('product.onlyLeft', { n: added }))
  else toast.success(t('toast.added'))
  quick.close()
  cart.drawerOpen = true
}
</script>

<template>
  <Transition name="fade">
    <div v-if="quick.open && product"
         class="fixed inset-0 z-[85] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
         @click.self="quick.close()">
      <div class="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[5px] border border-line bg-surface shadow-2xl">
        <header class="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3.5 sm:px-5">
          <h2 class="font-display">{{ t('picker.title') }}</h2>
          <button class="rounded-[5px] p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
                  :aria-label="t('common.close')" @click="quick.close()"><AppIcon name="x" :size="18" /></button>
        </header>

        <div class="flex gap-4 p-4 sm:p-5">
          <div class="h-24 w-24 shrink-0 overflow-hidden rounded-[5px] bg-surface-2 sm:h-28 sm:w-28">
            <Transition name="fade" mode="out-in">
              <img :key="image" :src="image" :alt="product.name" class="h-full w-full object-cover" />
            </Transition>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted">{{ product.brand }}</p>
            <p class="font-display line-clamp-2">{{ product.name }}</p>
            <p class="font-display mt-1 text-lg">{{ formatPrice(product.price) }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ colors[colorIndex]?.name }}</p>
            <p class="mt-1 text-xs" :class="available <= 3 ? 'text-amber-600' : 'text-muted'">
              {{ t('product.onlyLeft', { n: available }) }}
            </p>
          </div>
        </div>

        <div class="space-y-4 px-4 pb-5 sm:px-5">
          <div v-if="colors.length > 1">
            <p class="label">{{ t('picker.color') }}</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="(c, i) in colors" :key="c.name" type="button"
                      class="h-8 w-8 rounded-[5px] border-2 transition"
                      :class="colorIndex === i ? 'border-ink scale-110' : 'border-line hover:scale-105'"
                      :style="{ background: c.hex }" :title="c.name" :aria-label="c.name"
                      :aria-pressed="colorIndex === i" @click="colorIndex = i"></button>
            </div>
          </div>

          <div>
            <p class="label">{{ t('picker.size') }}</p>
            <div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
              <button v-for="s in product.sizes" :key="s" type="button"
                      class="h-10 rounded-[5px] border text-sm font-medium transition"
                      :class="size === s ? 'border-primary bg-primary text-primary-ink' : 'border-line hover:border-ink'"
                      @click="size = s">{{ s }}</button>
            </div>
            <p v-if="!size" class="mt-1.5 text-xs text-muted">{{ t('product.chooseSizeFirst') }}</p>
          </div>

          <div class="flex items-center gap-3">
            <QuantityStepper v-model="qty" :max="Math.max(1, available)" />
            <button class="btn btn-primary flex-1 !py-3" :disabled="!size || available === 0" @click="confirm">
              <AppIcon name="bag" :size="16" /> {{ t('picker.confirm') }}
            </button>
          </div>

          <RouterLink :to="{ name: 'product', params: { slug: product.slug } }"
                      class="block text-center text-sm font-medium text-primary hover:underline" @click="quick.close()">
            {{ t('picker.viewDetails') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </Transition>
</template>
