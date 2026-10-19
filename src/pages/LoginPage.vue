<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from '@/components/AppIcon.vue'
import InputField from '@/components/ui/InputField.vue'
import SocialAuthButtons from '@/components/SocialAuthButtons.vue'

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

const DEMOS = [
  { key: 'auth.demoCustomer', email: 'demo@vks.store', password: 'demo123', icon: 'user' },
  { key: 'auth.demoAdmin', email: 'admin@vks.store', password: 'admin123', icon: 'shieldUser' },
]

async function submit() {
  error.value = ''
  if (!form.email || !form.password) return (error.value = t('common.required'))
  loading.value = true
  try {
    const user = await auth.login(form)
    toast.success(t('toast.signedIn'))
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.replace(redirect || (user.role === 'admin' ? '/admin' : '/account'))
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function demo(d) {
  form.email = d.email
  form.password = d.password
  await submit()
}
</script>

<template>
  <div>
    <div class="text-center">
      <h1 class="font-display text-2xl font-extrabold">{{ t('auth.welcome') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('auth.welcomeSub') }}</p>
    </div>

    <div class="mt-5"><SocialAuthButtons /></div>

    <div class="my-5 flex items-center gap-3">
      <span class="h-px flex-1 bg-line"></span>
      <span class="text-[11px] uppercase tracking-wider text-muted">{{ t('auth.or') }}</span>
      <span class="h-px flex-1 bg-line"></span>
    </div>

    <form class="space-y-3.5" novalidate @submit.prevent="submit">
      <InputField id="email" v-model="form.email" :label="t('auth.email')" icon="mail"
                  type="email" autocomplete="email" placeholder="you@example.com" />
      <InputField id="password" v-model="form.password" :label="t('auth.password')" icon="lock"
                  type="password" autocomplete="current-password" placeholder="••••••••" />

      <p v-if="error" class="flex items-center gap-2 rounded-[5px] bg-rose-500/10 p-3 text-sm text-rose-600" role="alert">
        <AppIcon name="alert" :size="16" /> {{ error }}
      </p>

      <button class="btn btn-primary w-full !py-3" :disabled="loading">
        <AppIcon v-if="!loading" name="logout" :size="16" class="rotate-180" />
        {{ loading ? t('common.loading') : t('common.signIn') }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-muted">
      {{ t('auth.noAccount') }}
      <RouterLink :to="{ name: 'register', query: route.query }" class="font-semibold text-primary hover:underline">{{ t('common.signUp') }}</RouterLink>
    </p>

    <div class="mt-5 rounded-[5px] border border-dashed border-line p-3.5">
      <p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
        <AppIcon name="sparkle" :size="13" /> {{ t('auth.demoTitle') }}
      </p>
      <div class="mt-2.5 grid gap-2 sm:grid-cols-2">
        <button v-for="d in DEMOS" :key="d.email" type="button" class="btn btn-outline btn-sm justify-start" :disabled="loading" @click="demo(d)">
          <AppIcon :name="d.icon" :size="15" /> {{ t(d.key) }}
        </button>
      </div>
    </div>
  </div>
</template>
