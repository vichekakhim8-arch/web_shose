import { computed } from 'vue'
import en from './en.js'
import km from './km.js'
import { useUiStore } from '@/stores/ui.js'

export const MESSAGES = { en, km }

export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'km', label: 'ភាសាខ្មែរ', short: 'ខ្មែរ', flag: '🇰🇭' },
]

function resolve(dict, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), dict)
}

/** Translate helper with {placeholder} interpolation and English fallback. */
export function translate(locale, key, vars) {
  let out = resolve(MESSAGES[locale] || MESSAGES.en, key)
  if (out == null) out = resolve(MESSAGES.en, key)
  if (out == null) return key
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    })
  }
  return out
}

export function useI18n() {
  const ui = useUiStore()
  const locale = computed(() => ui.locale)
  const t = (key, vars) => translate(ui.locale, key, vars)
  return { t, locale, setLocale: ui.setLocale, locales: LOCALES }
}
