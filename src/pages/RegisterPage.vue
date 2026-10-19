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

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const errors = ref({})
const error = ref('')
const loading = ref(false)

function validate() {
  const e = {}
  if (!form.name.trim()) e.name = t('common.required')
  if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('common.required')
  if (form.password.length < 6) e.password = '≥ 6 characters'
  if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
  return e
}

async function submit() {
  error.value = ''
  errors.value = validate()
  if (Object.keys(errors.value).length) return
  loading.value = true
  try {
    await auth.register({ name: form.name, email: form.email, password: form.password })
    toast.success(t('toast.signedIn'))
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.replace(redirect || '/account')
  } catch (e) {
    error.value = e.message
    if (e.fields) errors.value = e.fields
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="text-center">
      <h1 class="font-display text-2xl font-extrabold">{{ t('auth.createTitle') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('auth.createSub') }}</p>
    </div>

    <div class="mt-5"><SocialAuthButtons /></div>

    <div class="my-5 flex items-center gap-3">
      <span class="h-px flex-1 bg-line"></span>
      <span class="text-[11px] uppercase tracking-wider text-muted">{{ t('auth.or') }}</span>
      <span class="h-px flex-1 bg-line"></span>
    </div>

    <form class="space-y-3.5" novalidate @submit.prevent="submit">
      <InputField id="name" v-model="form.name" :label="t('auth.name')" icon="user"
                  autocomplete="name" :error="errors.name" placeholder="Sok Dara" />
      <InputField id="email" v-model="form.email" :label="t('auth.email')" icon="mail"
                  type="email" autocomplete="email" :error="errors.email" placeholder="you@example.com" />
      <div class="grid gap-3.5 sm:grid-cols-2">
        <InputField id="password" v-model="form.password" :label="t('auth.password')" icon="lock"
                    type="password" autocomplete="new-password" :error="errors.password" />
        <InputField id="confirm" v-model="form.confirm" :label="t('auth.confirm')" icon="shield"
                    type="password" autocomplete="new-password" :error="errors.confirm" />
      </div>

      <p v-if="error" class="flex items-center gap-2 rounded-[5px] bg-rose-500/10 p-3 text-sm text-rose-600" role="alert">
        <AppIcon name="alert" :size="16" /> {{ error }}
      </p>

      <button class="btn btn-primary w-full !py-3" :disabled="loading">
        <AppIcon v-if="!loading" name="checkCircle" :size="16" />
        {{ loading ? t('common.loading') : t('common.signUp') }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-muted">
      {{ t('auth.haveAccount') }}
      <RouterLink :to="{ name: 'login', query: route.query }" class="font-semibold text-primary hover:underline">{{ t('common.signIn') }}</RouterLink>
    </p>
  </div>
</template>
