import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { COLOR_PRESETS } from '@/assets/theme.js'

const KEY = 'vks_ui_v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const saved = load()
const prefersDark =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useUiStore = defineStore('ui', () => {
  const locale = ref(saved.locale || 'en')
  const dark = ref(saved.dark ?? prefersDark ?? false)
  const sidebarOpen = ref(saved.sidebarOpen ?? true)
  const primaryColor = ref(saved.primaryColor || COLOR_PRESETS[0].primary)
  const colorPreset = ref(saved.colorPreset || COLOR_PRESETS[0].id)
  // Which dashboard sidebar groups are expanded (all open by default).
  const closedGroups = ref(saved.closedGroups || [])

  function persist() {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        locale: locale.value,
        dark: dark.value,
        sidebarOpen: sidebarOpen.value,
        primaryColor: primaryColor.value,
        colorPreset: colorPreset.value,
        closedGroups: closedGroups.value,
      }),
    )
  }

  const isGroupOpen = (key) => !closedGroups.value.includes(key)
  function toggleGroup(key) {
    closedGroups.value = isGroupOpen(key)
      ? [...closedGroups.value, key]
      : closedGroups.value.filter((k) => k !== key)
    persist()
  }

  /** Writes the live CSS variables that every component reads. */
  function applyTheme() {
    const root = document.documentElement
    root.classList.toggle('dark', dark.value)
    root.setAttribute('lang', locale.value)
    root.style.setProperty('--c-primary', primaryColor.value)

    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset.value)
    if (preset) {
      root.style.setProperty('--c-primary-soft', dark.value ? preset.softDark : preset.soft)
      root.style.setProperty('--c-primary-ink', preset.ink)
    }
    persist()
  }

  function setLocale(code) {
    locale.value = code
    applyTheme()
  }
  function toggleDark() {
    dark.value = !dark.value
    applyTheme()
  }
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
    persist()
  }
  /** One-click website re-skin. */
  function setColor(presetId, customHex) {
    const preset = COLOR_PRESETS.find((p) => p.id === presetId)
    colorPreset.value = presetId
    primaryColor.value = customHex || preset?.primary || primaryColor.value
    applyTheme()
  }

  watch([locale, dark], applyTheme)

  return {
    locale, dark, sidebarOpen, primaryColor, colorPreset, closedGroups,
    applyTheme, setLocale, toggleDark, toggleSidebar, setColor, isGroupOpen, toggleGroup,
  }
})
