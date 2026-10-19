import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  let initPromise = null

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const initials = computed(() =>
    (user.value?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
  )

  function init() {
    if (!initPromise) {
      initPromise = api.auth.me()
        .then((u) => (user.value = u))
        .catch(() => (user.value = null))
        .finally(() => (ready.value = true))
    }
    return initPromise
  }

  async function login(c) {
    user.value = (await api.auth.login(c)).user
    return user.value
  }
  async function register(p) {
    user.value = (await api.auth.register(p)).user
    return user.value
  }
  async function oauth(provider) {
    user.value = (await api.auth.oauth(provider)).user
    return user.value
  }
  async function updateProfile(patch) {
    user.value = await api.auth.updateProfile(patch)
    return user.value
  }
  async function logout() {
    await api.auth.logout()
    user.value = null
  }

  return { user, ready, isAuthenticated, isAdmin, initials, init, login, register, oauth, updateProfile, logout }
})
