<script setup>
import { reactive, ref } from 'vue'
import { COLOR_PRESETS } from '@/assets/theme.js'
import { backendMode } from '@/services/api.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useUiStore } from '@/stores/ui.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import InputField from '@/components/ui/InputField.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const ui = useUiStore()
const auth = useAuthStore()
const toast = useToastStore()
const { t } = useI18n()

const busy = ref('')
const profile = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  password: '',
})

async function saveProfile() {
  busy.value = 'profile'
  try {
    await auth.updateProfile({ ...profile, password: profile.password || undefined })
    profile.password = ''
    toast.success(t('account.updated'))
  } catch (e) { toast.error(e.message) } finally { busy.value = '' }
}

async function pickColor(p) {
  ui.setColor(p.id, p.primary)
  try {
    await settings.update({ colorPreset: p.id, primaryColor: p.primary })
    toast.success(t('admin.saved'))
  } catch (e) { toast.error(e.message) }
}

const LINKS = [
  { to: '/admin/banners', key: 'nav2.banners', icon: 'megaphone', desc: 'Hero, banner & colour' },
  { to: '/admin/payments', key: 'nav2.payments', icon: 'qr', desc: 'KHQR / Bakong token' },
  { to: '/admin/discounts', key: 'nav2.discounts', icon: 'ticket', desc: 'Coupons & bulk discount' },
  { to: '/admin/staff', key: 'nav2.staff', icon: 'shieldUser', desc: 'Team & permissions' },
]
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.settings')" :subtitle="auth.user?.email" />

    <div class="grid gap-4 xl:grid-cols-2">
      <!-- Admin profile -->
      <section class="card p-4 sm:p-5">
        <h2 class="flex items-center gap-2 font-display"><AppIcon name="user" :size="18" /> {{ t('admin.adminProfile') }}</h2>
        <div class="mt-4 space-y-3">
          <InputField id="s-name" v-model="profile.name" :label="t('account.name')" icon="user" />
          <div class="grid gap-3 sm:grid-cols-2">
            <InputField id="s-email" v-model="profile.email" :label="t('auth.email')" icon="mail" type="email" />
            <InputField id="s-phone" v-model="profile.phone" :label="t('checkout.phone')" icon="phone" />
          </div>
          <InputField id="s-pw" v-model="profile.password" :label="t('account.newPassword')" icon="lock"
                      type="password" :placeholder="t('account.leaveBlank')" />
          <button class="btn btn-primary w-full sm:w-auto" :disabled="busy === 'profile'" @click="saveProfile">
            {{ busy === 'profile' ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </section>

      <div class="space-y-4">
        <!-- Preferences -->
        <section class="card p-4 sm:p-5">
          <h2 class="flex items-center gap-2 font-display"><AppIcon name="sliders" :size="18" /> Preferences</h2>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button class="btn btn-outline btn-sm" @click="ui.toggleDark()">
              <AppIcon :name="ui.dark ? 'sun' : 'moon'" :size="15" />
              {{ ui.dark ? t('common.lightMode') : t('common.darkMode') }}
            </button>
            <LanguageSwitcher />
            <button class="btn btn-outline btn-sm" @click="ui.toggleSidebar()">
              <AppIcon name="panelLeft" :size="15" />
              {{ ui.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar' }}
            </button>
          </div>

          <p class="label mt-5">{{ t('admin.themeColor') }}</p>
          <div class="grid max-w-sm grid-cols-8 gap-2">
            <button v-for="p in COLOR_PRESETS" :key="p.id"
                    class="relative aspect-square rounded-[5px] border-2 transition hover:scale-105"
                    :class="settings.settings.colorPreset === p.id ? 'border-ink scale-105' : 'border-transparent'"
                    :style="{ background: p.primary }" :title="p.name" :aria-label="p.name"
                    @click="pickColor(p)">
              <AppIcon v-if="settings.settings.colorPreset === p.id" name="check" :size="14" class="absolute inset-0 m-auto text-white" />
            </button>
          </div>
        </section>

        <!-- Shortcuts to the dedicated editors -->
        <section class="card overflow-hidden">
          <h2 class="border-b border-line px-4 py-3.5 font-display sm:px-5">Manage</h2>
          <div class="divide-y divide-line-soft">
            <RouterLink v-for="l in LINKS" :key="l.to" :to="l.to"
                        class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2 sm:px-5">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-primary-soft text-primary">
                <AppIcon :name="l.icon" :size="17" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ t(l.key) }}</span>
                <span class="block truncate text-xs text-muted">{{ l.desc }}</span>
              </span>
              <AppIcon name="chevronRight" :size="16" class="shrink-0 text-muted" />
            </RouterLink>
          </div>
        </section>

        <!-- System -->
        <section class="card p-4 sm:p-5">
          <h2 class="flex items-center gap-2 font-display"><AppIcon name="database" :size="18" /> System</h2>
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Data mode</dt>
              <dd class="font-medium" :class="backendMode === 'api' ? 'text-emerald-600' : 'text-amber-600'">
                {{ backendMode === 'api' ? 'REST API backend' : 'Browser storage' }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">KHQR verification</dt>
              <dd class="text-right text-xs text-muted">Manual — connect Bakong Open API</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Version</dt>
              <dd class="font-mono text-xs">VKS 2.0</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </div>
</template>
