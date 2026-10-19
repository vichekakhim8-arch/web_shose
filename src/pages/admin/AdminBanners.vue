<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { BANNER_PRESETS, COLOR_PRESETS } from '@/assets/theme.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useUiStore } from '@/stores/ui.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const catalog = useCatalogStore()
const ui = useUiStore()
const toast = useToastStore()
const { t, locale } = useI18n()

const form = ref({ ...settings.settings })
watch(() => settings.settings, (s) => (form.value = { ...s }), { deep: true })
const saving = ref(false)

onMounted(() => catalog.init())

const SOURCES = [
  { id: 'featured', key: 'heroCfg.sourceFeatured', icon: 'sparkle' },
  { id: 'newest', key: 'heroCfg.sourceNewest', icon: 'clock' },
  { id: 'sale', key: 'heroCfg.sourceSale', icon: 'percent' },
  { id: 'manual', key: 'heroCfg.sourceManual', icon: 'list' },
]

/** Mirrors HomePage's resolution so the preview is truthful. */
const preview = computed(() => {
  const all = catalog.products
  const n = Math.max(1, Number(form.value.heroCount) || 5)
  if (!all.length) return []
  switch (form.value.heroSource) {
    case 'manual':
      return (form.value.heroIds || []).map((id) => all.find((p) => p.id === id)).filter(Boolean).slice(0, n)
    case 'newest':
      return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, n)
    case 'sale':
      return all.filter((p) => p.compareAtPrice > p.price).slice(0, n)
    default:
      return [...all].sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating).slice(0, n)
  }
})

function togglePick(id) {
  const list = [...(form.value.heroIds || [])]
  const i = list.indexOf(id)
  i === -1 ? list.push(id) : list.splice(i, 1)
  form.value.heroIds = list
}

async function save() {
  saving.value = true
  try {
    await settings.update({ ...form.value })
    toast.success(t('admin.saved'))
  } catch (e) { toast.error(e.message) } finally { saving.value = false }
}

async function pickColor(p) {
  ui.setColor(p.id, p.primary)
  form.value.colorPreset = p.id
  form.value.primaryColor = p.primary
  await settings.update({ colorPreset: p.id, primaryColor: p.primary })
  toast.success(t('admin.saved'))
}
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.banners')" :subtitle="t('admin.appearance')">
      <template #actions>
        <RouterLink to="/" class="btn btn-outline btn-sm"><AppIcon name="eye" :size="14" /> {{ t('admin.viewStore') }}</RouterLink>
        <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">{{ t('common.save') }}</button>
      </template>
    </PageHeader>

    <div class="grid gap-5 xl:grid-cols-2">
      <!-- HERO -->
      <section class="card p-4 sm:p-5">
        <h2 class="flex items-center gap-2 font-display"><AppIcon name="sparkle" :size="18" /> Hero carousel</h2>

        <p class="label mt-4">{{ t('heroCfg.source') }}</p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button v-for="o in SOURCES" :key="o.id" type="button"
                  class="flex flex-col items-center gap-1 rounded-[5px] border px-2 py-2.5 text-xs transition"
                  :class="form.heroSource === o.id ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted hover:border-ink'"
                  @click="form.heroSource = o.id">
            <AppIcon :name="o.icon" :size="16" /> {{ t(o.key) }}
          </button>
        </div>

        <!-- Hand-picked slides -->
        <div v-if="form.heroSource === 'manual'" class="mt-4">
          <p class="label">{{ t('heroCfg.sourceManual') }} ({{ (form.heroIds || []).length }})</p>
          <div class="max-h-56 overflow-y-auto rounded-[5px] border border-line">
            <button v-for="p in catalog.products" :key="p.id" type="button"
                    class="flex w-full items-center gap-2.5 border-b border-line-soft px-2.5 py-2 text-left text-sm transition last:border-0 hover:bg-surface-2"
                    :class="(form.heroIds || []).includes(p.id) && 'bg-primary-soft'"
                    @click="togglePick(p.id)">
              <img :src="p.image" :alt="p.name" class="h-9 w-9 rounded-[5px] object-cover" />
              <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
              <AppIcon v-if="(form.heroIds || []).includes(p.id)" name="check" :size="15" class="text-primary" />
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label class="label" for="h-count">Slides</label>
            <input id="h-count" v-model.number="form.heroCount" type="number" min="1" max="10" class="input tabular" />
          </div>
          <div>
            <label class="label" for="h-int">{{ t('heroCfg.interval') }}</label>
            <input id="h-int" v-model.number="form.heroInterval" type="number" min="2" max="30" class="input tabular" />
          </div>
          <label class="flex items-end gap-2 pb-2.5 text-sm">
            <input v-model="form.heroAutoplay" type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" />
            {{ t('heroCfg.autoplay') }}
          </label>
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <div><label class="label" for="h-ee">{{ t('heroCfg.eyebrow') }} (EN)</label><input id="h-ee" v-model="form.heroEyebrowEn" class="input" /></div>
          <div><label class="label" for="h-ek">{{ t('heroCfg.eyebrow') }} (ខ្មែរ)</label><input id="h-ek" v-model="form.heroEyebrowKm" class="input" /></div>
          <div><label class="label" for="h-ce">{{ t('heroCfg.cta') }} (EN)</label><input id="h-ce" v-model="form.heroCtaEn" class="input" /></div>
          <div><label class="label" for="h-ck">{{ t('heroCfg.cta') }} (ខ្មែរ)</label><input id="h-ck" v-model="form.heroCtaKm" class="input" /></div>
        </div>

        <p class="label mt-4">Preview ({{ preview.length }})</p>
        <div class="scroll-x no-scrollbar flex gap-2">
          <div v-for="p in preview" :key="p.id" class="w-20 shrink-0 text-center">
            <img :src="p.image" :alt="p.name" class="aspect-square w-full rounded-[5px] object-cover" />
            <p class="mt-1 truncate text-[10px] text-muted">{{ p.name }}</p>
          </div>
          <p v-if="!preview.length" class="py-4 text-sm text-muted">{{ t('common.noResults') }}</p>
        </div>

        <button class="btn btn-primary mt-4 w-full" :disabled="saving" @click="save">{{ t('common.save') }}</button>
      </section>

      <div class="space-y-5">
        <!-- PROMO BANNER -->
        <section class="card p-4 sm:p-5">
          <h2 class="font-display">{{ t('admin.banner') }}</h2>
          <div class="relative mt-3 overflow-hidden rounded-[5px] border border-line">
            <img :src="form.bannerImage" alt="" class="h-36 w-full object-cover sm:h-44" />
            <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div class="absolute inset-y-0 left-0 flex max-w-[85%] flex-col justify-center p-4 sm:max-w-sm">
              <span class="mb-1.5 w-fit rounded-[5px] bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-ink">
                {{ locale === 'km' ? form.bannerSubKm : form.bannerSubEn }}
              </span>
              <p class="font-display text-lg leading-tight text-white sm:text-xl">
                {{ locale === 'km' ? form.bannerHeadingKm : form.bannerHeadingEn }}
              </p>
            </div>
          </div>

          <div class="mt-3 flex gap-2">
            <button v-for="b in BANNER_PRESETS" :key="b.id"
                    class="h-12 flex-1 overflow-hidden rounded-[5px] border-2 transition hover:scale-[1.02]"
                    :class="form.bannerImage === b.image ? 'border-primary' : 'border-line'"
                    @click="form.bannerImage = b.image">
              <img :src="b.image" alt="" class="h-full w-full object-cover" />
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <div><label class="label" for="b-img">{{ t('admin.bannerImage') }}</label><input id="b-img" v-model="form.bannerImage" class="input font-mono text-xs" /></div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div><label class="label" for="b-he">{{ t('admin.heading') }} (EN)</label><input id="b-he" v-model="form.bannerHeadingEn" class="input" /></div>
              <div><label class="label" for="b-hk">{{ t('admin.heading') }} (ខ្មែរ)</label><input id="b-hk" v-model="form.bannerHeadingKm" class="input" /></div>
              <div><label class="label" for="b-se">{{ t('admin.subheading') }} (EN)</label><input id="b-se" v-model="form.bannerSubEn" class="input" /></div>
              <div><label class="label" for="b-sk">{{ t('admin.subheading') }} (ខ្មែរ)</label><input id="b-sk" v-model="form.bannerSubKm" class="input" /></div>
            </div>
            <button class="btn btn-primary w-full" :disabled="saving" @click="save">{{ t('common.save') }}</button>
          </div>
        </section>

        <section class="card p-4 sm:p-5">
          <h2 class="flex items-center gap-2 font-display"><AppIcon name="palette" :size="18" /> {{ t('admin.themeColor') }}</h2>
          <div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
            <button v-for="p in COLOR_PRESETS" :key="p.id"
                    class="relative aspect-square rounded-[5px] border-2 transition hover:scale-105"
                    :class="form.colorPreset === p.id ? 'border-ink scale-105' : 'border-transparent'"
                    :style="{ background: p.primary }" :title="p.name" :aria-label="p.name" @click="pickColor(p)">
              <AppIcon v-if="form.colorPreset === p.id" name="check" :size="15" class="absolute inset-0 m-auto text-white" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
