import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api.js'
import { DEFAULT_SETTINGS } from '@/services/domain.js'
import { useUiStore } from './ui.js'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...DEFAULT_SETTINGS })
  const ready = ref(false)
  let p = null

  function init() {
    if (!p) {
      p = api.settings
        .get()
        .then((s) => {
          settings.value = { ...DEFAULT_SETTINGS, ...s }
          // The admin's saved colour becomes the site-wide theme.
          const ui = useUiStore()
          if (settings.value.colorPreset) ui.setColor(settings.value.colorPreset, settings.value.primaryColor)
        })
        .catch(() => {})
        .finally(() => (ready.value = true))
    }
    return p
  }

  async function update(patch) {
    settings.value = await api.settings.update(patch)
    return settings.value
  }

  return { settings, ready, init, update }
})
