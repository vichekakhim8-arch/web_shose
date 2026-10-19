// One-click website colour schemes + banner presets (admin configurable).

export const COLOR_PRESETS = [
  { id: 'flame', name: 'Flame', primary: '#f26b1d', soft: '#fff1e7', softDark: '#2a1a10', ink: '#ffffff' },
  { id: 'emerald', name: 'Emerald', primary: '#07a66d', soft: '#e6f7f0', softDark: '#0c2220', ink: '#ffffff' },
  { id: 'azure', name: 'Azure', primary: '#2563eb', soft: '#e8efff', softDark: '#111c33', ink: '#ffffff' },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', soft: '#f1ebff', softDark: '#1e1430', ink: '#ffffff' },
  { id: 'rose', name: 'Rose', primary: '#e11d48', soft: '#ffe9ee', softDark: '#2d1219', ink: '#ffffff' },
  { id: 'amber', name: 'Amber', primary: '#d97706', soft: '#fff4e0', softDark: '#2a1e0c', ink: '#ffffff' },
  { id: 'teal', name: 'Teal', primary: '#0d9488', soft: '#e3f6f4', softDark: '#0b2422', ink: '#ffffff' },
  { id: 'ink', name: 'Monochrome', primary: '#18181b', soft: '#f1f1f2', softDark: '#232326', ink: '#ffffff' },
]

export const BANNER_PRESETS = [
  {
    id: 'street',
    image: 'https://images.pexels.com/photos/19882433/pexels-photo-19882433.jpeg?auto=compress&cs=tinysrgb&w=1600&h=600&fit=crop',
  },
  {
    id: 'court',
    image: 'https://images.pexels.com/photos/29699313/pexels-photo-29699313.jpeg?auto=compress&cs=tinysrgb&w=1600&h=600&fit=crop',
  },
  {
    id: 'studio',
    image: 'https://images.pexels.com/photos/19869753/pexels-photo-19869753.jpeg?auto=compress&cs=tinysrgb&w=1600&h=600&fit=crop',
  },
]

export const DEFAULT_SETTINGS = {
  colorPreset: 'flame',
  primaryColor: '#f26b1d',
  bannerImage: BANNER_PRESETS[0].image,
  bannerHeadingEn: 'Step into the new season',
  bannerHeadingKm: 'ចូលរួមរដូវកាលថ្មី',
  bannerSubEn: 'Up to 30% off selected sneakers',
  bannerSubKm: 'បញ្ចុះតម្លៃរហូតដល់ ៣០%',
  // Bakong / KHQR merchant configuration
  bakongAccount: 'vks_store@wing',
  merchantName: 'VKS SNEAKERS',
  merchantCity: 'PHNOM PENH',
  currency: 'USD',
}
