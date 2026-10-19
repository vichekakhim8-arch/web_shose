<script setup>
import { reactive, ref, watch } from 'vue'
import { BRANDS, CATEGORIES, GENDERS, SIZES } from '@/services/seed.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  open: Boolean,
  product: { type: Object, default: null },
  saving: Boolean,
  serverErrors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['close', 'save'])
const { t } = useI18n()

const blank = () => ({
  name: '', brand: BRANDS[0], category: CATEGORIES[0], gender: GENDERS[0], colorway: '',
  price: '', compareAtPrice: '', stock: 0, images: '', sizes: [...SIZES],
  description: '', features: '', tags: '', featured: false,
})
const form = reactive(blank())
const errors = ref({})

watch(() => [props.open, props.product], () => {
  if (!props.open) return
  errors.value = {}
  const p = props.product
  Object.assign(form, p ? {
    name: p.name, brand: p.brand, category: p.category, gender: p.gender, colorway: p.colorway || '',
    price: (p.price / 100).toFixed(2),
    compareAtPrice: p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : '',
    stock: p.stock, images: (p.images || []).join('\n'), sizes: [...(p.sizes || SIZES)],
    description: p.description, features: (p.features || []).join('\n'), tags: (p.tags || []).join(', '),
    featured: !!p.featured,
  } : blank())
}, { immediate: true })

watch(() => props.serverErrors, (v) => (errors.value = { ...v }))

function toggleSize(s) {
  const i = form.sizes.indexOf(s)
  i === -1 ? form.sizes.push(s) : form.sizes.splice(i, 1)
}

function submit() {
  const imgs = form.images.split('\n').map((s) => s.trim()).filter(Boolean)
  const e = {}
  if (form.name.trim().length < 2) e.name = t('common.required')
  if (!(Number(form.price) > 0)) e.price = t('common.required')
  if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) e.compareAtPrice = '>'
  if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = t('common.required')
  if (!imgs.length || !/^https?:\/\//.test(imgs[0])) e.image = t('common.required')
  if (form.description.trim().length < 10) e.description = t('common.required')
  if (!form.sizes.length) e.sizes = t('common.required')
  errors.value = e
  if (Object.keys(e).length) return

  emit('save', {
    name: form.name.trim(), brand: form.brand, category: form.category, gender: form.gender,
    colorway: form.colorway.trim(),
    price: Math.round(Number(form.price) * 100),
    compareAtPrice: form.compareAtPrice ? Math.round(Number(form.compareAtPrice) * 100) : null,
    stock: Number(form.stock), images: imgs, sizes: [...form.sizes].sort((a, b) => a - b),
    description: form.description.trim(),
    features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
    tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    featured: form.featured,
  })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-[90] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm" @click.self="emit('close')">
      <form class="mx-auto mt-6 w-full max-w-3xl rounded-[5px] border border-line bg-surface shadow-2xl" novalidate @submit.prevent="submit">
        <header class="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 class="font-display text-lg font-bold">{{ product ? t('admin.editProduct') : t('admin.newProduct') }}</h2>
          <button type="button" class="rounded-[5px] p-2 text-muted hover:bg-surface-2 hover:text-ink" :aria-label="t('common.close')" @click="emit('close')">
            <AppIcon name="x" />
          </button>
        </header>

        <div class="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label" for="f-name">Name</label>
            <input id="f-name" v-model="form.name" class="input" :class="errors.name && 'input-error'" />
          </div>
          <div><label class="label" for="f-brand">{{ t('shop.brand') }}</label>
            <select id="f-brand" v-model="form.brand" class="input"><option v-for="b in BRANDS" :key="b">{{ b }}</option></select></div>
          <div><label class="label" for="f-cat">{{ t('shop.category') }}</label>
            <select id="f-cat" v-model="form.category" class="input"><option v-for="c in CATEGORIES" :key="c">{{ c }}</option></select></div>
          <div><label class="label" for="f-gen">{{ t('shop.gender') }}</label>
            <select id="f-gen" v-model="form.gender" class="input"><option v-for="g in GENDERS" :key="g">{{ g }}</option></select></div>
          <div><label class="label" for="f-col">Colourway</label><input id="f-col" v-model="form.colorway" class="input" /></div>
          <div><label class="label" for="f-price">{{ t('admin.price') }} (USD)</label>
            <input id="f-price" v-model="form.price" type="number" min="0" step="0.01" class="input" :class="errors.price && 'input-error'" /></div>
          <div><label class="label" for="f-cmp">Compare-at (USD)</label>
            <input id="f-cmp" v-model="form.compareAtPrice" type="number" min="0" step="0.01" class="input" :class="errors.compareAtPrice && 'input-error'" /></div>
          <div><label class="label" for="f-stock">{{ t('admin.stock') }}</label>
            <input id="f-stock" v-model="form.stock" type="number" min="0" step="1" class="input" :class="errors.stock && 'input-error'" /></div>

          <div class="sm:col-span-2">
            <label class="label">{{ t('shop.size') }}</label>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="s in SIZES" :key="s" type="button" class="chip !px-3" :class="form.sizes.includes(s) && 'chip-active'" @click="toggleSize(s)">{{ s }}</button>
            </div>
            <p v-if="errors.sizes" class="mt-1 text-xs text-rose-600">{{ errors.sizes }}</p>
          </div>

          <div class="sm:col-span-2">
            <label class="label" for="f-img">Image URLs (one per line — first is the cover)</label>
            <textarea id="f-img" v-model="form.images" rows="3" class="input font-mono text-xs" :class="errors.image && 'input-error'" placeholder="https://…"></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="label" for="f-desc">Description</label>
            <textarea id="f-desc" v-model="form.description" rows="3" class="input" :class="errors.description && 'input-error'"></textarea>
          </div>
          <div><label class="label" for="f-feat">Highlights (one per line)</label><textarea id="f-feat" v-model="form.features" rows="3" class="input"></textarea></div>
          <div><label class="label" for="f-tags">Tags (comma separated)</label><textarea id="f-tags" v-model="form.tags" rows="3" class="input"></textarea></div>

          <label class="flex items-center gap-2 text-sm sm:col-span-2">
            <input v-model="form.featured" type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" /> Feature in hero carousel
          </label>
        </div>

        <footer class="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button type="button" class="btn btn-outline" @click="emit('close')">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? t('common.loading') : t('common.save') }}</button>
        </footer>
      </form>
    </div>
  </Transition>
</template>
