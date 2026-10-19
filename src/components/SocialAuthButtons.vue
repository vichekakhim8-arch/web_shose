<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import AppIcon from './AppIcon.vue'

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const busy = ref('')

async function go(provider) {
  busy.value = provider
  try {
    const user = await auth.oauth(provider)
    toast.success(t('toast.signedIn'))
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.replace(redirect || (user.role === 'admin' ? '/admin' : '/account'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    busy.value = ''
  }
}
</script>

<template>
  <div class="grid gap-2.5">
    <button type="button" class="btn btn-outline w-full !py-3" :disabled="!!busy" @click="go('google')">
      <AppIcon name="google" :size="18" />
      {{ busy === 'google' ? '…' : t('auth.continueGoogle') }}
    </button>
    <button type="button" class="btn w-full !py-3 bg-[#1877F2] text-white hover:brightness-110" :disabled="!!busy" @click="go('facebook')">
      <AppIcon name="facebook" :size="18" />
      {{ busy === 'facebook' ? '…' : t('auth.continueFacebook') }}
    </button>
  </div>
</template>
