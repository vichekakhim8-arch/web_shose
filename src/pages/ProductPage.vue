<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api.js'
import { useCartStore } from '@/stores/cart.js'
import { useToastStore } from '@/stores/toast.js'
import { useAuthStore } from '@/stores/auth.js'
import { useWishlistStore } from '@/stores/wishlist.js'
import { useI18n } from '@/i18n/index.js'
import { formatPrice, formatDate } from '@/composables/useFormat.js'
import StarRating from '@/components/StarRating.vue'
import QuantityStepper from '@/components/QuantityStepper.vue'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const toast = useToastStore()
const auth = useAuthStore()
const wishlist = useWishlistStore()
const { t } = useI18n()

const product = ref(null)
const related = ref([])
const reviews = ref([])
const loading = ref(true)
const notFound = ref(false)

const gallery = ref([])
const imgIndex = ref(0)
const colorIndex = ref(0)
const size = ref(null)
const qty = ref(1)
const expanded = ref(false)
const tab = ref('description')

const newReview = ref({ rating: 5, comment: '' })
const posting = ref(false)

const inCart = computed(() =>
  cart.items.filter((i) => i.productId === product.value?.id).reduce((s, i) => s + i.quantity, 0),
)
const available = computed(() => Math.max(0, (product.value?.stock || 0) - inCart.value))
const discount = computed(() =>
  product.value?.compareAtPrice > product.value?.price
    ? Math.round((1 - product.value.price / product.value.compareAtPrice) * 100) : 0,
)
const faved = computed(() => product.value && wishlist.has(product.value.id))

/** Selecting a colour promotes that colour's shot to the front of the gallery. */
function pickColor(i) {
  colorIndex.value = i
  const img = product.value.colors[i]?.image
  if (!img) return
  const rest = (product.value.images || []).filter((x) => x !== img)
  gallery.value = [img, ...rest]
  imgIndex.value = 0
}

async function load(slug) {
  loading.value = true
  notFound.value = false
  imgIndex.value = 0
  colorIndex.value = 0
  size.value = null
  qty.value = 1
  expanded.value = false
  tab.value = 'description'
  try {
    product.value = await api.products.get(slug)
    gallery.value = [...(product.value.images || [product.value.image])]
    const [rel, rev] = await Promise.all([
      api.products.list({ category: product.value.category, pageSize: 5 }),
      api.reviews.list(product.value.id),
    ])
    related.value = rel.items.filter((p) => p.id !== product.value.id).slice(0, 4)
    reviews.value = rev
  } catch (e) {
    if (e.status === 404) notFound.value = true
    else toast.error(e.message)
  } finally {
    loading.value = false
  }
}
watch(() => route.params.slug, (s) => s && load(s), { immediate: true })

function addToCart(buyNow = false) {
  if (!size.value) return toast.error(t('product.chooseSizeFirst'))
  const added = cart.add(product.value, qty.value, size.value)
  if (!added) return toast.error(t('common.outOfStock'))
  toast.success(t('toast.added'))
  qty.value = 1
  buyNow ? router.push('/checkout') : (cart.drawerOpen = true)
}

function toggleFav() {
  toast.success(wishlist.toggle(product.value) ? t('toast.faved') : t('toast.unfaved'))
}

async function submitReview() {
  if (!auth.isAuthenticated) return router.push({ name: 'login', query: { redirect: route.fullPath } })
  posting.value = true
  try {
    await api.reviews.create({ productId: product.value.id, ...newReview.value })
    reviews.value = await api.reviews.list(product.value.id)
    product.value = await api.products.get(product.value.slug)
    newReview.value = { rating: 5, comment: '' }
    toast.success(t('product.reviewThanks'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    posting.value = false
  }
}
</script>

<template>
  <div class="container-x py-8">
    <div v-if="loading" class="grid gap-8 lg:grid-cols-[90px_1fr_380px]">
      <div class="hidden gap-3 lg:grid"><div v-for="i in 3" :key="i" class="skel aspect-square"></div></div>
      <div class="skel aspect-square"></div>
      <div class="space-y-4"><div class="skel h-8 w-2/3"></div><div class="skel h-5 w-28"></div><div class="skel h-28"></div></div>
    </div>

    <EmptyState v-else-if="notFound" icon="alert" :title="t('common.noResults')">
      <RouterLink to="/shop" class="btn btn-primary">{{ t('nav.shop') }}</RouterLink>
    </EmptyState>

    <template v-else-if="product">
      <nav class="text-sm text-muted">
        <RouterLink to="/" class="hover:text-primary">{{ t('nav.home') }}</RouterLink> /
        <RouterLink :to="{ name: 'shop', query: { category: product.category } }" class="hover:text-primary">{{ product.category }}</RouterLink> /
        <span class="text-ink">{{ product.name }}</span>
      </nav>

      <!-- LEFT thumbs · CENTRE image · RIGHT details -->
      <div class="mt-5 grid gap-6 lg:grid-cols-[92px_minmax(0,1fr)_390px]">
        <div class="scroll-x no-scrollbar order-2 flex gap-2.5 lg:order-1 lg:flex-col lg:overflow-visible">
          <button v-for="(img, i) in gallery" :key="img"
                  class="h-20 w-20 shrink-0 overflow-hidden rounded-[5px] border-2 transition"
                  :class="i === imgIndex ? 'border-primary' : 'border-line hover:border-muted'"
                  :aria-label="`Image ${i + 1}`" :aria-pressed="i === imgIndex"
                  @click="imgIndex = i" @mouseenter="imgIndex = i">
            <img :src="img" :alt="`${product.name} view ${i + 1}`" class="h-full w-full object-cover" />
          </button>
        </div>

        <div class="relative order-1 overflow-hidden rounded-[5px] border border-line bg-surface-2 lg:order-2">
          <Transition name="fade" mode="out-in">
            <img :key="gallery[imgIndex]" :src="gallery[imgIndex]" :alt="product.name" class="aspect-square w-full object-cover" />
          </Transition>
          <span v-if="discount" class="absolute left-3 top-3 rounded-[5px] bg-primary px-2.5 py-1 text-xs font-bold text-primary-ink">-{{ discount }}%</span>
          <button class="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-[5px] border border-line bg-surface/90 backdrop-blur transition hover:scale-110"
                  :class="faved ? 'text-rose-500' : 'text-muted hover:text-ink'"
                  :aria-label="faved ? t('fav.remove') : t('fav.add')" :aria-pressed="faved" @click="toggleFav">
            <AppIcon name="heart" :size="18" :class="faved && 'fill-rose-500'" />
          </button>
        </div>

        <div class="order-3 self-start lg:sticky lg:top-24 lg:py-1">
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{{ product.brand }} · {{ product.gender }}</p>
          <h1 class="font-display mt-1.5 text-3xl font-extrabold leading-tight">{{ product.name }}</h1>

          <div class="mt-3 flex items-center gap-3">
            <StarRating :rating="product.rating" :count="product.reviewCount" :size="15" />
            <span class="text-xs text-muted">{{ t('product.sku') }} {{ product.sku }}</span>
          </div>

          <div class="mt-5 flex items-baseline gap-3">
            <span class="font-display text-3xl font-extrabold">{{ formatPrice(product.price) }}</span>
            <span v-if="discount" class="text-lg text-muted line-through">{{ formatPrice(product.compareAtPrice) }}</span>
          </div>

          <!-- Colour -->
          <div v-if="product.colors?.length" class="mt-6">
            <div class="flex items-baseline justify-between">
              <p class="label !mb-0">{{ t('picker.color') }}</p>
              <span class="text-xs text-muted">{{ product.colors[colorIndex]?.name }}</span>
            </div>
            <div class="mt-2.5 flex flex-wrap gap-2.5">
              <button v-for="(c, i) in product.colors" :key="c.name" type="button"
                      class="h-9 w-9 rounded-[5px] border-2 transition hover:scale-105"
                      :class="colorIndex === i ? 'border-ink scale-110 ring-2 ring-primary/30' : 'border-line'"
                      :style="{ background: c.hex }" :title="c.name" :aria-label="c.name"
                      :aria-pressed="colorIndex === i" @click="pickColor(i)"></button>
            </div>
          </div>

          <!-- Size -->
          <div class="mt-6">
            <div class="flex items-center justify-between">
              <p class="label !mb-0">{{ t('product.selectSize') }}</p>
              <button class="text-xs text-muted underline hover:text-ink">{{ t('product.sizeGuide') }}</button>
            </div>
            <div class="mt-2.5 flex flex-wrap gap-2">
              <button v-for="s in product.sizes" :key="s"
                      class="h-11 w-14 rounded-[5px] border text-sm font-semibold transition"
                      :class="size === s ? 'border-primary bg-primary text-primary-ink' : 'border-line hover:border-ink'"
                      :disabled="product.stock === 0" @click="size = s">{{ s }}</button>
            </div>
          </div>

          <div class="mt-5 text-sm">
            <p v-if="product.stock === 0" class="font-semibold text-rose-600">{{ t('common.outOfStock') }}</p>
            <p v-else-if="product.stock <= 5" class="font-semibold text-amber-600">{{ t('product.onlyLeft', { n: product.stock }) }}</p>
            <p v-else class="flex items-center gap-1.5 font-semibold text-emerald-600"><AppIcon name="checkCircle" :size="16" /> {{ t('common.inStock') }}</p>
          </div>

          <div v-if="product.stock > 0" class="mt-5 space-y-3">
            <div class="flex gap-3">
              <QuantityStepper v-model="qty" :max="Math.max(1, available)" />
              <button class="btn btn-primary flex-1 !py-3" :disabled="available === 0" @click="addToCart(false)">
                <AppIcon name="bag" :size="17" /> {{ t('product.addToCart') }}
              </button>
            </div>
            <button class="btn btn-dark w-full !py-3" :disabled="available === 0" @click="addToCart(true)">{{ t('product.buyNow') }}</button>
          </div>

          <ul class="mt-6 grid gap-2 rounded-[5px] bg-surface-2 p-4 text-sm">
            <li class="flex items-center gap-2"><AppIcon name="truck" :size="17" /> {{ t('home.deliverySub') }}</li>
            <li class="flex items-center gap-2"><AppIcon name="qr" :size="17" /> {{ t('home.khqr') }}</li>
            <li class="flex items-center gap-2"><AppIcon name="refresh" :size="17" /> {{ t('home.returns') }}</li>
          </ul>
        </div>
      </div>

      <!-- Tabs -->
      <section class="mt-14">
        <div class="scroll-x no-scrollbar -mx-4 flex gap-1 border-b border-line px-4 sm:mx-0 sm:px-0">
          <button v-for="x in ['description', 'specs', 'reviews']" :key="x"
                  class="relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold transition"
                  :class="tab === x ? 'text-primary' : 'text-muted hover:text-ink'" @click="tab = x">
            {{ t(`product.${x}`) }}
            <span v-if="x === 'reviews'" class="ml-1 text-xs opacity-70">({{ reviews.length }})</span>
            <span v-if="tab === x" class="absolute inset-x-2 -bottom-px h-0.5 rounded-[5px] bg-primary"></span>
          </button>
        </div>

        <div class="py-6">
          <div v-if="tab === 'description'" class="max-w-3xl">
            <p class="leading-relaxed text-muted" :class="!expanded && 'line-clamp-3'">{{ product.description }}</p>
            <div v-if="expanded" class="mt-5">
              <h3 class="font-display font-bold">Highlights</h3>
              <ul class="mt-2 grid gap-2 sm:grid-cols-2">
                <li v-for="f in product.features" :key="f" class="flex items-center gap-2 text-sm text-muted">
                  <AppIcon name="check" :size="15" class="text-primary" /> {{ f }}
                </li>
              </ul>
            </div>
            <button class="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline" @click="expanded = !expanded">
              {{ expanded ? t('common.readLess') : t('common.readMore') }}
              <AppIcon :name="expanded ? 'arrowUp' : 'arrowDown'" :size="14" />
            </button>
          </div>

          <dl v-else-if="tab === 'specs'" class="grid max-w-2xl gap-x-8 gap-y-3 sm:grid-cols-2">
            <div v-for="row in [
              ['Brand', product.brand], ['Category', product.category], ['Gender', product.gender],
              ['Colours', (product.colors || []).map(c => c.name).join(', ')], ['SKU', product.sku], ['Sizes', product.sizes.join(', ')],
            ]" :key="row[0]" class="flex justify-between border-b border-line-soft pb-2 text-sm">
              <dt class="text-muted">{{ row[0] }}</dt><dd class="text-right font-medium">{{ row[1] }}</dd>
            </div>
          </dl>

          <div v-else class="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <p v-if="!reviews.length" class="text-sm text-muted">{{ t('product.noReviews') }}</p>
              <ul v-else class="space-y-5">
                <li v-for="r in reviews" :key="r.id" class="border-b border-line-soft pb-5">
                  <div class="flex items-center gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-surface-2 text-xs font-bold">{{ r.userName.charAt(0) }}</span>
                    <div><p class="text-sm font-semibold">{{ r.userName }}</p><StarRating :rating="r.rating" :size="12" /></div>
                    <span class="ml-auto text-xs text-muted">{{ formatDate(r.createdAt) }}</span>
                  </div>
                  <p class="mt-3 text-sm leading-relaxed text-muted">{{ r.comment }}</p>
                </li>
              </ul>
            </div>

            <div class="card h-fit p-5">
              <h3 class="font-display font-bold">{{ t('product.writeReview') }}</h3>
              <template v-if="auth.isAuthenticated">
                <p class="label mt-4">{{ t('product.yourRating') }}</p>
                <StarRating :rating="newReview.rating" :size="22" editable @update:rating="newReview.rating = $event" />
                <label class="label mt-4" for="rc">{{ t('product.yourComment') }}</label>
                <textarea id="rc" v-model="newReview.comment" rows="4" class="input"></textarea>
                <button class="btn btn-primary mt-3 w-full" :disabled="posting" @click="submitReview">
                  {{ posting ? t('common.loading') : t('product.submitReview') }}
                </button>
              </template>
              <template v-else>
                <p class="mt-3 text-sm text-muted">{{ t('product.loginToReview') }}</p>
                <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }" class="btn btn-outline mt-4 w-full">{{ t('common.signIn') }}</RouterLink>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section v-if="related.length" class="mt-12">
        <h2 class="font-display text-2xl font-extrabold">{{ t('product.relatedTitle') }}</h2>
        <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </section>
    </template>
  </div>
</template>
