<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuickAddStore } from '@/stores/quickAdd.js'
import { useCartStore } from '@/stores/cart.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice } from '@/composables/useFormat.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  slides: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  /** Admin-controlled presentation */
  eyebrow: { type: String, default: '' },
  ctaLabel: { type: String, default: '' },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 5 },
})

const router = useRouter()
const quick = useQuickAddStore()
const cart = useCartStore()
const toast = useToastStore()
const { t } = useI18n()

const index = ref(0)
const paused = ref(false)
const playing = ref(props.autoplay)
let timer = null

const count = computed(() => props.slides.length)
const active = computed(() => props.slides[index.value] || null)
const prev = computed(() => (count.value > 1 ? props.slides[(index.value - 1 + count.value) % count.value] : null))
const next = computed(() => (count.value > 1 ? props.slides[(index.value + 1) % count.value] : null))
const soldOut = computed(() => (active.value?.stock ?? 0) <= 0)

const DOTS = ['bg-stone-500', 'bg-primary', 'bg-ink', 'bg-emerald-500', 'bg-sky-500']
const go = (i) => count.value && (index.value = (i + count.value) % count.value)

function start() {
  stop()
  if (count.value < 2 || !playing.value) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => !paused.value && go(index.value + 1), Math.max(2, props.interval) * 1000)
}
function stop() {
  if (timer) clearInterval(timer)
  timer = null
}
function togglePlay() {
  playing.value = !playing.value
  playing.value ? start() : stop()
}

onMounted(start)
onBeforeUnmount(stop)
// Restart whenever the admin changes slides, speed or autoplay.
watch(() => [props.slides.length, props.interval], start)
watch(() => props.autoplay, (v) => { playing.value = v; start() })
watch(() => props.slides, () => (index.value = 0))

let tx = 0
const onStart = (e) => (tx = e.changedTouches[0].clientX)
function onEnd(e) {
  const dx = e.changedTouches[0].clientX - tx
  if (Math.abs(dx) > 50) go(index.value + (dx < 0 ? 1 : -1))
}

/** Opens the size picker rather than guessing — same rule as the cards. */
function buyNow() {
  const p = active.value
  if (!p) return
  if ((p.stock ?? 0) <= 0) return toast.error(t('hero.soldOut'))
  if (cart.availableFor(p) === 0) return toast.error(t('picker.allInCart'))
  quick.show(p)
}
</script>

<template>
  <section
    class="relative overflow-hidden border-b border-line bg-gradient-to-b from-surface-2 to-canvas"
    aria-roledescription="carousel" aria-label="Featured sneakers"
    @mouseenter="paused = true" @mouseleave="paused = false"
    @touchstart.passive="onStart" @touchend.passive="onEnd"
  >
    <div class="container-x relative py-7 sm:py-10 lg:py-14">
      <div v-if="loading" class="flex flex-col items-center">
        <div class="skel h-48 w-48 sm:h-64 sm:w-64"></div>
        <div class="skel mt-7 h-8 w-56 max-w-full"></div>
        <div class="skel mt-3 h-4 w-72 max-w-full"></div>
        <div class="skel mt-5 h-11 w-32"></div>
      </div>

      <template v-else-if="active">
        <div class="relative flex h-[190px] items-center justify-center sm:h-[260px] lg:h-[330px]">
          <button v-if="prev && prev !== active"
                  class="absolute left-0 hidden md:block xl:left-12" tabindex="-1"
                  :aria-label="`Show ${prev.name}`" @click="go(index - 1)">
            <img :src="prev.image" alt="" aria-hidden="true"
                 class="h-32 w-32 rounded-[5px] object-cover opacity-45 blur-[3px] lg:h-48 lg:w-48" />
          </button>

          <div class="relative h-full">
            <Transition name="hero" mode="out-in">
              <RouterLink :key="active.id" :to="{ name: 'product', params: { slug: active.slug } }"
                          class="block h-full" :aria-label="active.name">
                <img :src="active.image" :alt="active.name"
                     class="h-full w-auto rounded-[5px] object-cover shadow-2xl shadow-black/25"
                     :class="soldOut && 'blur-[2px] grayscale'" />
              </RouterLink>
            </Transition>
            <span v-if="soldOut"
                  class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[5px] bg-ink/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-canvas">
              {{ t('hero.soldOut') }}
            </span>
          </div>

          <button v-if="next && next !== active"
                  class="absolute right-0 hidden md:block xl:right-12" tabindex="-1"
                  :aria-label="`Show ${next.name}`" @click="go(index + 1)">
            <img :src="next.image" alt="" aria-hidden="true"
                 class="h-32 w-32 rounded-[5px] object-cover opacity-45 blur-[3px] lg:h-48 lg:w-48" />
          </button>

          <button class="absolute left-0 flex h-9 w-9 items-center justify-center rounded-[5px] border border-line bg-surface/80 backdrop-blur transition hover:bg-surface md:hidden"
                  aria-label="Previous" @click="go(index - 1)"><AppIcon name="chevronLeft" :size="17" /></button>
          <button class="absolute right-0 flex h-9 w-9 items-center justify-center rounded-[5px] border border-line bg-surface/80 backdrop-blur transition hover:bg-surface md:hidden"
                  aria-label="Next" @click="go(index + 1)"><AppIcon name="chevronRight" :size="17" /></button>
        </div>

        <div class="mt-6 text-center sm:mt-8" aria-live="polite">
          <p class="text-[10px] font-medium uppercase tracking-[0.28em] text-muted sm:text-[11px]">
            {{ eyebrow || `${active.brand} · ${active.category}` }}
          </p>
          <h1 class="font-display h-hero mt-2">{{ active.name }}</h1>
          <p class="mx-auto mt-2.5 line-clamp-2 max-w-md px-2 text-sm leading-relaxed text-muted">{{ active.description }}</p>
          <p class="font-display mt-2.5 text-lg sm:text-xl">
            {{ formatPrice(active.price) }}
            <span v-if="active.compareAtPrice > active.price" class="ml-1 text-sm font-normal text-muted line-through">
              {{ formatPrice(active.compareAtPrice) }}
            </span>
          </p>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button class="btn btn-primary !px-7 !py-3 uppercase tracking-[0.1em]" :disabled="soldOut" @click="buyNow">
              {{ soldOut ? t('hero.soldOut') : (ctaLabel || t('hero.buyNow')) }}
            </button>
            <RouterLink :to="{ name: 'product', params: { slug: active.slug } }" class="btn btn-outline !py-3">
              {{ t('hero.explore') }}
            </RouterLink>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between sm:mt-8">
          <button class="flex items-center gap-1.5 rounded-[5px] px-2 py-1.5 text-xs text-muted transition hover:text-ink"
                  :aria-pressed="!playing" @click="togglePlay">
            <AppIcon :name="playing ? 'clock' : 'refresh'" :size="14" />
            <span class="hidden sm:inline">{{ playing ? 'Auto' : 'Paused' }}</span>
          </button>
          <div class="flex items-center gap-2.5" role="tablist" aria-label="Choose slide">
            <button v-for="(s, i) in slides" :key="s.id"
                    class="circle h-2.5 w-2.5 transition-transform duration-300"
                    :class="[DOTS[i % DOTS.length], i === index ? 'scale-150' : 'opacity-40 hover:opacity-80']"
                    role="tab" :aria-selected="i === index" :aria-label="s.name" @click="go(i)"></button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
