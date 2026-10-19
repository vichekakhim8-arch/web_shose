// VKS brand identity, navigation and contact details.

export const BRAND = {
  name: 'VKS',
  fullName: 'VKS Sneakers',
  announcementKey: 'banner.announce',
  phone: '+855 93 777 168',
  email: 'hello@vks.store',
  address: 'St. 271, Toul Kork, Phnom Penh, Cambodia',
  hours: 'Mon–Sun · 8:00 – 21:00',
  mapLat: 11.5564,
  mapLng: 104.9282,
}

export const SOCIAL_LINKS = [
  { name: 'Facebook', icon: 'facebook', href: 'https://facebook.com' },
  { name: 'Instagram', icon: 'instagram', href: 'https://instagram.com' },
  { name: 'TikTok', icon: 'tiktok', href: 'https://tiktok.com' },
  { name: 'Telegram', icon: 'telegram', href: 'https://telegram.org' },
  { name: 'YouTube', icon: 'youtube', href: 'https://youtube.com' },
]

export const NAV = [
  { key: 'nav.new', query: { sort: 'newest' } },
  { key: 'nav.men', query: { gender: 'Men' } },
  { key: 'nav.women', query: { gender: 'Women' } },
  { key: 'nav.running', query: { category: 'Running' } },
  { key: 'nav.basketball', query: { category: 'Basketball' } },
  { key: 'nav.sale', query: { onSale: '1' } },
]

export const PRICE_PRESETS = [
  { label: '< $80', min: '', max: '80' },
  { label: '$80 – $150', min: '80', max: '150' },
  { label: '$150 +', min: '150', max: '' },
]

export const SHIPPING_ZONES = [
  { id: 'pp', name: 'Phnom Penh', fee: 150, eta: '1–2 days', lat: 11.5564, lng: 104.9282 },
  { id: 'siemreap', name: 'Siem Reap', fee: 350, eta: '2–3 days', lat: 13.3671, lng: 103.8448 },
  { id: 'bat', name: 'Battambang', fee: 350, eta: '2–4 days', lat: 13.0957, lng: 103.2022 },
  { id: 'sihanouk', name: 'Sihanoukville', fee: 300, eta: '2–3 days', lat: 10.6267, lng: 103.5222 },
]
